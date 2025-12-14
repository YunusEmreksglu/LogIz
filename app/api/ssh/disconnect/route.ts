import { NextRequest, NextResponse } from 'next/server'

const PYTHON_API_URL = 'http://127.0.0.1:5000/api'

export async function POST(request: NextRequest) {
    try {
        const response = await fetch(`${PYTHON_API_URL}/ssh/disconnect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })

    } catch (error: any) {
        console.error('SSH Disconnect Error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Bağlantı kesme hatası' },
            { status: 500 }
        )
    }
}
