#!/usr/bin/env node
import axios from 'axios';

const FACILZAP_TOKEN = '18984rMrQ2EXmMU5c0kicGm7DWhXtvliihjQxTHGP0cT6RLKwiUEEJvM7wTlReisezpDnX5JdJpRqi9zxR7Qq';
const SUPABASE_URL = 'https://rprucmoavblepodvanga.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcnVjbW9hdmJsZXBvZHZhbmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIxMzMyNywiZXhwIjoyMDc1Nzg5MzI3fQ.m2lfjTYPb4nHrge17kYmL1Gny8zrnOV5jzrZvn7Ib24';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testProductAPI() {
  const id = '3420761';
  console.log(`🔍 Testando busca do produto ${id}...\n`);

  // 1. Verificar se existe no banco
  console.log('1️⃣ Buscando no Supabase...');
  
  // Verificar se é UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  console.log(`   ID tipo: ${isUUID ? 'UUID' : 'ID Externo (numérico)'}`);
  
  let query = supabase.from('produtos').select('*');
  
  if (isUUID) {
    query = query.or(`id.eq.${id},id_externo.eq.${id}`);
  } else {
    query = query.eq('id_externo', id);
  }
  
  const { data, error } = await query.limit(1);

  if (error) {
    console.error('❌ Erro no Supabase:', error);
    return;
  }

  const produtoDoBanco = Array.isArray(data) && data.length > 0 ? data[0] : null;
  
  if (produtoDoBanco) {
    console.log('✅ Produto encontrado no banco:');
    console.log('   ID:', produtoDoBanco.id);
    console.log('   ID Externo:', produtoDoBanco.id_externo);
    console.log('   Nome:', produtoDoBanco.nome);
  } else {
    console.log('⚠️ Produto NÃO encontrado no banco');
  }

  // 2. Buscar na API FácilZap
  console.log('\n2️⃣ Buscando na API FácilZap...');
  const idExterno = produtoDoBanco?.id_externo ?? id;
  
  try {
    const client = axios.create({
      baseURL: 'https://api.facilzap.app.br',
      timeout: 10000,
      headers: { Authorization: `Bearer ${FACILZAP_TOKEN}` }
    });
    
    const resp = await client.get(`/produtos/${idExterno}`);
    console.log('✅ Produto encontrado na FácilZap:');
    console.log('   ID:', resp.data.id);
    console.log('   Nome:', resp.data.nome);
    console.log('   Variações:', resp.data.variacoes?.length || 0);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('❌ Erro na FácilZap:', err.response?.status, err.response?.data);
    } else {
      console.error('❌ Erro:', err);
    }
  }

  // 3. Testar o endpoint local
  console.log('\n3️⃣ Testando endpoint da aplicação (localhost:3000)...');
  try {
    const localResp = await axios.get(`http://localhost:3000/api/produtos/${id}`);
    console.log('✅ Endpoint respondeu com sucesso:', localResp.status);
    console.log('   Dados:', JSON.stringify(localResp.data, null, 2).substring(0, 500));
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('❌ Erro no endpoint:', err.response?.status);
      console.error('   Resposta:', JSON.stringify(err.response?.data, null, 2));
    } else {
      console.error('❌ Erro:', err);
    }
  }
}

testProductAPI().catch(console.error);
