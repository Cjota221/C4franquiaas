import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const ids = Array.isArray(body?.ids) ? body.ids.map((v: any) => Number(v)).filter((n: number) => Number.isFinite(n)) : [];
    const ativo = typeof body?.ativo === 'boolean' ? body.ativo : undefined;
    if (ids.length === 0 || typeof ativo === 'undefined') return NextResponse.json({ error: 'ids and ativo required' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');
    const { error } = await supabase.from('produtos').update({ ativo }).in('id', ids);
    if (error) {
      console.error('[produtos/batch] supabase error', error);
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }
    return NextResponse.json({ ok: true, updated: ids.length });
  } catch (err: unknown) {
    console.error('[produtos/batch] error', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
