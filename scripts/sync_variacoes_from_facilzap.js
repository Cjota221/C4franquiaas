#!/usr/bin/env node
/**
 * scripts/sync_variacoes_from_facilzap.js
 *
 * Usage:
 *  DRY RUN (default):
 *    FACILZAP_TOKEN=... node scripts/sync_variacoes_from_facilzap.js --page=1 --length=50
 *
 *  APPLY (writes to Supabase):
 *    FACILZAP_TOKEN=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/sync_variacoes_from_facilzap.js --page=1 --length=50 --apply
 *
 * The script fetches products from FácilZap (one page by default), computes `variacoes_meta` and aggregated `estoque`, and either prints the planned updates (dry-run) or performs upserts via Supabase using the service role key.
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const argv = require('minimist')(process.argv.slice(2));
const PAGE = Number(argv.page || argv.p || 1);
const LENGTH = Number(argv.length || argv.l || 50);
const APPLY = Boolean(argv.apply || argv.a);

async function fetchPageFromFacilzap(page = 1, length = 50) {
  const token = process.env.FACILZAP_TOKEN;
  if (!token) throw new Error('FACILZAP_TOKEN is required');
  const client = axios.create({ baseURL: 'https://api.facilzap.app.br', timeout: 10000, headers: { Authorization: `Bearer ${token}` } });
  const resp = await client.get(`/produtos?page=${page}&length=${length}`);
  const data = resp.data;
  if (data && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function normalizeNumberLike(val) {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const n = Number(String(val).replace(/[^0-9\-.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  if (val && typeof val === 'object') {
    const keys = ['estoque', 'disponivel', 'quantity', 'qtd', 'available'];
    for (const k of keys) {
      if (typeof val[k] !== 'undefined') {
        const n = normalizeNumberLike(val[k]);
        if (n !== null) return n;
      }
    }
    for (const k of Object.keys(val)) {
      const n = normalizeNumberLike(val[k]);
      if (n !== null) return n;
    }
  }
  return 0;
}

function normalizeEstoque(estoqueField) {
  if (typeof estoqueField === 'number') return Number.isFinite(estoqueField) ? estoqueField : 0;
  if (typeof estoqueField === 'string') {
    const n = Number(String(estoqueField).replace(/[^0-9\-.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  if (estoqueField && typeof estoqueField === 'object') {
    if (typeof estoqueField.estoque !== 'undefined' && estoqueField.estoque !== null) {
      return normalizeEstoque(estoqueField.estoque);
    }
    if (typeof estoqueField.disponivel !== 'undefined' && estoqueField.disponivel !== null) {
      return normalizeEstoque(estoqueField.disponivel);
    }
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
  const items = await fetchPageFromFacilzap(PAGE, LENGTH);
  if (!items || items.length === 0) {
    console.log('No items');
    return;
  }

  const planned = [];

  for (const p of items) {
    const id_externo = (p.id ?? p.codigo) ? String(p.id ?? p.codigo) : null;
    if (!id_externo) continue;
    const nome = p.nome ?? null;

    // process variations
    const variacoes = Array.isArray(p.variacoes) ? p.variacoes : [];
    const variacoes_meta = [];
    let estoqueTotal = 0;
    for (let i = 0; i < variacoes.length; i++) {
      const v = variacoes[i];
      const id = v && (v.id ?? v.codigo) ? String(v.id ?? v.codigo) : null;
      const sku = v && v.sku ? String(v.sku) : null;
      const nomeVar = v && v.nome ? String(v.nome) : null;
      const est = normalizeEstoque(v && v.estoque ? v.estoque : v && v.quantity ? v.quantity : null);
      estoqueTotal += est;
      const barcode = extractBarcode(v || {});
      variacoes_meta.push({ id, sku, estoque: est, codigo_barras: barcode });
    }
    if (variacoes.length === 0) {
      estoqueTotal = normalizeEstoque(p.estoque);
    }

    planned.push({ id_externo: String(id_externo), nome, estoque: estoqueTotal, variacoes_meta });
  }

  console.log('Planned updates (first 20):', planned.slice(0, 20));

  if (!APPLY) {
    console.log('\nDry-run mode — no changes applied. To apply, re-run with --apply and set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to apply changes');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { fetch });

  for (const p of planned) {
    const updates = { variacoes_meta: p.variacoes_meta, estoque: p.estoque };
    console.log('Applying for', p.id_externo, updates);
    const { data, error } = await supabase.from('produtos').update(updates).eq('id_externo', p.id_externo).select('id');
    if (error) {
      console.error('Supabase update error for', p.id_externo, error.message || error);
    } else {
      console.log('Updated', p.id_externo, data?.length ? 'rows:' + data.length : 'ok');
    }
  }
}

run().catch((err) => {
  console.error('run error', err);
  process.exit(1);
});
