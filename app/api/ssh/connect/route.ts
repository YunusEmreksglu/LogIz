import { NextRequest, NextResponse } from 'next/server'

const PYTHON_API_URL = 'http://127.0.0.1:5000/api'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const response = await fetch(`${PYTHON_API_URL}/ssh/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })

    } catch (error: any) {
        console.error('SSH Connect Error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Bağlantı hatası' },
            { status: 500 }
        )
    }
}
