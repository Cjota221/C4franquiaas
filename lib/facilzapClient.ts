import axios from 'axios';

// ============ TIPOS E INTERFACES ============

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
    codigo?: string;
    sku?: string;
    nome?: string;
    ativada?: boolean;
    preco?: number | string;
    estoque?: { estoque?: number | string } | number | string;
    [key: string]: unknown;
  }>;
  estoque?: { disponivel?: number | string; estoque?: number | string } | number | string;
  preco?: number | string;
  catalogos?: Array<{
    precos?: { preco?: number | string; variacoes?: unknown };
    grade?: unknown;
  }>;
  [key: string]: unknown;
};

export type VariacaoMeta = {
  id?: string | number;
  sku?: string;
  nome?: string;
  codigo_barras?: string | null;
  estoque?: number | null;
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
  variacoes_meta?: VariacaoMeta[];
};

// ============ CONSTANTES ============

const FACILZAP_API = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000;

// ============ FUNÇÕES AUXILIARES ============

function normalizeToProxy(u: string): string {
  if (!u) return u;
  let s = String(u).trim();

  if (s.includes('cjotarasteirinhas.com.br/.netlify/functions/proxy-facilzap-image') ||
      s.includes('c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image')) return s;

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

  s = s.replace('://produtos/', '://arquivos.facilzap.app.br/produtos/');
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

function normalizeEstoque(estoqueField: unknown): number {
  // LOG: Mostrar o valor recebido
  if (process.env.DEBUG_SYNC === 'true') {
    console.log('[normalizeEstoque] Entrada:', typeof estoqueField, estoqueField);
  }

  // Verificar se é number direto
  if (typeof estoqueField === 'number' && Number.isFinite(estoqueField)) {
    if (process.env.DEBUG_SYNC === 'true') {
      console.log('[normalizeEstoque] ✅ Retornando number direto:', estoqueField);
    }
    return estoqueField;
  }

  // Verificar se é string
  if (typeof estoqueField === 'string') {
    const cleaned = estoqueField.trim().replace(/[^0-9.-]/g, '');
    if (cleaned === '') {
      if (process.env.DEBUG_SYNC === 'true') {
        console.log('[normalizeEstoque] ⚠️ String vazia após limpeza');
      }
      return 0;
    }
    const num = Number(cleaned);
    if (process.env.DEBUG_SYNC === 'true') {
      console.log('[normalizeEstoque] ✅ Retornando string convertida:', num);
    }
    return Number.isFinite(num) && num >= 0 ? num : 0;
  }

  // Verificar se é objeto
  if (estoqueField && typeof estoqueField === 'object' && !Array.isArray(estoqueField)) {
    const obj = estoqueField as Record<string, unknown>;
    
    if (process.env.DEBUG_SYNC === 'true') {
      console.log('[normalizeEstoque] 📦 Objeto recebido com campos:', Object.keys(obj));
    }

    // Prioridade 1: estoque.estoque
    if ('estoque' in obj) {
      const est = obj['estoque'];
      if (typeof est === 'number' && Number.isFinite(est)) {
        if (process.env.DEBUG_SYNC === 'true') {
          console.log('[normalizeEstoque] ✅ Retornando obj.estoque (number):', est);
        }
        return est;
      }
      if (typeof est === 'string') {
        const cleaned = est.trim().replace(/[^0-9.-]/g, '');
        if (cleaned !== '') {
          const num = Number(cleaned);
          if (Number.isFinite(num) && num >= 0) {
            if (process.env.DEBUG_SYNC === 'true') {
              console.log('[normalizeEstoque] ✅ Retornando obj.estoque (string):', num);
            }
            return num;
          }
        }
      }
    }

    // Prioridade 2: estoque.disponivel
    if ('disponivel' in obj) {
      const disp = obj['disponivel'];
      if (typeof disp === 'number' && Number.isFinite(disp)) {
        if (process.env.DEBUG_SYNC === 'true') {
          console.log('[normalizeEstoque] ✅ Retornando obj.disponivel (number):', disp);
        }
        return disp;
      }
      if (typeof disp === 'string') {
        const cleaned = disp.trim().replace(/[^0-9.-]/g, '');
        if (cleaned !== '') {
          const num = Number(cleaned);
          if (Number.isFinite(num) && num >= 0) {
            if (process.env.DEBUG_SYNC === 'true') {
              console.log('[normalizeEstoque] ✅ Retornando obj.disponivel (string):', num);
            }
            return num;
          }
        }
      }
    }

    // Prioridade 3: quantidade
    if ('quantidade' in obj) {
      const qty = obj['quantidade'];
      if (typeof qty === 'number' && Number.isFinite(qty)) {
        if (process.env.DEBUG_SYNC === 'true') {
          console.log('[normalizeEstoque] ✅ Retornando obj.quantidade:', qty);
        }
        return qty;
      }
      if (typeof qty === 'string') {
        const cleaned = qty.trim().replace(/[^0-9.-]/g, '');
        if (cleaned !== '') {
          const num = Number(cleaned);
          if (Number.isFinite(num) && num >= 0) {
            if (process.env.DEBUG_SYNC === 'true') {
              console.log('[normalizeEstoque] ✅ Retornando obj.quantidade (string):', num);
            }
            return num;
          }
        }
      }
    }

    // Prioridade 4: qty
    if ('qty' in obj) {
      const qty = obj['qty'];
      if (typeof qty === 'number' && Number.isFinite(qty)) {
        if (process.env.DEBUG_SYNC === 'true') {
          console.log('[normalizeEstoque] ✅ Retornando obj.qty:', qty);
        }
        return qty;
      }
      if (typeof qty === 'string') {
        const cleaned = qty.trim().replace(/[^0-9.-]/g, '');
        if (cleaned !== '') {
          const num = Number(cleaned);
          if (Number.isFinite(num) && num >= 0) {
            if (process.env.DEBUG_SYNC === 'true') {
              console.log('[normalizeEstoque] ✅ Retornando obj.qty (string):', num);
            }
            return num;
          }
        }
      }
    }

    // Prioridade 5: stock
    if ('stock' in obj) {
      const stock = obj['stock'];
      if (typeof stock === 'number' && Number.isFinite(stock)) {
        if (process.env.DEBUG_SYNC === 'true') {
          console.log('[normalizeEstoque] ✅ Retornando obj.stock:', stock);
        }
        return stock;
      }
      if (typeof stock === 'string') {
        const cleaned = stock.trim().replace(/[^0-9.-]/g, '');
        if (cleaned !== '') {
          const num = Number(cleaned);
          if (Number.isFinite(num) && num >= 0) {
            if (process.env.DEBUG_SYNC === 'true') {
              console.log('[normalizeEstoque] ✅ Retornando obj.stock (string):', num);
            }
            return num;
          }
        }
      }
    }
  }

  // LOG: Se não encontrou
  if (process.env.DEBUG_SYNC === 'true') {
    console.log('[normalizeEstoque] ❌ Retornando 0 (nenhum campo válido encontrado)');
  }

  return 0;
}

function extractBarcode(item: Record<string, unknown>): string | null {
  if (!item) return null;

  // LOG: Mostrar todos os campos disponíveis
  if (process.env.DEBUG_SYNC === 'true') {
    console.log('[extractBarcode] Campos disponíveis:', Object.keys(item));
  }

  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras', 'barcodes', 'eans'];
  for (const k of arrKeys) {
    const v = item[k];
    
    // Verificar se é um objeto com 'numero' (estrutura FácilZap)
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>;
      if ('numero' in obj) {
        const numero = obj['numero'];
        if (typeof numero === 'string' && numero.trim() !== '') {
          if (process.env.DEBUG_SYNC === 'true') {
            console.log(`[extractBarcode] ✅ Encontrado em '${k}.numero': ${numero}`);
          }
          return numero.trim();
        }
        if (typeof numero === 'number') {
          if (process.env.DEBUG_SYNC === 'true') {
            console.log(`[extractBarcode] ✅ Encontrado em '${k}.numero': ${numero}`);
          }
          return String(numero);
        }
      }
    }
    
    if (Array.isArray(v) && v.length > 0) {
      if (process.env.DEBUG_SYNC === 'true') {
        console.log(`[extractBarcode] Encontrado array em '${k}':`, v);
      }
      for (const it of v) {
        if (typeof it === 'string' && it.trim() !== '') return it.trim();
        if (typeof it === 'number') return String(it);
        // Verificar objetos dentro do array
        if (it && typeof it === 'object') {
          const itObj = it as Record<string, unknown>;
          if ('numero' in itObj) {
            const numero = itObj['numero'];
            if (typeof numero === 'string' && numero.trim() !== '') return numero.trim();
            if (typeof numero === 'number') return String(numero);
          }
        }
      }
    }
  }

  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode', 'cod_barras', 'ean13', 'ean8', 'upc'];
  for (const k of candidates) {
    const v = item[k];
    
    // Verificar se é um objeto com 'numero'
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>;
      if ('numero' in obj) {
        const numero = obj['numero'];
        if (typeof numero === 'string' && numero.trim() !== '') {
          if (process.env.DEBUG_SYNC === 'true') {
            console.log(`[extractBarcode] ✅ Encontrado em '${k}.numero': ${numero}`);
          }
          return numero.trim();
        }
        if (typeof numero === 'number') {
          if (process.env.DEBUG_SYNC === 'true') {
            console.log(`[extractBarcode] ✅ Encontrado em '${k}.numero': ${numero}`);
          }
          return String(numero);
        }
      }
      // Verificar outras propriedades do objeto
      if ('number' in obj) {
        const number = obj['number'];
        if (typeof number === 'string' && number.trim() !== '') {
          if (process.env.DEBUG_SYNC === 'true') {
            console.log(`[extractBarcode] ✅ Encontrado em '${k}.number': ${number}`);
          }
          return number.trim();
        }
        if (typeof number === 'number') {
          if (process.env.DEBUG_SYNC === 'true') {
            console.log(`[extractBarcode] ✅ Encontrado em '${k}.number': ${number}`);
          }
          return String(number);
        }
      }
    }
    
    if (typeof v === 'string' && v.trim() !== '') {
      if (process.env.DEBUG_SYNC === 'true') {
        console.log(`[extractBarcode] ✅ Encontrado em '${k}': ${v}`);
      }
      return v.trim();
    }
    if (typeof v === 'number') {
      if (process.env.DEBUG_SYNC === 'true') {
        console.log(`[extractBarcode] ✅ Encontrado em '${k}': ${v}`);
      }
      return String(v);
    }
  }

  for (const key of Object.keys(item)) {
    const lk = key.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = item[key];
      
      // Verificar se é um objeto com 'numero' ou 'number'
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const obj = v as Record<string, unknown>;
        if ('numero' in obj) {
          const numero = obj['numero'];
          if (typeof numero === 'string' && numero.trim() !== '') {
            if (process.env.DEBUG_SYNC === 'true') {
              console.log(`[extractBarcode] ✅ Encontrado em busca genérica '${key}.numero': ${numero}`);
            }
            return numero.trim();
          }
          if (typeof numero === 'number') {
            if (process.env.DEBUG_SYNC === 'true') {
              console.log(`[extractBarcode] ✅ Encontrado em busca genérica '${key}.numero': ${numero}`);
            }
            return String(numero);
          }
        }
        if ('number' in obj) {
          const number = obj['number'];
          if (typeof number === 'string' && number.trim() !== '') {
            if (process.env.DEBUG_SYNC === 'true') {
              console.log(`[extractBarcode] ✅ Encontrado em busca genérica '${key}.number': ${number}`);
            }
            return number.trim();
          }
          if (typeof number === 'number') {
            if (process.env.DEBUG_SYNC === 'true') {
              console.log(`[extractBarcode] ✅ Encontrado em busca genérica '${key}.number': ${number}`);
            }
            return String(number);
          }
        }
      }
      
      if (typeof v === 'string' && v.trim() !== '') {
        if (process.env.DEBUG_SYNC === 'true') {
          console.log(`[extractBarcode] ✅ Encontrado em busca genérica '${key}': ${v}`);
        }
        return v.trim();
      }
      if (typeof v === 'number') {
        if (process.env.DEBUG_SYNC === 'true') {
          console.log(`[extractBarcode] ✅ Encontrado em busca genérica '${key}': ${v}`);
        }
        return String(v);
      }
    }
  }

  // LOG: Se não encontrou, mostrar o objeto completo
  if (process.env.DEBUG_SYNC === 'true') {
    console.log('[extractBarcode] ❌ Código de barras NÃO encontrado. Objeto completo:', JSON.stringify(item, null, 2));
  }

  return null;
}

