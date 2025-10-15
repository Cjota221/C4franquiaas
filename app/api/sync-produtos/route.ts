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

    // helper: robust category name extraction from various possible payload shapes
    const extractCategoryNames = (obj: unknown): string[] => {
      try {
        if (!obj || typeof obj !== 'object') return [];
        const rec = obj as Record<string, unknown>;
        const collector: string[] = [];

        const pushName = (v: unknown) => {
          if (!v) return;
          if (typeof v === 'string') {
            const s = v.trim(); if (s) collector.push(s); return;
          }
          if (typeof v === 'object') {
            const r = v as Record<string, unknown>;
            // try common name keys
            const nameKeys = ['nome', 'name', 'titulo', 'title', 'nome_categoria', 'category_name'];
            for (const k of nameKeys) {
              const val = r[k];
              if (typeof val === 'string' && val.trim()) { collector.push(val.trim()); return; }
            }
            // if the object itself contains a stringish primitive
            for (const key of Object.keys(r)) {
              const val = r[key];
              if (typeof val === 'string' && val.trim()) { collector.push(val.trim()); return; }
            }
          }
        };

        // common candidate keys
        const candidates = ['categorias', 'categories', 'categoria', 'category', 'categorias_principais', 'categoria_principal'];
        for (const k of candidates) {
          const v = rec[k];
          if (!v) continue;
          if (Array.isArray(v)) {
            for (const it of v) pushName(it);
            continue;
          }
          pushName(v);
        }

        // fallback: scan all keys for anything that looks category-like
        if (collector.length === 0) {
          for (const key of Object.keys(rec)) {
            const lk = key.toLowerCase();
            if (lk.includes('cat') || lk.includes('categoria') || lk.includes('category')) {
              const v = rec[key];
              if (Array.isArray(v)) for (const it of v) pushName(it);
              else pushName(v);
            }
          }
        }

        // normalize: dedupe & trim
        const normalized = Array.from(new Set(collector.map(x => x.trim()).filter(Boolean)));
        return normalized;
      } catch {
        return [];
      }
    };

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
      const slice = produtos.slice(i, i + BATCH_SIZE);
      const batch = slice.map((p: ProdutoDB) => {
        const catNames = extractCategoryNames(p);
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
          categorias: catNames,
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
          try {
            // collect all category names from this slice
            const allNames: string[] = [];
            for (const p of slice) {
              const names = extractCategoryNames(p);
              if (names && names.length > 0) allNames.push(...names);
            }
            const uniqNames = Array.from(new Set(allNames.map(n => n.trim()).filter(Boolean)));
            if (uniqNames.length > 0) {
              // upsert by nome
              await supabase.from('categorias').upsert(uniqNames.map(n => ({ nome: n })), { onConflict: 'nome' });
            }
          } catch (catErr) {
            console.error('[sync-produtos] categorias upsert error', catErr);
          }
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

