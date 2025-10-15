import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

// --- TIPOS E INTERFACES ---

// Define a estrutura de um produto como vem da API da FácilZap (com base no seu debug)
// We'll use the canonical functions from lib/facilzapClient to fetch and normalize products.
// The client already returns ProdutoDB shapes that include `variacoes_meta` and `codigo_barras`.

// --- LÓGICA DA API ---

export async function POST(request: NextRequest) {
  console.log('[sync-produtos] INÍCIO da sincronização');
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');

    const parsed = await request.json().catch(() => ({} as unknown));
    const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    const page = Number(body?.page) > 0 ? Number(body.page) : undefined;
    const length = Number(body?.length) > 0 ? Number(body.length) : undefined;

    let produtos: ProdutoDB[] = [];
    if (page) {
      console.log('[sync-produtos] fetching page', page, 'length', length ?? undefined);
      const res = await fetchProdutosFacilZapPage(page, length ?? 50);
      produtos = res.produtos ?? [];
    } else {
      console.log('[sync-produtos] fetching ALL products (paginated via client)');
      const res = await fetchAllProdutosFacilZap();
      produtos = res.produtos ?? [];
    }

    if (!produtos || produtos.length === 0) {
      console.log('[sync-produtos] no products found');
      return NextResponse.json({ ok: true, imported: 0, pages: 0 });
    }

    const BATCH_SIZE = 50;
    let imported = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({
        id_externo: p.id_externo,
        nome: p.nome,
        preco_base: p.preco_base ?? null,
        estoque: p.estoque ?? null,
        ativo: p.ativo ?? true,
        imagem: p.imagem ?? null,
        imagens: p.imagens ?? [],
        codigo_barras: p.codigo_barras ?? null,
        variacoes_meta: p.variacoes_meta ?? [],
        last_synced_at: new Date().toISOString(),
      }));

      console.log(`[sync-produtos] upserting batch ${i}..${i + batch.length} (size=${batch.length})`);
      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] supabase upsert error', error);
        return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
      }
      imported += batch.length;
    }

    console.log('[sync-produtos] SYNCHRONIZATION complete, imported=', imported);
    return NextResponse.json({ ok: true, imported }, { status: 200 });
  } catch (e: any) {
    console.error('[sync-produtos] error', e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

