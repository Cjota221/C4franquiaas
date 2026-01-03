import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  return sincronizarVinculos(false);
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const executar = searchParams.get('executar') === 'true';
  
  return sincronizarVinculos(executar);
}

async function sincronizarVinculos(executar: boolean) {
  try {
    const resultado = {
      modo: executar ? 'execucao' : 'preview',
      timestamp: new Date().toISOString(),
      analise: {
        total_revendedoras: 0,
        total_produtos_ativos_master: 0,
        problemas_encontrados: 0,
      },
      revendedoras: [] as Array<{
        id: string;
        store_name: string;
        slug: string;
        vinculos_totais: number;
        vinculos_ativos: number;
        vinculos_orfaos: number;
        produtos_faltantes: number;
        detalhes: string[];
      }>,
      acoes_realizadas: executar ? {
        vinculos_desativados: 0,
        vinculos_criados: 0,
      } : null,
    };

    // 1. Contar produtos ativos no master
    const { count: totalProdutosAtivos } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    resultado.analise.total_produtos_ativos_master = totalProdutosAtivos || 0;

    // 2. Buscar todas as revendedoras ativas
    const { data: revendedoras, error: revendedorasError } = await supabase
      .from('resellers')
      .select('id, store_name, slug')
      .eq('status', 'aprovada')
      .order('store_name');

    if (revendedorasError) throw revendedorasError;

    resultado.analise.total_revendedoras = revendedoras?.length || 0;

    // 3. Para cada revendedora, analisar vínculos
    for (const revendedora of revendedoras || []) {
      const analiseRevendedora = {
        id: revendedora.id,
        store_name: revendedora.store_name,
        slug: revendedora.slug,
        vinculos_totais: 0,
        vinculos_ativos: 0,
        vinculos_orfaos: 0,
        produtos_faltantes: 0,
        detalhes: [] as string[],
      };

      // 3.1. Contar vínculos totais e ativos
      const { data: vinculos } = await supabase
        .from('reseller_products')
        .select('product_id, is_active, margin_percent')
        .eq('reseller_id', revendedora.id);

      analiseRevendedora.vinculos_totais = vinculos?.length || 0;
      analiseRevendedora.vinculos_ativos = vinculos?.filter(v => v.is_active).length || 0;

      // 3.2. Encontrar vínculos órfãos (produto vinculado mas inativo no master)
      const produtoIds = vinculos?.map(v => v.product_id) || [];
      
      if (produtoIds.length > 0) {
        const { data: produtosVinculados } = await supabase
          .from('produtos')
          .select('id, nome, ativo')
          .in('id', produtoIds);

        const produtosInativos = produtosVinculados?.filter(p => !p.ativo) || [];
        const vinculosOrfaos = vinculos?.filter(v => 
          v.is_active && produtosInativos.some(p => p.id === v.product_id)
        ) || [];

        analiseRevendedora.vinculos_orfaos = vinculosOrfaos.length;

        if (vinculosOrfaos.length > 0) {
          analiseRevendedora.detalhes.push(
            `🔴 ${vinculosOrfaos.length} vínculo(s) ativo(s) mas produto inativo no master`
          );

          // EXECUTAR: Desativar vínculos órfãos
          if (executar) {
            const idsParaDesativar = vinculosOrfaos.map(v => v.product_id);
            
            const { error: updateError } = await supabase
              .from('reseller_products')
              .update({ is_active: false, updated_at: new Date().toISOString() })
              .eq('reseller_id', revendedora.id)
              .in('product_id', idsParaDesativar);

            if (!updateError) {
              resultado.acoes_realizadas!.vinculos_desativados += vinculosOrfaos.length;
              analiseRevendedora.detalhes.push(
                `✅ ${vinculosOrfaos.length} vínculo(s) órfão(s) desativado(s)`
              );
            }
          }
        }
      }

      // 3.3. Encontrar produtos faltantes (ativos no master mas não vinculados)
      const { data: todosProdutosAtivos } = await supabase
        .from('produtos')
        .select('id')
        .eq('ativo', true);

      const idsAtivos = todosProdutosAtivos?.map(p => p.id) || [];
      const idsVinculados = vinculos?.map(v => v.product_id) || [];
      const idsFaltantes = idsAtivos.filter(id => !idsVinculados.includes(id));

      analiseRevendedora.produtos_faltantes = idsFaltantes.length;

      if (idsFaltantes.length > 0) {
        analiseRevendedora.detalhes.push(
          `⚠️ ${idsFaltantes.length} produto(s) ativo(s) no master mas não vinculado(s)`
        );

        // EXECUTAR: Criar vínculos faltantes (desativados e sem margem por segurança)
        if (executar) {
          const novosVinculos = idsFaltantes.map(productId => ({
            reseller_id: revendedora.id,
            product_id: productId,
            margin_percent: 0,
            is_active: false, // Desativado por segurança até configurar margem
            linked_at: new Date().toISOString(),
          }));

          const { error: insertError } = await supabase
            .from('reseller_products')
            .insert(novosVinculos);

          if (!insertError) {
            resultado.acoes_realizadas!.vinculos_criados += novosVinculos.length;
            analiseRevendedora.detalhes.push(
              `✅ ${novosVinculos.length} produto(s) vinculado(s) (inativos, margem 0%)`
            );
          }
        }
      }

      // Adicionar ao resultado se houver problemas
      if (analiseRevendedora.vinculos_orfaos > 0 || analiseRevendedora.produtos_faltantes > 0) {
        resultado.analise.problemas_encontrados++;
        resultado.revendedoras.push(analiseRevendedora);
      } else if (!executar) {
        // No modo preview, mostrar todas (mesmo sem problemas)
        analiseRevendedora.detalhes.push('✅ Sincronizada corretamente');
        resultado.revendedoras.push(analiseRevendedora);
      }
    }

    return NextResponse.json(resultado);

  } catch (error) {
    console.error('[sincronizar-vinculos] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao sincronizar vínculos', details: String(error) },
      { status: 500 }
    );
  }
}
