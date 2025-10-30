import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar configurações globais
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('configuracoes_globais')
      .select('mp_ativado, mp_modo_producao')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Se não existir, retorna valores padrão
    if (!data) {
      return NextResponse.json({
        mp_ativado: true, // Ativo por padrão
        mp_modo_producao: false, // Modo teste por padrão
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Admin API - Config MP] Erro ao buscar:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

// POST - Salvar configurações globais
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mp_ativado, mp_modo_producao } = body;

    // Atualiza ou insere a configuração global
    const { error } = await supabase
      .from('configuracoes_globais')
      .upsert(
        {
          id: 1,
          mp_ativado,
          mp_modo_producao,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) throw error;

    console.log('✅ [Admin] Configurações MP globais salvas:', { mp_ativado, mp_modo_producao });

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
    });
  } catch (error) {
    console.error('[Admin API - Config MP] Erro ao salvar:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}
