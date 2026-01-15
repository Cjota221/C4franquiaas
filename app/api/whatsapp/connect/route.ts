import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { resellerId: _resellerId, instanceName } = await request.json()

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return NextResponse.json(
        { error: 'Evolution API não configurada' },
        { status: 500 }
      )
    }

    // Primeiro, verificar se a instância já existe
    const checkResponse = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
      {
        headers: { apikey: EVOLUTION_API_KEY }
      }
    )

    if (checkResponse.ok) {
      const checkData = await checkResponse.json()
      
      // Se já está conectado, retornar sucesso
      if (checkData.instance?.state === 'open') {
        return NextResponse.json({ connected: true })
      }
      
      // Se existe mas não está conectado, buscar QR Code
      const connectResponse = await fetch(
        `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
        {
          headers: { apikey: EVOLUTION_API_KEY }
        }
      )
      
      const connectData = await connectResponse.json()
      
      if (connectData.base64) {
        return NextResponse.json({
          qrcode: connectData.base64,
          instanceName
        })
      }
    }

    // Instância não existe, criar uma nova
    const createResponse = await fetch(
      `${EVOLUTION_API_URL}/instance/create`,
      {
        method: 'POST',
        headers: {
          apikey: EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      }
    )

    const _createData = await createResponse.json()

    // Aguardar um pouco para a instância inicializar
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Buscar o QR Code
    const qrResponse = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      {
        headers: { apikey: EVOLUTION_API_KEY }
      }
    )

    const qrData = await qrResponse.json()

    if (qrData.base64) {
      return NextResponse.json({
        qrcode: qrData.base64,
        instanceName
      })
    }

    // Se não conseguiu o QR Code, tentar novamente
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const retryResponse = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      {
        headers: { apikey: EVOLUTION_API_KEY }
      }
    )

    const retryData = await retryResponse.json()

    return NextResponse.json({
      qrcode: retryData.base64 || null,
      instanceName,
      status: 'connecting'
    })

  } catch (error) {
    console.error('Erro ao conectar WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro ao conectar WhatsApp' },
      { status: 500 }
    )
  }
}
