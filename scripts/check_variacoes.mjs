#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rprucmoavblepodvanga.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcnVjbW9hdmJsZXBvZHZhbmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIxMzMyNywiZXhwIjoyMDc1Nzg5MzI3fQ.m2lfjTYPb4nHrge17kYmL1Gny8zrnOV5jzrZvn7Ib24'
);

async function checkVariacoes() {
  console.log('🔍 Verificando produtos no banco...\n');
  
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, codigo_barras, variacoes_meta')
    .limit(5);
  
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log(`📦 Encontrados ${data.length} produtos:\n`);
  
  data.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.nome}`);
    console.log(`   ID: ${p.id}`);
    console.log(`   Código de barras: ${p.codigo_barras || 'NENHUM'}`);
    console.log(`   Variações: ${p.variacoes_meta ? JSON.stringify(p.variacoes_meta, null, 2) : 'NENHUMA'}`);
    console.log('');
  });
}

checkVariacoes().catch(console.error);
