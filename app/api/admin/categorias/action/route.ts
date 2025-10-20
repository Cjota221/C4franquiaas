import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function POST(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const body = await req.json();
  const { action } = body;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE configuration (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (action === 'create') {
  let { nome, slug } = body as { nome?: string; slug?: string; descricao?: string };
  const descricao = (body as unknown as Record<string, unknown>)?.descricao as string | undefined;
      nome = (nome ?? '').trim();
      if (!nome || nome.length < 2) {
        return NextResponse.json({ error: 'Nome da categoria é obrigatório e deve ter pelo menos 2 caracteres.' }, { status: 400 });
      }
      if (!slug || !String(slug).trim()) {
        slug = slugify(nome);
      }

      // attempt insert; if slug already exists, return a 409 with helpful message
      const { data, error } = await supabase.from('categorias').insert([{ nome, slug, descricao }]).select().single();
      if (error) {
        // unique_violation in Postgres returns code '23505'
        const errObj = (error as unknown) as Record<string, unknown> | null;
        const code = (errObj && ((errObj['code'] as unknown) ?? (errObj['status'] as unknown))) ?? null;
        if (code === '23505' || code === 23505 || String((errObj && errObj['message']) ?? '').toLowerCase().includes('duplicate')) {
          return NextResponse.json({ error: 'Já existe uma categoria com esse nome/slug.' }, { status: 409 });
        }
        throw error;
      }
      return NextResponse.json({ data });
    }

    if (action === 'update') {
      const { id, updates } = body as { id?: string; updates?: Record<string, unknown> };
      if (!id) return NextResponse.json({ error: 'id é obrigatório para update' }, { status: 400 });
      const { data, error } = await supabase.from('categorias').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (action === 'delete') {
      const { id } = body as { id?: string };
      if (!id) return NextResponse.json({ error: 'id é obrigatório para delete' }, { status: 400 });
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
