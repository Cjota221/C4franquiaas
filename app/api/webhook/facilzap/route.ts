import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com service role para operações administrativas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Chave secreta para validar requisições do FácilZap
const FACILZAP_WEBHOOK_SECRET = process.env.FACILZAP_WEBHOOK_SECRET || '';

// Tipos de eventos suportados
type EventType = 'produto_criado' | 'produto_atualizado' | 'estoque_atualizado';

interface WebhookPayload {
  event: EventType;
  produto_id: string; // ID do produto no FácilZap
  data: {
    nome?: string;
    preco?: number;
    estoque?: number;
    imagem?: string;
    ativo?: boolean;
    sku?: string;
    descricao?: string;
  };
  timestamp?: string;
}

/**
 * POST /api/webhook/facilzap
 * Endpoint para receber eventos de webhook do FácilZap
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validação de segurança
    const webhookSecret = request.headers.get('x-facilzap-signature');
    
    if (FACILZAP_WEBHOOK_SECRET && webhookSecret !== FACILZAP_WEBHOOK_SECRET) {
      console.error('❌ Webhook: Assinatura inválida');
      return NextResponse.json(
        { error: 'Unauthorized: Invalid signature' },
        { status: 401 }
      );
    }

    // 2. Parse do payload
    const payload: WebhookPayload = await request.json();
    
    console.log('📥 Webhook recebido:', {
      event: payload.event,
      produto_id: payload.produto_id,
      timestamp: payload.timestamp || new Date().toISOString()
    });

    // 3. Validação do payload
    if (!payload.event || !payload.produto_id || !payload.data) {
      console.error('❌ Payload inválido:', payload);
      return NextResponse.json(
        { error: 'Invalid payload: missing required fields' },
        { status: 400 }
      );
    }

    // 4. Processar evento baseado no tipo
    let result;
    
    switch (payload.event) {
      case 'produto_criado':
        result = await handleProdutoCriado(payload);
        break;
      
      case 'produto_atualizado':
        result = await handleProdutoAtualizado(payload);
        break;
      
      case 'estoque_atualizado':
        result = await handleEstoqueAtualizado(payload);
        break;
      
      default:
        console.warn('⚠️ Evento não suportado:', payload.event);
        return NextResponse.json(
          { error: 'Unsupported event type' },
          { status: 400 }
        );
    }

    // 5. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: `Evento ${payload.event} processado com sucesso`,
      result
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handler para evento de produto criado
 */
async function handleProdutoCriado(payload: WebhookPayload) {
  const { produto_id, data } = payload;

  console.log('➕ Criando novo produto:', produto_id);

  // Verificar se produto já existe
  const { data: produtoExistente } = await supabaseAdmin
    .from('produtos')
    .select('id')
    .eq('facilzap_id', produto_id)
    .maybeSingle();

  if (produtoExistente) {
    console.log('⚠️ Produto já existe, atualizando:', produto_id);
    return handleProdutoAtualizado(payload);
  }

  // Criar novo produto
  const { data: novoProduto, error } = await supabaseAdmin
    .from('produtos')
    .insert({
      facilzap_id: produto_id,
      nome: data.nome || 'Produto sem nome',
      preco_base: data.preco || 0,
      estoque: data.estoque || 0,
      imagem: data.imagem || null,
      ativo: data.ativo !== false, // Ativo por padrão
      sku: data.sku || null,
      descricao: data.descricao || null,
      categorias: 'Geral',
      sincronizado_facilzap: true,
      ultima_sincronizacao: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar produto:', error);
    throw error;
  }

  console.log('✅ Produto criado com sucesso:', novoProduto.id);

  return {
    produto_id: novoProduto.id,
    action: 'created'
  };
}

/**
 * Handler para evento de produto atualizado
 */
async function handleProdutoAtualizado(payload: WebhookPayload) {
  const { produto_id, data } = payload;

  console.log('🔄 Atualizando produto:', produto_id);

  // Buscar produto pelo facilzap_id
  const { data: produto } = await supabaseAdmin
    .from('produtos')
    .select('id, estoque')
    .eq('facilzap_id', produto_id)
    .maybeSingle();

  if (!produto) {
    console.error('❌ Produto não encontrado:', produto_id);
    throw new Error(`Produto não encontrado: ${produto_id}`);
  }

  // Preparar dados de atualização
  const updateData: Record<string, unknown> = {
    ultima_sincronizacao: new Date().toISOString()
  };

  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.preco !== undefined) updateData.preco_base = data.preco;
  if (data.estoque !== undefined) updateData.estoque = data.estoque;
  if (data.imagem !== undefined) updateData.imagem = data.imagem;
  if (data.ativo !== undefined) updateData.ativo = data.ativo;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.descricao !== undefined) updateData.descricao = data.descricao;

  // Atualizar produto
  const { error } = await supabaseAdmin
    .from('produtos')
    .update(updateData)
    .eq('id', produto.id);

  if (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    throw error;
  }

  console.log('✅ Produto atualizado com sucesso:', produto.id);

  // Se o estoque foi atualizado para zero, desativar em franqueadas/revendedoras
  if (data.estoque !== undefined && data.estoque === 0) {
    await desativarProdutoEstoqueZero(produto.id);
  }

  return {
    produto_id: produto.id,
    action: 'updated',
    fields_updated: Object.keys(updateData)
  };
}

