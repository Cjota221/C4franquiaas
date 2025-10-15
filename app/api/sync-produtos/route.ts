import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

const BATCH_SIZE = 50;

// Definitive sync route: accepts optional { page, length } and upserts products in batches.
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const parsed = await request.json().catch(() => ({} as unknown));
    const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    const page = typeof body['page'] === 'number' ? (body['page'] as number) : undefined;
    const length = typeof body['length'] === 'number' ? (body['length'] as number) : undefined;

    if (page && page > 0) {
      const { produtos, page: pnum } = await fetchProdutosFacilZapPage(page, length ?? BATCH_SIZE);
      if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, page: pnum }, { status: 200 });

      let imported = 0;
      for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
        const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
        const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
        if (error) {
          console.error('[sync-produtos] upsert error', error);
          return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
        }
        imported += batch.length;
      }

      return NextResponse.json({ ok: true, imported, page: pnum }, { status: 200 });
    }

    const { produtos, pages } = await fetchAllProdutosFacilZap();
    if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, pages }, { status: 200 });

    let imported = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] upsert error', error);
        return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
      }
      imported += batch.length;
    }

    return NextResponse.json({ ok: true, imported, pages }, { status: 200 });
  } catch (e: any) {
    console.error('[sync-produtos] error', e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

const BATCH_SIZE = 50;

// Definitive single-file implementation of the sync route.
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const parsed = await request.json().catch(() => ({} as unknown));
    const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    const page = typeof body['page'] === 'number' ? (body['page'] as number) : undefined;
    const length = typeof body['length'] === 'number' ? (body['length'] as number) : undefined;

    if (page && page > 0) {
      const { produtos, page: pnum } = await fetchProdutosFacilZapPage(page, length ?? BATCH_SIZE);
      if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, page: pnum }, { status: 200 });

      let imported = 0;
      for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
        const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
        const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
        if (error) {
          console.error('[sync-produtos] upsert error', error);
          return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
        }
        imported += batch.length;
      }

      return NextResponse.json({ ok: true, imported, page: pnum }, { status: 200 });
    }

    const { produtos, pages } = await fetchAllProdutosFacilZap();
    if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, pages }, { status: 200 });

    let imported = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] upsert error', error);
        return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
      }
      imported += batch.length;
    }

    return NextResponse.json({ ok: true, imported, pages }, { status: 200 });
  } catch (e: any) {
    console.error('[sync-produtos] error', e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

const BATCH_SIZE = 50;

// Definitive single-copy implementation of the sync route.
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const parsed = await request.json().catch(() => ({} as unknown));
    const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    const page = typeof body['page'] === 'number' ? (body['page'] as number) : undefined;
    const length = typeof body['length'] === 'number' ? (body['length'] as number) : undefined;

    if (page && page > 0) {
      const { produtos, page: pnum } = await fetchProdutosFacilZapPage(page, length ?? BATCH_SIZE);
      if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, page: pnum }, { status: 200 });

      let imported = 0;
      for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
        const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
        const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
        if (error) {
          console.error('[sync-produtos] upsert error', error);
          return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
        }
        imported += batch.length;
      }

      return NextResponse.json({ ok: true, imported, page: pnum }, { status: 200 });
    }

    const { produtos, pages } = await fetchAllProdutosFacilZap();
    if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, pages }, { status: 200 });

    let imported = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] upsert error', error);
        return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
      }
      imported += batch.length;
    }

    return NextResponse.json({ ok: true, imported, pages }, { status: 200 });
  } catch (e: any) {
    console.error('[sync-produtos] error', e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const parsed = await request.json().catch(() => ({} as unknown));
    const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    const page = typeof body['page'] === 'number' ? (body['page'] as number) : undefined;
    const length = typeof body['length'] === 'number' ? (body['length'] as number) : undefined;

    if (page && page > 0) {
      const { produtos, page: pnum } = await fetchProdutosFacilZapPage(page, length ?? BATCH_SIZE);
      if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, page: pnum }, { status: 200 });

      let imported = 0;
      for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
        const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
        const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
        if (error) {
          console.error('[sync-produtos] upsert error', error);
          return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
        }
        imported += batch.length;
      }

      return NextResponse.json({ ok: true, imported, page: pnum }, { status: 200 });
    }

    const { produtos, pages } = await fetchAllProdutosFacilZap();
    if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, pages }, { status: 200 });

    let imported = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] upsert error', error);
        return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
      }
      imported += batch.length;
    }

    return NextResponse.json({ ok: true, imported, pages }, { status: 200 });
  } catch (e: any) {
    console.error('[sync-produtos] error', e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const parsed = await request.json().catch(() => ({} as unknown));
    const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    const page = typeof body['page'] === 'number' ? (body['page'] as number) : undefined;
    const length = typeof body['length'] === 'number' ? (body['length'] as number) : undefined;

    if (page && page > 0) {
      const { produtos, page: pnum } = await fetchProdutosFacilZapPage(page, length ?? BATCH_SIZE);
      if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, page: pnum }, { status: 200 });

      let imported = 0;
      for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
        const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
        const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
        if (error) {
          console.error('[sync-produtos] upsert error', error);
          return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
        }
        imported += batch.length;
      }

      return NextResponse.json({ ok: true, imported, page: pnum }, { status: 200 });
    }

    const { produtos, pages } = await fetchAllProdutosFacilZap();
    if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, pages }, { status: 200 });

    let imported = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] upsert error', error);
        return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
      }
      imported += batch.length;
    }

    return NextResponse.json({ ok: true, imported, pages }, { status: 200 });
  } catch (e: any) {
    console.error('[sync-produtos] error', e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const body = await request.json().catch(() => ({}));
    const page = body && typeof body.page === 'number' ? body.page : undefined;
    const length = body && typeof body.length === 'number' ? body.length : undefined;

    if (page && page > 0) {
      const { produtos, page: pnum } = await fetchProdutosFacilZapPage(page, length ?? BATCH_SIZE);
      if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, page: pnum }, { status: 200 });

      let imported = 0;
      for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
        const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
        const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
        if (error) {
          console.error('[sync-produtos] upsert error', error);
          return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
        }
        imported += batch.length;
      }

      return NextResponse.json({ ok: true, imported, page: pnum }, { status: 200 });
    }

    const { produtos, pages } = await fetchAllProdutosFacilZap();
    if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, pages }, { status: 200 });

    let imported = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] upsert error', error);
        return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
      }
      imported += batch.length;
    }

    return NextResponse.json({ ok: true, imported, pages }, { status: 200 });
  } catch (e: any) {
    console.error('[sync-produtos] error', e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const body = await request.json().catch(() => ({}));
    const page = Number(body?.page ?? 1) || 1;
    const length = Number(body?.length ?? BATCH_SIZE) || BATCH_SIZE;

    if (page && page > 0) {
      const { produtos, page: pnum, count } = await fetchProdutosFacilZapPage(page, length ?? undefined);
      if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, page: pnum }, { status: 200 });

      let imported = 0;
      for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
        const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
        const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
        if (error) {
          console.error('[sync-produtos] upsert error', error);
          return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
        }
        imported += batch.length;
      }

      return NextResponse.json({ ok: true, imported, page: pnum }, { status: 200 });
    }

    const { produtos, pages } = await fetchAllProdutosFacilZap();
    if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, pages }, { status: 200 });

    let imported = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] upsert error', error);
        return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
      }
      imported += batch.length;
    }

    return NextResponse.json({ ok: true, imported, pages }, { status: 200 });
  } catch (e: any) {
    console.error('[sync-produtos] error', e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const body = await request.json().catch(() => ({}));
    const page = Number(body?.page ?? 1) || 1;
    const length = Number(body?.length ?? BATCH_SIZE) || BATCH_SIZE;

    if (page && page > 0) {
      const { produtos, page: pnum, count } = await fetchProdutosFacilZapPage(page, length ?? undefined);
      if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, page: pnum }, { status: 200 });

      let imported = 0;
      for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
        const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
        const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
        if (error) {
          console.error('[sync-produtos] upsert error', error);
          return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
        }
        imported += batch.length;
      }

      return NextResponse.json({ ok: true, imported, page: pnum }, { status: 200 });
    }

    const { produtos, pages } = await fetchAllProdutosFacilZap();
    if (!produtos || produtos.length === 0) return NextResponse.json({ ok: true, imported: 0, pages }, { status: 200 });

    let imported = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const batch = produtos.slice(i, i + BATCH_SIZE).map((p: ProdutoDB) => ({ ...p, last_synced_at: new Date().toISOString() }));
      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] upsert error', error);
        return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
      }
      imported += batch.length;
    }

    return NextResponse.json({ ok: true, imported, pages }, { status: 200 });
  } catch (e: any) {
    console.error('[sync-produtos] error', e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const body = await request.json().catch(() => ({}));
    const page = Number(body?.page ?? 1) || 1;
    const length = Number(body?.length ?? BATCH_SIZE) || BATCH_SIZE;

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
          // keep provided codigo_barras and variacoes_meta if present
          codigo_barras: (p as any).codigo_barras ?? null,
          variacoes_meta: (p as any).variacoes_meta ?? null,
          // deactivate products with zero stock
          ativo: p.estoque && p.estoque > 0 ? p.ativo : false,
          last_synced_at: new Date().toISOString(),
        }));
        const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
        if (error) {
          console.error('[sync-produtos] upsert error', error);
          return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
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
        codigo_barras: (p as any).codigo_barras ?? null,
        variacoes_meta: (p as any).variacoes_meta ?? null,
        ativo: p.estoque && p.estoque > 0 ? p.ativo : false,
        last_synced_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        console.error('[sync-produtos] upsert error', error);
        return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
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
import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const body = await request.json().catch(() => ({}));
    const page = Number(body?.page ?? 1) || 1;
    const length = Number(body?.length ?? BATCH_SIZE) || BATCH_SIZE;

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
          return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
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
        return NextResponse.json({ error: (error as any).message || 'Erro ao salvar produtos.' }, { status: 500 });
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
