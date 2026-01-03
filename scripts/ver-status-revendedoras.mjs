#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Ler .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Verificando status das revendedoras...\n');

const { data: revendedoras, error } = await supabase
  .from('resellers')
  .select('id, store_name, slug, status')
  .order('store_name');

if (error) {
  console.error('Erro:', error);
  process.exit(1);
}

console.log(`Total de revendedoras: ${revendedoras?.length || 0}\n`);

// Agrupar por status
const porStatus = {};
for (const r of revendedoras || []) {
  const status = r.status || 'null';
  if (!porStatus[status]) porStatus[status] = [];
  porStatus[status].push(r);
}

console.log('📊 Revendedoras por status:\n');
for (const [status, lista] of Object.entries(porStatus)) {
  console.log(`   ${status}: ${lista.length}`);
  if (lista.length <= 5) {
    for (const r of lista) {
      console.log(`      - ${r.store_name} (${r.slug})`);
    }
  }
}

console.log('\n✨ Análise concluída!\n');