/**
 * Handler para evento de estoque atualizado (mais frequente)
 */
async function handleEstoqueAtualizado(payload: WebhookPayload) {
  const { produto_id, data } = payload;

  console.log('📦 Atualizando estoque:', produto_id, '→', data.estoque);

  if (data.estoque === undefined) {
    throw new Error('Estoque não informado no payload');
  }

  // Buscar produto pelo facilzap_id
  const { data: produto } = await supabaseAdmin
    .from('produtos')
    .select('id')
    .eq('facilzap_id', produto_id)
    .maybeSingle();

  if (!produto) {
    console.error('❌ Produto não encontrado:', produto_id);
    throw new Error(`Produto não encontrado: ${produto_id}`);
  }

  // Atualizar apenas o estoque
  const { error } = await supabaseAdmin
    .from('produtos')
    .update({
      estoque: data.estoque,
      ultima_sincronizacao: new Date().toISOString()
    })
    .eq('id', produto.id);

  if (error) {
    console.error('❌ Erro ao atualizar estoque:', error);
    throw error;
  }

  console.log('✅ Estoque atualizado com sucesso:', produto.id);

  // REGRA CRÍTICA: Se estoque zerou, desativar produto em franqueadas/revendedoras
  if (data.estoque === 0) {
    await desativarProdutoEstoqueZero(produto.id);
  }

  return {
    produto_id: produto.id,
    action: 'stock_updated',
    novo_estoque: data.estoque
  };
}

/**
 * Desativa produto em todas as franqueadas e revendedoras quando estoque zera
 * REGRA DE NEGÓCIO CRÍTICA
 */
async function desativarProdutoEstoqueZero(produtoId: string) {
  console.log('🚫 Estoque zerado! Desativando produto em franqueadas/revendedoras:', produtoId);

  try {
    // 1. Desativar em produtos_franqueadas_precos
    // Primeiro buscar os IDs de produtos_franqueadas vinculados a este produto
    const { data: vinculacoesFranqueadas } = await supabaseAdmin
      .from('produtos_franqueadas')
      .select('id')
      .eq('produto_id', produtoId);

    if (vinculacoesFranqueadas && vinculacoesFranqueadas.length > 0) {
      const produtoFranqueadaIds = vinculacoesFranqueadas.map(v => v.id);
      
      const { error: errorFranqueadas } = await supabaseAdmin
        .from('produtos_franqueadas_precos')
        .update({ ativo_no_site: false })
        .in('produto_franqueada_id', produtoFranqueadaIds);

      if (errorFranqueadas) {
        console.error('❌ Erro ao desativar em franqueadas:', errorFranqueadas);
      } else {
        console.log(`✅ Produto desativado em ${vinculacoesFranqueadas.length} franqueadas`);
      }
    }

    // 2. Desativar em reseller_products
    const { error: errorRevendedoras } = await supabaseAdmin
      .from('reseller_products')
      .update({ is_active: false })
      .eq('product_id', produtoId);

    if (errorRevendedoras) {
      console.error('❌ Erro ao desativar em revendedoras:', errorRevendedoras);
    } else {
      console.log('✅ Produto desativado em revendedoras');
    }

    // 3. Registrar log da desativação automática
    await supabaseAdmin
      .from('logs_sincronizacao')
      .insert({
        tipo: 'estoque_zerado',
        produto_id: produtoId,
        descricao: 'Produto desativado automaticamente por estoque zero',
        timestamp: new Date().toISOString()
      });

    console.log('✅ Produto desativado em todos os painéis');

  } catch (error) {
    console.error('❌ Erro ao desativar produto:', error);
    // Não lançar erro aqui para não falhar o webhook
  }
}

/**
 * GET /api/webhook/facilzap
 * Endpoint de verificação/teste
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'FácilZap Webhook Endpoint',
    supported_events: [
      'produto_criado',
      'produto_atualizado',
      'estoque_atualizado'
    ],
    docs: 'https://docs.c4franquias.com.br/webhook/facilzap'
  });
}
