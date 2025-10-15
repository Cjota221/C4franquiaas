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
  const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {} as Record<string, unknown>;
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
      const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => {
        // extract categories robustly without using `any`
        const rawCats = (p as unknown) && typeof (p as unknown) === 'object' ? (p as unknown) as Record<string, unknown> : {} as Record<string, unknown>;
        let cats: unknown[] = [];
        if (Array.isArray(rawCats['categorias'])) cats = rawCats['categorias'] as unknown[];
        else if (Array.isArray(rawCats['categories'])) cats = rawCats['categories'] as unknown[];
        return {
          id_externo: p.id_externo,
          nome: p.nome,
          preco_base: p.preco_base ?? null,
          estoque: p.estoque ?? null,
          ativo: p.ativo ?? true,
          imagem: p.imagem ?? null,
          imagens: p.imagens ?? [],
          codigo_barras: p.codigo_barras ?? null,
          variacoes_meta: p.variacoes_meta ?? [],
          categorias: cats,
          last_synced_at: new Date().toISOString(),
        };
      });

      console.log(`[sync-produtos] upserting batch ${i}..${i + batch.length} (size=${batch.length})`);
      // Upsert produtos
      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] supabase upsert error', error);
          // Diagnostic info (don't expose secrets) — helpful when debugging 500s in environments like Netlify
          try {
            const present = {
              FACILZAP_TOKEN: !!process.env.FACILZAP_TOKEN,
              NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
              SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
              DEBUG_SYNC: !!process.env.DEBUG_SYNC,
            };
            console.log('[sync-produtos] env present:', JSON.stringify(present));
          } catch {}
        const msg = error?.message ?? 'Erro ao salvar produtos.';
        return NextResponse.json({ error: String(msg) }, { status: 500 });
      }
      // Sync categories table (if categories provided)
      try {
        const catsToUpsert: { id?: string; nome?: string }[] = [];
        for (const p of produtos.slice(i, i + BATCH_SIZE)) {
          const pRec = (p as unknown) && typeof p === 'object' ? p as Record<string, unknown> : {};
          const cs = Array.isArray(pRec['categorias']) ? (pRec['categorias'] as unknown[]) : Array.isArray(pRec['categories']) ? (pRec['categories'] as unknown[]) : [];
          if (Array.isArray(cs)) {
              try {
                const res = await fetchProdutosFacilZapPage(page, length ?? 50);
                produtos = res.produtos ?? [];
              } catch (fetchErr) {
                console.error('[sync-produtos] error fetching page from FacilZap', fetchErr);
                const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
                const body = { error: 'failed_fetch_facilzap', message: msg } as Record<string, unknown>;
                if (process.env.DEBUG_SYNC === 'true') body['stack'] = (fetchErr as any)?.stack;
                return NextResponse.json(body, { status: 500 });
              }
            for (const c of cs) {
              if (!c) continue;
              try {
                const res = await fetchAllProdutosFacilZap();
                produtos = res.produtos ?? [];
              } catch (fetchErr) {
                console.error('[sync-produtos] error fetching ALL products from FacilZap', fetchErr);
                const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
                const body = { error: 'failed_fetch_facilzap_all', message: msg } as Record<string, unknown>;
                if (process.env.DEBUG_SYNC === 'true') body['stack'] = (fetchErr as any)?.stack;
                return NextResponse.json(body, { status: 500 });
              }
              if (typeof c === 'string') catsToUpsert.push({ nome: c });
              else if (typeof c === 'object' && c !== null) {
                const crec = c as Record<string, unknown>;
                catsToUpsert.push({ id: String(crec['id'] ?? crec['codigo'] ?? ''), nome: String(crec['nome'] ?? crec['nome_categoria'] ?? '') });
              }
            }
          }
        }
        if (catsToUpsert.length > 0) {
          // dedupe by nome
          const uniq = Array.from(new Map(catsToUpsert.map(c => [c.nome, c])).values()).filter(c => c.nome && c.nome.trim() !== '');
          await supabase.from('categorias').upsert(uniq.map(u => ({ nome: u.nome })), { onConflict: 'nome' });
        }
      } catch (catErr) {
        console.error('[sync-produtos] categorias upsert error', catErr);
      }
      imported += batch.length;
    }

    console.log('[sync-produtos] SYNCHRONIZATION complete, imported=', imported);
    return NextResponse.json({ ok: true, imported }, { status: 200 });
  } catch (e: unknown) {
    console.error('[sync-produtos] error', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

