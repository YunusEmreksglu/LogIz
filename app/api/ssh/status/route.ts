import { NextRequest, NextResponse } from 'next/server'

const PYTHON_API_URL = 'http://127.0.0.1:5000/api'

export async function GET(request: NextRequest) {
    try {
        const response = await fetch(`${PYTHON_API_URL}/ssh/status`, {
            method: 'GET',
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })

    } catch (error: any) {
        console.error('SSH Status Error:', error)
        return NextResponse.json(
            { connected: false, streaming: false, error: error.message },
            { status: 500 }
        )
    }
}
