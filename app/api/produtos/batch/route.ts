import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(req: NextRequest) {
  try {
    const parsed = await req.json().catch(() => ({} as unknown));
    const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : ({} as Record<string, unknown>);

    // basic payload validation
    if (!Array.isArray(body.ids)) return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
    const ids = (body.ids as unknown[]).map((v) => Number(v)).filter((n) => Number.isFinite(n));
    const ativo = typeof body.ativo === 'boolean' ? body.ativo : undefined;
    if (ids.length === 0) return NextResponse.json({ error: 'ids must contain at least one numeric id' }, { status: 400 });
    if (typeof ativo === 'undefined') return NextResponse.json({ error: 'ativo (boolean) is required' }, { status: 400 });

    // env validation
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    if (!url || !serviceKey) {
      console.error('[produtos/batch] missing Supabase env vars', { urlPresent: !!url, serviceKeyPresent: !!serviceKey });
      return NextResponse.json({ error: 'Server misconfiguration: missing Supabase credentials' }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey);
    try {
      const { data, error } = await supabase.from('produtos').update({ ativo }).in('id', ids).select('id,ativo');
      if (error) {
        console.error('[produtos/batch] supabase update error', error);
        return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
      }
      return NextResponse.json({ ok: true, updated: Array.isArray(data) ? data.length : ids.length, data: data ?? null });
    } catch (err: unknown) {
      console.error('[produtos/batch] supabase call failed', err);
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  } catch (err: unknown) {
    console.error('[produtos/batch] error parsing request', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
