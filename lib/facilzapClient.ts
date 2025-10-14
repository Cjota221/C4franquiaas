import axios from 'axios';

export type ExternalProduct = {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<{ preco?: number | string; estoque?: { estoque?: number } | number }>;
  estoque?: { disponivel?: number; estoque?: number } | number;
  preco?: number | string;
  catalogos?: Array<{
    precos?: { preco?: number | string; variacoes?: unknown };
    grade?: unknown;
  }>;
};

type Variation = { preco?: number | string; estoque?: { estoque?: number } | number } | undefined | null;

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;

function normalizeToProxy(u: string): string {
  let s = u;
  if (!s.includes('://')) {
    s = s.replace(/^\/+/, '');
    s = `https://arquivos.facilzap.app.br/${s}`;
  }
  s = s.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
  return `https://cjotarasteirinhas.com.br/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(s)}`;
}

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function extractImageUrl(x: unknown): string | undefined {
  if (!x) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'object') {
    const obj = x as Record<string, unknown>;
    return asString(obj['url'] ?? obj['file'] ?? obj['path']);
  }
  return undefined;
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN não configurado');

  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });

  const result: ProdutoDB[] = [];
  let page = 1;
  let pagesConsumed = 0;

  while (true) {
    const path = `/produtos?page=${page}&length=${PAGE_SIZE}`;
    let data: unknown;
    try {
      const resp = await client.get(path);
      data = resp.data;
    } catch (err: unknown) {
      console.error('[facilzap] erro ao buscar página', page, err instanceof Error ? err.message : String(err));
      break;
    }

    const items: ExternalProduct[] =
      typeof data === 'object' && data !== null && Array.isArray((data as Record<string, unknown>)['data'])
        ? ((data as Record<string, unknown>)['data'] as ExternalProduct[])
        : Array.isArray(data)
        ? (data as ExternalProduct[])
        : [];
    if (!items || items.length === 0) break;

    for (const p of items) {
      const id = asString(p.id ?? p.codigo);
      if (!id) continue;
      const nome = asString(p.nome) ?? 'Sem nome';
      const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

      // estoque: prefer sum of variation-level estoque when present
      let estoque = 0;
      if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
        estoque = p.variacoes.reduce((acc, v: Variation) => {
          if (!v) return acc;
          const ve = v.estoque;
          if (typeof ve === 'number') return acc + ve;
          if (ve && typeof ve === 'object' && typeof (ve as Record<string, unknown>)['estoque'] === 'number') return acc + ((ve as Record<string, unknown>)['estoque'] as number);
          return acc;
        }, 0);
      }
      // fallback to product-level estoque fields
      if (estoque === 0) {
        if (typeof p.estoque === 'number') estoque = p.estoque as number;
        else if (p.estoque && typeof p.estoque === 'object') {
          const estoqueObj = p.estoque as Record<string, unknown>;
          if (typeof estoqueObj['estoque'] === 'number') estoque = estoqueObj['estoque'] as number;
          else if (typeof estoqueObj['disponivel'] === 'number') estoque = estoqueObj['disponivel'] as number;
        }
      }

      // preco_base: prefer catalogos[0].precos.preco, then variacoes[0].preco, then p.preco
      let preco_base: number | null = null;
      if (Array.isArray(p.catalogos) && p.catalogos.length > 0) {
        const c0 = p.catalogos[0];
        if (c0 && c0.precos && typeof c0.precos === 'object') {
          const pc = (c0.precos as Record<string, unknown>)['preco'];
          if (typeof pc === 'number') preco_base = pc;
          if (typeof pc === 'string') {
            const n = Number(pc);
            if (Number.isFinite(n)) preco_base = n;
          }
        }
      }
      if (preco_base === null && Array.isArray(p.variacoes) && p.variacoes.length > 0) {
        const v0 = p.variacoes[0];
        if (v0 && typeof v0.preco === 'number') preco_base = v0.preco as number;
        if (v0 && typeof v0.preco === 'string') {
          const n = Number(v0.preco);
          if (Number.isFinite(n)) preco_base = n;
        }
      }
      if (preco_base === null && typeof p.preco !== 'undefined') {
        if (typeof p.preco === 'number') preco_base = p.preco;
        if (typeof p.preco === 'string') {
          const n = Number(p.preco);
          if (Number.isFinite(n)) preco_base = n;
        }
      }

      // imagens: entries may be objects with 'url' or 'file' fields
      const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
      const imgs = imgsRaw
        .map((x) => extractImageUrl(x))
        .filter((x): x is string => !!x)
        .map(normalizeToProxy);

      result.push({
        id_externo: id,
        nome,
        preco_base,
        estoque: Number(estoque || 0),
        ativo: Boolean(ativo),
        imagem: imgs.length > 0 ? imgs[0] : null,
        imagens: imgs,
      });
    }

    pagesConsumed++;
    if (process.env.DEBUG_SYNC === 'true') {
      console.log(`[facilzap] page ${page} fetched, items=${items.length}`);
      const sample = items.slice(0, 2).map((it) => {
        const rec = typeof it === 'object' && it !== null ? (it as Record<string, unknown>) : {};
        return {
          id: asString(rec['id'] ?? rec['codigo']) ?? null,
          nome: asString(rec['nome']) ?? null,
          variacoes: Array.isArray(rec['variacoes']) ? (rec['variacoes'] as unknown[]).length : 0,
          preco: rec['preco'] ?? null,
        };
      });
      console.log('[facilzap] sample items:', sample);
    }

    page++;
  }

  return { produtos: result, pages: pagesConsumed };
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN não configurado');

  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const result: ProdutoDB[] = [];

  const path = `/produtos?page=${page}&length=${length}`;
  let data: unknown;
  try {
    const resp = await client.get(path);
    data = resp.data;
  } catch (err: unknown) {
    console.error('[facilzap] erro ao buscar página', page, err instanceof Error ? err.message : String(err));
    return { produtos: [], page, count: 0 };
  }

  const items: ExternalProduct[] =
    typeof data === 'object' && data !== null && Array.isArray((data as Record<string, unknown>)['data'])
      ? ((data as Record<string, unknown>)['data'] as ExternalProduct[])
      : Array.isArray(data)
      ? (data as ExternalProduct[])
      : [];

  for (const p of items) {
    const id = asString(p.id ?? p.codigo);
    if (!id) continue;
    const nome = asString(p.nome) ?? 'Sem nome';
    const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

    let estoque = 0;
    if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
      estoque = p.variacoes.reduce((acc, v: Variation) => {
        if (!v) return acc;
        const ve = v.estoque;
        if (typeof ve === 'number') return acc + ve;
        if (ve && typeof ve === 'object' && typeof (ve as Record<string, unknown>)['estoque'] === 'number') return acc + ((ve as Record<string, unknown>)['estoque'] as number);
        return acc;
      }, 0);
    }
    if (estoque === 0) {
      if (typeof p.estoque === 'number') estoque = p.estoque as number;
      else if (p.estoque && typeof p.estoque === 'object') {
        const estoqueObj = p.estoque as Record<string, unknown>;
        if (typeof estoqueObj['estoque'] === 'number') estoque = estoqueObj['estoque'] as number;
        else if (typeof estoqueObj['disponivel'] === 'number') estoque = estoqueObj['disponivel'] as number;
      }
    }

    let preco_base: number | null = null;
    if (Array.isArray(p.catalogos) && p.catalogos.length > 0) {
      const c0 = p.catalogos[0];
      if (c0 && c0.precos && typeof c0.precos === 'object') {
        const pc = (c0.precos as Record<string, unknown>)['preco'];
        if (typeof pc === 'number') preco_base = pc;
        if (typeof pc === 'string') {
          const n = Number(pc);
          if (Number.isFinite(n)) preco_base = n;
        }
      }
    }
    if (preco_base === null && Array.isArray(p.variacoes) && p.variacoes.length > 0) {
      const v0 = p.variacoes[0];
      if (v0 && typeof v0.preco === 'number') preco_base = v0.preco as number;
      if (v0 && typeof v0.preco === 'string') {
        const n = Number(v0.preco);
        if (Number.isFinite(n)) preco_base = n;
      }
    }
    if (preco_base === null && typeof p.preco !== 'undefined') {
      if (typeof p.preco === 'number') preco_base = p.preco;
      if (typeof p.preco === 'string') {
        const n = Number(p.preco);
        if (Number.isFinite(n)) preco_base = n;
      }
    }

    const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
    const imgs = imgsRaw
      .map((x) => extractImageUrl(x))
      .filter((x): x is string => !!x)
      .map(normalizeToProxy);

    result.push({
      id_externo: id,
      nome,
      preco_base,
      estoque: Number(estoque || 0),
      ativo: Boolean(ativo),
      imagem: imgs.length > 0 ? imgs[0] : null,
      imagens: imgs,
    });
  }

  return { produtos: result, page, count: items.length };
}

export async function fetchProdutoFacilZapById(id: string): Promise<ExternalProduct | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN não configurado');

  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  try {
    // tentativa padrão: GET /produtos/{id}
    const resp = await client.get(`/produtos/${encodeURIComponent(id)}`);
    // FácilZap pode encapsular em { data: {...} } ou retornar o objeto diretamente
    const data = resp.data;
    if (!data) return null;
    const prod = (typeof data === 'object' && data !== null && (data as Record<string, unknown>)['data']) ? (data as Record<string, unknown>)['data'] as ExternalProduct : data as ExternalProduct;
    return prod ?? null;
  } catch (err: unknown) {
    console.error('[facilzap] erro ao buscar produto detalhe', id, err instanceof Error ? err.message : String(err));
    return null;
  }
}
