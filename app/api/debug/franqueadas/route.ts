import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('\n Verificando Franqueadas\n');

    const { data: todas, error: todasError } = await supabase
      .from('franqueadas')
      .select('id, nome, email, ativo, created_at');

    if (todasError) {
      return NextResponse.json({
        error: 'Erro ao buscar franqueadas',
        details: todasError.message
      }, { status: 500 });
    }

    const { data: ativas, error: ativasError } = await supabase
      .from('franqueadas')
      .select('id, nome, ativo')
      .eq('ativo', true);

    const resultado = {
      total: todas?.length || 0,
      ativas_com_eq_true: ativas?.length || 0,
      todas_franqueadas: todas?.map(f => ({
        nome: f.nome,
        email: f.email,
        ativo: f.ativo,
        tipo_ativo: typeof f.ativo,
        valor_raw: JSON.stringify(f.ativo),
      })) || [],
      franqueadas_ativas: ativas?.map(f => f.nome) || [],
    };

    console.log('\n Resultado:');
    console.log(`Total de franqueadas: ${resultado.total}`);
    console.log(`Franqueadas com ativo=true: ${resultado.ativas_com_eq_true}`);

    return NextResponse.json(resultado);

  } catch (error) {
    console.error(' Erro:', error);
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}