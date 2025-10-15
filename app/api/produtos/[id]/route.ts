import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { fetchProdutoFacilZapById } from '@/lib/facilzapClient';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    );

    // Busca o produto na nossa base de dados pelo ID interno ou externo
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .or(`id.eq.${id},id_externo.eq.${id}`)
      .limit(1);

    if (error) {
      console.error('[api/produtos/:id] Erro no Supabase:', error);
      return NextResponse.json({ error: 'Erro ao buscar produto no banco de dados.' }, { status: 500 });
    }

    const produtoDoBanco = Array.isArray(data) && data.length > 0 ? data[0] : null;

    // Se encontrarmos o produto, busca os detalhes mais recentes na FácilZap para comparação
    let detalhesDaFacilzap: unknown = null;
    const idExterno = produtoDoBanco?.id_externo ?? id;
    if (idExterno) {
      try {
        detalhesDaFacilzap = await fetchProdutoFacilZapById(String(idExterno));
      } catch (err) {
        console.error('[api/produtos/:id] falha ao buscar facilzap', err);
      }
    }

    return NextResponse.json({ produto: produtoDoBanco, facilzap: detalhesDaFacilzap }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[api/produtos/:id] Erro geral:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json().catch(() => ({} as any));

    const updates: Record<string, any> = {};
    if (body.estoque !== undefined) updates.estoque = body.estoque;
    if (body.variacoes_meta !== undefined) updates.variacoes_meta = body.variacoes_meta;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    );

    const { data, error } = await supabase
      .from('produtos')
      .update({ ...updates, last_synced_at: new Date().toISOString() })
      .or(`id.eq.${id},id_externo.eq.${id}`)
      .select()
      .limit(1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const updated = data?.[0] ?? null;
    let facilzap = null;
    if (updated?.id_externo) {
      try {
        facilzap = await fetchProdutoFacilZapById(String(updated.id_externo));
      } catch (err) {
        console.error('[api/produtos/:id PATCH] falha ao buscar facilzap', err);
      }
    }

    return NextResponse.json({ produto: updated, facilzap }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[api/produtos/:id PATCH] Erro geral:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