function processVariacoes(produto: ExternalProduct) {
  let estoqueTotal = 0;
  const variacoes_meta: VariacaoMeta[] = [];
  let primeiro_barcode: string | null = null;

  // LOG: Verificar se o produto tem variações
  if (process.env.DEBUG_SYNC === 'true') {
    console.log('[processVariacoes] ==========================================');
    console.log('[processVariacoes] 📦 Produto:', produto.id ?? produto.codigo);
    console.log('[processVariacoes] Nome:', produto.nome);
    console.log('[processVariacoes] Campos disponíveis no produto:', Object.keys(produto));
  }

  // Extrair array de códigos de barras do produto (pode ser usado como fallback)
  const productBarcodes = Array.isArray((produto as Record<string, unknown>)['cod_barras'])
    ? (produto as Record<string, unknown>)['cod_barras'] as unknown[]
    : undefined;

  if (process.env.DEBUG_SYNC === 'true' && productBarcodes) {
    console.log('[processVariacoes] 🏷️ Array de códigos de barras do produto:', productBarcodes);
  }

  // Procurar variações em diferentes campos (TODOS OS NOMES POSSÍVEIS)
  const prodObj = produto as Record<string, unknown>;
  
  let variacoesArray: unknown[] = [];
  let campoEncontrado = '';
  
  // Ordem de prioridade na busca
  if (Array.isArray(produto.variacoes)) {
    variacoesArray = produto.variacoes;
    campoEncontrado = 'variacoes';
  } else if (Array.isArray(prodObj.variations)) {
    variacoesArray = prodObj.variations as unknown[];
    campoEncontrado = 'variations';
  } else if (Array.isArray(prodObj.skus)) {
    variacoesArray = prodObj.skus as unknown[];
    campoEncontrado = 'skus';
  } else if (Array.isArray(prodObj.opcoes)) {
    variacoesArray = prodObj.opcoes as unknown[];
    campoEncontrado = 'opcoes';
  } else if (Array.isArray(prodObj.items)) {
    variacoesArray = prodObj.items as unknown[];
    campoEncontrado = 'items';
  }

  if (process.env.DEBUG_SYNC === 'true') {
    if (variacoesArray.length > 0) {
      console.log(`[processVariacoes] ✅ Variações encontradas em '${campoEncontrado}': ${variacoesArray.length} itens`);
    } else {
      console.log('[processVariacoes] ⚠️ Nenhuma variação encontrada nos campos: variacoes, variations, skus, opcoes, items');
    }
  }

  if (variacoesArray.length > 0) {
    variacoesArray.forEach((variacao, idx) => {
      const rec = (variacao && typeof variacao === 'object') ? variacao as Record<string, unknown> : {};

      // LOG: Mostrar campos da variação
      if (process.env.DEBUG_SYNC === 'true') {
        console.log(`[processVariacoes] ------------------------------------------`);
        console.log(`[processVariacoes] 🔍 Variação ${idx + 1}/${variacoesArray.length}`);
        console.log(`[processVariacoes] Campos disponíveis:`, Object.keys(rec));
      }

      // Extrair estoque
      const estoqueVal = normalizeEstoque(rec['estoque']);
      estoqueTotal += estoqueVal;

      // Extrair código de barras
      let barcode = extractBarcode(rec);

      // Fallback: usar código de barras do array do produto (índice correspondente)
      if ((!barcode || barcode === '') && Array.isArray(productBarcodes) && productBarcodes[idx]) {
        const cand = productBarcodes[idx];
        if (typeof cand === 'string' && cand.trim() !== '') {
          barcode = cand.trim();
          if (process.env.DEBUG_SYNC === 'true') {
            console.log(`[processVariacoes] 🏷️ Usando código de barras do array do produto [${idx}]: ${barcode}`);
          }
        }
        if (typeof cand === 'number') {
          barcode = String(cand);
          if (process.env.DEBUG_SYNC === 'true') {
            console.log(`[processVariacoes] 🏷️ Usando código de barras do array do produto [${idx}]: ${barcode}`);
          }
        }
        // Se for objeto com 'numero'
        if (cand && typeof cand === 'object') {
          const candObj = cand as Record<string, unknown>;
          if ('numero' in candObj && candObj['numero']) {
            barcode = String(candObj['numero']);
            if (process.env.DEBUG_SYNC === 'true') {
              console.log(`[processVariacoes] 🏷️ Usando código de barras do array do produto [${idx}].numero: ${barcode}`);
            }
          }
        }
      }

      if (!primeiro_barcode && barcode) primeiro_barcode = barcode;

      // Extrair ID (prioridade: id → codigo)
      const resolvedId = (() => {
        const cand = rec['id'] ?? rec['codigo'];
        if (typeof cand === 'string' || typeof cand === 'number') return cand as string | number;
        return undefined;
      })();

      // Extrair nome
      const nome = asString(rec['nome'] ?? rec['name'] ?? rec['titulo']);

      // Extrair SKU (prioridade: sku → codigo → id)
      const sku = asString(rec['sku'] ?? rec['codigo'] ?? rec['id']) ?? undefined;

      // LOG: Mostrar dados extraídos da variação
      if (process.env.DEBUG_SYNC === 'true') {
        console.log(`[processVariacoes] ✅ Dados extraídos da variação ${idx + 1}:`, {
          id: resolvedId,
          sku: sku || 'null',
          nome: nome || 'null',
          codigo_barras: barcode || 'null',
          estoque: estoqueVal
        });
      }

      variacoes_meta.push({
        id: resolvedId,
        sku,
        nome,
        codigo_barras: barcode ?? null,
        estoque: estoqueVal,
      });
    });
  } else {
    // Produto sem variações - usar estoque direto
    estoqueTotal = normalizeEstoque(produto.estoque);
    
    if (process.env.DEBUG_SYNC === 'true') {
      console.log('[processVariacoes] ⚠️ Produto SEM variações');
      console.log('[processVariacoes] Usando estoque direto do produto:', estoqueTotal);
    }
    
    // Tentar extrair código de barras do produto
    primeiro_barcode = extractBarcode(produto as unknown as Record<string, unknown>);
    
    if (process.env.DEBUG_SYNC === 'true') {
      console.log('[processVariacoes] Código de barras do produto:', primeiro_barcode || 'null');
    }
  }

  // LOG: Resultado final
  if (process.env.DEBUG_SYNC === 'true') {
    console.log('[processVariacoes] ==========================================');
    console.log('[processVariacoes] 📊 RESULTADO FINAL:');
    console.log('[processVariacoes] Estoque total:', estoqueTotal);
    console.log('[processVariacoes] Número de variações:', variacoes_meta.length);
    console.log('[processVariacoes] Primeiro código de barras:', primeiro_barcode || 'null');
    console.log('[processVariacoes] ==========================================');
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

// ============ FUNÇÕES PRINCIPAIS (EXPORTS) ============

export async function fetchAllProdutosFacilZap(): Promise<{ produtos: ProdutoDB[]; pages: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN não configurado');

  const client = axios.create({
    baseURL: FACILZAP_API,
    timeout: TIMEOUT,
    headers: { Authorization: `Bearer ${token}` }
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
    }

    page++;
  }

  return { produtos: result, pages: pagesConsumed };
}

export async function fetchProdutosFacilZapPage(
  page = 1,
  length = PAGE_SIZE
): Promise<{ produtos: ProdutoDB[]; page: number; count: number }> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN não configurado');

  const client = axios.create({
    baseURL: FACILZAP_API,
    timeout: TIMEOUT,
    headers: { Authorization: `Bearer ${token}` }
  });

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

  return { produtos: result, page, count: items.length };
}

export async function fetchProdutoFacilZapById(id: string): Promise<ExternalProduct | null> {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) {
    console.warn('[facilzap] FACILZAP_TOKEN não configurado, pulando busca de detalhes da API');
    return null;
  }

  const client = axios.create({
    baseURL: FACILZAP_API,
    timeout: TIMEOUT,
    headers: { Authorization: `Bearer ${token}` }
  });

  try {
    const resp = await client.get(`/produtos/${encodeURIComponent(id)}`);
    const data = resp.data;
    if (!data) return null;

    const prod = (typeof data === 'object' && data !== null && (data as Record<string, unknown>)['data'])
      ? (data as Record<string, unknown>)['data'] as ExternalProduct
      : data as ExternalProduct;

    return prod ?? null;
  } catch (err: unknown) {
    console.error('[facilzap] erro ao buscar produto detalhe', id, err instanceof Error ? err.message : String(err));
    return null;
  }
}