#!/usr/bin/env node
/**
 * Script para sincronizar TODOS os produtos da FácilZap para o Supabase
 * com VARIAÇÕES COMPLETAS (fazendo requisições individuais por produto)
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[k] = v;
  }
  return env;
}

function normalizeEstoque(estoqueField) {
  if (typeof estoqueField === 'number' && Number.isFinite(estoqueField)) {
    return estoqueField;
  }
  if (typeof estoqueField === 'string') {
    const parsed = parseFloat(estoqueField);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (estoqueField && typeof estoqueField === 'object') {
    const disponivel = estoqueField.disponivel ?? estoqueField.estoque;
    return normalizeEstoque(disponivel);
  }
  return 0;
}

async function fetchProdutoCompleto(client, id) {
  try {
    const resp = await client.get(`/produtos/${id}`);
    return resp.data?.produto ?? resp.data;
  } catch (error) {
    console.error(`  ❌ Erro ao buscar produto ${id}:`, error.message);
    return null;
  }
}

async function run() {
  const env = readEnvLocal();
  const FACILZAP_TOKEN = env.FACILZAP_TOKEN;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;

  if (!FACILZAP_TOKEN || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
    console.error('❌ Variáveis faltando em .env.local');
    process.exit(1);
  }

  const client = axios.create({ 
    baseURL: 'https://api.facilzap.app.br', 
    timeout: 60000, 
    headers: { Authorization: `Bearer ${FACILZAP_TOKEN}` } 
  });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('🔄 Iniciando sincronização completa com variações...\n');

  let page = 1;
  const length = 50;
  let total = 0;

  while (true) {
    console.log(`📄 Buscando página ${page}...`);
    
    let resp;
    try {
      resp = await client.get(`/produtos?page=${page}&length=${length}`);
    } catch (err) {
      console.error('❌ Erro ao buscar página', page, err.message);
      break;
    }

    const data = resp.data;
    const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    
    if (!items || items.length === 0) {
      console.log('✅ Todas as páginas processadas!');
      break;
    }

    console.log(`   Encontrados ${items.length} produtos`);

    // Processar cada produto individualmente
    for (const item of items) {
      const id = String(item.id ?? item.codigo);
      
      // Buscar dados completos do produto
      const produto = await fetchProdutoCompleto(client, id);
      
      if (!produto) {
        console.log(`   ⏭️  Produto ${id} pulado (erro na API)`);
        continue;
      }

      const nome = produto.nome || 'Sem nome';
      const ativo = produto.ativado ?? produto.ativo ?? true;

      // Processar variações
      const variacoes = Array.isArray(produto.variacoes) ? produto.variacoes : [];
      const variacoes_meta = [];
      let estoqueTotal = 0;

      for (const v of variacoes) {
        const varId = String(v.id ?? v.codigo);
        const varSku = v.sku || null;
        const varNome = v.nome || v.name || null;
        const varEstoque = normalizeEstoque(v.estoque);
        
        estoqueTotal += varEstoque;

        variacoes_meta.push({
          id: varId,
          sku: varSku,
          nome: varNome,
          estoque: varEstoque,
          codigo_barras: null,
        });
      }

      // Se não tem variações, usar estoque do produto
      if (variacoes.length === 0) {
        estoqueTotal = normalizeEstoque(produto.estoque);
      }

      // Atualizar no banco
      const { error } = await supabase
        .from('produtos')
        .update({
          estoque: estoqueTotal,
          variacoes_meta,
          ativo: estoqueTotal > 0 ? ativo : false,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id_externo', id);

      if (error) {
        console.error(`   ❌ ${nome}: Erro ao atualizar -`, error.message);
      } else {
        const status = estoqueTotal > 0 ? '✅' : '⚪';
        console.log(`   ${status} ${nome}: ${estoqueTotal} un (${variacoes_meta.length} variações)`);
        total++;
      }

      // Aguardar 100ms para não sobrecarregar API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log();
    page++;
  }

  console.log(`\n🎉 Sincronização concluída! Total: ${total} produtos atualizados`);
}

run().catch(console.error);
