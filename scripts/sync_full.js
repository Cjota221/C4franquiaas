const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

function readEnvLocal() {
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return {};
  const txt = fs.readFileSync(p, 'utf8');
  const lines = txt.split(/\r?\n/);
  const env = {};
  for (const l of lines) {
    const s = l.trim();
    if (!s || s.startsWith('#')) continue;
    const idx = s.indexOf('=');
    if (idx === -1) continue;
    const k = s.slice(0, idx).trim();
    let v = s.slice(idx + 1).trim();
    // remove optional quotes
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[k] = v;
  }
  return env;
}

function asString(v) {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  return undefined;
}

function extractImageUrl(x) {
  if (!x) return undefined;
  if (typeof x === 'string') return x;
  if (typeof x === 'object') {
    return asString(x.url ?? x.file ?? x.path ?? x.src);
  }
  return undefined;
}

function normalizeProduct(p) {
  const id = asString(p.id ?? p.codigo);
  const nome = asString(p.nome) || 'Sem nome';
  const ativo = typeof p.ativado === 'boolean' ? p.ativado : typeof p.ativo === 'boolean' ? p.ativo : true;

  let estoque = 0;
  if (Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    estoque = p.variacoes.reduce((acc, v) => {
      if (!v) return acc;
      const ve = v.estoque;
      if (typeof ve === 'number') return acc + ve;
      if (ve && typeof ve === 'object' && typeof ve.estoque === 'number') return acc + ve.estoque;
      return acc;
    }, 0);
  }
  if (estoque === 0) {
    if (typeof p.estoque === 'number') estoque = p.estoque;
    else if (p.estoque && typeof p.estoque === 'object') {
      if (typeof p.estoque.estoque === 'number') estoque = p.estoque.estoque;
      else if (typeof p.estoque.disponivel === 'number') estoque = p.estoque.disponivel;
    }
  }

  let preco_base = null;
  if (Array.isArray(p.catalogos) && p.catalogos.length > 0) {
    const c0 = p.catalogos[0];
    if (c0 && c0.precos) {
      const pc = c0.precos.preco;
      if (typeof pc === 'number') preco_base = pc;
      if (typeof pc === 'string') {
        const n = Number(pc);
        if (Number.isFinite(n)) preco_base = n;
      }
    }
  }
  if (preco_base === null && Array.isArray(p.variacoes) && p.variacoes.length > 0) {
    const v0 = p.variacoes[0];
    if (v0 && typeof v0.preco === 'number') preco_base = v0.preco;
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
  const imgs = imgsRaw.map(extractImageUrl).filter(x => !!x).map(s => s.replace(/^\/+/, '')).map(s => s.includes('://') ? s : `https://arquivos.facilzap.app.br/${s}`);

  return {
    id_externo: id,
    nome,
    preco_base,
    estoque: Number(estoque || 0),
    ativo: Boolean(ativo),
    imagem: imgs.length > 0 ? imgs[0] : null,
    imagens: imgs,
  };
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = { dryRun: false, page: undefined, length: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run' || a === '-d') out.dryRun = true;
    if (a.startsWith('--page=')) out.page = Number(a.split('=')[1]);
    if (a === '--page' && argv[i + 1]) { out.page = Number(argv[i + 1]); i++; }
    if (a.startsWith('--length=')) out.length = Number(a.split('=')[1]);
    if (a === '--length' && argv[i + 1]) { out.length = Number(argv[i + 1]); i++; }
  }
  return out;
}

async function run() {
  const args = parseArgs();
  const env = readEnvLocal();
  const FACILZAP_TOKEN = env.FACILZAP_TOKEN;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;

  if (!FACILZAP_TOKEN || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
    console.error('Faltam variaveis em .env.local (FACILZAP_TOKEN, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL).');
    process.exit(1);
  }

  const client = axios.create({ baseURL: 'https://api.facilzap.app.br', timeout: 60000, headers: { Authorization: `Bearer ${FACILZAP_TOKEN}` } });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let page = args.page ?? 1;
  const length = args.length ?? 50;
  let total = 0;
  const stopAfterThisPage = typeof args.page === 'number' && args.page > 0;
  while (true) {
    console.log(`Fetching page ${page}...`);
    let resp;
    try {
      resp = await client.get(`/produtos?page=${page}&length=${length}`);
    } catch (err) {
      console.error('Erro ao buscar facilzap page', page, err.message || err);
      break;
    }
    const data = resp.data;
    const items = (typeof data === 'object' && data !== null && Array.isArray(data.data)) ? data.data : (Array.isArray(data) ? data : []);
    if (!items || items.length === 0) {
      console.log('No more items. Finished.');
      break;
    }

    const produtos = items.map(normalizeProduct);

    // upsert in batches of 50
    const batchSize = 50;
    let processed = 0;
    for (let i = 0; i < produtos.length; i += batchSize) {
      const batch = produtos.slice(i, i + batchSize);
      // Only send columns we know exist in the 'produtos' table to avoid schema errors
      const payload = batch.map(p => ({
        id_externo: p.id_externo,
        nome: p.nome,
        preco_base: p.preco_base,
        estoque: p.estoque,
        ativo: p.ativo,
        imagem: p.imagem ?? null,
        imagens: p.imagens ?? [],
        last_synced_at: new Date().toISOString(),
      }));
      if (args.dryRun) {
        console.log(`DRY RUN: would upsert ${payload.length} items (page ${page})`);
        processed += payload.length;
      } else {
        try {
          const { error } = await supabase.from('produtos').upsert(payload, { onConflict: 'id_externo' });
          if (error) {
            console.error('Supabase upsert error', error.message || error);
            process.exit(1);
          }
        } catch (err) {
          console.error('Supabase upsert exception', err.message || err);
          process.exit(1);
        }
        processed += payload.length;
      }
    }

    total += processed;
    console.log(`Page ${page}: fetched=${items.length} upserted=${processed}`);
    console.log('Sample:', produtos.slice(0, Math.min(5, produtos.length)).map(p => ({ id_externo: p.id_externo, nome: p.nome, preco_base: p.preco_base, estoque: p.estoque })));

    page += 1;
    if (stopAfterThisPage) break;
  }

  console.log(`Sync finished. Total upserted: ${total}`);
}

run().catch(err => { console.error('Fatal error', err); process.exit(1); });
