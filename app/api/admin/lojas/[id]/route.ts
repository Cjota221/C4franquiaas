import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const { data: loja, error } = await supabase
      .from('lojas')
      .select('id, nome, dominio, mp_ativado, mp_modo_producao, ativo')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json(loja);
  } catch (error) {
    console.error('[Admin API - Loja] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar loja' },
      { status: 500 }
    );
  }
}
