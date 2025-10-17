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
    if (action === 'attach') {
      const { categoria_id, produto_ids } = body;

      // validações básicas
      if (categoria_id == null) {
        return NextResponse.json({ error: 'categoria_id is required' }, { status: 400 });
      }
      // permitimos uuid/string também, mas não vazio
      if (typeof categoria_id !== 'string' && typeof categoria_id !== 'number') {
        return NextResponse.json({ error: 'categoria_id must be a string or number' }, { status: 400 });
      }

      if (!Array.isArray(produto_ids) || produto_ids.length === 0) {
        return NextResponse.json({ error: 'produto_ids must be a non-empty array' }, { status: 400 });
      }

      // verifica se a categoria existe
      const { data: cat, error: catError } = await supabase.from('categorias').select('id').eq('id', categoria_id).single();
      if (catError || !cat) {
        return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
      }

      // prepara linhas (preserva tipo recebido para produto_id)
      const rows = produto_ids.map((pid: string | number) => ({ produto_id: pid, categoria_id }));
      const { error } = await supabase.from('produto_categorias').upsert(rows, { onConflict: 'produto_id,categoria_id' });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === 'detach') {
      const { categoria_id, produto_ids } = body;
      if (categoria_id == null) {
        return NextResponse.json({ error: 'categoria_id is required' }, { status: 400 });
      }
      if (!Array.isArray(produto_ids) || produto_ids.length === 0) {
        return NextResponse.json({ error: 'produto_ids must be a non-empty array' }, { status: 400 });
      }

      const { error } = await supabase.from('produto_categorias').delete().in('produto_id', produto_ids).eq('categoria_id', categoria_id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('produto_categorias action error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
