import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const expected = process.env.SYNC_PRODUCTS_TOKEN;
    const provided = request.headers.get('x-admin-token') ?? '';
    if (expected && provided !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    // Allowed updates: ativo (boolean), estoque (number), variacoes_meta (array/object)
  const updates: Record<string, unknown> = {};
  const b = body as Record<string, unknown>;
  if (typeof b['ativo'] === 'boolean') updates.ativo = b['ativo'] as boolean;
  if (typeof b['estoque'] === 'number') updates.estoque = b['estoque'] as number;
  if (b['variacoes_meta']) updates.variacoes_meta = b['variacoes_meta'];

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar.' }, { status: 400 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const resolvedParams = (params instanceof Promise ? await params : params) as { id: string };
  const id = resolvedParams.id;
    // Attempt update by numeric id or id_externo match
    const { data, error } = await supabase
      .from('produtos')
      .update(updates)
      .or(`id.eq.${id},id_externo.eq.${id}`);

    if (error) {
      console.error('[api/produtos/:id] update error', error);
      return NextResponse.json({ error: error.message || 'Erro ao atualizar produto.' }, { status: 500 });
    }

  const dataAny = data as unknown;
  const updatedCount = Array.isArray(dataAny) ? (dataAny as unknown[]).length : 0;
  return NextResponse.json({ message: 'Produto atualizado.', updated: updatedCount }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[api/produtos/:id] catch', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = (params instanceof Promise ? await params : params) as { id: string };
    const id = resolvedParams.id;

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Try to find product by numeric id or id_externo
    const { data, error } = await supabase.from('produtos').select('*').or(`id.eq.${id},id_externo.eq.${id}`).limit(1);
    if (error) {
      console.error('[api/produtos/:id] select error', error);
      return NextResponse.json({ error: 'Erro ao buscar produto.' }, { status: 500 });
    }
    const row = Array.isArray(data) && data.length > 0 ? data[0] : null;

    // If we have an external id, attempt to fetch detailed variations from FácilZap
    let facilzapDetail: unknown = null;
    const { fetchProdutoFacilZapById } = await import('../../../../lib/facilzapClient');
    const externalId = row?.id_externo ?? id;
    if (externalId) {
      try {
        facilzapDetail = await fetchProdutoFacilZapById(String(externalId));
      } catch (e) {
        console.warn('[api/produtos/:id] facilzap detail fetch failed', e);
      }
    }

    return NextResponse.json({ produto: row, facilzap: facilzapDetail }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[api/produtos/:id] GET catch', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
