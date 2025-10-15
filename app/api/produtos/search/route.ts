import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('query') ?? '';
    const limit = Math.min(500, Number(url.searchParams.get('limit') ?? '200'));
    if (!q || q.trim() === '') return NextResponse.json({ produtos: [] });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');
    // search by name (ilike) or id_externo
    const term = `%${q}%`;
    const { data, error } = await supabase
      .from('produtos')
      .select('id,id_externo,nome,estoque,preco_base,ativo,imagem,imagens,variacoes_meta,codigo_barras')
      .or(`nome.ilike.${term},id_externo.ilike.${term}`)
      .limit(limit);
    if (error) {
      console.error('[produtos/search] supabase error', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }
    return NextResponse.json({ produtos: data ?? [] });
  } catch (err: unknown) {
    console.error('[produtos/search] error', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
