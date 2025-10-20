import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Missing SUPABASE configuration (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const per_page = Number(url.searchParams.get('per_page') || '20');
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q') || '';
    const pedido_id = url.searchParams.get('pedido_id');

    if (pedido_id) {
      // return itens for pedido
      const { data: itens, error } = await supabase.from('itens_pedido').select('*').eq('pedido_id', pedido_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ itens });
    }

    let query = supabase.from('pedidos').select('*', { count: 'exact' }).order('criado_em', { ascending: false });
    if (status && status !== 'Todos') query = query.eq('status', status);
    if (q) {
      // basic search by cliente nome or franqueada id or id
      query = query.or(`cliente->>nome.ilike.%${q}%,franqueada_id.ilike.%${q}%,id.ilike.%${q}%`);
    }

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, count, error } = await query.range(from, to);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ pedidos: data ?? [], total: count ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
