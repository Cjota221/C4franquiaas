import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Missing SUPABASE configuration (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, franqueado_id, updates } = body;

    if (!action || !franqueado_id) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
    }

    if (action === 'toggle-status') {
      const { data, error } = await supabase.from('franqueados').update({ status: updates.status }).eq('id', franqueado_id).select();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, data: data?.[0] ?? null });
    }

    if (action === 'update') {
      const { data, error } = await supabase.from('franqueados').update(updates).eq('id', franqueado_id).select();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, data: data?.[0] ?? null });
    }

    if (action === 'delete') {
      const { error } = await supabase.from('franqueados').delete().eq('id', franqueado_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[franqueados/action] error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
