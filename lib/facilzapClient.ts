// Clean, minimal FácilZap client used by the sync route.

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  descricao?: string | null;
  preco_base?: number | null;
  preco_promocional?: number | null;
  estoque?: number | null;
  ativo?: boolean;
  imagens?: string[];
  imagem?: string | null;
  variacoes_meta?: unknown | null;
  codigo_barras?: string | null;
  last_synced_at?: string | null;
};

type ExternalProduct = Record<string, any>;

const FACILZAP_API = 'https://api.facilzap.app.br/api/v1/products';
const PAGE_SIZE = 50;

function asString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  return null;
}

function parseNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? (v as number) : null;
  if (typeof v === 'string') {
    const cleaned = String(v).replace(/[R$\s]/g, '').replace(/\./g, '').replace(/,/g, '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeEstoque(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Math.round(v);
  if (typeof v === 'string') {
    const n = parseInt((v as string).replace(/[^0-9-]/g, ''), 10);
    return Number.isNaN(n) ? null : n;
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return normalizeEstoque(o['estoque'] ?? o['quantity'] ?? o['quantidade'] ?? null);
  }
  return null;
}

function extractImageUrl(item: unknown): string | null {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (Array.isArray(item) && item.length) return asString(item[0]);
  if (typeof item === 'object') {
    const o = item as Record<string, unknown>;
    for (const k of ['images', 'imagens', 'fotos', 'foto', 'imagem', 'picture', 'pictures']) {
      const v = o[k];
      if (Array.isArray(v) && v.length) return asString(v[0]);
      if (typeof v === 'string') return v as string;
    }
    for (const k of ['url', 'link', 'path']) {
      const v = o[k];
      if (typeof v === 'string') return v;
    }
  }
  return null;
}

function mapToProdutoDB(item: ExternalProduct): ProdutoDB {
  const id_externo = asString(item?.id ?? item?.codigo ?? item?.sku) || '';
  const nome = asString(item?.name ?? item?.titulo ?? item?.nome) || 'Sem nome';
  const descricao = asString(item?.description ?? item?.descricao) ?? null;
  const preco_base = parseNumber(item?.price ?? item?.preco ?? item?.valor) ?? null;
  const preco_promocional = parseNumber(item?.sale_price ?? item?.preco_promocional) ?? null;
  const estoque = normalizeEstoque(item?.stock ?? item?.estoque ?? item?.quantity) ?? null;
  const ativo = item?.active != null ? Boolean(item.active) : item?.ativo != null ? Boolean(item.ativo) : true;

  const imagens: string[] = [];
  if (Array.isArray(item?.images)) imagens.push(...(item.images as any[]).map(asString).filter(Boolean) as string[]);
  if (Array.isArray(item?.imagens)) imagens.push(...(item.imagens as any[]).map(asString).filter(Boolean) as string[]);
  const imagem = imagens.length ? imagens[0] : extractImageUrl(item) ?? null;

  const variacoes_meta = item?.variations ?? item?.variacoes ?? null;
  const codigo_barras = (item && typeof item === 'object') ? (item as any).codigo_barras ?? (item as any).barcode ?? null : null;

  return {
    id_externo,
    nome,
    descricao,
    preco_base,
    preco_promocional,
    estoque,
    ativo,
    imagens: imagens.length ? imagens.map((u) => u).filter(Boolean) : undefined,
    imagem: imagem ?? null,
    variacoes_meta: variacoes_meta ?? null,
    codigo_barras: codigo_barras ?? null,
    last_synced_at: null,
  };
}

async function fetchFacilZap(path: string) {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const url = path.startsWith('http') ? path : `${FACILZAP_API}${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`FacilZap fetch error ${res.status} ${res.statusText} - ${body}`);
  }
  return res.json();
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE) {
  const q = `?page=${page}&length=${length}`;
  const data = await fetchFacilZap(q);
  let items: any[] = [];
  if (Array.isArray(data)) items = data;
  else if (Array.isArray(data?.items)) items = data.items;
  else if (Array.isArray(data?.produtos)) items = data.produtos;

  const normalized = items.map((it) => mapToProdutoDB(it));
  return { produtos: normalized, total: Number(data?.total ?? normalized.length), page: Number(data?.page ?? page) };
}

export async function fetchAllProdutosFacilZap(maxPages = 1000) {
  const out: ProdutoDB[] = [];
  for (let p = 1; p <= maxPages; p++) {
    const { produtos } = await fetchProdutosFacilZapPage(p, PAGE_SIZE);
    if (!produtos || produtos.length === 0) break;
    out.push(...produtos);
    if (produtos.length < PAGE_SIZE) break;
  }
  return { produtos: out, pages: Math.max(1, Math.ceil(out.length / PAGE_SIZE)) };
}

export async function fetchProdutoFacilZapById(id: string) {
  if (!id) return null;
  const data = await fetchFacilZap(`/${encodeURIComponent(id)}`);
  return data ? mapToProdutoDB(data) : null;
}

export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };
// Definitive FácilZap client and normalizer (single clean implementation)

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  descricao?: string | null;
  preco_base?: number | null;
  preco_promocional?: number | null;
  estoque?: number | null;
  ativo?: boolean;
  imagens?: string[];
  imagem?: string | null;
  variacoes_meta?: unknown | null;
  codigo_barras?: string | null;
  last_synced_at?: string | null;
};

type ExternalProduct = Record<string, any>;

const FACILZAP_API = 'https://api.facilzap.app.br/api/v1/products';
const PAGE_SIZE = 50;

function asString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  return null;
}

function parseNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? (v as number) : null;
  if (typeof v === 'string') {
    const cleaned = String(v).replace(/[R$\s]/g, '').replace(/\./g, '').replace(/,/g, '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeEstoque(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Math.round(v);
  if (typeof v === 'string') {
    const n = parseInt((v as string).replace(/[^0-9-]/g, ''), 10);
    return Number.isNaN(n) ? null : n;
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return normalizeEstoque(o['estoque'] ?? o['quantity'] ?? o['quantidade'] ?? null);
  }
  return null;
}

function extractImageUrl(item: unknown): string | null {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (Array.isArray(item) && item.length) return asString(item[0]);
  if (typeof item === 'object') {
    const o = item as Record<string, unknown>;
    for (const k of ['images', 'imagens', 'fotos', 'foto', 'imagem', 'picture', 'pictures']) {
      const v = o[k];
      if (Array.isArray(v) && v.length) return asString(v[0]);
      if (typeof v === 'string') return v as string;
    }
    for (const k of ['url', 'link', 'path']) {
      const v = o[k];
      if (typeof v === 'string') return v;
    }
  }
  return null;
}

function normalizeToProxy(url: string | null | undefined): string | null {
  if (!url) return null;
  const proxy = process.env.NEXT_PUBLIC_PROXY_HOST || process.env.NEXT_PUBLIC_PROXY_URL;
  if (!proxy) return url;
  try {
    const u = new URL(String(url));
    // If already pointing to proxy host, keep as-is
    if (new URL(proxy).hostname === u.hostname) return u.toString();
  } catch (e) {
    // ignore parsing errors
  }
  return `${proxy.replace(/\/+$/, '')}/${String(url).replace(/^\/+/, '')}`;
}

function extractBarcode(item: unknown): string | null {
  if (!item || typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;
  const keys = ['codigo_barras', 'barcode', 'ean', 'gtin', 'codigo', 'cod_barras'];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return null;
}

function mapToProdutoDB(item: ExternalProduct): ProdutoDB {
  const id_externo = asString(item?.id ?? item?.codigo ?? item?.sku) || '';
  const nome = asString(item?.name ?? item?.titulo ?? item?.nome) || 'Sem nome';
  const descricao = asString(item?.description ?? item?.descricao) ?? null;
  const preco_base = parseNumber(item?.price ?? item?.preco ?? item?.valor) ?? null;
  const preco_promocional = parseNumber(item?.sale_price ?? item?.preco_promocional) ?? null;
  const estoque = normalizeEstoque(item?.stock ?? item?.estoque ?? item?.quantity) ?? null;
  const ativo = item?.active != null ? Boolean(item.active) : item?.ativo != null ? Boolean(item.ativo) : true;

  const imagens: string[] = [];
  if (Array.isArray(item?.images)) imagens.push(...(item.images as any[]).map(asString).filter(Boolean) as string[]);
  if (Array.isArray(item?.imagens)) imagens.push(...(item.imagens as any[]).map(asString).filter(Boolean) as string[]);
  const imagem = imagens.length ? imagens[0] : extractImageUrl(item) ?? null;

  const variacoes_meta = item?.variations ?? item?.variacoes ?? null;
  const codigo_barras = extractBarcode(item?.meta ?? item);

  return {
    id_externo,
    nome,
    descricao,
    preco_base,
    preco_promocional,
    estoque,
    ativo,
    imagens: imagens.length ? imagens.map((u) => normalizeToProxy(u) as string).filter(Boolean) : undefined,
    imagem: imagem ? normalizeToProxy(imagem) : null,
    variacoes_meta: variacoes_meta ?? null,
    codigo_barras: codigo_barras ?? null,
    last_synced_at: null,
  };
}

async function fetchFacilZap(path: string) {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const url = path.startsWith('http') ? path : `${FACILZAP_API}${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`FacilZap fetch error ${res.status} ${res.statusText} - ${body}`);
  }
  return res.json();
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE) {
  const q = `?page=${page}&length=${length}`;
  const data = await fetchFacilZap(q);
  let items: any[] = [];
  if (Array.isArray(data)) items = data;
  else if (Array.isArray(data?.items)) items = data.items;
  else if (Array.isArray(data?.produtos)) items = data.produtos;

  const normalized = items.map((it) => mapToProdutoDB(it));
  return { produtos: normalized, total: Number(data?.total ?? normalized.length), page: Number(data?.page ?? page) };
}

export async function fetchAllProdutosFacilZap(maxPages = 1000) {
  const out: ProdutoDB[] = [];
  let lastPage = 0;
  for (let p = 1; p <= maxPages; p++) {
    const { produtos, page } = await fetchProdutosFacilZapPage(p, PAGE_SIZE);
    lastPage = page ?? p;
    if (!produtos || produtos.length === 0) break;
    out.push(...produtos);
    if (produtos.length < PAGE_SIZE) break;
  }
  return { produtos: out, pages: lastPage };
}

export async function fetchProdutoFacilZapById(id: string) {
  if (!id) return null;
  const data = await fetchFacilZap(`/${encodeURIComponent(id)}`);
  return data ? mapToProdutoDB(data) : null;
}

export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };
// Definitive FácilZap client and normalizer

