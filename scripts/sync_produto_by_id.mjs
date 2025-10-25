#!/usr/bin/env node
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import minimist from 'minimist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
const envPath = join(__dirname, '..', '.env.local');
try {
  const envFile = readFileSync(envPath, 'utf8');
  const lines = envFile.split('\n');
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    
    if (key && value) {
      process.env[key.trim()] = value;
    }
  });
} catch (error) {
  console.error('❌ Erro ao ler .env.local:', error.message);
}

const argv = minimist(process.argv.slice(2));

const ID = argv.id || argv.i || argv.id_externo;
const APPLY = Boolean(argv.apply || argv.a);
if (!ID) {
  console.error('Usage: --id=<facilzap product id>');
  process.exit(1);
}

async function fetchProdutoFacilzap(id) {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN required');
  const client = axios.create({ baseURL: 'https://api.facilzap.app.br', timeout: 10000, headers: { Authorization: `Bearer ${token}` } });
  const resp = await client.get(`/produtos/${id}`);
  return resp.data;
}

function normalizeEstoque(estoqueField) {
  if (typeof estoqueField === 'number') return Number.isFinite(estoqueField) ? estoqueField : 0;
  if (typeof estoqueField === 'string') {
    const n = Number(String(estoqueField).replace(/[^0-9\-.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  if (estoqueField && typeof estoqueField === 'object') {
    if (typeof estoqueField.estoque !== 'undefined' && estoqueField.estoque !== null) return normalizeEstoque(estoqueField.estoque);
    if (typeof estoqueField.disponivel !== 'undefined' && estoqueField.disponivel !== null) return normalizeEstoque(estoqueField.disponivel);
  }
  return 0;
}

function extractBarcode(item) {
  if (!item || typeof item !== 'object') return null;
  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras'];
  for (const k of arrKeys) {
    const v = item[k];
    if (Array.isArray(v) && v.length > 0) {
      for (const it of v) {
        if (typeof it === 'string' && it.trim() !== '') return it.trim();
        if (typeof it === 'number') return String(it);
        if (it && typeof it === 'object') {
          if (typeof it.numero === 'string' && it.numero.trim() !== '') return it.numero.trim();
        }
      }
    }
  }
  const candidates = ['codigo_barras', 'codigoBarras', 'codigo', 'ean', 'gtin', 'barcode', 'cod_barras'];
  for (const k of candidates) {
    const v = item[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
    if (typeof v === 'number') return String(v);
    if (v && typeof v === 'object') {
      if (typeof v.numero === 'string' && v.numero.trim() !== '') return v.numero.trim();
      if (typeof v.number === 'string' && v.number.trim() !== '') return v.number.trim();
    }
  }
  for (const key of Object.keys(item)) {
    const lk = key.toLowerCase();
    if (lk.includes('cod') || lk.includes('ean') || lk.includes('bar') || lk.includes('gtin')) {
      const v = item[key];
      if (typeof v === 'string' && v.trim() !== '') return v.trim();
      if (typeof v === 'number') return String(v);
      if (v && typeof v === 'object') {
        if (typeof v.numero === 'string' && v.numero.trim() !== '') return v.numero.trim();
      }
    }
  }
  return null;
}

async function run() {
  const apiResp = await fetchProdutoFacilzap(ID);
  const produto = apiResp?.produto ?? (apiResp && typeof apiResp === 'object' ? apiResp : null);
  if (!produto) {
    console.error('Produto not found in API response');
    return;
  }

  const variacoes = Array.isArray(produto.variacoes) ? produto.variacoes : [];
  const variacoes_meta = [];
  let estoqueTotal = 0;
  for (let i = 0; i < variacoes.length; i++) {
    const v = variacoes[i];
    const id = (v && (v.id ?? v.codigo)) ? String(v.id ?? v.codigo) : null;
    const sku = v && v.sku ? String(v.sku) : null;
    const nome = v && v.nome ? String(v.nome) : (v && v.name ? String(v.name) : null);
    const est = normalizeEstoque(v && v.estoque ? v.estoque : null);
    estoqueTotal += est;
    const barcode = extractBarcode(v || {});
    variacoes_meta.push({ id, sku, nome, estoque: est, codigo_barras: barcode });
  }
  if (variacoes.length === 0) estoqueTotal = normalizeEstoque(produto.estoque);

  const planned = { id_externo: String(produto.id ?? produto.codigo), nome: produto.nome ?? null, estoque: estoqueTotal, variacoes_meta };
  console.log('Planned update for', planned.id_externo, planned);

  if (!APPLY) {
    console.log('\nDry-run mode. To apply, re-run with --apply and set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.');
    return;
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Variáveis necessárias:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_KEY ? '✅' : '❌');
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to apply');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const updates = { variacoes_meta: variacoes_meta, estoque: estoqueTotal };
  console.log('Applying update to Supabase for', planned.id_externo, updates);
  const { data, error } = await supabase.from('produtos').update(updates).eq('id_externo', planned.id_externo).select('id');
  if (error) {
    console.error('Supabase update error', error.message || error);
  } else {
    console.log('Applied update, affected rows:', data?.length ?? 0);
  }
}

run().catch((err) => {
  console.error('Error', err);
  process.exit(1);
});
