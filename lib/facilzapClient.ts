import axios from 'axios';

export type NormalizedProduct = {
  id: string;
  nome: string;
  preco: number | null;
  estoque: number;
  ativo: boolean;
  imagens: string[]; // proxy URLs
  imagem: string | null;
};

export async function fetchProdutosFacilZap(): Promise<NormalizedProduct[]> {
  const apiBaseUrl = 'https://api.facilzap.app.br';
  const apiToken = process.env.FACILZAP_TOKEN;
  if (!apiToken) throw new Error('FACILZAP_TOKEN não configurado');

  const pageSize = 100;
  let page = 1;
  const results: NormalizedProduct[] = [];

  const axiosClient = axios.create({
    baseURL: apiBaseUrl,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: 'application/json',
      'User-Agent': 'C4-Franquias-Integration/1.0',
    },
    timeout: 10000,
  });

  async function getPageWithRetry(path: string, attempts = 3): Promise<unknown> {
    let lastErr: unknown = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await axiosClient.get(path);
        return res.data;
      } catch (err: unknown) {
        lastErr = err;
        // backoff
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
      }
    }
    throw lastErr;
  }

  while (true) {
    const path = `/produtos?page=${page}&length=${pageSize}`;
    let body: unknown;
    try {
      body = await getPageWithRetry(path, 3);
    } catch (err: unknown) {
      const errMsg =
        typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>)['message'] === 'string'
          ? String((err as Record<string, unknown>)['message'])
          : String(err);
      console.error('[fetchProdutosFacilZap] erro ao buscar página', page, errMsg);
      break;
    }

    const pageData: unknown[] =
      typeof body === 'object' && body !== null && Array.isArray((body as Record<string, unknown>).data)
        ? ((body as Record<string, unknown>).data as unknown[])
        : Array.isArray(body)
        ? (body as unknown[])
        : [];
    if (!pageData || pageData.length === 0) break;
    for (const raw of pageData) {
      const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

      const getString = (key: string): string | undefined => {
        const v = r[key];
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return String(v);
        return undefined;
      };

      const getNumber = (key: string): number | undefined => {
        const v = r[key];
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const n = Number(v);
          return Number.isFinite(n) ? n : undefined;
        }
        return undefined;
      };

      const getArray = (key: string): unknown[] | undefined => {
        const v = r[key];
        return Array.isArray(v) ? v : undefined;
      };

      const id = getString('id') ?? getString('codigo') ?? '';
      const nome = getString('nome') ?? getString('title') ?? 'Sem nome';
      const ativo = ((): boolean => {
        const v = r['ativado'] ?? r['ativo'];
        if (typeof v === 'boolean') return v;
        if (typeof v === 'string') return v === 'true';
        return true;
      })();

      const estoqueFromObj = typeof r['estoque'] === 'object' && r['estoque'] !== null ? (r['estoque'] as Record<string, unknown>)['disponivel'] : undefined;
      const estoque = Number(estoqueFromObj ?? getNumber('quantidade') ?? 0);
      if (!ativo) continue;
      if ((estoque ?? 0) <= 0) continue;

      let preco: number | null = null;
      const variacoes = getArray('variacoes');
      if (variacoes && variacoes.length > 0) {
        const v0 = variacoes[0];
        const v0rec = typeof v0 === 'object' && v0 !== null ? (v0 as Record<string, unknown>) : {};
        const p = v0rec['preco'];
        if (typeof p === 'number') preco = p;
        if (typeof p === 'string') {
          const pn = Number(p);
          if (Number.isFinite(pn)) preco = pn;
        }
      }
      if (preco === null) {
        const pRaw = r['preco'];
        if (typeof pRaw === 'number') preco = pRaw;
        if (typeof pRaw === 'string') {
          const pn = Number(pRaw);
          if (Number.isFinite(pn)) preco = pn;
        }
      }

      const imagensFromKey = getArray('imagens') ?? getArray('fotos') ?? [];
      const rawImgs = imagensFromKey.map((x) => (typeof x === 'string' || typeof x === 'number' ? String(x) : '')).filter(Boolean);
      const absImgs = rawImgs
        .map((s) => {
          let str = s;
          if (!str.includes('://')) {
            str = str.replace(/^\/+/, '');
            str = `https://arquivos.facilzap.app.br/${str}`;
          }
          str = str.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
          return str;
        })
        .filter(Boolean);

      const imagensProxy = absImgs.map((u) => `/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(u)}`);

      results.push({
        id: String(id),
        nome,
        preco: typeof preco === 'number' ? preco : null,
        estoque: Number(estoque || 0),
        ativo: Boolean(ativo),
        imagens: imagensProxy,
        imagem: imagensProxy[0] ?? null,
      });
    }

    page++;
  }

  return results;
}
