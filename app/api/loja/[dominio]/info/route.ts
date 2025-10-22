import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dominio: string }> }
) {
  try {
    const { dominio } = await params;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Buscar loja pelo domínio
    const { data: loja, error } = await supabase
      .from('lojas')
      .select(`
        *,
        franqueadas:franqueada_id (
          nome,
          email,
          telefone,
          cidade,
          estado
        )
      `)
      .eq('dominio', dominio)
      .eq('ativo', true)
      .single();

    if (error || !loja) {
      console.error('[API loja/info] Erro:', error);
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      loja: {
        id: loja.id,
        nome: loja.nome,
        dominio: loja.dominio,
        logo: loja.logo,
        cor_primaria: loja.cor_primaria,
        cor_secundaria: loja.cor_secundaria,
        ativo: loja.ativo,
        produtos_ativos: loja.produtos_ativos
      },
      franqueada: Array.isArray(loja.franqueadas) ? loja.franqueadas[0] : loja.franqueadas
    }, { status: 200 });
  } catch (err) {
    console.error('[API loja/info] Erro inesperado:', err);
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
