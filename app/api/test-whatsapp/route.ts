/**
 * 🧪 Rota de teste para verificar conexão Z-API
 * 
 * Acesse: http://localhost:3000/api/test-whatsapp
 */

import { checkWhatsAppConnection } from '@/lib/zapi-whatsapp';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const isConnected = await checkWhatsAppConnection();

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: '✅ WhatsApp conectado com sucesso!',
        connected: true,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '❌ WhatsApp não está conectado. Verifique o QR Code.',
        connected: false,
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    
    return NextResponse.json({
      success: false,
      message: '❌ Erro ao verificar conexão',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
