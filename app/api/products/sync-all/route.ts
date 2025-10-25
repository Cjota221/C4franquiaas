/**
 * 🔄 API: Sincronização em Lote de Produtos
 * 
 * Endpoint para receber e processar sincronização completa
 * do catálogo mestre (enviado pelo botão "Sincronizar Catálogo").
 * 
 * Rota: POST /api/products/sync-all
 * 
 * @module products/sync-all
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

// ============ TIPOS ============

interface ProductToSync {
  id: string;
  id_externo?: string | null;
  sku?: string | null;
  codigo_barras?: string | null;
  nome: string;
  preco_base: number;
  estoque: number;
  ativo: boolean;
  imagem?: string | null;
  imagens?: string[] | null;
  categoria_id?: string | null;
  variacoes_meta?: unknown[] | null;
  last_synced_at?: string | null;
}

interface SyncRequest {
  produtos: ProductToSync[];
  mode?: 'update_only' | 'create_and_update'; // Modo de sincronização
}

interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  details: Array<{
    sku: string;
    action: 'created' | 'updated' | 'skipped' | 'error';
    message?: string;
  }>;
}

// ============ CONFIGURAÇÃO ============

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============ HANDLER ============

export async function POST(request: NextRequest) {
  try {
    console.log('\n[products/sync-all] 🔄 Iniciando sincronização em lote');

    // ============ 1. PARSE DO PAYLOAD ============

    const payload: SyncRequest = await request.json();
    const mode = payload.mode || 'create_and_update';

    console.log(`[products/sync-all] 📦 Produtos recebidos: ${payload.produtos.length}`);
    console.log(`[products/sync-all] 🔧 Modo: ${mode}`);

    if (!payload.produtos || !Array.isArray(payload.produtos)) {
      return NextResponse.json(
        { error: 'Invalid payload', message: 'produtos array is required' },
        { status: 400 }
      );
    }

    // ============ 2. CONEXÃO COM BANCO DE DADOS ============

    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('[products/sync-all] ❌ Configuração Supabase ausente');
      return NextResponse.json(
        { error: 'Internal configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ============ 3. PROCESSAR CADA PRODUTO ============

    const result: SyncResult = {
      total: payload.produtos.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [],
    };

    console.log('[products/sync-all] 🔄 Processando produtos...\n');

    for (const produto of payload.produtos) {
      const sku = produto.sku || produto.codigo_barras || produto.id_externo || produto.id;

      try {
        console.log(`[products/sync-all] 📦 Processando: ${produto.nome} (${sku})`);

        // Buscar produto existente
        const { data: existingProduct } = await supabase
          .from('produtos')
          .select('id')
          .or(`codigo_barras.eq.${sku},id_externo.eq.${sku},id.eq.${produto.id}`)
          .limit(1)
          .single();

        if (existingProduct) {
          // ♻️ PRODUTO JÁ EXISTE - UPDATE
          console.log(`[products/sync-all]   ♻️ Atualizando produto existente (ID: ${existingProduct.id})`);

          const { error: updateError } = await supabase
            .from('produtos')
            .update({
              nome: produto.nome,
              preco_base: produto.preco_base,
              estoque: produto.estoque,
              // NÃO atualizar o campo 'ativo' - preservar escolha da franqueada
              imagem: produto.imagem,
              imagens: produto.imagens,
              categoria_id: produto.categoria_id,
              variacoes_meta: produto.variacoes_meta,
              last_synced_at: new Date().toISOString(),
            })
            .eq('id', existingProduct.id);

          if (updateError) {
            console.error(`[products/sync-all]   ❌ Erro ao atualizar:`, updateError.message);
            result.errors++;
            result.details.push({
              sku,
              action: 'error',
              message: `Update failed: ${updateError.message}`,
            });
          } else {
            console.log(`[products/sync-all]   ✅ Atualizado com sucesso`);
            result.updated++;
            result.details.push({
              sku,
              action: 'updated',
            });
          }

        } else if (mode === 'create_and_update') {
          // ✨ PRODUTO NOVO - INSERT
          console.log(`[products/sync-all]   ✨ Criando novo produto`);

          const { error: insertError } = await supabase
            .from('produtos')
            .insert({
              id_externo: produto.id_externo,
              codigo_barras: produto.codigo_barras,
              nome: produto.nome,
              preco_base: produto.preco_base,
              estoque: produto.estoque,
              ativo: false, // 🔒 Criar desativado por padrão
              imagem: produto.imagem,
              imagens: produto.imagens,
              categoria_id: produto.categoria_id,
              variacoes_meta: produto.variacoes_meta,
              last_synced_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error(`[products/sync-all]   ❌ Erro ao criar:`, insertError.message);
            result.errors++;
            result.details.push({
              sku,
              action: 'error',
              message: `Insert failed: ${insertError.message}`,
            });
          } else {
            console.log(`[products/sync-all]   ✅ Criado com sucesso (desativado)`);
            result.created++;
            result.details.push({
              sku,
              action: 'created',
              message: 'Created as inactive, requires manual activation',
            });
          }

        } else {
          // ⏭️ MODO UPDATE_ONLY - Pular produtos novos
          console.log(`[products/sync-all]   ⏭️ Produto não encontrado, pulando (modo update_only)`);
          result.skipped++;
          result.details.push({
            sku,
            action: 'skipped',
            message: 'Product not found (update_only mode)',
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[products/sync-all]   ❌ Erro ao processar:`, errorMessage);
        result.errors++;
        result.details.push({
          sku,
          action: 'error',
          message: errorMessage,
        });
      }
    }

    // ============ 4. RESUMO E RETORNO ============

    console.log('\n[products/sync-all] 📊 RESUMO DA SINCRONIZAÇÃO:');
    console.log(`[products/sync-all]   Total: ${result.total}`);
    console.log(`[products/sync-all]   ✅ Atualizados: ${result.updated}`);
    console.log(`[products/sync-all]   ✨ Criados: ${result.created}`);
    console.log(`[products/sync-all]   ⏭️ Pulados: ${result.skipped}`);
    console.log(`[products/sync-all]   ❌ Erros: ${result.errors}\n`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[products/sync-all] ❌ Erro fatal:', errorMessage);
    
    return NextResponse.json(
      { error: 'Sync failed', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============ MÉTODOS NÃO PERMITIDOS ============

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'This endpoint only accepts POST requests' },
    { status: 405 }
  );
}
