import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instance = searchParams.get('instance')

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance não informada' },
        { status: 400 }
      )
    }

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return NextResponse.json(
        { error: 'Evolution API não configurada', connected: false },
        { status: 200 }
      )
    }

    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${instance}`,
      {
        headers: { apikey: EVOLUTION_API_KEY }
      }
    )

    if (!response.ok) {
      return NextResponse.json({ connected: false })
    }

    const data = await response.json()
    
    const connected = data.instance?.state === 'open'

    return NextResponse.json({
      connected,
      state: data.instance?.state || 'unknown',
      instanceName: instance
    })

  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return NextResponse.json({ connected: false, error: 'Erro ao verificar status' })
  }
}
