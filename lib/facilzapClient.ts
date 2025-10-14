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
  let keepGoing = true;
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

  async function getPageWithRetry(path: string, attempts = 3) {
    let lastErr: any = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await axiosClient.get(path);
        return res.data;
      } catch (err) {
        lastErr = err;
        await new Promise(r => setTimeout(r, 300 * (i + 1)));
      }
    }
    throw lastErr;
  }

  while (keepGoing) {
    const path = `/produtos?page=${page}&length=${pageSize}`;
    let body: any;
    try {
      body = await getPageWithRetry(path, 3);
    } catch (err) {
      const errMsg = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
      console.error('[fetchProdutosFacilZap] erro ao buscar página', page, errMsg);
      break;
    }

    const pageData = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
    if (!pageData || pageData.length === 0) break;

    for (const raw of pageData) {
      const id = raw?.id ?? String(raw?.codigo ?? '');
      const nome = raw?.nome ?? raw?.title ?? 'Sem nome';
      const ativo = raw?.ativado ?? raw?.ativo ?? true;

      const estoque = Number(raw?.estoque?.disponivel ?? raw?.quantidade ?? 0);
      if (!ativo) continue;
      if ((estoque ?? 0) <= 0) continue;

      let preco: number | null = null;
      if (Array.isArray(raw?.variacoes) && raw.variacoes.length > 0) {
        const v0 = raw.variacoes[0];
        preco = typeof v0?.preco === 'number' ? v0.preco : preco;
      }
      if (preco === null && typeof raw?.preco === 'number') preco = raw.preco;

      const rawImgs: string[] = Array.isArray(raw?.imagens) ? raw.imagens : (raw?.fotos || []);
      const absImgs = (rawImgs || [])
        .map((u: string) => {
          if (!u) return null;
          let s = String(u);
          if (!s.includes('://')) {
            s = s.replace(/^\/+/, '');
            s = `https://arquivos.facilzap.app.br/${s}`;
          }
          s = s.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
          return s;
        })
        .filter(Boolean) as string[];

      const imagensProxy = absImgs.map(u => `/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(u)}`);

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
