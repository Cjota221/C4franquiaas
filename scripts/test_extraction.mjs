#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const SUPABASE_URL = 'https://rprucmoavblepodvanga.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcnVjbW9hdmJsZXBvZHZhbmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIxMzMyNywiZXhwIjoyMDc1Nzg5MzI3fQ.m2lfjTYPb4nHrge17kYmL1Gny8zrnOV5jzrZvn7Ib24';
const FACILZAP_TOKEN = process.argv[2] || '18984rMrQ2EXmMU5c0kicGm7DWhXtvliihjQxTHGP0cT6RLKwiUEEJvM7wTlReisezpDnX5JdJpRqi9zxR7Qq';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Ativar DEBUG_SYNC temporariamente
process.env.DEBUG_SYNC = 'true';

// Importar a função do facilzapClient
import { fetchProdutoFacilZapById } from '../lib/facilzapClient.ts';

async function testExtraction() {
  console.log('🔍 Testando extração de código de barras...\n');
  
  // Buscar produto da API
  const produtoApi = await fetchProdutoFacilZapById('3469603');
  
  if (!produtoApi) {
    console.error('❌ Não foi possível buscar o produto da API');
    return;
  }
  
  console.log('\n✅ Produto recebido do facilzapClient:');
  console.log('ID:', produtoApi.id);
  console.log('Nome:', produtoApi.nome);
  console.log('cod_barras:', produtoApi.cod_barras);
  console.log('Variações:', produtoApi.variacoes);
}

testExtraction().catch(console.error);
