import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || '1');
    const per_page = Number(url.searchParams.get('per_page') || '20');
    const status = url.searchParams.get('status') || '';
    const franqueada = url.searchParams.get('franqueada') || '';
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';
    const q = url.searchParams.get('q') || '';

    let query = supabase.from('comissoes').select('*', { count: 'exact' }).order('criado_em', { ascending: false });
    if (status && status !== 'Todos') query = query.eq('status', status);
    if (franqueada && franqueada !== 'Todos') {
      query = query.eq('franqueada_id', franqueada);
      const orClause = `franqueada_nome.ilike.%${franqueada}%`;
      query = query.or(orClause);
    }
    if (from) query = query.gte('criado_em', from);
    if (to) query = query.lte('criado_em', to);
    if (q) {
      const orClause = `franqueada_nome.ilike.%${q}%,pedido_id.ilike.%${q}%`;
      query = query.or(orClause);
    }

    const fromIndex = (page - 1) * per_page;
    const toIndex = fromIndex + per_page - 1;

    const { data, count, error } = await query.range(fromIndex, toIndex);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // resumo aggregation
    const { data: resumoRows } = await supabase.rpc('comissoes_resumo', { p_from: from || null, p_to: to || null });
    const resumo = (resumoRows && resumoRows[0]) || null;

    return NextResponse.json({ comissoes: data ?? [], total: count ?? 0, resumo });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
