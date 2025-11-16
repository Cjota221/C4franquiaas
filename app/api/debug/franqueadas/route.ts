import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('\n [DEBUG FRANQUEADAS] Iniciando verificação...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Key configurada:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: todas, error: todasError } = await supabase
      .from('franqueadas')
      .select('id, nome, email, ativo');

    console.log('Busca TODAS - Total:', todas?.length, 'Erro:', todasError?.message);

    if (todasError) {
      console.error(' Erro:', todasError);
      return NextResponse.json({
        error: 'Erro ao buscar franqueadas',
        details: todasError.message,
        code: todasError.code
      }, { status: 500 });
    }

    const { data: ativas } = await supabase
      .from('franqueadas')
      .select('id, nome, ativo')
      .eq('ativo', true);

    console.log('Busca ATIVAS - Total:', ativas?.length);

    const resultado = {
      total: todas?.length || 0,
      ativas_com_eq_true: ativas?.length || 0,
      todas_franqueadas: todas?.map(f => ({
        nome: f.nome,
        email: f.email,
        ativo: f.ativo,
        tipo_ativo: typeof f.ativo,
      })) || [],
      franqueadas_ativas: ativas?.map(f => f.nome) || [],
    };

    console.log(' Resultado:', resultado);
    return NextResponse.json(resultado);

  } catch (error) {
    console.error(' ERRO CATCH:', error);
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}