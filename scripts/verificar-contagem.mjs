#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Ler .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 Verificando contagem de produtos...\n');

// Buscar TODOS os produtos
const { data: allProducts, error, count } = await supabase
  .from('produtos')
  .select('id, nome, ativo', { count: 'exact' });

if (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

console.log(`📊 Total de produtos na tabela: ${count}`);
console.log(`   - Ativos (ativo=true): ${allProducts.filter(p => p.ativo).length}`);
console.log(`   - Inativos (ativo=false): ${allProducts.filter(p => !p.ativo).length}`);

console.log('\n✅ Primeiros 10 produtos:');
allProducts.slice(0, 10).forEach((p, i) => {
  console.log(`   ${i+1}. ${p.nome} - ativo:${p.ativo}`);
});
