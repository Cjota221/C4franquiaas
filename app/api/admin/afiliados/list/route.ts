import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const per_page = Number(url.searchParams.get('per_page') || '20');
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q') || '';

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ items: [], resumo: { ativos: 0, inativos: 0, total: 0 } });
    }

    let query = supabase.from('afiliados').select('*', { count: 'exact' }).order('criado_em', { ascending: false });
    if (status && status !== 'todos') query = query.eq('status', status);
    if (q) query = query.ilike('nome', `%${q}%`);

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, count, error } = await query.range(from, to);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // tentativa de resumo via RPC
    const { data: resumoData } = await supabase.rpc('resumo_afiliados');
    let resumo = { ativos: 0, inativos: 0, total: count ?? 0 };
    if (Array.isArray(resumoData) && resumoData.length) {
      resumo = { ativos: resumoData[0].ativos ?? 0, inativos: resumoData[0].inativos ?? 0, total: resumoData[0].total ?? (count ?? 0) };
    }

    return NextResponse.json({ items: data ?? [], resumo });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
