import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const body = await req.json();
  const { action } = body;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (action === 'create') {
      const { nome, slug, descricao } = body;
      const { data, error } = await supabase.from('categorias').insert([{ nome, slug, descricao }]).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (action === 'update') {
      const { id, updates } = body;
      const { data, error } = await supabase.from('categorias').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (action === 'delete') {
      const { id } = body;
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
