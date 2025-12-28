import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import axios from 'axios';

// Rota otimizada para sincronização rápida de estoque via CRON
// Busca apenas estoque dos produtos existentes - executa em menos de 30s

export async function GET() {
  return handleSyncEstoque();
}

export async function POST() {
  return handleSyncEstoque();
}

async function handleSyncEstoque() {
  const startTime = Date.now();
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const FACILZAP_TOKEN = process.env.FACILZAP_TOKEN;
  
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
  }
  
  if (!FACILZAP_TOKEN) {
    return NextResponse.json({ error: 'FacilZap token missing' }, { status: 500 });
  }
  
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  try {
    // 1. Buscar produtos existentes no banco (apenas id_externo e estoque)
    const { data: produtos, error: prodError } = await supabase
      .from('produtos')
      .select('id, id_externo, estoque, nome')
      .not('id_externo', 'is', null)
      .limit(200);
    
    if (prodError) {
      throw new Error(`Erro ao buscar produtos: ${prodError.message}`);
    }
    
    if (!produtos || produtos.length === 0) {
      return NextResponse.json({ ok: true, updated: 0, message: 'Nenhum produto para sincronizar' });
    }
    
    // 2. Buscar estoque do FacilZap (100 produtos por página)
    const client = axios.create({
      baseURL: 'https://api.facilzap.app.br',
      timeout: 20000,
      headers: {
        'Authorization': `Bearer ${FACILZAP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    const response = await client.get('/v1/produtos', {
      params: { page: 1, length: 100 }
    });
    
    const facilzapProdutos = response.data?.data || response.data?.produtos || [];
    
    if (!facilzapProdutos.length) {
      return NextResponse.json({ ok: true, updated: 0, message: 'Nenhum produto no FacilZap' });
    }
    
    // 3. Criar mapa de estoque do FacilZap
    const estoqueMap = new Map<string, number>();
    
    for (const prod of facilzapProdutos) {
      const idExterno = String(prod.id || prod.codigo || '');
      if (!idExterno) continue;
      
      let estoqueTotal = 0;
      
      if (prod.variacoes && Array.isArray(prod.variacoes)) {
        for (const v of prod.variacoes) {
          const est = v.estoque?.estoque ?? v.estoque ?? 0;
          estoqueTotal += Number(est) || 0;
        }
      } else {
        const est = prod.estoque?.disponivel ?? prod.estoque?.estoque ?? prod.estoque ?? 0;
        estoqueTotal = Number(est) || 0;
      }
      
      estoqueMap.set(idExterno, estoqueTotal);
    }
    
    // 4. Atualizar apenas produtos com estoque diferente
    let updated = 0;
    
    for (const prod of produtos) {
      const novoEstoque = estoqueMap.get(prod.id_externo);
      
      if (novoEstoque !== undefined && novoEstoque !== prod.estoque) {
        await supabase
          .from('produtos')
          .update({ estoque: novoEstoque, updated_at: new Date().toISOString() })
          .eq('id', prod.id);
        
        updated++;
      }
    }
    
    const duration = Date.now() - startTime;
    
    // 5. Log rápido (ignorar erros)
    try {
      await supabase.from('logs_sincronizacao').insert({
        tipo: 'cron_estoque',
        descricao: `${updated} atualizados em ${duration}ms`,
        sucesso: true,
      });
    } catch {
      // Ignorar erro de log
    }
    
    return NextResponse.json({
      ok: true,
      updated,
      checked: produtos.length,
      duration: `${duration}ms`
    });
    
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