export type ProdutoDB = {
  id_externo: string; // FácilZap product id
  nome: string;
  descricao?: string | null;
  preco_base?: number | null;
  preco_promocional?: number | null;
  estoque?: number | null;
  // CORREÇÃO DEFINITIVA - FácilZap client (single clean implementation)

  export type ProdutoDB = {
    id_externo: string;
    nome: string;
    descricao?: string | null;
    preco_base?: number | null;
    preco_promocional?: number | null;
    estoque?: number | null;
    ativo?: boolean;
    imagens?: string[];
    imagem?: string | null;
    variacoes_meta?: Record<string, unknown> | null;
    codigo_barras?: string | null;
    last_synced_at?: string | null;
  };

  type ExternalProduct = any;

  const FACILZAP_API = 'https://api.facilzap.app.br/api/v1/products';
  const PAGE_SIZE = 50;

  function asString(v: unknown): string | null {
    if (v == null) return null;
    if (typeof v === 'string') return v.trim() || null;
    if (typeof v === 'number') return String(v);
    return null;
  }

  function parseNumber(v: unknown): number | null {
    if (v == null) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? (v as number) : null;
    if (typeof v === 'string') {
      const cleaned = String(v).replace(/[R$\s]/g, '').replace(/\./g, '').replace(/,/g, '.');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  function normalizeEstoque(v: unknown): number | null {
    if (v == null) return null;
    if (typeof v === 'number') return Math.round(v);
    if (typeof v === 'string') {
      const n = parseInt(v.replace(/[^0-9-]/g, ''), 10);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  }

  function extractImageUrl(item: ExternalProduct): string | null {
    if (!item) return null;
    if (typeof item === 'string') return item;
    if (Array.isArray(item) && item.length) return asString(item[0]) ?? null;
    if (typeof item === 'object') {
      for (const k of ['images', 'imagens', 'fotos', 'foto', 'imagem', 'picture', 'pictures']) {
        const v = (item as any)[k];
        if (Array.isArray(v) && v.length) return asString(v[0]) ?? null;
        if (typeof v === 'string') return v;
      }
      for (const k of ['url', 'link', 'path']) {
        const v = (item as any)[k];
        if (typeof v === 'string') return v;
      }
    }
    return null;
  }

  function normalizeToProxy(url: string | null | undefined): string | null {
    if (!url) return null;
    const proxy = process.env.NEXT_PUBLIC_PROXY_HOST || process.env.NEXT_PUBLIC_PROXY_URL;
    if (!proxy) return url;
    return `${proxy.replace(/\/+$/, '')}/${String(url).replace(/^\/+/, '')}`;
  }

  function extractBarcode(item: ExternalProduct): string | null {
    if (!item || typeof item !== 'object') return null;
    const keys = ['codigo_barras', 'barcode', 'ean', 'gtin', 'codigo'];
    for (const k of keys) {
      const v = (item as any)[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number') return String(v);
    }
    return null;
  }

  function mapToProdutoDB(item: ExternalProduct): ProdutoDB {
    const id_externo = asString(item?.id ?? item?.codigo ?? item?.sku) || '';
    const nome = asString(item?.name ?? item?.titulo ?? item?.nome) || 'Sem nome';
    const descricao = asString(item?.description ?? item?.descricao) ?? null;
    const preco_base = parseNumber(item?.price ?? item?.preco ?? item?.valor) ?? null;
    const preco_promocional = parseNumber(item?.sale_price ?? item?.preco_promocional) ?? null;
    const estoque = normalizeEstoque(item?.stock ?? item?.estoque ?? item?.quantity) ?? null;
    const ativo = item?.active != null ? Boolean(item.active) : item?.ativo != null ? Boolean(item.ativo) : true;
    const imagens: string[] = [];
    if (Array.isArray(item?.images)) imagens.push(...(item.images as any[]).map(asString).filter(Boolean) as string[]);
    if (Array.isArray(item?.imagens)) imagens.push(...(item.imagens as any[]).map(asString).filter(Boolean) as string[]);
    const imagem = imagens.length ? imagens[0] : extractImageUrl(item);
    const variacoes_meta = item?.variations ?? item?.variacoes ?? null;
    const codigo_barras = extractBarcode(item);

    return {
      id_externo,
      nome,
      descricao,
      preco_base,
      preco_promocional,
      estoque,
      ativo,
      imagens: imagens.length ? imagens.map(normalizeToProxy).filter(Boolean) as string[] : undefined,
      imagem: (imagem ? normalizeToProxy(imagem) : null),
      variacoes_meta: variacoes_meta ?? null,
      codigo_barras: codigo_barras ?? null,
      last_synced_at: null,
    };
  }

  async function fetchFacilZap(path: string) {
    const token = process.env.FACILZAP_TOKEN;
    if (!token) throw new Error('FACILZAP_TOKEN is not set');
    const url = path.startsWith('http') ? path : `${FACILZAP_API}${path}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`FacilZap fetch error ${res.status} ${res.statusText} - ${body}`);
    }
    return await res.json();
  }

  export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE) {
    const q = `?page=${page}&length=${length}`;
    const data = await fetchFacilZap(q);
    let items: any[] = [];
    if (Array.isArray(data)) items = data;
    else if (Array.isArray(data?.items)) items = data.items;
    else if (Array.isArray(data?.produtos)) items = data.produtos;

    const normalized = items.map((it) => mapToProdutoDB(it));
    return { items: normalized, total: Number(data?.total ?? normalized.length) };
  }

  export async function fetchAllProdutosFacilZap(maxPages = 1000) {
    const out: ProdutoDB[] = [];
    for (let p = 1; p <= maxPages; p++) {
      const { items } = await fetchProdutosFacilZapPage(p, PAGE_SIZE);
      if (!items || items.length === 0) break;
      out.push(...items);
      if (items.length < PAGE_SIZE) break;
    }
    return out;
  }

  export async function fetchProdutoFacilZapById(id: string) {
    if (!id) return null;
    const data = await fetchFacilZap(`/${encodeURIComponent(id)}`);
    return data ? mapToProdutoDB(data) : null;
  }

  export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };
  ativo?: boolean;
  imagem?: string | null;
  imagens?: string[];
  variacoes_meta?: any;
  codigo_barras?: string | null;
  last_synced_at?: string | null;
};

type ExternalProduct = any; // FácilZap payloads vary

const FACILZAP_API = 'https://api.facilzap.app.br/api/v1/products';
const PAGE_SIZE = 50;

function asString(v: unknown) {
  if (v == null) return undefined;
  if (typeof v === 'string') return v.trim() || undefined;
  if (typeof v === 'number') return String(v);
  return undefined;
}

function parseNumber(v: unknown) {
  if (v == null) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const n = Number(String(v).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeEstoque(v: unknown) {
  if (v == null) return undefined;
  if (typeof v === 'number') return Math.max(0, Math.floor(v));
  if (typeof v === 'string') {
    const n = Number(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : undefined;
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return normalizeEstoque(o['estoque'] ?? o['disponivel'] ?? o['quantity'] ?? o['quantidade']);
  }
  return undefined;
}

function extractImageUrl(item: ExternalProduct): string | null {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (Array.isArray(item)) return asString(item[0]) ?? null;
  if (typeof item === 'object') {
    for (const k of ['images', 'imagens', 'fotos', 'foto', 'imagem', 'picture', 'pictures']) {
      const v = (item as any)[k];
      if (Array.isArray(v) && v.length) return asString(v[0]) ?? null;
      if (typeof v === 'string') return v;
    }
    for (const k of ['url', 'link', 'path']) {
      const v = (item as any)[k];
      if (typeof v === 'string') return v;
    }
  }
  return null;
}

function normalizeToProxy(url: string | null | undefined) {
  if (!url) return null;
  const proxy = process.env.NEXT_PUBLIC_PROXY_HOST || 'https://c4franquiaas.netlify.app';
  try {
    const u = new URL(String(url));
    if (u.hostname === new URL(proxy).hostname) return u.toString();
  } catch (e) {
    // ignore
  }
  return `${proxy}/api/proxy?url=${encodeURIComponent(String(url))}`;
}

function extractBarcode(item: ExternalProduct): string | null {
  if (!item || typeof item !== 'object') return null;
  const keys = ['codigo_barras', 'barcode', 'ean', 'gtin', 'codigo', 'cod_barras'];
  for (const k of keys) {
    const v = (item as any)[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return null;
}

function mapToProdutoDB(item: ExternalProduct): ProdutoDB {
  const id_externo = asString(item?.id ?? item?._id ?? item?.codigo ?? item?.sku) || '';
  const titulo = asString(item?.title ?? item?.titulo ?? item?.nome) || '';
  const descricao = asString(item?.description ?? item?.descricao) ?? null;
  const preco_base = parseNumber(item?.price ?? item?.preco ?? item?.valor) ?? null;
  const preco_promocional = parseNumber(item?.sale_price ?? item?.preco_promocional) ?? null;
  const estoque = normalizeEstoque(item?.stock ?? item?.estoque ?? item?.quantity) ?? null;
  const ativo = item?.active != null ? Boolean(item.active) : item?.ativo != null ? Boolean(item.ativo) : true;
  const imagem = normalizeToProxy(extractImageUrl(item));
  const imagens: string[] = [];
  if (Array.isArray(item?.images)) imagens.push(...(item.images as any[]).map(asString).filter(Boolean) as string[]);
  if (Array.isArray(item?.imagens)) imagens.push(...(item.imagens as any[]).map(asString).filter(Boolean) as string[]);
  if (imagem && !imagens.includes(imagem)) imagens.unshift(imagem);
  const variacoes_meta = item?.variations ?? item?.variacoes ?? null;
  const codigo_barras = extractBarcode(item);

  return {
    id_externo,
    titulo,
    descricao,
    preco_base,
    preco_promocional,
    estoque,
    ativo,
    imagem,
    imagens,
    variacoes_meta,
    codigo_barras,
    last_synced_at: null,
  };
}

async function fetchFacilZap(path: string) {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is required');
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`FacilZap fetch error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE) {
  const url = `${FACILZAP_API}?page=${page}&length=${length}`;
  const data = await fetchFacilZap(url);
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.produtos) ? data.produtos : [];
  const produtos = items.map((i: any) => mapToProdutoDB(i));
  return { produtos, page: data?.page ?? page };
}

export async function fetchAllProdutosFacilZap(maxPages = 1000) {
  const first = await fetchProdutosFacilZapPage(1);
  const pages = Math.min(first?.page ?? 1, maxPages);
  let produtos = first.produtos ?? [];
  for (let p = 2; p <= pages; p++) {
    const res = await fetchProdutosFacilZapPage(p);
    produtos = produtos.concat(res.produtos ?? []);
  }
  return { produtos, pages };
}

export async function fetchProdutoFacilZapById(id: string) {
  const url = `${FACILZAP_API}/${encodeURIComponent(id)}`;
  const data = await fetchFacilZap(url);
  return mapToProdutoDB(data);
}

export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  try {
    const resp = await axios.get(`${API_BASE}/produtos/${encodeURIComponent(String(id))}`, { timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
    const raw = resp?.data ?? null;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (e) {
    return null;
  }
}

export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };
import axios from 'axios';

// CORREÇÃO DEFINITIVA: clean, minimal FácilZap client used by the sync route

export type ExternalProduct = Record<string, unknown> & {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  descricao?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<Record<string, unknown>>;
  estoque?: number | string | Record<string, unknown>;
  preco?: number | string;
  [key: string]: unknown;
};

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string | number | undefined; nome?: string | undefined; codigo_barras?: string | null; estoque?: number | null }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;
const PROXY_HOST = process.env.NEXT_PUBLIC_PROXY_HOST ?? 'https://c4franquiaas.netlify.app';

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(v?: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === 'string') {
    const n = Number(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return normalizeEstoque(o['estoque'] ?? o['disponivel'] ?? o['quantity'] ?? o['quantidade']);
  }
  return 0;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (x == null) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (typeof x === 'object') {
    const o = x as Record<string, unknown>;
    for (const k of ['url', 'link', 'path', 'imagem', 'foto', 'arquivo', 'file']) {
      if (k in o) return asString(o[k]);
    }
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') return v;
    }
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  const s = String(u).trim();
  if (!s) return undefined;
  if (s.includes(`${PROXY_HOST}/.netlify/functions/proxy-facilzap-image`)) return s;
  return `${PROXY_HOST}/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(s)}`;
}

function extractBarcode(obj?: Record<string, unknown> | null): string | null {
  if (!obj) return null;
  const keys = ['codigo_barras', 'codigoBarras', 'barcode', 'ean', 'gtin', 'codigo', 'cod_barras'];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const k of Object.keys(obj)) {
    const lk = k.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = obj[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function parsePrice(v?: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function mapToProdutoDB(p: ExternalProduct): ProdutoDB {
  const id_externo = String(p.id ?? p.codigo ?? '');
  const nome = asString(p.nome) || asString(p.descricao) || 'Sem nome';

  let preco_base: number | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length) {
    const vals = p.variacoes.map((v: any) => parsePrice(v?.preco ?? v?.price ?? v?.valor)).filter((n: any) => n != null) as number[];
    if (vals.length) preco_base = Math.min(...vals);
  }
  if (preco_base === null && p.preco != null) preco_base = parsePrice(p.preco);

  const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
  const imagens = imgsRaw.map(extractImageUrl).filter((x): x is string => !!x).map(normalizeToProxy).filter((x): x is string => !!x);
  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) {
    const prox = normalizeToProxy(single);
    if (prox && !imagens.includes(prox)) imagens.unshift(prox);
  }

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const q = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += q;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      const resolvedId: string | number | undefined = typeof rec['id'] === 'string' || typeof rec['id'] === 'number' ? (rec['id'] as string | number) : typeof rec['codigo'] === 'string' || typeof rec['codigo'] === 'number' ? (rec['codigo'] as string | number) : undefined;
      variacoes_meta.push({ id: resolvedId, sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: q });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(p as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens, codigo_barras, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const resp = await client.get(`/produtos?page=${page}&length=${length}`);
  const data = resp?.data ?? {};
  const items: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data?.produtos) ? data.data.produtos : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : produtos.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break; // safety cap
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  try {
    const resp = await axios.get(`${API_BASE}/produtos/${encodeURIComponent(String(id))}`, { timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
    const raw = resp?.data ?? null;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (e) {
    return null;
  }
}

export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };

// Definitive, minimal FacilZap client. Exports three functions used by sync route.

export type ExternalProduct = Record<string, unknown> & {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  descricao?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<Record<string, unknown>>;
  estoque?: number | string | Record<string, unknown>;
  preco?: number | string;
  catalogos?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string | number | undefined; nome?: string | undefined; codigo_barras?: string | null; estoque?: number | null }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;
const PROXY_HOST = process.env.NEXT_PUBLIC_PROXY_HOST ?? 'https://c4franquiaas.netlify.app';

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(v?: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === 'string') {
    const n = Number(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return normalizeEstoque(o['estoque'] ?? o['disponivel'] ?? o['quantity'] ?? o['quantidade']);
  }
  return 0;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (x == null) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (typeof x === 'object') {
    const o = x as Record<string, unknown>;
    for (const k of ['url', 'link', 'path', 'imagem', 'foto', 'arquivo', 'file']) {
      if (k in o) return asString(o[k]);
    }
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') return v;
    }
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  const s = String(u).trim();
  if (!s) return undefined;
  if (s.includes(`${PROXY_HOST}/.netlify/functions/proxy-facilzap-image`)) return s;
  return `${PROXY_HOST}/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(s)}`;
}

function extractBarcode(obj?: Record<string, unknown> | null): string | null {
  if (!obj) return null;
  const keys = ['codigo_barras', 'codigoBarras', 'barcode', 'ean', 'gtin', 'codigo', 'cod_barras'];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const k of Object.keys(obj)) {
    const lk = k.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = obj[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function parsePrice(v?: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function mapToProdutoDB(p: ExternalProduct): ProdutoDB {
  const id_externo = String(p.id ?? p.codigo ?? '');
  const nome = asString(p.nome) || asString(p.descricao) || 'Sem nome';

  let preco_base: number | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length) {
    const vals = p.variacoes.map((v: any) => parsePrice(v?.preco ?? v?.price ?? v?.valor)).filter((n: any) => n != null) as number[];
    if (vals.length) preco_base = Math.min(...vals);
  }
  if (preco_base === null && p.preco != null) preco_base = parsePrice(p.preco);

  const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
  const imagens = imgsRaw.map(extractImageUrl).filter((x): x is string => !!x).map(normalizeToProxy).filter((x): x is string => !!x);
  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) {
    const prox = normalizeToProxy(single);
    if (prox && !imagens.includes(prox)) imagens.unshift(prox);
  }

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const q = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += q;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      const resolvedId: string | number | undefined = typeof rec['id'] === 'string' || typeof rec['id'] === 'number' ? (rec['id'] as string | number) : typeof rec['codigo'] === 'string' || typeof rec['codigo'] === 'number' ? (rec['codigo'] as string | number) : undefined;
      variacoes_meta.push({ id: resolvedId, sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: q });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(p as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens, codigo_barras, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const resp = await client.get(`/produtos?page=${page}&length=${length}`);
  const data = resp?.data ?? {};
  const items: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data?.produtos) ? data.data.produtos : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : produtos.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  try {
    const resp = await axios.get(`${API_BASE}/produtos/${encodeURIComponent(String(id))}`, { timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
    const raw = resp?.data ?? null;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (e) {
    return null;
  }
}

export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };
import axios from 'axios';

// CORREÇÃO DEFINITIVA - clean, single-module FácilZap client

export type ExternalProduct = Record<string, unknown> & {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  descricao?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<Record<string, unknown>>;
  estoque?: number | string | Record<string, unknown>;
  preco?: number | string;
  catalogos?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string | number | undefined; nome?: string | undefined; codigo_barras?: string | null; estoque?: number | null }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;
const PROXY_HOST = process.env.NEXT_PUBLIC_PROXY_HOST ?? 'https://c4franquiaas.netlify.app';

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(v?: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  if (typeof v === 'string') {
    const n = Number(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return normalizeEstoque(o['estoque'] ?? o['disponivel'] ?? o['quantity'] ?? o['quantidade']);
  }
  return 0;
}

function extractBarcode(item?: Record<string, unknown> | null): string | null {
  if (!item) return null;
  const candidates = ['codigo_barras', 'codigoBarras', 'barcode', 'ean', 'gtin', 'codigo', 'cod_barras'];
  for (const k of candidates) {
    const v = item[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const k of Object.keys(item)) {
    const lk = k.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = item[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    for (const k of ['url', 'link', 'path', 'imagem', 'foto', 'arquivo', 'file']) {
      if (k in o) {
        const s = asString(o[k]);
        if (s) return s;
      }
    }
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
    }
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  const s = String(u).trim();
  if (!s) return undefined;
  if (s.includes(`${PROXY_HOST}/.netlify/functions/proxy-facilzap-image`)) return s;
  const param = encodeURIComponent(s);
  return `${PROXY_HOST}/.netlify/functions/proxy-facilzap-image?url=${param}`;
}

function parsePrice(v?: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function mapToProdutoDB(p: ExternalProduct): ProdutoDB {
  const id_externo = String(p.id ?? p.codigo ?? '');
  const nome = asString(p.nome) || asString(p.descricao) || 'Sem nome';

  let preco_base: number | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length) {
    const vals = p.variacoes
      .map((v: any) => parsePrice(v?.preco ?? v?.price ?? v?.valor))
      .filter((n: any) => n != null) as number[];
    if (vals.length) preco_base = Math.min(...vals);
  }
  if (preco_base === null && p.preco != null) preco_base = parsePrice(p.preco);

  const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
  const imagens = imgsRaw
    .map(extractImageUrl)
    .filter((x): x is string => !!x)
    .map(normalizeToProxy)
    .filter((x): x is string => !!x);

  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) {
    const prox = normalizeToProxy(single);
    if (prox && !imagens.includes(prox)) imagens.unshift(prox);
  }

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;

  if (Array.isArray(p.variacoes) && p.variacoes.length) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const q = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += q;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      const resolvedId: string | number | undefined = typeof rec['id'] === 'string' || typeof rec['id'] === 'number' ? (rec['id'] as string | number) : typeof rec['codigo'] === 'string' || typeof rec['codigo'] === 'number' ? (rec['codigo'] as string | number) : undefined;
      variacoes_meta.push({ id: resolvedId, sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: q });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(p as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens, codigo_barras, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const resp = await client.get(`/produtos?page=${page}&length=${length}`);
  const data = resp?.data ?? {};
  const items: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data?.produtos) ? data.data.produtos : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : produtos.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  try {
    const resp = await axios.get(`${API_BASE}/produtos/${encodeURIComponent(String(id))}`, { timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
    const raw = resp?.data ?? null;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (e) {
    return null;
  }
}

export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };
import axios from 'axios';

// CORREÇÃO DEFINITIVA - minimal, robust FacilZap client

export type ExternalProduct = Record<string, any>;

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string | number | undefined; nome?: string | undefined; codigo_barras?: string | null; estoque?: number | null }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;
const PROXY_HOST = process.env.NEXT_PUBLIC_PROXY_HOST ?? 'https://c4franquiaas.netlify.app';

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(v?: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return Math.max(0, Math.floor(v));
  if (typeof v === 'string') {
    const n = Number(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return normalizeEstoque(o['estoque'] ?? o['disponivel'] ?? o['quantity'] ?? o['quantidade']);
  }
  return 0;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (!x && x !== 0) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (typeof x === 'object') {
    const o = x as Record<string, unknown>;
    return asString(o['url'] ?? o['link'] ?? o['path'] ?? o['imagem'] ?? o['foto'] ?? Object.values(o)[0]);
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  const s = String(u).trim();
  if (!s) return undefined;
  const param = encodeURIComponent(s);
  return `${PROXY_HOST}/.netlify/functions/proxy-facilzap-image?url=${param}`;
}

function parsePrice(v?: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function mapToProdutoDB(p: ExternalProduct): ProdutoDB {
  const id_externo = String(p.id ?? p.codigo ?? '');
  const nome = asString(p.nome) || asString(p.descricao) || 'Sem nome';

  let preco_base: number | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length) {
    const vals = p.variacoes.map((v: any) => parsePrice(v?.preco ?? v?.price ?? v?.valor)).filter((n: any) => n != null) as number[];
    if (vals.length) preco_base = Math.min(...vals);
  }
  if (preco_base === null && p.preco != null) preco_base = parsePrice(p.preco);

  const imgs = (Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [])
    .map(extractImageUrl)
    .filter((x): x is string => !!x)
    .map(normalizeToProxy)
    .filter((x): x is string => !!x);

  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) imgs.unshift(normalizeToProxy(single) ?? single);

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  if (Array.isArray(p.variacoes) && p.variacoes.length) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const q = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += q;
      variacoes_meta.push({ id: rec['id'] ?? rec['codigo'], sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: extractImageUrl(rec['codigo_barras'] as any) ?? null, estoque: q });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const imagem = imgs.length ? imgs[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens: imgs, codigo_barras: undefined, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const resp = await client.get(`/produtos?page=${page}&length=${length}`);
  const data = resp?.data ?? {};
  const list: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  const produtos = list.map((i) => mapToProdutoDB(i));
  const count = typeof data?.count === 'number' ? data.count : produtos.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  try {
    const resp = await axios.get(`${API_BASE}/produtos/${encodeURIComponent(String(id))}`, { timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
    const raw = resp?.data ?? null;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (e) {
    return null;
  }
}

export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };
import axios from 'axios';

// CORREÇÃO DEFINITIVA - single clean FacilZap client

export type ExternalProduct = Record<string, any>;

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string | number | undefined; nome?: string | undefined; codigo_barras?: string | null; estoque?: number | null }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;
const PROXY_HOST = process.env.NEXT_PUBLIC_PROXY_HOST ?? 'https://c4franquiaas.netlify.app';

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(v?: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return Math.max(0, Math.floor(v));
  if (typeof v === 'string') {
    const n = Number(String(v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return normalizeEstoque(o['estoque'] ?? o['disponivel'] ?? o['quantity'] ?? o['quantidade']);
  }
  return 0;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (!x && x !== 0) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (typeof x === 'object') {
    const o = x as Record<string, unknown>;
    return asString(o['url'] ?? o['link'] ?? o['path'] ?? o['imagem'] ?? o['foto'] ?? Object.values(o)[0]);
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  const s = String(u).trim();
  if (!s) return undefined;
  const param = encodeURIComponent(s);
  return `${PROXY_HOST}/.netlify/functions/proxy-facilzap-image?url=${param}`;
}

function parsePrice(v?: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function mapToProdutoDB(p: ExternalProduct): ProdutoDB {
  const id_externo = String(p.id ?? p.codigo ?? '');
  const nome = asString(p.nome) || asString(p.descricao) || 'Sem nome';

  let preco_base: number | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length) {
    const vals = p.variacoes.map((v: any) => parsePrice(v?.preco ?? v?.price ?? v?.valor)).filter((n: any) => n != null) as number[];
    if (vals.length) preco_base = Math.min(...vals);
  }
  if (preco_base === null && p.preco != null) preco_base = parsePrice(p.preco);

  const imgs = (Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [])
    .map(extractImageUrl)
    .filter((x): x is string => !!x)
    .map(normalizeToProxy)
    .filter((x): x is string => !!x);

  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) imgs.unshift(normalizeToProxy(single) ?? single);

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  if (Array.isArray(p.variacoes) && p.variacoes.length) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const q = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += q;
      variacoes_meta.push({ id: rec['id'] ?? rec['codigo'], sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: null, estoque: q });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const imagem = imgs.length ? imgs[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens: imgs, codigo_barras: null, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const resp = await client.get(`/produtos?page=${page}&length=${length}`);
  const data = resp?.data ?? {};
  const list: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  const produtos = list.map((i) => mapToProdutoDB(i));
  const count = typeof data?.count === 'number' ? data.count : produtos.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  try {
    const resp = await axios.get(`${API_BASE}/produtos/${encodeURIComponent(String(id))}`, { timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
    const raw = resp?.data ?? null;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (e) {
    return null;
  }
}

export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : Array.isArray(data?.data?.produtos)
      ? data.data.produtos
      : [];
    const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
    const count = typeof data?.count === 'number' ? data.count : items.length;
    return { produtos, page, count };
  }

  export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
    const produtos: ProdutoDB[] = [];
    let page = 1;
    while (true) {
      const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
      if (!pageItems || pageItems.length === 0) break;
      produtos.push(...pageItems);
      if (pageItems.length < PAGE_SIZE) break;
      page += 1;
      if (page > 1000) break;
    }
    return { produtos, pages: page };
  }

  export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
    const token = process.env.FACILZAP_TOKEN;
    if (!token) throw new Error('FACILZAP_TOKEN is not set');
    const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
    try {
      const resp = await client.get(`/produtos/${encodeURIComponent(String(id))}`);
      const raw = resp?.data ?? null;
      const prod = raw?.produto ?? raw?.data ?? raw;
      if (!prod) return null;
      return mapToProdutoDB(prod as ExternalProduct);
    } catch (err) {
      return null;
    }
  }

  export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<Record<string, unknown>>;
  estoque?: number | string | Record<string, unknown>;
  preco?: number | string;
  catalogos?: Array<Record<string, unknown>>;
};

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{
    id?: string | number;
    sku?: string | number | undefined;
    nome?: string | undefined;
    codigo_barras?: string | null;
    estoque?: number | null;
  }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;

const PROXY_HOST = process.env.NEXT_PUBLIC_PROXY_HOST ?? 'https://c4franquiaas.netlify.app';

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const key of ['estoque', 'disponivel', 'quantity', 'quantidade', 'qtd']) {
      if (key in o) return normalizeEstoque(o[key]);
    }
  }
  return 0;
}

function extractBarcode(item?: Record<string, unknown> | null): string | null {
  if (!item) return null;
  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
  for (const k of arrKeys) {
    const v = item[k];
    if (Array.isArray(v) && v.length > 0) {
      for (const it of v) {
        if (typeof it === 'string' && it.trim()) return it.trim();
        if (typeof it === 'number') return String(it);
      }
    }
  }
  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode'];
  for (const k of candidates) {
    const v = item[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const k of Object.keys(item)) {
    const lk = k.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = item[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    for (const k of ['url', 'link', 'path', 'imagem', 'foto', 'arquivo', 'file']) {
      if (k in o) {
        const s = asString(o[k]);
        if (s) return s;
      }
    }
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
    }
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  let s = u.trim();
  if (!s) return undefined;
  // avoid double-proxy
  if (s.includes(`${PROXY_HOST}/.netlify/functions/proxy-facilzap-image`)) return s;
  try {
    const d = decodeURIComponent(s);
    if (d && d.length) s = d;
  } catch (e) {
    // ignore
  }
  s = s.replace(/\s+/g, '%20');
  if (s.startsWith('//')) s = 'https:' + s;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = `https://arquivos.facilzap.app.br/${s.replace(/^\/+/, '')}`;
  s = s.replace(/^http:/i, 'https:');
  const param = encodeURIComponent(s);
  return `${PROXY_HOST}/.netlify/functions/proxy-facilzap-image?url=${param}`;
}

function parsePriceRaw(v?: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).replace(/[^0-9.,-]/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function mapToProdutoDB(p: ExternalProduct): ProdutoDB {
  const id_externo = String(p.id ?? p.codigo ?? '');
  const nome = asString(p.nome) || asString(p.descricao) || 'Sem nome';

  // preco_base: min variation price or product price
  let preco_base: number | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    const nums: number[] = [];
    for (const v of p.variacoes) {
      const pv = (v as any)?.preco ?? (v as any)?.price ?? (v as any)?.valor;
      const n = parsePriceRaw(pv);
      if (n != null) nums.push(n);
    }
    if (nums.length) preco_base = Math.min(...nums);
  }
  if (preco_base === null && p.preco != null) {
    const n = parsePriceRaw(p.preco);
    if (n != null) preco_base = n;
  }

  const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
  const imagens: string[] = imgsRaw
    .map(extractImageUrl)
    .filter((x): x is string => !!x)
    .map(normalizeToProxy)
    .filter((x): x is string => !!x);

  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) {
    const prox = normalizeToProxy(single);
    if (prox && !imagens.includes(prox)) imagens.unshift(prox);
  }

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;

  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const vEst = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += vEst;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      const resolvedId: string | number | undefined = typeof rec['id'] === 'string' || typeof rec['id'] === 'number' ? (rec['id'] as string | number) : typeof rec['codigo'] === 'string' || typeof rec['codigo'] === 'number' ? (rec['codigo'] as string | number) : undefined;
      variacoes_meta.push({ id: resolvedId, sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: vEst });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(p as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return {
    id_externo,
    nome,
    preco_base,
    estoque,
    ativo,
    imagem,
    imagens,
    codigo_barras,
    variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined,
  } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const path = `/produtos?page=${page}&length=${length}`;
  const resp = await client.get(path);
  const data = resp?.data ?? {};
  const items: any[] = Array.isArray(data?.produtos)
    ? data.produtos
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : Array.isArray(data?.data?.produtos)
    ? data.data.produtos
    : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : items.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(String(id))}`);
    const raw = resp?.data ?? null;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (err) {
    return null;
  }
}

export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };
import axios from 'axios';

// CORREÇÃO DEFINITIVA - FacilZap client (single clean module)

export type ExternalProduct = Record<string, unknown> & {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  descricao?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<Record<string, unknown>>;
  estoque?: number | string | Record<string, unknown>;
  preco?: number | string;
  catalogos?: Array<Record<string, unknown>>;
};

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{
    id?: string | number;
    sku?: string | number | undefined;
    nome?: string | undefined;
    codigo_barras?: string | null;
    estoque?: number | null;
  }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;

const PROXY_HOST = process.env.NEXT_PUBLIC_PROXY_HOST ?? 'https://c4franquiaas.netlify.app';

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const key of ['estoque', 'disponivel', 'quantity', 'quantidade', 'qtd']) {
      if (key in o) return normalizeEstoque(o[key]);
    }
  }
  return 0;
}

function extractBarcode(item?: Record<string, unknown> | null): string | null {
  if (!item) return null;
  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
  for (const k of arrKeys) {
    const v = item[k];
    if (Array.isArray(v) && v.length > 0) {
      for (const it of v) {
        if (typeof it === 'string' && it.trim()) return it.trim();
        if (typeof it === 'number') return String(it);
      }
    }
  }
  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode'];
  for (const k of candidates) {
    const v = item[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const k of Object.keys(item)) {
    const lk = k.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = item[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    for (const k of ['url', 'link', 'path', 'imagem', 'foto', 'arquivo', 'file']) {
      if (k in o) {
        const s = asString(o[k]);
        if (s) return s;
      }
    }
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
    }
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  let s = u.trim();
  if (!s) return undefined;
  // avoid double-proxy
  if (s.includes(`${PROXY_HOST}/.netlify/functions/proxy-facilzap-image`)) return s;
  try {
    const d = decodeURIComponent(s);
    if (d && d.length) s = d;
  } catch (e) {
    // ignore
  }
  s = s.replace(/\s+/g, '%20');
  if (s.startsWith('//')) s = 'https:' + s;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = `https://arquivos.facilzap.app.br/${s.replace(/^\/+/, '')}`;
  s = s.replace(/^http:/i, 'https:');
  const param = encodeURIComponent(s);
  return `${PROXY_HOST}/.netlify/functions/proxy-facilzap-image?url=${param}`;
}

function parsePriceRaw(v?: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).replace(/[^0-9.,-]/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function mapToProdutoDB(p: ExternalProduct): ProdutoDB {
  const id_externo = String(p.id ?? p.codigo ?? '');
  const nome = asString(p.nome) || asString(p.descricao) || 'Sem nome';

  // preco_base: min variation price or product price
  let preco_base: number | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    const nums: number[] = [];
    for (const v of p.variacoes) {
      const pv = (v as any)?.preco ?? (v as any)?.price ?? (v as any)?.valor;
      const n = parsePriceRaw(pv);
      if (n != null) nums.push(n);
    }
    if (nums.length) preco_base = Math.min(...nums);
  }
  if (preco_base === null && p.preco != null) {
    const n = parsePriceRaw(p.preco);
    if (n != null) preco_base = n;
  }

  const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
  const imagens: string[] = imgsRaw
    .map(extractImageUrl)
    .filter((x): x is string => !!x)
    .map(normalizeToProxy)
    .filter((x): x is string => !!x);

  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) {
    const prox = normalizeToProxy(single);
    if (prox && !imagens.includes(prox)) imagens.unshift(prox);
  }

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;

  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const vEst = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += vEst;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      const resolvedId: string | number | undefined = typeof rec['id'] === 'string' || typeof rec['id'] === 'number' ? (rec['id'] as string | number) : typeof rec['codigo'] === 'string' || typeof rec['codigo'] === 'number' ? (rec['codigo'] as string | number) : undefined;
      variacoes_meta.push({ id: resolvedId, sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: vEst });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(p as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return {
    id_externo,
    nome,
    preco_base,
    estoque,
    ativo,
    imagem,
    imagens,
    codigo_barras,
    variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined,
  } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const path = `/produtos?page=${page}&length=${length}`;
  const resp = await client.get(path);
  const data = resp?.data ?? {};
  const items: any[] = Array.isArray(data?.produtos)
    ? data.produtos
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : Array.isArray(data?.data?.produtos)
    ? data.data.produtos
    : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : items.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(String(id))}`);
    const raw = resp?.data ?? null;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (err) {
    return null;
  }
}

export default { fetchProdutosFacilZapPage, fetchAllProdutosFacilZap, fetchProdutoFacilZapById };

import axios from 'axios';

// CORREÇÃO DEFINITIVA - FacilZap client
export type ExternalProduct = Record<string, unknown> & {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  descricao?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<Record<string, unknown>>;
  estoque?: number | string | Record<string, unknown>;
  preco?: number | string;
  catalogos?: Array<Record<string, unknown>>;
};
export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string | number | undefined; nome?: string | undefined; codigo_barras?: string | null; estoque?: number | null }>;
};
const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const key of ['estoque', 'disponivel', 'quantity', 'quantidade', 'qtd']) {
      if (key in o) return normalizeEstoque(o[key]);
    }
  }
  return 0;
}
function extractBarcode(item?: Record<string, unknown> | null): string | null {
  if (!item) return null;
  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
  for (const k of arrKeys) {
    const v = item[k];
    if (Array.isArray(v) && v.length > 0) {
      for (const it of v) {
        if (typeof it === 'string' && it.trim()) return it.trim();
        if (typeof it === 'number') return String(it);
      }
    }
  }
  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode'];
  for (const k of candidates) {
    const v = item[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const k of Object.keys(item)) {
    const lk = k.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = item[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}
function extractImageUrl(x?: unknown): string | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    for (const k of ['url', 'link', 'path', 'imagem', 'foto', 'arquivo', 'file']) {
      if (k in o) {
        const s = asString(o[k]);
        if (s) return s;
      }
    }
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
    }
  }
  return undefined;
}
function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  let s = u.trim();
  if (!s) return undefined;
  if (s.includes('c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image')) return s;
  try { const d = decodeURIComponent(s); if (d && d.length) s = d; } catch {}
  s = s.replace(/\s+/g, '%20');
  if (s.startsWith('//')) s = 'https:' + s;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = `https://arquivos.facilzap.app.br/${s.replace(/^\/+/, '')}`;
  s = s.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
  s = s.replace(/^http:/i, 'https:');
  const param = encodeURIComponent(s);
  const PROXY = 'https://c4franquiaas.netlify.app';
  return `${PROXY}/.netlify/functions/proxy-facilzap-image?facilzap=${param}&url=${param}`;
}
function mapToProdutoDB(p: ExternalProduct): ProdutoDB {
  const id_externo = String(p.id ?? p.codigo ?? '');
  const nome = asString(p.nome) || asString(p.descricao) || 'Sem nome';

  let preco_base: number | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    const nums: number[] = [];
    for (const v of p.variacoes) {
      const pv = (v as any)?.preco;
      if (pv != null) {
        const cleaned = String(pv).replace(/[^0-9.,-]/g, '').replace(',', '.');
        const n = Number(cleaned);
        if (Number.isFinite(n)) nums.push(n);
      }
    }
    if (nums.length) preco_base = Math.min(...nums);
  }
  if (preco_base === null && p.preco != null) {
    const cleaned = String(p.preco).replace(/[^0-9.,-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    if (Number.isFinite(n)) preco_base = n;
  }

  const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
  const imagens: string[] = imgsRaw.map(extractImageUrl).filter((x): x is string => !!x).map(normalizeToProxy).filter((x): x is string => !!x);
  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) { const prox = normalizeToProxy(single); if (prox && !imagens.includes(prox)) imagens.unshift(prox); }

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const vEst = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += vEst;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      const resolvedId: string | number | undefined = typeof rec['id'] === 'string' || typeof rec['id'] === 'number' ? (rec['id'] as string | number) : typeof rec['codigo'] === 'string' || typeof rec['codigo'] === 'number' ? (rec['codigo'] as string | number) : undefined;
      variacoes_meta.push({ id: resolvedId, sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: vEst });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(p as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens, codigo_barras, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}
export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const path = `/produtos?page=${page}&length=${length}`;
  const resp = await client.get(path);
  const data = resp.data;
  const items: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data?.produtos) ? data.data.produtos : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : items.length;
  return { produtos, page, count };
}
export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}
export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(String(id))}`);
    const raw = resp.data;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (err) {
    return null;
  }
}
export default {
  fetchProdutosFacilZapPage,
  fetchAllProdutosFacilZap,
  fetchProdutoFacilZapById,
};
import axios from 'axios';

// CORREÇÃO DEFINITIVA - FacilZap client (clean single module)

export type ExternalProduct = Record<string, unknown> & {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  descricao?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<Record<string, unknown>>;
  estoque?: number | string | Record<string, unknown>;
  preco?: number | string;
  catalogos?: Array<Record<string, unknown>>;
};

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string | number | undefined; nome?: string | undefined; codigo_barras?: string | null; estoque?: number | null }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const key of ['estoque', 'disponivel', 'quantity', 'quantidade', 'qtd']) {
      if (key in o) return normalizeEstoque(o[key]);
    }
  }
  return 0;
}

function extractBarcode(item?: Record<string, unknown> | null): string | null {
  if (!item) return null;
  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
  for (const k of arrKeys) {
    const v = item[k];
    if (Array.isArray(v) && v.length > 0) {
      for (const it of v) {
        if (typeof it === 'string' && it.trim()) return it.trim();
        if (typeof it === 'number') return String(it);
      }
    }
  }
  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode'];
  for (const k of candidates) {
    const v = item[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const k of Object.keys(item)) {
    const lk = k.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = item[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (x === undefined || x === null) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    for (const k of ['url', 'link', 'path', 'imagem', 'foto', 'arquivo', 'file']) {
      if (k in o) {
        const s = asString(o[k]);
        if (s) return s;
      }
    }
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
    }
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  let s = u.trim();
  if (!s) return undefined;
  if (s.includes('c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image')) return s;
  try { const d = decodeURIComponent(s); if (d && d.length) s = d; } catch {}
  s = s.replace(/\s+/g, '%20');
  if (s.startsWith('//')) s = 'https:' + s;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = `https://arquivos.facilzap.app.br/${s.replace(/^\/+/, '')}`;
  s = s.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
  s = s.replace(/^http:/i, 'https:');
  const param = encodeURIComponent(s);
  const PROXY = 'https://c4franquiaas.netlify.app';
  return `${PROXY}/.netlify/functions/proxy-facilzap-image?facilzap=${param}&url=${param}`;
}

function mapToProdutoDB(p: ExternalProduct): ProdutoDB {
  const id_externo = String(p.id ?? p.codigo ?? '');
  const nome = asString(p.nome) || asString(p.descricao) || 'Sem nome';

  let preco_base: number | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    const nums: number[] = [];
    for (const v of p.variacoes) {
      const pv = (v as any)?.preco;
      if (pv != null) {
        const cleaned = String(pv).replace(/[^0-9.,-]/g, '').replace(',', '.');
        const n = Number(cleaned);
        if (Number.isFinite(n)) nums.push(n);
      }
    }
    if (nums.length) preco_base = Math.min(...nums);
  }
  if (preco_base === null && p.preco != null) {
    const cleaned = String(p.preco).replace(/[^0-9.,-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    if (Number.isFinite(n)) preco_base = n;
  }

  const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
  const imagens: string[] = imgsRaw.map(extractImageUrl).filter((x): x is string => !!x).map(normalizeToProxy).filter((x): x is string => !!x);
  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) { const prox = normalizeToProxy(single); if (prox && !imagens.includes(prox)) imagens.unshift(prox); }

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const vEst = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += vEst;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      const resolvedId: string | number | undefined = typeof rec['id'] === 'string' || typeof rec['id'] === 'number' ? (rec['id'] as string | number) : typeof rec['codigo'] === 'string' || typeof rec['codigo'] === 'number' ? (rec['codigo'] as string | number) : undefined;
      variacoes_meta.push({ id: resolvedId, sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: vEst });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(p as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens, codigo_barras, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const path = `/produtos?page=${page}&length=${length}`;
  const resp = await client.get(path);
  const data = resp.data;
  const items: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data?.produtos) ? data.data.produtos : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : items.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(String(id))}`);
    const raw = resp.data;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (err) {
    return null;
  }
}

export default {
  fetchProdutosFacilZapPage,
  fetchAllProdutosFacilZap,
  fetchProdutoFacilZapById,
};
import axios from 'axios';

// CORREÇÃO DEFINITIVA - FacilZap client (single clean copy)
export type ExternalProduct = {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  descricao?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<Record<string, unknown>>;
  estoque?: number | string | Record<string, unknown>;
  preco?: number | string;
  catalogos?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string | number | undefined; nome?: string | undefined; codigo_barras?: string | null; estoque?: number | null }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const key of ['estoque', 'disponivel', 'quantity', 'quantidade', 'qtd']) {
      if (key in o) return normalizeEstoque(o[key]);
    }
  }
  return 0;
}

function extractBarcode(item?: Record<string, unknown> | null): string | null {
  if (!item) return null;
  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
  for (const k of arrKeys) {
    const v = item[k];
    if (Array.isArray(v) && v.length > 0) {
      for (const it of v) {
        if (typeof it === 'string' && it.trim()) return it.trim();
        if (typeof it === 'number') return String(it);
      }
    }
  }
  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode'];
  for (const k of candidates) {
    const v = item[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const k of Object.keys(item)) {
    const lk = k.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = item[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (!x && x !== 0) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    for (const k of ['url', 'link', 'path', 'imagem', 'foto', 'arquivo', 'file']) {
      if (k in o) {
        const s = asString(o[k]);
        if (s) return s;
      }
    }
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
    }
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  let s = u.trim();
  if (!s) return undefined;
  if (s.includes('c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image')) return s;
  try { const d = decodeURIComponent(s); if (d && d.length) s = d; } catch {}
  s = s.replace(/\s+/g, '%20');
  if (s.startsWith('//')) s = 'https:' + s;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = `https://arquivos.facilzap.app.br/${s.replace(/^\/+/, '')}`;
  s = s.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
  s = s.replace(/^http:/i, 'https:');
  const param = encodeURIComponent(s);
  const PROXY = 'https://c4franquiaas.netlify.app';
  return `${PROXY}/.netlify/functions/proxy-facilzap-image?facilzap=${param}&url=${param}`;
}

function mapToProdutoDB(p: ExternalProduct): ProdutoDB {
  const id_externo = String(p.id ?? p.codigo ?? '');
  const nome = asString(p.nome) || asString(p.descricao) || 'Sem nome';

  let preco_base: number | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    const nums: number[] = [];
    for (const v of p.variacoes) {
      const pv = (v as any)?.preco;
      if (pv != null) {
        const cleaned = String(pv).replace(/[^0-9.,-]/g, '').replace(',', '.');
        const n = Number(cleaned);
        if (Number.isFinite(n)) nums.push(n);
      }
    }
    if (nums.length) preco_base = Math.min(...nums);
  }
  if (preco_base === null && p.preco != null) {
    const cleaned = String(p.preco).replace(/[^0-9.,-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    if (Number.isFinite(n)) preco_base = n;
  }

  const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
  const imagens: string[] = imgsRaw.map(extractImageUrl).filter((x): x is string => !!x).map(normalizeToProxy).filter((x): x is string => !!x);
  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) { const prox = normalizeToProxy(single); if (prox && !imagens.includes(prox)) imagens.unshift(prox); }

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const vEst = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += vEst;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      const resolvedId: string | number | undefined = typeof rec['id'] === 'string' || typeof rec['id'] === 'number' ? (rec['id'] as string | number) : typeof rec['codigo'] === 'string' || typeof rec['codigo'] === 'number' ? (rec['codigo'] as string | number) : undefined;
      variacoes_meta.push({ id: resolvedId, sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: vEst });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(p as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens, codigo_barras, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const path = `/produtos?page=${page}&length=${length}`;
  const resp = await client.get(path);
  const data = resp.data;
  const items: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data?.produtos) ? data.data.produtos : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : items.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(String(id))}`);
    const raw = resp.data;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (err) {
    return null;
  }
}

export default {
  fetchProdutosFacilZapPage,
  fetchAllProdutosFacilZap,
  fetchProdutoFacilZapById,
};
import axios from 'axios';
// Full file replaced with a single clean implementation below
import axios from 'axios';

export type ExternalProduct = {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  descricao?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<Record<string, unknown>>;
  estoque?: number | string | Record<string, unknown>;
  preco?: number | string;
  catalogos?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string | number | undefined; nome?: string | undefined; codigo_barras?: string | null; estoque?: number | null }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const key of ['estoque', 'disponivel', 'quantity', 'quantidade', 'qtd']) {
      if (key in o) return normalizeEstoque(o[key]);
    }
  }
  return 0;
}

function extractBarcode(item?: Record<string, unknown> | null): string | null {
  if (!item) return null;
  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
  for (const k of arrKeys) {
    const v = item[k];
    if (Array.isArray(v) && v.length > 0) {
      for (const it of v) {
        if (typeof it === 'string' && it.trim()) return it.trim();
        if (typeof it === 'number') return String(it);
      }
    }
  }
  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode'];
  for (const k of candidates) {
    const v = item[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const k of Object.keys(item)) {
    const lk = k.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = item[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (!x && x !== 0) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    for (const k of ['url', 'link', 'path', 'imagem', 'foto', 'arquivo', 'file']) {
      if (k in o) {
        const s = asString(o[k]);
        if (s) return s;
      }
    }
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
    }
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  let s = u.trim();
  if (!s) return undefined;
  if (s.includes('c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image')) return s;
  try { const d = decodeURIComponent(s); if (d && d.length) s = d; } catch {}
  s = s.replace(/\s+/g, '%20');
  if (s.startsWith('//')) s = 'https:' + s;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = `https://arquivos.facilzap.app.br/${s.replace(/^\/+/, '')}`;
  s = s.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
  s = s.replace(/^http:/i, 'https:');
  const param = encodeURIComponent(s);
  const PROXY = 'https://c4franquiaas.netlify.app';
  return `${PROXY}/.netlify/functions/proxy-facilzap-image?facilzap=${param}&url=${param}`;
}

function mapToProdutoDB(p: ExternalProduct): ProdutoDB {
  const id_externo = String(p.id ?? p.codigo ?? '');
  const nome = asString(p.nome) || asString(p.descricao) || 'Sem nome';

  let preco_base: number | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    const nums: number[] = [];
    for (const v of p.variacoes) {
      const pv = (v as any)?.preco;
      if (pv != null) {
        const cleaned = String(pv).replace(/[^0-9.,-]/g, '').replace(',', '.');
        const n = Number(cleaned);
        if (Number.isFinite(n)) nums.push(n);
      }
    }
    if (nums.length) preco_base = Math.min(...nums);
  }
  if (preco_base === null && p.preco != null) {
    const cleaned = String(p.preco).replace(/[^0-9.,-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    if (Number.isFinite(n)) preco_base = n;
  }

  const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
  const imagens: string[] = imgsRaw.map(extractImageUrl).filter((x): x is string => !!x).map(normalizeToProxy).filter((x): x is string => !!x);
  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) { const prox = normalizeToProxy(single); if (prox && !imagens.includes(prox)) imagens.unshift(prox); }

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const vEst = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += vEst;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      const resolvedId: string | number | undefined = typeof rec['id'] === 'string' || typeof rec['id'] === 'number' ? (rec['id'] as string | number) : typeof rec['codigo'] === 'string' || typeof rec['codigo'] === 'number' ? (rec['codigo'] as string | number) : undefined;
      variacoes_meta.push({ id: resolvedId, sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: vEst });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(p as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens, codigo_barras, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const path = `/produtos?page=${page}&length=${length}`;
  const resp = await client.get(path);
  const data = resp.data;
  const items: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data?.produtos) ? data.data.produtos : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : items.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(String(id))}`);
    const raw = resp.data;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (err) {
    return null;
  }
}
      if (Number.isFinite(n)) preco_base = n;
    }

    const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
    const imagens: string[] = imgsRaw.map(extractImageUrl).filter((x): x is string => !!x).map(normalizeToProxy).filter((x): x is string => !!x);
    const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
    if (single) { const prox = normalizeToProxy(single); if (prox && !imagens.includes(prox)) imagens.unshift(prox); }

    let estoque = 0;
    const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
    let primeiro_barcode: string | null = null;
    if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
      for (const v of p.variacoes) {
        const rec = v as Record<string, unknown>;
        const vEst = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
        estoque += vEst;
        const code = extractBarcode(rec) ?? null;
        if (!primeiro_barcode && code) primeiro_barcode = code;
        variacoes_meta.push({ id: rec['id'] ?? rec['codigo'], sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: vEst });
      }
    } else {
      estoque = normalizeEstoque(p.estoque ?? 0);
    }

    const prod_barcode = extractBarcode(p as Record<string, unknown>);
    const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

    const imagem = imagens.length > 0 ? imagens[0] : null;
    const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

    return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens, codigo_barras, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
  }

  export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
    const token = process.env.FACILZAP_TOKEN;
    if (!token) throw new Error('FACILZAP_TOKEN is not set');
    const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
    const path = `/produtos?page=${page}&length=${length}`;
    const resp = await client.get(path);
    const data = resp.data;
    const items: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data?.produtos) ? data.data.produtos : [];
    const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
    const count = typeof data?.count === 'number' ? data.count : items.length;
    return { produtos, page, count };
  }

  export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
    const produtos: ProdutoDB[] = [];
    let page = 1;
    while (true) {
      const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
      if (!pageItems || pageItems.length === 0) break;
      produtos.push(...pageItems);
      if (pageItems.length < PAGE_SIZE) break;
      page += 1;
      if (page > 1000) break;
    }
    return { produtos, pages: page };
  }

  export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
    const token = process.env.FACILZAP_TOKEN;
    if (!token) throw new Error('FACILZAP_TOKEN is not set');
    const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
    try {
      const resp = await client.get(`/produtos/${encodeURIComponent(String(id))}`);
      const raw = resp.data;
      const prod = raw?.produto ?? raw?.data ?? raw;
      if (!prod) return null;
      return mapToProdutoDB(prod as ExternalProduct);
    } catch (err) {
      return null;
    }
  }
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    const nums: number[] = [];
    for (const v of p.variacoes) {
      const pv = (v as any)?.preco;
      if (pv != null) {
        const cleaned = String(pv).replace(/[^0-9.,-]/g, '').replace(',', '.');
        const n = Number(cleaned);
        if (Number.isFinite(n)) nums.push(n);
      }
    }
    if (nums.length) preco_base = Math.min(...nums);
  }
  if (preco_base === null && p.preco != null) {
    const cleaned = String(p.preco).replace(/[^0-9.,-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    if (Number.isFinite(n)) preco_base = n;
  }

  const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
  const imagens: string[] = imgsRaw.map(extractImageUrl).filter((x): x is string => !!x).map(normalizeToProxy).filter((x): x is string => !!x);
  const single = extractImageUrl((p as any).imagem ?? (p as any).foto);
  if (single) { const prox = normalizeToProxy(single); if (prox && !imagens.includes(prox)) imagens.unshift(prox); }

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    for (const v of p.variacoes) {
      const rec = v as Record<string, unknown>;
      const vEst = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += vEst;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      const resolvedId: string | number | undefined =
        typeof rec['id'] === 'string' || typeof rec['id'] === 'number' ? (rec['id'] as string | number) : typeof rec['codigo'] === 'string' || typeof rec['codigo'] === 'number' ? (rec['codigo'] as string | number) : undefined;
      variacoes_meta.push({ id: resolvedId, sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: vEst });
    }
  } else {
    estoque = normalizeEstoque(p.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(p as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens, codigo_barras, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const path = `/produtos?page=${page}&length=${length}`;
  const resp = await client.get(path);
  const data = resp.data;
  const items: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data?.produtos) ? data.data.produtos : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : items.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(String(id))}`);
    const raw = resp.data;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (err) {
    return null;
  }
}


// FacilZap client — normalized product mapping for sync
export type ExternalProduct = {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  descricao?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<Record<string, unknown>>;
  estoque?: number | string | Record<string, unknown>;
  preco?: number | string;
  catalogos?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string | number | undefined; nome?: string | undefined; codigo_barras?: string | null; estoque?: number | null }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(field: unknown): number {
  if (typeof field === 'number' && Number.isFinite(field)) return Math.max(0, Math.floor(field));
  if (typeof field === 'string') {
    const cleaned = field.trim().replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }
  if (field && typeof field === 'object') {
    const obj = field as Record<string, unknown>;
    const keys = ['estoque', 'disponivel', 'quantity', 'quantidade', 'qtd'];
    for (const k of keys) {
      if (k in obj) return normalizeEstoque(obj[k]);
    }
  }
  return 0;
}

function extractBarcode(item?: Record<string, unknown> | null): string | null {
  if (!item) return null;
  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
  for (const k of arrKeys) {
    const v = item[k];
    if (Array.isArray(v) && v.length > 0) {
      for (const it of v) {
        if (typeof it === 'string' && it.trim() !== '') return it.trim();
        if (typeof it === 'number') return String(it);
      }
    }
  }
  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode'];
  for (const k of candidates) {
    const v = item[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const key of Object.keys(item)) {
    const lk = key.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = item[key];
      if (typeof v === 'string' && v.trim() !== '') return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (!x && x !== 0) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (x && typeof x === 'object') {
    const obj = x as Record<string, unknown>;
    const tryKeys = ['url', 'link', 'path', 'imagem', 'foto', 'arquivo', 'file'];
    for (const k of tryKeys) {
      if (k in obj) {
        const s = asString(obj[k]);
        if (s) return s;
      }
    }
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
    }
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  let s = u.trim();
  if (!s) return undefined;
  if (s.includes('c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image')) return s;
  try { const d = decodeURIComponent(s); if (d && d.length) s = d; } catch {}
  s = s.replace(/\s+/g, '%20');
  if (s.startsWith('//')) s = 'https:' + s;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = `https://arquivos.facilzap.app.br/${s.replace(/^\/+/, '')}`;
  s = s.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
  s = s.replace(/^http:/i, 'https:');
  const param = encodeURIComponent(s);
  const PROXY = 'https://c4franquiaas.netlify.app';
  return `${PROXY}/.netlify/functions/proxy-facilzap-image?facilzap=${param}&url=${param}`;
}

function mapToProdutoDB(prod: ExternalProduct): ProdutoDB {
  const id_externo = String(prod.id ?? prod.codigo ?? '');
  const nome = asString(prod.nome) || asString((prod as any).descricao) || 'Sem nome';

  const preco_base = ((): number | null => {
    if (Array.isArray(prod.variacoes) && prod.variacoes.length > 0) {
      const nums: number[] = [];
      for (const v of prod.variacoes) {
        const p = (v as any)?.preco;
        if (p != null) {
          const cleaned = String(p).replace(/[^0-9.,-]/g, '').replace(',', '.');
          const n = Number(cleaned);
          if (Number.isFinite(n)) nums.push(n);
        }
      }
      if (nums.length) return Math.min(...nums);
    }
    if (prod.preco != null) {
      const cleaned = String(prod.preco).replace(/[^0-9.,-]/g, '').replace(',', '.');
      const n = Number(cleaned);
      if (Number.isFinite(n)) return n;
    }
    return null;
  })();

  const imgsRaw = Array.isArray(prod.imagens) ? prod.imagens : Array.isArray(prod.fotos) ? prod.fotos : [];
  const imagens: string[] = imgsRaw
    .map(extractImageUrl)
    .filter((x): x is string => !!x)
    .map(normalizeToProxy)
    .filter((x): x is string => !!x);
  const single = extractImageUrl((prod as any).imagem ?? (prod as any).foto);
  if (single) { const p = normalizeToProxy(single); if (p && !imagens.includes(p)) imagens.unshift(p); }

  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;
  if (Array.isArray(prod.variacoes) && prod.variacoes.length > 0) {
    for (const v of prod.variacoes) {
      const rec = v as Record<string, unknown>;
      const vEst = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += vEst;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      variacoes_meta.push({ id: rec['id'] ?? rec['codigo'], sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: vEst });
    }
  } else {
    estoque = normalizeEstoque(prod.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(prod as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof prod.ativado === 'boolean' ? prod.ativado : typeof prod.ativo === 'boolean' ? prod.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens, codigo_barras, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const path = `/produtos?page=${page}&length=${length}`;
  const resp = await client.get(path);
  const data = resp.data;
  const items: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data?.produtos) ? data.data.produtos : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : items.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(String(id))}`);
    const raw = resp.data;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (err) {
    return null;
  }
}

export type ExternalProduct = {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<Record<string, unknown>>;
  estoque?: number | string | Record<string, unknown>;
  preco?: number | string;
  catalogos?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string; nome?: string; codigo_barras?: string | null; estoque?: number | null }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function normalizeEstoque(field: unknown): number {
  if (typeof field === 'number' && Number.isFinite(field)) return Math.max(0, Math.floor(field));
  if (typeof field === 'string') {
    const cleaned = field.trim().replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }
  if (field && typeof field === 'object') {
    const obj = field as Record<string, unknown>;
    const keys = ['estoque', 'disponivel', 'quantity', 'quantidade', 'qtd'];
    for (const k of keys) {
      if (k in obj) return normalizeEstoque(obj[k]);
    }
  }
  return 0;
}

function extractBarcode(item?: Record<string, unknown> | null): string | null {
  if (!item) return null;
  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
  for (const k of arrKeys) {
    const v = item[k];
    if (Array.isArray(v) && v.length > 0) {
      for (const it of v) {
        if (typeof it === 'string' && it.trim() !== '') return it.trim();
        if (typeof it === 'number') return String(it);
      }
    }
  }
  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode'];
  for (const k of candidates) {
    const v = item[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const key of Object.keys(item)) {
    const lk = key.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = item[key];
      if (typeof v === 'string' && v.trim() !== '') return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (!x && x !== 0) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (x && typeof x === 'object') {
    const obj = x as Record<string, unknown>;
    const tryKeys = ['url', 'link', 'path', 'imagem', 'foto', 'arquivo', 'file'];
    for (const k of tryKeys) {
      if (k in obj) {
        const s = asString(obj[k]);
        if (s) return s;
      }
    }
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
    }
  }
  return undefined;
}

function normalizeToProxy(u?: string | undefined): string | undefined {
  if (!u) return undefined;
  let s = u.trim();
  if (!s) return undefined;
  if (s.includes('c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image')) return s;
  try {
    const d = decodeURIComponent(s);
    if (d && d.length) s = d;
  } catch {}
  s = s.replace(/\s+/g, '%20');
  if (s.startsWith('//')) s = 'https:' + s;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = `https://arquivos.facilzap.app.br/${s.replace(/^\/+/, '')}`;
  s = s.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
  s = s.replace(/^http:/i, 'https:');
  const param = encodeURIComponent(s);
  const PROXY = 'https://c4franquiaas.netlify.app';
  return `${PROXY}/.netlify/functions/proxy-facilzap-image?facilzap=${param}&url=${param}`;
}

function mapToProdutoDB(prod: ExternalProduct): ProdutoDB {
  const id_externo = String(prod.id ?? prod.codigo ?? '');
  const nome = asString(prod.nome) || asString((prod as any).descricao) || 'Sem nome';

  // preco_base: try variations then product price
  const preco_base = ((): number | null => {
    if (Array.isArray(prod.variacoes) && prod.variacoes.length > 0) {
      const nums: number[] = [];
      for (const v of prod.variacoes) {
        const p = (v as any)?.preco;
        if (p != null) {
          const cleaned = String(p).replace(/[^0-9.,-]/g, '').replace(',', '.');
          const n = Number(cleaned);
          if (Number.isFinite(n)) nums.push(n);
        }
      }
      if (nums.length) return Math.min(...nums);
    }
    if (prod.preco != null) {
      const cleaned = String(prod.preco).replace(/[^0-9.,-]/g, '').replace(',', '.');
      const n = Number(cleaned);
      if (Number.isFinite(n)) return n;
    }
    return null;
  })();

  // imagens
  const imgsRaw = Array.isArray(prod.imagens) ? prod.imagens : Array.isArray(prod.fotos) ? prod.fotos : [];
  const imagens: string[] = imgsRaw
    .map(extractImageUrl)
    .filter((x): x is string => !!x)
    .map(normalizeToProxy)
    .filter((x): x is string => !!x);
  const single = extractImageUrl((prod as any).imagem ?? (prod as any).foto);
  if (single) {
    const p = normalizeToProxy(single);
    if (p && !imagens.includes(p)) imagens.unshift(p);
  }

  // variacoes
  let estoque = 0;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  let primeiro_barcode: string | null = null;
  if (Array.isArray(prod.variacoes) && prod.variacoes.length > 0) {
    for (const v of prod.variacoes) {
      const rec = v as Record<string, unknown>;
      const vEst = normalizeEstoque(rec['estoque'] ?? rec['disponivel'] ?? rec['quantity']);
      estoque += vEst;
      const code = extractBarcode(rec) ?? null;
      if (!primeiro_barcode && code) primeiro_barcode = code;
      variacoes_meta.push({ id: rec['id'] ?? rec['codigo'], sku: asString(rec['sku'] ?? rec['codigo']), nome: asString(rec['nome']), codigo_barras: code, estoque: vEst });
    }
  } else {
    estoque = normalizeEstoque(prod.estoque ?? 0);
  }

  const prod_barcode = extractBarcode(prod as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imagens.length > 0 ? imagens[0] : null;
  const ativo = typeof prod.ativado === 'boolean' ? prod.ativado : typeof prod.ativo === 'boolean' ? prod.ativo : true;

  return { id_externo, nome, preco_base, estoque, ativo, imagem, imagens, codigo_barras, variacoes_meta: variacoes_meta.length ? variacoes_meta : undefined } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length = PAGE_SIZE): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const path = `/produtos?page=${page}&length=${length}`;
  const resp = await client.get(path);
  const data = resp.data;
  const items: any[] = Array.isArray(data?.produtos) ? data.produtos : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : Array.isArray(data?.data?.produtos) ? data.data.produtos : [];
  const produtos = items.map((i) => mapToProdutoDB(i as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : items.length;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set');
  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(String(id))}`);
    const raw = resp.data;
    const prod = raw?.produto ?? raw?.data ?? raw;
    if (!prod) return null;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (err) {
    return null;
  }
}

    for (const c of prod.catalogos) {
      const preco = c && typeof c === 'object' && 'precos' in c && c.precos ? (c as any).precos.preco : undefined;
      if (preco !== undefined && preco !== null) {
        const cleaned = typeof preco === 'string' ? preco.replace(/[^0-9.,-]/g, '').replace(',', '.') : String(preco);
        const num = Number(cleaned);
        if (Number.isFinite(num)) return num;
      }
    }
  }
  return null;
}

function extractImageUrl(x?: unknown): string | undefined {
  if (!x && x !== 0) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'number') return String(x);
  if (x && typeof x === 'object') {
    const obj = x as Record<string, unknown>;
    const tryKeys = ['url', 'link', 'path', 'imagem', 'foto', 'arquivo'];
    for (const k of tryKeys) {
      if (k in obj) {
        const v = obj[k];
        const s = asString(v);
        if (s) return s;
      }
    }
    // fall back to first string value
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return String(v);
    }
  }
  return undefined;
}

function mapToProdutoDB(prod: ExternalProduct): ProdutoDB {
  const id_externo = String(prod.id ?? prod.codigo ?? '');
  const nome = asString(prod.nome) || asString((prod as any).descricao) || 'Sem nome';
  const preco_base = extractPrecoBase(prod);

  // imagens
  const imgs: string[] = [];
  const rawImgs = Array.isArray(prod.imagens) ? prod.imagens : Array.isArray(prod.fotos) ? prod.fotos : [];
  for (const it of rawImgs) {
    const url = extractImageUrl(it);
    const proxied = normalizeToProxy(url);
    if (proxied) imgs.push(proxied);
  }
  // also try imagem / foto singular fields
  const singleImg = extractImageUrl((prod as any).imagem ?? (prod as any).foto ?? undefined);
  if (singleImg) {
    const prox = normalizeToProxy(singleImg);
    if (prox && !imgs.includes(prox)) imgs.unshift(prox);
  }

  // variacoes
  let estoque = 0;
  let primeiro_barcode: string | null = null;
  const variacoes_meta: ProdutoDB['variacoes_meta'] = [];
  if (Array.isArray(prod.variacoes) && prod.variacoes.length > 0) {
    for (const v of prod.variacoes) {
      const vid = v.id ?? (v as any).sku ?? undefined;
      const nomeVar = asString(v.nome) || asString((v as any).descricao) || undefined;
      const sku = asString((v as any).sku) || asString(vid);
      const vEstoque = normalizeEstoque(v.estoque ?? (v as any).disponivel ?? 0);
      const codigo_barras = extractBarcode(v as Record<string, unknown>);
      if (!primeiro_barcode && codigo_barras) primeiro_barcode = codigo_barras;
      estoque += vEstoque;
      variacoes_meta.push({ id: vid, sku, nome: nomeVar, codigo_barras: codigo_barras ?? null, estoque: vEstoque });
    }
  } else {
    estoque = normalizeEstoque(prod.estoque ?? 0);
  }

  // product-level barcode
  const prod_barcode = extractBarcode(prod as Record<string, unknown>);
  const codigo_barras = primeiro_barcode ?? prod_barcode ?? null;

  const imagem = imgs.length > 0 ? imgs[0] : null;

  const ativo = typeof prod.ativado === 'boolean' ? prod.ativado : typeof prod.ativo === 'boolean' ? prod.ativo : true;

  return {
    id_externo,
    nome,
    preco_base,
    estoque,
    ativo,
    imagem,
    imagens: imgs,
    codigo_barras,
    variacoes_meta: variacoes_meta.length > 0 ? variacoes_meta : undefined,
  } as ProdutoDB;
}

export async function fetchProdutosFacilZapPage(page = 1, length?: number): Promise<{ produtos: ProdutoDB[]; page: number; count?: number }> {
  const perPage = typeof length === 'number' && length > 0 ? Math.min(length, PAGE_SIZE) : PAGE_SIZE;
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set in env');
  const url = `${API_BASE}/produtos?page=${page}&length=${perPage}`;
  const resp = await axios.get(url, { timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
  const data = resp && resp.data ? resp.data : {};
  // attempt common shapes: { produtos: [], data: { produtos: [] }, items: [] }
  const rawList: any[] = Array.isArray(data?.produtos)
    ? data.produtos
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? data
    : Array.isArray(data?.data?.produtos)
    ? data.data.produtos
    : [];
  const produtos: ProdutoDB[] = rawList.map((p) => mapToProdutoDB(p as ExternalProduct));
  const count = typeof data?.count === 'number' ? data.count : undefined;
  return { produtos, page, count };
}

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const produtos: ProdutoDB[] = [];
  let page = 1;
  while (true) {
    const { produtos: pageItems } = await fetchProdutosFacilZapPage(page, PAGE_SIZE);
    if (!pageItems || pageItems.length === 0) break;
    produtos.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
    page += 1;
    // safety cap
    if (page > 1000) break;
  }
  return { produtos, pages: page };
}

export async function fetchProdutoFacilZapById(id: string | number): Promise<ProdutoDB | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is not set in env');
  const url = `${API_BASE}/produto/${id}`;
  try {
    const resp = await axios.get(url, { timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });
    const raw = resp && resp.data ? resp.data : null;
    if (!raw) return null;
    // raw might be { produto: {...} }
    const prod = raw.produto ?? raw.data ?? raw;
    return mapToProdutoDB(prod as ExternalProduct);
  } catch (err) {
    return null;
  }
}


  function processVariacoes(produto: ExternalProduct) {
    let estoqueTotal = 0;
    const variacoes_meta: Array<{ id?: string | number; sku?: string; nome?: string; codigo_barras?: string | null; estoque?: number | null }> = [];
    let primeiro_barcode: string | null = null;

    const productBarcodes = Array.isArray((produto as Record<string, unknown>)['cod_barras']) ? (produto as Record<string, unknown>)['cod_barras'] as unknown[] : undefined;

    if (Array.isArray(produto.variacoes) && produto.variacoes.length > 0) {
      produto.variacoes.forEach((variacao, idx) => {
        const rec = (variacao && typeof variacao === 'object') ? variacao as Record<string, unknown> : {};
        const estoqueVal = normalizeEstoque(rec['estoque'] ?? rec['quantity'] ?? rec['disponivel']);
        estoqueTotal += estoqueVal;

        let barcode = extractBarcode(rec);
        if ((!barcode || barcode === '') && Array.isArray(productBarcodes) && productBarcodes[idx]) {
          const cand = productBarcodes[idx];
          if (typeof cand === 'string' && cand.trim() !== '') barcode = cand.trim();
          if (typeof cand === 'number') barcode = String(cand);
        }

        if (!primeiro_barcode && barcode) primeiro_barcode = barcode;

        const resolvedId = (() => {
          const cand = rec['id'] ?? rec['codigo'];
          if (typeof cand === 'string' || typeof cand === 'number') return cand as string | number;
          return undefined;
        })();

        variacoes_meta.push({
          id: resolvedId,
          sku: asString(rec['sku'] ?? rec['codigo'] ?? rec['id']) ?? undefined,
          nome: asString(rec['nome']) ?? undefined,
          codigo_barras: barcode ?? null,
          estoque: estoqueVal ?? null,
        });
      });
    } else {
      const est = normalizeEstoque(produto.estoque);
      estoqueTotal = est;
      primeiro_barcode = extractBarcode(produto as Record<string, unknown>);
    }

    return { estoque: estoqueTotal, variacoes_meta, primeiro_barcode };
  }

  function extractPrecoBase(produto: ExternalProduct): number | null {
    if (Array.isArray(produto.catalogos) && produto.catalogos.length > 0) {
      const c0 = produto.catalogos[0];
      if (c0 && c0.precos && typeof c0.precos === 'object') {
        const pc = (c0.precos as Record<string, unknown>)['preco'];
        if (typeof pc === 'number') return pc;
        if (typeof pc === 'string') {
          const n = Number(pc);
          if (Number.isFinite(n)) return n;
        }
      }
    }
    if (Array.isArray(produto.variacoes) && produto.variacoes.length > 0) {
      const p0 = produto.variacoes[0];
      if (p0) {
        const precoVal = (p0 as Record<string, unknown>)['preco'];
        if (typeof precoVal === 'number') return precoVal as number;
        if (typeof precoVal === 'string') {
          const n = Number(precoVal);
          if (Number.isFinite(n)) return n;
        }
      }
    }
    if (typeof produto.preco === 'number') return produto.preco as number;
    if (typeof produto.preco === 'string') {
      const n = Number(produto.preco);
      if (Number.isFinite(n)) return n;
    }
    return null;
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

        const { estoque, variacoes_meta, primeiro_barcode } = processVariacoes(p);
        const preco_base = extractPrecoBase(p);

        const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
        const imgs = imgsRaw.map((x) => extractImageUrl(x)).filter((x): x is string => !!x).map(normalizeToProxy);

        result.push({
          id_externo: id,
          nome,
          preco_base,
          estoque: Number(estoque || 0),
          ativo: Boolean(ativo) && Number(estoque || 0) > 0,
          imagem: imgs.length > 0 ? imgs[0] : null,
          imagens: imgs,
          codigo_barras: primeiro_barcode ?? null,
          variacoes_meta: variacoes_meta.length > 0 ? variacoes_meta : undefined,
        });
      }

      pagesConsumed++;

      if (process.env.DEBUG_SYNC === 'true') {
        console.log(`[facilzap] page ${page} fetched, items=${items.length}`);
        const sample = result.slice(-2).map((p) => ({ id: p.id_externo, nome: p.nome, estoque: p.estoque, variacoes: p.variacoes_meta?.length ?? 0 }));
        console.log('[facilzap] últimos produtos processados:', sample);
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

      const { estoque, variacoes_meta, primeiro_barcode } = processVariacoes(p);
      const preco_base = extractPrecoBase(p);

      const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
      const imgs = imgsRaw.map((x) => extractImageUrl(x)).filter((x): x is string => !!x).map(normalizeToProxy);

      result.push({
        id_externo: id,
        nome,
        preco_base,
        estoque: Number(estoque || 0),
        ativo: Boolean(ativo) && Number(estoque || 0) > 0,
        imagem: imgs.length > 0 ? imgs[0] : null,
        imagens: imgs,
        codigo_barras: primeiro_barcode ?? null,
        variacoes_meta: variacoes_meta.length > 0 ? variacoes_meta : undefined,
      });
    }

    return { produtos: result, page, count: items.length };
  }

  export async function fetchProdutoFacilZapById(id: string): Promise<ExternalProduct | null> {
    const token = process.env.FACILZAP_TOKEN;
    if (!token) throw new Error('FACILZAP_TOKEN não configurado');

    const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });

    try {
      const resp = await client.get(`/produtos/${encodeURIComponent(id)}`);
      const data = resp.data;
      if (!data) return null;

      const prod = typeof data === 'object' && data !== null && (data as Record<string, unknown>)['data'] ? (data as Record<string, unknown>)['data'] as ExternalProduct : data as ExternalProduct;
      return prod ?? null;
    } catch (err: unknown) {
      console.error('[facilzap] erro ao buscar produto detalhe', id, err instanceof Error ? err.message : String(err));
      return null;
    }
  }

function normalizeEstoque(estoqueField: unknown): number {
  if (typeof estoqueField === 'number' && Number.isFinite(estoqueField)) {
    return estoqueField;
  }

  if (typeof estoqueField === 'string') {
    const cleaned = estoqueField.trim().replace(/[^0-9.-]/g, '');
    if (cleaned === '') return 0;
    const num = Number(cleaned);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  }

  if (estoqueField && typeof estoqueField === 'object' && !Array.isArray(estoqueField)) {
    const obj = estoqueField as Record<string, unknown>;
    if ('estoque' in obj) {
      const est = obj['estoque'];
      if (typeof est === 'number' && Number.isFinite(est)) return est;
      if (typeof est === 'string') {
        const cleaned = est.trim().replace(/[^0-9.-]/g, '');
        if (cleaned !== '') {
          const num = Number(cleaned);
          if (Number.isFinite(num) && num >= 0) return num;
        }
      }
    }
    if ('disponivel' in obj) {
      const disp = obj['disponivel'];
      if (typeof disp === 'number' && Number.isFinite(disp)) return disp;
      if (typeof disp === 'string') {
        const cleaned = disp.trim().replace(/[^0-9.-]/g, '');
        if (cleaned !== '') {
          const num = Number(cleaned);
          if (Number.isFinite(num) && num >= 0) return num;
        }
      }
    }
  }

  return 0;
}

function extractBarcode(item: Record<string, unknown> | undefined | null): string | null {
  if (!item) return null;
  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
  for (const k of arrKeys) {
    const v = (item as Record<string, unknown>)[k];
    if (Array.isArray(v) && v.length > 0) {
      for (const it of v) {
        if (typeof it === 'string' && it.trim() !== '') return it.trim();
        if (typeof it === 'number') return String(it);
      }
    }
  }
  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode', 'cod_barras'];
  for (const k of candidates) {
    const v = (item as Record<string, unknown>)[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const key of Object.keys(item)) {
    const lk = key.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = (item as Record<string, unknown>)[key];
      if (typeof v === 'string' && v.trim() !== '') return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function processVariacoes(produto: ExternalProduct) {
  let estoqueTotal = 0;
  const variacoes_meta: Array<{ id?: string | number; sku?: string; nome?: string; codigo_barras?: string | null; estoque?: number | null }> = [];
  let primeiro_barcode: string | null = null;

  const productBarcodes = Array.isArray((produto as Record<string, unknown>)['cod_barras']) ? (produto as Record<string, unknown>)['cod_barras'] as unknown[] : undefined;

  if (Array.isArray(produto.variacoes) && produto.variacoes.length > 0) {
    produto.variacoes.forEach((variacao, idx) => {
      const rec = (variacao && typeof variacao === 'object') ? variacao as Record<string, unknown> : {};
      const estoqueVal = normalizeEstoque(rec['estoque'] ?? rec['quantity'] ?? rec['disponivel']);
      estoqueTotal += estoqueVal;

      let barcode = extractBarcode(rec);
      if ((!barcode || barcode === '') && Array.isArray(productBarcodes) && productBarcodes[idx]) {
        const cand = productBarcodes[idx];
        if (typeof cand === 'string' && cand.trim() !== '') barcode = cand.trim();
        if (typeof cand === 'number') barcode = String(cand);
      }

      if (!primeiro_barcode && barcode) primeiro_barcode = barcode;

      const resolvedId = (() => {
        const cand = rec['id'] ?? rec['codigo'];
        if (typeof cand === 'string' || typeof cand === 'number') return cand as string | number;
        return undefined;
      })();

      variacoes_meta.push({
        id: resolvedId,
        sku: asString(rec['sku'] ?? rec['codigo'] ?? rec['id']) ?? undefined,
        nome: asString(rec['nome']) ?? undefined,
        codigo_barras: barcode ?? null,
        estoque: estoqueVal ?? null,
      });
    });
  } else {
    const est = normalizeEstoque(produto.estoque);
    estoqueTotal = est;
    primeiro_barcode = extractBarcode(produto as Record<string, unknown>);
  }

  return { estoque: estoqueTotal, variacoes_meta, primeiro_barcode };
}

function extractPrecoBase(produto: ExternalProduct): number | null {
  if (Array.isArray(produto.catalogos) && produto.catalogos.length > 0) {
    const c0 = produto.catalogos[0];
    if (c0 && c0.precos && typeof c0.precos === 'object') {
      const pc = (c0.precos as Record<string, unknown>)['preco'];
      if (typeof pc === 'number') return pc;
      if (typeof pc === 'string') {
        const n = Number(pc);
        if (Number.isFinite(n)) return n;
      }
    }
  }
  if (Array.isArray(produto.variacoes) && produto.variacoes.length > 0) {
    const p0 = produto.variacoes[0];
    if (p0) {
      const precoVal = (p0 as Record<string, unknown>)['preco'];
      if (typeof precoVal === 'number') return precoVal as number;
      if (typeof precoVal === 'string') {
        const n = Number(precoVal);
        if (Number.isFinite(n)) return n;
      }
    }
  }
  if (typeof produto.preco === 'number') return produto.preco as number;
  if (typeof produto.preco === 'string') {
    const n = Number(produto.preco);
    if (Number.isFinite(n)) return n;
  }
  return null;
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

      const { estoque, variacoes_meta, primeiro_barcode } = processVariacoes(p);
      const preco_base = extractPrecoBase(p);

      const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
      const imgs = imgsRaw.map((x) => extractImageUrl(x)).filter((x): x is string => !!x).map(normalizeToProxy);

      result.push({
        id_externo: id,
        nome,
        preco_base,
        estoque: Number(estoque || 0),
        ativo: Boolean(ativo) && Number(estoque || 0) > 0,
        imagem: imgs.length > 0 ? imgs[0] : null,
        imagens: imgs,
        codigo_barras: primeiro_barcode ?? null,
        variacoes_meta: variacoes_meta.length > 0 ? variacoes_meta : undefined,
      });
    }

    pagesConsumed++;
    if (process.env.DEBUG_SYNC === 'true') {
      console.log(`[facilzap] page ${page} fetched, items=${items.length}`);
      const sample = result.slice(-2).map((p) => ({ id: p.id_externo, nome: p.nome, estoque: p.estoque, variacoes: p.variacoes_meta?.length ?? 0 }));
      console.log('[facilzap] últimos produtos processados:', sample);
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

    const { estoque, variacoes_meta, primeiro_barcode } = processVariacoes(p);
    const preco_base = extractPrecoBase(p);

    const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
    const imgs = imgsRaw.map((x) => extractImageUrl(x)).filter((x): x is string => !!x).map(normalizeToProxy);

    result.push({
      id_externo: id,
      nome,
      preco_base,
      estoque: Number(estoque || 0),
      ativo: Boolean(ativo) && Number(estoque || 0) > 0,
      imagem: imgs.length > 0 ? imgs[0] : null,
      imagens: imgs,
      codigo_barras: primeiro_barcode ?? null,
      variacoes_meta: variacoes_meta.length > 0 ? variacoes_meta : undefined,
    });
  }

  return { produtos: result, page, count: items.length };
}

export async function fetchProdutoFacilZapById(id: string): Promise<ExternalProduct | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN não configurado');

  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });

  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(id)}`);
    const data = resp.data;
    if (!data) return null;

    const prod = typeof data === 'object' && data !== null && (data as Record<string, unknown>)['data'] ? (data as Record<string, unknown>)['data'] as ExternalProduct : data as ExternalProduct;
    return prod ?? null;
  } catch (err: unknown) {
    console.error('[facilzap] erro ao buscar produto detalhe', id, err instanceof Error ? err.message : String(err));
    return null;
  }
}

import axios from 'axios';

export type ExternalProduct = {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number | Record<string, unknown>>;
  fotos?: Array<string | number | Record<string, unknown>>;
  variacoes?: Array<{
    id?: string | number;
    sku?: string | number;
    nome?: string;
    preco?: number | string;
    // estoque pode vir como número, string ou objeto
    estoque?: number | string | { estoque?: number | string; disponivel?: number | string; estoque_minimo?: number | null; localizacao?: string | null; controlar_estoque?: boolean };
    [key: string]: unknown;
  }>;
  // estoque do produto também pode ser number|string|object
  estoque?: number | string | { estoque?: number | string; disponivel?: number | string };
  preco?: number | string;
  catalogos?: Array<{
    precos?: { preco?: number | string; variacoes?: unknown };
    grade?: unknown;
  }>;
  [key: string]: unknown;
};

export type ProdutoDB = {
  id_externo: string;
  nome: string;
  preco_base: number | null;
  estoque: number;
  ativo: boolean;
  imagem: string | null;
  imagens: string[];
  codigo_barras?: string | null;
  variacoes_meta?: Array<{ id?: string | number; sku?: string; codigo_barras?: string | null; estoque?: number | null }>;
};

const API_BASE = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;

function normalizeToProxy(u: string): string {
  if (!u) return u;
  let s = String(u).trim();

  // If already proxied, return as-is
  if (s.includes('cjotarasteirinhas.com.br/.netlify/functions/proxy-facilzap-image')) return s;

  try {
    const d = decodeURIComponent(s);
    if (d && d.length > 0) s = d;
  } catch {
    // ignore
  }

  s = s.replace(/\s+/g, '%20');
  if (s.startsWith('//')) s = 'https:' + s;

  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) {
    s = s.replace(/^\/+/, '');
    s = `https://arquivos.facilzap.app.br/${s}`;
  }

  // Fix malformed host like https://produtos/...
  s = s.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');

  // Force https
  s = s.replace(/^http:/i, 'https:');

  const facilzapParam = encodeURIComponent(s);
  const urlParam = encodeURIComponent(s);
  const PROXY_HOST = 'https://c4franquiaas.netlify.app';
  return `${PROXY_HOST}/.netlify/functions/proxy-facilzap-image?facilzap=${facilzapParam}&url=${urlParam}`;
}

function asString(v?: unknown): string | undefined {
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

/**
 * Normaliza o campo estoque vindo do FácilZap
 */
function normalizeEstoque(estoqueField: unknown): number {
  if (typeof estoqueField === 'number' && Number.isFinite(estoqueField)) {
    return estoqueField;
  }

  if (typeof estoqueField === 'string') {
    const cleaned = estoqueField.trim().replace(/[^0-9.-]/g, '');
    if (cleaned === '') return 0;
    const num = Number(cleaned);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  }

  if (estoqueField && typeof estoqueField === 'object' && !Array.isArray(estoqueField)) {
    const obj = estoqueField as Record<string, unknown>;
    if ('estoque' in obj) {
      const est = obj['estoque'];
      if (typeof est === 'number' && Number.isFinite(est)) return est;
      if (typeof est === 'string') {
        const cleaned = est.trim().replace(/[^0-9.-]/g, '');
        if (cleaned !== '') {
          const num = Number(cleaned);
          if (Number.isFinite(num) && num >= 0) return num;
        }
      }
    }
    if ('disponivel' in obj) {
      const disp = obj['disponivel'];
      if (typeof disp === 'number' && Number.isFinite(disp)) return disp;
      if (typeof disp === 'string') {
        const cleaned = disp.trim().replace(/[^0-9.-]/g, '');
        if (cleaned !== '') {
          const num = Number(cleaned);
          if (Number.isFinite(num) && num >= 0) return num;
        }
      }
    }
  }

  return 0;
}

function extractBarcode(item: Record<string, unknown> | undefined | null): string | null {
  if (!item) return null;
  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
  for (const k of arrKeys) {
    const v = (item as Record<string, unknown>)[k];
    if (Array.isArray(v) && v.length > 0) {
      for (const it of v) {
        if (typeof it === 'string' && it.trim() !== '') return it.trim();
        if (typeof it === 'number') return String(it);
      }
    }
  }
  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode', 'cod_barras'];
  for (const k of candidates) {
    const v = (item as Record<string, unknown>)[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const key of Object.keys(item)) {
    const lk = key.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = (item as Record<string, unknown>)[key];
      if (typeof v === 'string' && v.trim() !== '') return v.trim();
      if (typeof v === 'number') return String(v);
    }
  }
  return null;
}

function processVariacoes(produto: ExternalProduct) {
  let estoqueTotal = 0;
  const variacoes_meta: Array<{ id?: string | number; sku?: string; nome?: string; codigo_barras?: string | null; estoque?: number | null }> = [];
  let primeiro_barcode: string | null = null;

  const productBarcodes = Array.isArray((produto as Record<string, unknown>)['cod_barras']) ? (produto as Record<string, unknown>)['cod_barras'] as unknown[] : undefined;

  if (Array.isArray(produto.variacoes) && produto.variacoes.length > 0) {
    produto.variacoes.forEach((variacao, idx) => {
      const rec = (variacao && typeof variacao === 'object') ? variacao as Record<string, unknown> : {};
      const estoqueVal = normalizeEstoque(rec['estoque'] ?? rec['quantity'] ?? rec['disponivel']);
      estoqueTotal += estoqueVal;

      let barcode = extractBarcode(rec);
      if ((!barcode || barcode === '') && Array.isArray(productBarcodes) && productBarcodes[idx]) {
        const cand = productBarcodes[idx];
        if (typeof cand === 'string' && cand.trim() !== '') barcode = cand.trim();
        if (typeof cand === 'number') barcode = String(cand);
      }

      if (!primeiro_barcode && barcode) primeiro_barcode = barcode;

      const resolvedId = (() => {
        const cand = rec['id'] ?? rec['codigo'];
        if (typeof cand === 'string' || typeof cand === 'number') return cand as string | number;
        return undefined;
      })();

      variacoes_meta.push({
        id: resolvedId,
        sku: asString(rec['sku'] ?? rec['codigo'] ?? rec['id']) ?? undefined,
        nome: asString(rec['nome']) ?? undefined,
        codigo_barras: barcode ?? null,
        estoque: estoqueVal ?? null,
      });
    });
  } else {
    const est = normalizeEstoque(produto.estoque);
    estoqueTotal = est;
    primeiro_barcode = extractBarcode(produto as Record<string, unknown>);
  }

  return { estoque: estoqueTotal, variacoes_meta, primeiro_barcode };
}

function extractPrecoBase(produto: ExternalProduct): number | null {
  if (Array.isArray(produto.catalogos) && produto.catalogos.length > 0) {
    const c0 = produto.catalogos[0];
    if (c0 && c0.precos && typeof c0.precos === 'object') {
      const pc = (c0.precos as Record<string, unknown>)['preco'];
      if (typeof pc === 'number') return pc;
      if (typeof pc === 'string') {
        const n = Number(pc);
        if (Number.isFinite(n)) return n;
      }
    }
  }
  if (Array.isArray(produto.variacoes) && produto.variacoes.length > 0) {
    const p0 = produto.variacoes[0];
    if (p0) {
      const precoVal = (p0 as Record<string, unknown>)['preco'];
      if (typeof precoVal === 'number') return precoVal as number;
      if (typeof precoVal === 'string') {
        const n = Number(precoVal);
        if (Number.isFinite(n)) return n;
      }
    }
  }
  if (typeof produto.preco === 'number') return produto.preco as number;
  if (typeof produto.preco === 'string') {
    const n = Number(produto.preco);
    if (Number.isFinite(n)) return n;
  }
  return null;
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

  const client = axios.create({
    baseURL: API_BASE,
    timeout: TIMEOUT,
    headers: { Authorization: `Bearer ${token}` },
  });

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

      const { estoque, variacoes_meta, primeiro_barcode } = processVariacoes(p);
      const preco_base = extractPrecoBase(p);

      const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
      const imgs = imgsRaw.map((x) => extractImageUrl(x)).filter((x): x is string => !!x).map(normalizeToProxy);

      result.push({
        id_externo: id,
        nome,
        preco_base,
        estoque: Number(estoque || 0),
        ativo: Boolean(ativo) && Number(estoque || 0) > 0,
        imagem: imgs.length > 0 ? imgs[0] : null,
        imagens: imgs,
        codigo_barras: primeiro_barcode ?? null,
        variacoes_meta: variacoes_meta.length > 0 ? variacoes_meta : undefined,
      });
    }

    pagesConsumed++;

    if (process.env.DEBUG_SYNC === 'true') {
      console.log(`[facilzap] page ${page} fetched, items=${items.length}`);
      const sample = result.slice(-2).map((p) => ({ id: p.id_externo, nome: p.nome, estoque: p.estoque, variacoes: p.variacoes_meta?.length ?? 0 }));
      console.log('[facilzap] últimos produtos processados:', sample);
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

    const { estoque, variacoes_meta, primeiro_barcode } = processVariacoes(p);
    const preco_base = extractPrecoBase(p);

    const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
    const imgs = imgsRaw.map((x) => extractImageUrl(x)).filter((x): x is string => !!x).map(normalizeToProxy);

    result.push({
      id_externo: id,
      nome,
      preco_base,
      estoque: Number(estoque || 0),
      ativo: Boolean(ativo) && Number(estoque || 0) > 0,
      imagem: imgs.length > 0 ? imgs[0] : null,
      imagens: imgs,
      codigo_barras: primeiro_barcode ?? null,
      variacoes_meta: variacoes_meta.length > 0 ? variacoes_meta : undefined,
    });
  }

  return { produtos: result, page, count: items.length };
}

export async function fetchProdutoFacilZapById(id: string): Promise<ExternalProduct | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN não configurado');

  const client = axios.create({ baseURL: API_BASE, timeout: TIMEOUT, headers: { Authorization: `Bearer ${token}` } });

  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(id)}`);
    const data = resp.data;
    if (!data) return null;

    const prod = typeof data === 'object' && data !== null && (data as Record<string, unknown>)['data'] ? (data as Record<string, unknown>)['data'] as ExternalProduct : data as ExternalProduct;
    return prod ?? null;
  } catch (err: unknown) {
    console.error('[facilzap] erro ao buscar produto detalhe', id, err instanceof Error ? err.message : String(err));
    return null;
  }
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

      // process variations (estoque per-variation, variacoes_meta and product-level barcode mapping)
      const { estoque, variacoes_meta, primeiro_barcode } = processVariacoes(p);

      // preco_base
      const preco_base = extractPrecoBase(p);

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
        ativo: Boolean(ativo) && (Number(estoque || 0) > 0),
        imagem: imgs.length > 0 ? imgs[0] : null,
        imagens: imgs,
        codigo_barras: primeiro_barcode ?? null,
        variacoes_meta: variacoes_meta.length > 0 ? variacoes_meta : undefined,
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
        return acc + normalizeEstoque((v as Record<string, unknown>)['estoque']);
      }, 0);
    }
    if (estoque === 0) {
      estoque = normalizeEstoque(p.estoque);
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
