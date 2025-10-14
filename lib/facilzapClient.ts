import axios from 'axios';

export type ExternalProduct = {
  id?: string | number;
  codigo?: string | number;
  nome?: string;
  ativado?: boolean;
  ativo?: boolean;
  imagens?: Array<string | number>;
  fotos?: Array<string | number>;
  variacoes?: Array<{ preco?: number | string }>;
  estoque?: { disponivel?: number } | number;
  preco?: number | string;
  // any other fields are ignored
};

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

      // estoque
      let estoque = 0;
      if (typeof p.estoque === 'number') estoque = p.estoque;
      else if (p.estoque && typeof p.estoque === 'object') {
        const estoqueObj = p.estoque as Record<string, unknown>;
        if (typeof estoqueObj['disponivel'] === 'number') estoque = estoqueObj['disponivel'] as number;
      }

      // preco_base from variacoes[0].preco
      let preco_base: number | null = null;
      if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
        const v0 = p.variacoes[0];
        if (v0 && typeof v0.preco === 'number') preco_base = v0.preco;
        if (v0 && typeof v0.preco === 'string') {
          const n = Number(v0.preco);
          if (Number.isFinite(n)) preco_base = n;
        }
      }

      // imagens
      const imgsRaw = Array.isArray(p.imagens) ? p.imagens : Array.isArray(p.fotos) ? p.fotos : [];
      const imgs = imgsRaw.map((x) => asString(x)).filter((x): x is string => !!x).map(normalizeToProxy);

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
    page++;
  }

  return { produtos: result, pages: pagesConsumed };
}
