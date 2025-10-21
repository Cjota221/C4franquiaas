import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClientOrNull() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    const body = await req.json();
    const { action, comissao_id, usuario } = body as { action?: string; comissao_id?: string; usuario?: string };
    if (!action || !comissao_id) return NextResponse.json({ error: 'missing' }, { status: 400 });

    if (action === 'approve') {
      const { error } = await supabase.from('comissoes').update({ status: 'aprovada' }).eq('id', comissao_id);
      await supabase.from('logs_comissoes').insert([{ comissao_id, acao: 'Aprovou comissão', usuario: usuario ?? 'admin', data: new Date().toISOString() }]);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === 'pay') {
      const { error } = await supabase.from('comissoes').update({ status: 'paga', pago_em: new Date().toISOString() }).eq('id', comissao_id);
      await supabase.from('logs_comissoes').insert([{ comissao_id, acao: 'Marcou como paga', usuario: usuario ?? 'admin', data: new Date().toISOString() }]);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
