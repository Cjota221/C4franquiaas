import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { fetchAllProdutosFacilZap } from '@/lib/facilzapClient';

/**
 * 🧪 Endpoint de TESTE para verificar sincronização
 * Acesse: https://c4franquiaas.netlify.app/api/test-sync
 */
export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ 
      error: 'Configuração do Supabase faltando' 
    }, { status: 500 });
  }

  try {
    // 1️⃣ Buscar produtos do FácilZap
    console.log('🔍 Buscando produtos do FácilZap...');
    const { produtos, pages } = await fetchAllProdutosFacilZap();
    
    console.log(`✅ Recebidos ${produtos.length} produtos em ${pages} páginas`);

    // 2️⃣ Mostrar os primeiros 5 produtos com estoque
    const primeiros5 = produtos.slice(0, 5).map(p => ({
      id_externo: p.id_externo,
      nome: p.nome,
      estoque: p.estoque,
      ativo: p.ativo,
    }));

    // 3️⃣ Verificar no banco quantos produtos existem
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { count, error } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erro ao contar produtos no banco:', error);
    }

    // 4️⃣ Comparar estoque de um produto específico
    const primeiroId = produtos[0]?.id_externo;
    let produtoBanco = null;

    if (primeiroId) {
      const { data } = await supabase
        .from('produtos')
        .select('id, nome, estoque, ultima_sincronizacao')
        .eq('id_externo', primeiroId)
        .single();
      
      produtoBanco = data;
    }

    return NextResponse.json({
      success: true,
      facilzap: {
        total_produtos: produtos.length,
        total_paginas: pages,
        primeiros_5: primeiros5,
      },
      banco: {
        total_produtos: count,
        produto_exemplo: produtoBanco,
      },
      comparacao: {
        facilzap_produto_1: produtos[0] ? {
          nome: produtos[0].nome,
          estoque: produtos[0].estoque,
        } : null,
        banco_produto_1: produtoBanco,
        estoque_diferente: produtoBanco && produtos[0] ? 
          produtoBanco.estoque !== produtos[0].estoque : false,
      }
    }, { status: 200 });

  } catch (err) {
    console.error('❌ Erro no teste:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : String(err) 
    }, { status: 500 });
  }
}
