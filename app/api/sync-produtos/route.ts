import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

function safeString(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  return null;
}

function extractCategoryNames(obj: unknown): string[] {
  try {
    if (!obj || typeof obj !== 'object') return [];
    const rec = obj as Record<string, unknown>;
    const collector: string[] = [];

    const pushName = (v: unknown) => {
      if (!v) return;
      if (typeof v === 'string') { const s = v.trim(); if (s) collector.push(s); return; }
      if (typeof v === 'number') { collector.push(String(v)); return; }
      if (typeof v === 'object') {
        const r = v as Record<string, unknown>;
        const nameKeys = ['nome', 'name', 'titulo', 'title', 'nome_categoria', 'category_name'];
        for (const k of nameKeys) {
          const val = safeString(r[k]); if (val) { collector.push(val); return; }
        }
        for (const key of Object.keys(r)) {
          const val = safeString(r[key]); if (val) { collector.push(val); return; }
        }
      }
    };

    const candidates = ['categorias', 'categories', 'categoria', 'category', 'categorias_principais', 'categoria_principal'];
    for (const k of candidates) {
      const v = rec[k];
      if (!v) continue;
      if (Array.isArray(v)) { for (const it of v) pushName(it); continue; }
      pushName(v);
    }

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

    return Array.from(new Set(collector.map(x => x.trim()).filter(Boolean)));
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');
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
          categorias: extractCategoryNames(rec),
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

      try {
        const allNames: string[] = [];
        for (const p of slice) {
          const names = extractCategoryNames(p);
          if (names && names.length > 0) allNames.push(...names);
        }
        const uniqNames = Array.from(new Set(allNames.map(n => n.trim()).filter(Boolean)));
        if (uniqNames.length > 0) {
          await supabase.from('categorias').upsert(uniqNames.map(n => ({ nome: n })), { onConflict: 'nome' });
        }
      } catch (catErr) {
        console.error('[sync-produtos] categorias upsert error', catErr);
      }

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

