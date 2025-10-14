import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const parsed = await request.json().catch(() => ({} as unknown));
  const body = typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {} as Record<string, unknown>;
  const page = typeof body['page'] === 'number' ? (body['page'] as number) : undefined;
  const length = typeof body['length'] === 'number' ? (body['length'] as number) : undefined;

    if (page && page > 0) {
      // fetch only one page and upsert in batches
      const { produtos, page: pnum, count } = await fetchProdutosFacilZapPage(page, length ?? undefined);
      if (!produtos || produtos.length === 0) return NextResponse.json({ message: 'Nenhum produto nesta página.', processed: 0, page: pnum }, { status: 200 });

      // upsert in batches
      let processed = 0;
      for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
        const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({
          id_externo: p.id_externo,
          nome: p.nome,
          preco_base: p.preco_base,
          estoque: p.estoque,
          imagem: p.imagem ?? null,
          imagens: p.imagens ?? [],
          // deactivate products with zero stock
          ativo: p.estoque && p.estoque > 0 ? p.ativo : false,
          last_synced_at: new Date().toISOString(),
        }));
  const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
        if (error) {
          console.error('[sync-produtos] upsert error', error);
          return NextResponse.json({ error: error.message || 'Erro ao salvar produtos.' }, { status: 500 });
        }
        processed += batch.length;
      }
      return NextResponse.json({ message: 'Sincronização de página concluída.', processed, page: pnum, count }, { status: 200 });
    }

    // default: fetch all pages and upsert in batches per page to avoid huge payloads
    const { produtos, pages } = await fetchAllProdutosFacilZap();
    if (!produtos || produtos.length === 0) return NextResponse.json({ message: 'Nenhum produto encontrado para sincronizar.', processed: 0, pages }, { status: 200 });

    let totalProcessed = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({
        id_externo: p.id_externo,
        nome: p.nome,
        preco_base: p.preco_base,
        estoque: p.estoque,
        imagem: p.imagem ?? null,
        imagens: p.imagens ?? [],
        // deactivate products with zero stock
        ativo: p.estoque && p.estoque > 0 ? p.ativo : false,
        last_synced_at: new Date().toISOString(),
      }));
  const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] upsert error', error);
        return NextResponse.json({ error: error.message || 'Erro ao salvar produtos.' }, { status: 500 });
      }
      totalProcessed += batch.length;
    }

    return NextResponse.json({ message: 'Sincronização concluída.', processed: totalProcessed, pages }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[sync-produtos] catch', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
