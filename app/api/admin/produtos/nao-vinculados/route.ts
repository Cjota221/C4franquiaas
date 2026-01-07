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
 * Retorna produtos ativos que NÃO estão vinculados a nenhuma revendedora
 * Útil para identificar produtos "órfãos" que precisam ser sincronizados
 */
export async function GET() {
  try {
    // 1. Buscar todos os produtos ativos
    const { data: produtosAtivos, error: errorProdutos } = await supabaseAdmin
      .from('produtos')
      .select('id, nome, preco_base, estoque, ativo, imagem, created_at')
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (errorProdutos) {
      console.error('Erro ao buscar produtos:', errorProdutos);
      throw errorProdutos;
    }

    // 2. Buscar todos os IDs de produtos que estão vinculados a pelo menos uma revendedora
    const { data: produtosVinculados, error: errorVinculados } = await supabaseAdmin
      .from('reseller_products')
      .select('product_id');

    if (errorVinculados) {
      console.error('Erro ao buscar produtos vinculados:', errorVinculados);
      throw errorVinculados;
    }

    // Criar Set de IDs vinculados (unique)
    const idsVinculados = new Set(produtosVinculados?.map(p => p.product_id) || []);

    // 3. Filtrar produtos que NÃO estão no Set de vinculados
    const produtosNaoVinculados = (produtosAtivos || []).filter(
      produto => !idsVinculados.has(produto.id)
    );

    // 4. Contar revendedoras ativas para referência
    const { count: totalRevendedoras } = await supabaseAdmin
      .from('resellers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    // 5. Estatísticas gerais
    const stats = {
      total_produtos_ativos: produtosAtivos?.length || 0,
      produtos_vinculados: idsVinculados.size,
      produtos_nao_vinculados: produtosNaoVinculados.length,
      total_revendedoras: totalRevendedoras || 0,
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
