import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

function getSupabaseClientOrNull() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClientOrNull();
    // If Supabase not configured, return empty result (avoid build-time throws)
    if (!supabase) {
      return NextResponse.json({ items: [], resumo: { ativos: 0, inativos: 0, total: 0 } });
    }
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const per_page = Number(url.searchParams.get('per_page') || '20');
    const status = (url.searchParams.get('status') || '').toLowerCase();
    const q = url.searchParams.get('q') ?? '';
    // Build base query
    let query = supabase.from('franqueados').select('*', { count: 'exact' }).order('criado_em', { ascending: false });

    if (status && status !== 'todos') {
      // normalize expected status values
      const normalized = status === 'ativo' ? 'ativo' : status === 'inativo' ? 'inativo' : status;
      query = query.eq('status', normalized);
    }

    // Only apply ilike search when q has content
    if (q && q.trim().length > 0) {
      query = query.ilike('nome', `%${q.trim()}%`);
    }

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, count, error } = await query.range(from, to);
    if (error) {
      console.error('[franqueados/list] supabase error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // compute resumo counts in a safe way (two queries)
    const ativosRes = await supabase.from('franqueados').select('id', { count: 'exact' }).eq('status', 'ativo').range(0, 0);
    const inativosRes = await supabase.from('franqueados').select('id', { count: 'exact' }).eq('status', 'inativo').range(0, 0);

    const resumo = {
      ativos: ativosRes.error ? 0 : (ativosRes.count ?? 0),
      inativos: inativosRes.error ? 0 : (inativosRes.count ?? 0),
      total: count ?? 0,
    };

    return NextResponse.json({ items: data ?? [], resumo });
  } catch (err) {
    console.error('[franqueados/list] unexpected error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
