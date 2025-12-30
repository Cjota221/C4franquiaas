import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { instanceName } = await request.json()

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Instance não informada' },
        { status: 400 }
      )
    }

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return NextResponse.json(
        { error: 'Evolution API não configurada' },
        { status: 500 }
      )
    }

    // Fazer logout da instância
    await fetch(
      `${EVOLUTION_API_URL}/instance/logout/${instanceName}`,
      {
        method: 'DELETE',
        headers: { apikey: EVOLUTION_API_KEY }
      }
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao desconectar WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro ao desconectar WhatsApp' },
      { status: 500 }
    )
  }
}
