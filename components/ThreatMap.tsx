'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

// Fix for default marker icon
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

interface ThreatLocation {
    lat: number
    lon: number
    country: string
    ip: string
    type: string
    count: number
}

interface Props {
    threats: any[]
}

export default function ThreatMap({ threats }: Props) {
    // Group threats by location
    const locations: ThreatLocation[] = []

    threats.forEach(threat => {
        if (threat.sourceLat && threat.sourceLon) {
            const existing = locations.find(
                l => l.lat === threat.sourceLat && l.lon === threat.sourceLon
            )

            if (existing) {
                existing.count++
            } else {
                locations.push({
                    lat: threat.sourceLat,
                    lon: threat.sourceLon,
                    country: threat.sourceCountry || 'Unknown',
                    ip: threat.sourceIP,
                    type: threat.type,
                    count: 1
                })
            }
        }
    })

    if (locations.length === 0) {
        return (
            <div className="h-[400px] w-full bg-gray-900/50 rounded-xl border border-gray-700 flex items-center justify-center text-gray-400">
                No geolocation data available
            </div>
        )
    }

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-700 z-0">
            <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {locations.map((loc, idx) => (
                    <Marker
                        key={idx}
                        position={[loc.lat, loc.lon]}
                        icon={icon}
                    >
                        <Popup className="text-black">
                            <div className="p-2">
                                <h3 className="font-bold text-sm mb-1">{loc.country}</h3>
                                <p className="text-xs">IP: {loc.ip}</p>
                                <p className="text-xs">Type: {loc.type}</p>
                                <p className="text-xs font-semibold mt-1">
                                    {loc.count} Threat{loc.count > 1 ? 's' : ''} from this location
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
