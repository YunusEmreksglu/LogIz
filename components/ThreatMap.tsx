'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import { useEffect, useState } from 'react'

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
    const [cssLoaded, setCssLoaded] = useState(false)

    // Load leaflet CSS dynamically
    useEffect(() => {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = ''
        document.head.appendChild(link)
        setCssLoaded(true)
        return () => {
            document.head.removeChild(link)
        }
    }, [])

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
            <div className="h-[400px] w-full bg-gray-900/50 rounded-2xl border border-gray-700/50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center space-x-2 p-4 border-b border-gray-700/50">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Global Threat Map</h3>
                        <p className="text-xs text-gray-400">Geographic threat distribution</p>
                    </div>
                </div>
                {/* Empty state */}
                <div className="flex flex-col items-center justify-center h-[320px] text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">No geolocation data available</p>
                    <p className="text-gray-500 text-xs">Threat locations will appear here when detected</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-700 z-0">
            <MapContainer
                center={[20, 0] as LatLngExpression}
                zoom={2}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {locations.map((loc, idx) => (
                    <Marker
                        key={idx}
                        position={[loc.lat, loc.lon] as LatLngExpression}
                        icon={icon}
                    >
                        <Popup>
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
