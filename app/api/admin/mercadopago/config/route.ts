/**
 * API Route: Salvar Configurações do Mercado Pago
 * 
 * Endpoint: POST /api/admin/mercadopago/config
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { lojaId, mp_ativado, mp_modo_producao } = await request.json();

    if (!lojaId) {
      return NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar configurações no banco
    const { error } = await supabase
      .from('lojas')
      .update({
        mp_ativado,
        mp_modo_producao,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lojaId);

    if (error) {
      console.error('Erro ao atualizar config MP:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar configurações' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}
