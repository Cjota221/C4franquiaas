import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

// extractCategoryNames removed: categories should be managed manually in admin panel

export async function POST(request: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: 'supabase_config_missing', message: 'Missing SUPABASE configuration (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).' }, { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const parsed = await request.json().catch(() => ({} as unknown));
  const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {} as Record<string, unknown>;
  const page = Number(body?.page) > 0 ? Number(body.page) : undefined;
  const length = Number(body?.length) > 0 ? Number(body.length) : undefined;

  try {
    let produtos: ProdutoDB[] = [];
    if (page) {
      const res = await fetchProdutosFacilZapPage(page, length ?? 50);
      produtos = res.produtos ?? [];
    } else {
      const res = await fetchAllProdutosFacilZap();
      produtos = res.produtos ?? [];
    }

    if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0 });

    const BATCH_SIZE = 50;
    let importedCount = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const slice = produtos.slice(i, i + BATCH_SIZE);

      const batch = slice.map((p: ProdutoDB) => {
        const rec = p as unknown as Record<string, unknown>;
        const id_externo = (rec['id_externo'] ?? rec['id'] ?? null) as string | null;
        const nome = (rec['nome'] ?? rec['name'] ?? null) as string | null;
        const preco_base = (rec['preco_base'] ?? rec['preco'] ?? null) as number | string | null;
        const estoque = (rec['estoque'] ?? rec['stock'] ?? null) as number | string | null;
        const ativoVal = rec['ativo'];
        const ativo = typeof ativoVal === 'boolean' ? ativoVal : (ativoVal ?? true) as boolean;
        const imagem = (rec['imagem'] ?? null) as string | null;
        const imagens = Array.isArray(rec['imagens']) ? rec['imagens'] as string[] : (rec['imagens'] ? [String(rec['imagens'])] : [] as string[]);
        const codigo_barras = (rec['codigo_barras'] ?? rec['barcode'] ?? null) as string | null;
        const variacoes_meta = (rec['variacoes_meta'] ?? rec['variacoes'] ?? []) as unknown;

        return {
          id_externo,
          nome,
          preco_base,
          estoque,
          ativo,
          imagem,
          imagens,
          codigo_barras,
          variacoes_meta,
          last_synced_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        const msg = error?.message ?? 'Erro ao salvar produtos.';
        const body: Record<string, unknown> = { error: 'supabase_upsert_failed', message: String(msg) };
        if (process.env.DEBUG_SYNC === 'true') body['raw'] = error;
        return NextResponse.json(body, { status: 500 });
      }

      // Note: removed automatic categories extraction/upsert to avoid external coupling.
      // Categories should be managed manually in the admin panel and linked to products via the categorias API.

      importedCount += batch.length;
    }

    return NextResponse.json({ ok: true, imported: importedCount }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const body: Record<string, unknown> = { error: msg };
    if (process.env.DEBUG_SYNC === 'true') body['raw'] = err;
    return NextResponse.json(body, { status: 500 });
  }
}

