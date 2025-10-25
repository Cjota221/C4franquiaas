/**
 * 📚 API: Catálogo Mestre de Produtos
 * 
 * Endpoint para fornecer a lista completa de produtos e estoques
 * para sincronização manual pelas franqueadas.
 * 
 * Rota: GET /api/public/master-catalog
 * 
 * @module public/master-catalog
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

// ============ CONFIGURAÇÃO ============

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============ HANDLER ============

export async function GET(request: NextRequest) {
  try {
    console.log('\n[public/master-catalog] 📚 Requisição de catálogo mestre');

    // ============ 1. VALIDAÇÃO DE SEGURANÇA (API Key ou Webhook Secret) ============
    
    const apiKey = request.headers.get('X-API-Key');
    const webhookSecret = request.headers.get('X-Webhook-Secret');
    const authorization = request.headers.get('Authorization');

    // Aceitar qualquer uma das três formas de autenticação
    const isAuthenticated = 
      apiKey === process.env.API_KEY ||
      webhookSecret === process.env.WEBHOOK_PRODUCT_SECRET ||
      authorization?.startsWith('Bearer ');

    if (!isAuthenticated) {
      console.error('[public/master-catalog] ❌ Não autorizado');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid API key or authentication required' },
        { status: 401 }
      );
    }

    // ============ 2. PARÂMETROS DE FILTRO (Opcional) ============

    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('only_active') === 'true';
    const categoriaId = searchParams.get('categoria_id');
    const limit = parseInt(searchParams.get('limit') || '1000', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    console.log('[public/master-catalog] 🔍 Parâmetros:');
    console.log(`[public/master-catalog]   Apenas ativos: ${onlyActive}`);
    console.log(`[public/master-catalog]   Categoria: ${categoriaId || 'Todas'}`);
    console.log(`[public/master-catalog]   Limit: ${limit}`);
    console.log(`[public/master-catalog]   Offset: ${offset}`);

    // ============ 3. CONEXÃO COM BANCO DE DADOS ============

    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('[public/master-catalog] ❌ Configuração Supabase ausente');
      return NextResponse.json(
        { error: 'Internal configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ============ 4. BUSCAR PRODUTOS ============

    let query = supabase
      .from('produtos')
      .select(`
        id,
        id_externo,
        codigo_barras,
        nome,
        preco_base,
        estoque,
        ativo,
        imagem,
        imagens,
        categoria_id,
        variacoes_meta,
        last_synced_at
      `)
      .order('nome', { ascending: true })
      .range(offset, offset + limit - 1);

    // Filtrar apenas produtos ativos (se solicitado)
    if (onlyActive) {
      query = query.eq('ativo', true);
    }

    // Filtrar por categoria (se solicitado)
    if (categoriaId) {
      query = query.eq('categoria_id', categoriaId);
    }

    const { data: produtos, error: produtosError, count } = await query;

    if (produtosError) {
      console.error('[public/master-catalog] ❌ Erro ao buscar produtos:', produtosError);
      return NextResponse.json(
        { error: 'Failed to fetch products', details: produtosError.message },
        { status: 500 }
      );
    }

    // ============ 5. TRANSFORMAR DADOS PARA FORMATO DE SINCRONIZAÇÃO ============

    const catalog = produtos?.map(produto => ({
      // Identificadores
      id: produto.id,
      id_externo: produto.id_externo,
      sku: produto.codigo_barras || produto.id_externo || produto.id,
      codigo_barras: produto.codigo_barras,

      // Dados principais
      nome: produto.nome,
      preco_base: produto.preco_base,
      estoque: produto.estoque,
      ativo: produto.ativo,

      // Imagens
      imagem: produto.imagem,
      imagens: produto.imagens,

      // Categoria
      categoria_id: produto.categoria_id,

      // Variações
      variacoes_meta: produto.variacoes_meta,

      // Metadados
      last_synced_at: produto.last_synced_at,
    })) || [];

    console.log(`[public/master-catalog] ✅ Retornando ${catalog.length} produtos`);

    // ============ 6. RETORNAR CATÁLOGO ============

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total: count || catalog.length,
      limit,
      offset,
      produtos: catalog,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[public/master-catalog] ❌ Erro no processamento:', errorMessage);
    
    return NextResponse.json(
      { error: 'Failed to generate catalog', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============ MÉTODOS NÃO PERMITIDOS ============

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'This endpoint only accepts GET requests' },
    { status: 405 }
  );
}
