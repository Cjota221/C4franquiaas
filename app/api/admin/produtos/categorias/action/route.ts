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
      if (!Array.isArray(produto_ids)) return NextResponse.json({ error: 'produto_ids must be array' }, { status: 400 });
      const rows = produto_ids.map((pid: string) => ({ produto_id: pid, categoria_id }));
  const { error } = await supabase.from('produto_categorias').upsert(rows, { onConflict: 'produto_id,categoria_id' });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === 'detach') {
      const { categoria_id, produto_ids } = body;
      const { error } = await supabase.from('produto_categorias').delete().in('produto_id', produto_ids).eq('categoria_id', categoria_id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
