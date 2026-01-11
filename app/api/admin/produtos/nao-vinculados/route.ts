import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * GET /api/admin/produtos/nao-vinculados
 * 
 * Retorna produtos ativos que NÃO estão vinculados a TODAS as revendedoras ativas/aprovadas
 * 
 * Definição de "não vinculado":
 * - Produto com ativo=true no admin
 * - Que NÃO possui registro em reseller_products para pelo menos uma revendedora ativa/aprovada
 * 
 * Ou seja: se há 5 revendedoras ativas e o produto só está vinculado a 3, ele é "parcialmente vinculado"
 * e aparece na lista para ser corrigido
 */
export async function GET() {
  try {
    // 1. Buscar revendedoras ativas/aprovadas
    const { data: revendedorasAtivas, error: errorRevendedoras } = await supabaseAdmin
      .from('resellers')
      .select('id')
      .eq('status', 'aprovada')
      .eq('is_active', true);

    if (errorRevendedoras) {
      console.error('Erro ao buscar revendedoras:', errorRevendedoras);
      throw errorRevendedoras;
    }

    const totalRevendedorasAtivas = revendedorasAtivas?.length || 0;
    const idsRevendedorasAtivas = new Set(revendedorasAtivas?.map(r => r.id) || []);

    // Se não há revendedoras ativas, não há como ter produtos "não vinculados"
    if (totalRevendedorasAtivas === 0) {
      return NextResponse.json({
        success: true,
        produtos: [],
        stats: {
          total_produtos_ativos: 0,
          produtos_vinculados: 0,
          produtos_nao_vinculados: 0,
          total_revendedoras: 0,
        },
        mensagem: 'Nenhuma revendedora ativa/aprovada encontrada',
      });
    }

    // 2. Buscar todos os produtos ativos
    const { data: produtosAtivos, error: errorProdutos } = await supabaseAdmin
      .from('produtos')
      .select('id, nome, preco_base, estoque, ativo, imagem, created_at')
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (errorProdutos) {
      console.error('Erro ao buscar produtos:', errorProdutos);
      throw errorProdutos;
    }

    if (!produtosAtivos || produtosAtivos.length === 0) {
      return NextResponse.json({
        success: true,
        produtos: [],
        stats: {
          total_produtos_ativos: 0,
          produtos_vinculados: 0,
          produtos_nao_vinculados: 0,
          total_revendedoras: totalRevendedorasAtivas,
        },
      });
    }

    // 3. Buscar TODAS as vinculações existentes (para revendedoras ativas)
    const { data: vinculacoes, error: errorVinculacoes } = await supabaseAdmin
      .from('reseller_products')
      .select('product_id, reseller_id');

    if (errorVinculacoes) {
      console.error('Erro ao buscar vinculações:', errorVinculacoes);
      throw errorVinculacoes;
    }

    // 4. Criar mapa: produto_id -> Set de reseller_ids vinculados (apenas de revendedoras ativas)
    const vinculacoesPorProduto = new Map<string, Set<string>>();
    vinculacoes?.forEach(v => {
      // Só conta se a revendedora ainda está ativa
      if (idsRevendedorasAtivas.has(v.reseller_id)) {
        if (!vinculacoesPorProduto.has(v.product_id)) {
          vinculacoesPorProduto.set(v.product_id, new Set());
        }
        vinculacoesPorProduto.get(v.product_id)!.add(v.reseller_id);
      }
    });

    // 5. Filtrar produtos que NÃO estão vinculados a TODAS as revendedoras ativas
    const produtosNaoVinculados: typeof produtosAtivos = [];
    const produtosVinculados: typeof produtosAtivos = [];

    for (const produto of produtosAtivos) {
      const revendedorasVinculadas = vinculacoesPorProduto.get(produto.id);
      const quantasVinculadas = revendedorasVinculadas?.size || 0;
      
      if (quantasVinculadas < totalRevendedorasAtivas) {
        // Produto não está vinculado a todas revendedoras
        produtosNaoVinculados.push({
          ...produto,
          // Adiciona info de quantas faltam vincular
          _vinculacoes_faltando: totalRevendedorasAtivas - quantasVinculadas,
          _vinculacoes_existentes: quantasVinculadas,
        } as typeof produto);
      } else {
        produtosVinculados.push(produto);
      }
    }

    // 6. Estatísticas
    const stats = {
      total_produtos_ativos: produtosAtivos.length,
      produtos_vinculados: produtosVinculados.length,
      produtos_nao_vinculados: produtosNaoVinculados.length,
      total_revendedoras: totalRevendedorasAtivas,
    };

    return NextResponse.json({
      success: true,
      produtos: produtosNaoVinculados,
      stats,
    });

  } catch (error) {
    console.error('Erro ao buscar produtos não vinculados:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}
