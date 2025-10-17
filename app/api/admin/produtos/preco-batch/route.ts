import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as unknown));
    const data = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {} as Record<string, unknown>;
    const acao = String(data['acao'] ?? '');
    const tipo = String(data['tipo'] ?? '');
    const valor = Number(data['valor']);
  const produto_ids = Array.isArray(data['produto_ids']) ? (data['produto_ids'] as unknown[]).map((v) => Number(v)).filter((n: number) => Number.isFinite(n)) : [] as number[];

    if (acao !== 'atualizar') return NextResponse.json({ error: 'acao must be atualizar' }, { status: 400 });
    if (produto_ids.length === 0) return NextResponse.json({ error: 'produto_ids required' }, { status: 400 });
    if (!['fixo', 'percentual'].includes(tipo)) return NextResponse.json({ error: 'tipo must be fixed or percentual' }, { status: 400 });
    if (!Number.isFinite(valor)) return NextResponse.json({ error: 'valor must be a number' }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');

    // Fetch current totals and products
    const { data: produtos, error: fetchErr } = await supabase.from('produtos').select('id,preco_base').in('id', produto_ids as unknown[]);
    if (fetchErr) {
      console.error('[preco-batch] fetch error', fetchErr);
      return NextResponse.json({ error: fetchErr.message ?? String(fetchErr) }, { status: 500 });
    }

    // compute new prices
    let totalAnterior = 0;
    let totalNovo = 0;
    const updates: Array<Record<string, unknown>> = [];
    for (const p of (produtos ?? [] as { id: number; preco_base: number | null }[])) {
      const id = Number((p as { id: number }).id);
      const prev = typeof (p as { preco_base?: unknown }).preco_base === 'number' && Number.isFinite((p as { preco_base?: number }).preco_base!) ? (p as { preco_base?: number }).preco_base! : 0;
      totalAnterior += prev;
      let novo = prev;
      if (tipo === 'fixo') {
        novo = prev + valor;
      } else {
        // percentual: valor is interpreted as percentage (e.g., 10 => +10%)
        novo = prev * (1 + (valor / 100));
      }
      // round to cents
      novo = Math.round(novo * 100) / 100;
      totalNovo += novo;
      updates.push({ id, preco_base: novo });
    }

    // apply updates
    // perform update per row using update with in('id', ids) may set same price for all; use rpc or multiple updates
    for (const u of updates) {
      const { error: upErr } = await supabase.from('produtos').update({ preco_base: u.preco_base }).eq('id', u.id);
      if (upErr) {
        console.error('[preco-batch] update error', upErr);
        return NextResponse.json({ error: upErr.message ?? String(upErr) }, { status: 500 });
      }
    }

    return NextResponse.json({ sucesso: true, quantidade_afetada: updates.length, total_anterior: Math.round(totalAnterior * 100) / 100, total_novo: Math.round(totalNovo * 100) / 100 });
  } catch (err) {
    console.error('[preco-batch] error', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
