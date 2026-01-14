import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';
import { filtrarProdutosExcluidos } from '@/lib/produtos-excluidos';

// extractCategoryNames removed: categories should be managed manually in admin panel

// ⏱️ Configuração de timeout
export const maxDuration = 300; // 5 minutos (Vercel Pro)
export const dynamic = 'force-dynamic';

// GET também funciona para permitir cron jobs externos (cron-job.org, etc)
export async function GET() {
  return handleSync();
}

export async function POST(request: NextRequest) {
  const parsed = await request.json().catch(() => ({} as unknown));
  const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {} as Record<string, unknown>;
  const page = Number(body?.page) > 0 ? Number(body.page) : undefined;
  const length = Number(body?.length) > 0 ? Number(body.length) : undefined;
  return handleSync(page, length);
}

async function handleSync(page?: number, length?: number) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: 'supabase_config_missing', message: 'Missing SUPABASE configuration (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).' }, { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 SYNC-PRODUTOS: Iniciando sincronização com FácilZap...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Token FácilZap presente:', !!process.env.FACILZAP_TOKEN);
    console.log('🛡️ Filtro de produtos excluídos: ATIVO');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    let produtos: ProdutoDB[] = [];
    let totalPages = 0;
    
    if (page) {
      console.log(`📄 Buscando página ${page} do FácilZap...`);
      const res = await fetchProdutosFacilZapPage(page, length ?? 50);
      produtos = res.produtos ?? [];
      totalPages = 1;
    } else {
      console.log('📚 Buscando TODOS os produtos do FácilZap (PODE DEMORAR)...');
      const inicio = Date.now();
      
      // ⏱️ Timeout de 4 minutos para busca completa
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: FácilZap API demorou mais de 4 minutos')), 240000)
      );
      
      const res = await Promise.race([
        fetchAllProdutosFacilZap(),
        timeout
      ]);
      
      const duracao = Date.now() - inicio;
      produtos = res.produtos ?? [];
      totalPages = res.pages ?? 0;
      console.log(`⏱️ Tempo de busca: ${(duracao/1000).toFixed(1)}s, Páginas: ${totalPages}, Produtos: ${produtos.length}`);
    }

    console.log(`✅ Recebidos ${produtos.length} produtos do FácilZap`);

    if (!produtos || produtos.length === 0) {
      console.log('⚠️ ATENÇÃO: Nenhum produto recebido do FácilZap!');
      console.log('⚠️ Isso pode indicar: Token inválido, API fora do ar, ou erro na requisição');
      return NextResponse.json({ 
        ok: true, 
        imported: 0,
        warning: 'Nenhum produto recebido do FácilZap'
      });
    }

    // 🚫 FILTRAR PRODUTOS EXCLUÍDOS PELO ADMIN (ANTES DE TUDO)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛡️  VERIFICANDO PRODUTOS EXCLUÍDOS PELO ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const produtosOriginais = produtos.length;
    produtos = await filtrarProdutosExcluidos(supabase, produtos);
    const produtosFiltrados = produtos.length;
    const totalExcluidosIgnorados = produtosOriginais - produtosFiltrados;
    
    if (totalExcluidosIgnorados > 0) {
      console.log(`🚫 BLOQUEADOS: ${totalExcluidosIgnorados} produtos que foram excluídos pelo admin`);
      console.log(`   Esses produtos NÃO serão recriados!`);
    } else {
      console.log(`✅ Nenhum produto excluído detectado. Prosseguindo com sync...`);
    }
    console.log('');

    const BATCH_SIZE = 50;
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalNew = 0;
    let totalUnchanged = 0;
    
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const slice = produtos.slice(i, i + BATCH_SIZE);

      const batch = slice.map((p: ProdutoDB) => {
        const rec = p as unknown as Record<string, unknown>;
        const id_externo = (rec['id_externo'] ?? rec['id'] ?? null) as string | null;
        const nome = (rec['nome'] ?? rec['name'] ?? null) as string | null;
        const preco_base = (rec['preco_base'] ?? rec['preco'] ?? null) as number | string | null;
        
        // 🔧 ESTOQUE: Sempre calcular pela soma das variações
        const variacoes = (rec['variacoes_meta'] ?? rec['variacoes'] ?? []) as unknown[];
        let estoque = 0;
        
        if (Array.isArray(variacoes) && variacoes.length > 0) {
          // Produto TEM variações - somar estoque de todas
          estoque = variacoes.reduce<number>((total: number, v: unknown) => {
            const varRec = v as Record<string, unknown>;
            const varEstoque = typeof varRec['estoque'] === 'number' ? varRec['estoque'] : 0;
            return total + varEstoque;
          }, 0);
        } else {
          // Produto SEM variações - usar estoque direto
          const estoqueRaw = (rec['estoque'] ?? rec['stock'] ?? 0) as number | string;
          estoque = typeof estoqueRaw === 'number' ? estoqueRaw : (parseFloat(estoqueRaw) || 0);
        }
        
        // 🔥 FLUXO DE APROVAÇÃO: Produtos NOVOS ficam pendentes
        // Este valor será substituído no upsert para produtos existentes
        const ativo = false; // Valor inicial para produtos NOVOS
        
        const imagem = (rec['imagem'] ?? null) as string | null;
        const imagens = Array.isArray(rec['imagens']) ? rec['imagens'] as string[] : (rec['imagens'] ? [String(rec['imagens'])] : [] as string[]);
        const codigo_barras = (rec['codigo_barras'] ?? rec['barcode'] ?? null) as string | null;
        const variacoes_meta = (rec['variacoes_meta'] ?? rec['variacoes'] ?? []) as unknown;

        return {
          id_externo,
          nome,
          preco_base,
          estoque,
          ativo, // Sempre false inicialmente
          imagem,
          imagens,
          codigo_barras,
          variacoes_meta,
          last_synced_at: new Date().toISOString(),
          // 🆕 Novas colunas para sincronização com FácilZap
          facilzap_id: id_externo, // Mesmo valor do id_externo
          sincronizado_facilzap: true, // Marca como sincronizado
          ultima_sincronizacao: new Date().toISOString(), // Timestamp da sync
          // 🆕 Fluxo de aprovação
          admin_aprovado: false, // Produtos novos aguardam aprovação
          admin_rejeitado: false,
          eh_produto_novo: true, // Marcar como novo
        };
      });

      // 🔍 COMPARAR com dados existentes para detectar mudanças
      const idsExternos = batch.map(p => p.id_externo).filter(id => id !== null);
      
      // 🚫 REMOVIDO: Verificação em batch (agora feita ANTES do loop)
      // A filtragem global já aconteceu antes, não precisa refiltrar aqui
      
      const { data: existingProducts } = await supabase
        .from('produtos')
        .select('id, id_externo, estoque, preco_base, ativo, desativado_manual, ultima_sincronizacao, admin_aprovado, admin_rejeitado')
        .in('id_externo', idsExternos);

      // Identificar produtos novos, alterados e inalterados
      const productsToUpsert: typeof batch = [];
      const changedProducts: Array<{ id_externo: string; changes: string[] }> = [];
      
      batch.forEach(newProduct => {
        const existing = existingProducts?.find((p: { id_externo: string }) => p.id_externo === newProduct.id_externo);
        
        if (!existing) {
          // ✨ Produto NOVO - fica PENDENTE de aprovação
          productsToUpsert.push(newProduct);
          totalNew++;
        } else {
          // 🔄 Produto EXISTENTE - PRESERVAR aprovação
          const changes: string[] = [];
          
          if (existing.estoque !== newProduct.estoque) {
            changes.push(`estoque: ${existing.estoque} → ${newProduct.estoque}`);
          }
          if (existing.preco_base !== newProduct.preco_base) {
            changes.push(`preço: ${existing.preco_base} → ${newProduct.preco_base}`);
          }
          
          // 🔥 SIMPLIFICADO: NUNCA mudar status ativo automaticamente
          // Admin tem controle total - sync só atualiza dados
          const novoAtivo = existing.ativo; // SEMPRE manter o que o admin definiu
          const adminAprovado = existing.admin_aprovado ?? false;
          const adminRejeitado = existing.admin_rejeitado ?? false;
          const ehProdutoNovo = false;
          
          // Atualizar o produto preservando aprovação
          const productToUpsert = { 
            ...newProduct, 
            ativo: novoAtivo,
            admin_aprovado: adminAprovado,
            admin_rejeitado: adminRejeitado,
            eh_produto_novo: ehProdutoNovo
          };
          
          if (changes.length > 0) {
            // Produto ALTERADO
            productsToUpsert.push(productToUpsert);
            changedProducts.push({ id_externo: newProduct.id_externo as string, changes });
            totalUpdated++;
          } else {
            // Produto INALTERADO - ainda atualiza timestamp
            productsToUpsert.push(productToUpsert);
            totalUnchanged++;
          }
        }
      });

      // 🔍 Log detalhado das mudanças
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      console.log(`📦 Batch ${batchNum}: ${batch.length} produtos`);
      console.log(`   🆕 Novos neste batch: ${productsToUpsert.length - (existingProducts?.length || 0)}`);
      console.log(`   🔄 Alterados neste batch: ${changedProducts.length}`);
      
      if (changedProducts.length > 0) {
        console.log(`   📊 Mudanças detectadas:`);
        changedProducts.slice(0, 3).forEach(p => {
          console.log(`      - ${p.id_externo}: ${p.changes.join(', ')}`);
        });
        if (changedProducts.length > 3) {
          console.log(`      ... e mais ${changedProducts.length - 3} produtos alterados`);
        }
      }

      // Fazer upsert (todos produtos, para atualizar timestamp)
      const { error } = await supabase.from('produtos').upsert(productsToUpsert, { onConflict: 'id_externo' });
      if (error) {
        const msg = error?.message ?? 'Erro ao salvar produtos.';
        const body: Record<string, unknown> = { error: 'supabase_upsert_failed', message: String(msg) };
        if (process.env.DEBUG_SYNC === 'true') body['raw'] = error;
        return NextResponse.json(body, { status: 500 });
      }

      console.log(`✅ Batch processado com sucesso`);

      // 🆕 Registrar log de sincronização (apenas se houve mudanças)
      if (changedProducts.length > 0 || totalNew > 0) {
        const logResult = await supabase.from('logs_sincronizacao').insert({
          tipo: 'produto_atualizado',
          facilzap_id: null,
          descricao: `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${totalNew} novos, ${changedProducts.length} alterados`,
          payload: { 
            batch: Math.floor(i / BATCH_SIZE) + 1,
            novos: totalNew,
            alterados: changedProducts.length,
            inalterados: totalUnchanged - changedProducts.length,
            mudancas: changedProducts.slice(0, 5) // Primeiras 5 mudanças
          },
          sucesso: true,
          erro: null,
        });
        if (logResult.error) {
          console.warn('⚠️ Erro ao registrar log (não crítico):', logResult.error);
        }
      }

      totalProcessed += batch.length;
    }

    // 🚫 REMOVIDO: Não desativar/reativar automaticamente
    // Admin tem controle total sobre ativar/desativar produtos
    // await desativarProdutosEstoqueZero(supabase);
    // await reativarProdutosComEstoque(supabase);

    // 🗑️ DETECTAR E EXCLUIR produtos que foram DELETADOS do FácilZap
    console.log('🗑️ Verificando produtos excluídos do FácilZap...');
    const produtosExcluidos = await detectarProdutosExcluidos(supabase, produtos);

    console.log(`✅ SINCRONIZAÇÃO CONCLUÍDA:`);
    console.log(`   📊 Total processado: ${totalProcessed} produtos`);
    console.log(`   🆕 Novos: ${totalNew}`);
    console.log(`   🔄 Atualizados: ${totalUpdated}`);
    console.log(`   ⚪ Inalterados: ${totalUnchanged}`);
    console.log(`   🗑️ Excluídos: ${produtosExcluidos}`);
    
    return NextResponse.json({ 
      ok: true, 
      processed: totalProcessed,
      new: totalNew,
      updated: totalUpdated,
      unchanged: totalUnchanged,
      deleted: produtosExcluidos, // 🆕 Produtos excluídos
      // Mantém 'imported' para compatibilidade com código existente
      imported: totalNew + totalUpdated,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const body: Record<string, unknown> = { error: msg };
    if (process.env.DEBUG_SYNC === 'true') body['raw'] = err;
    return NextResponse.json(body, { status: 500 });
  }
}

/**
 * 🚫 DESABILITADO: Funções de desativação automática
 * Admin tem controle total sobre ativar/desativar produtos
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
async function desativarProdutosEstoqueZero(supabase: any) {
  try {
    // 1. Buscar produtos com estoque = 0
    const { data: produtosZero, error: errProdutos } = await supabase
      .from('produtos')
      .select('id, nome, facilzap_id')
      .eq('estoque', 0);

    if (errProdutos) {
      console.error('❌ Erro ao buscar produtos com estoque zero:', errProdutos);
      return;
    }

    if (!produtosZero || produtosZero.length === 0) {
      console.log('✅ Nenhum produto com estoque zero');
      return;
    }

    console.log(`📦 Encontrados ${produtosZero.length} produtos com estoque zero`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const produtoIds = produtosZero.map((p: any) => p.id);

    // 2. Buscar IDs das franqueadas com esses produtos
    const { data: franqueadas, error: errFranqueadas } = await supabase
      .from('produtos_franqueadas')
      .select('id, produto_id')
      .in('produto_id', produtoIds);

    if (errFranqueadas) {
      console.error('❌ Erro ao buscar produtos_franqueadas:', errFranqueadas);
      return;
    }

    if (franqueadas && franqueadas.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const franqueadaIds = franqueadas.map((f: any) => f.id);

      // 3. Desativar em produtos_franqueadas_precos
      const { error: errPrecos } = await supabase
        .from('produtos_franqueadas_precos')
        .update({ ativo_no_site: false })
        .in('produto_franqueada_id', franqueadaIds);

      if (errPrecos) {
        console.error('❌ Erro ao desativar em franqueadas:', errPrecos);
      } else {
        console.log(`✅ Desativados ${franqueadaIds.length} produtos em franqueadas`);
      }
    }

    // 4. Desativar em reseller_products
    const { error: errRevendedoras } = await supabase
      .from('reseller_products')
      .update({ is_active: false })
      .in('product_id', produtoIds);

    if (errRevendedoras) {
      console.error('❌ Erro ao desativar em revendedoras:', errRevendedoras);
    } else {
      console.log(`✅ Produtos desativados em revendedoras`);
    }

    // 5. Registrar log
    for (const produto of produtosZero) {
      await supabase.from('logs_sincronizacao').insert({
        tipo: 'estoque_zerado',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        produto_id: (produto as any).id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        facilzap_id: (produto as any).facilzap_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        descricao: `Produto "${(produto as any).nome}" desativado automaticamente (estoque = 0)`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: { produto_id: (produto as any).id, nome: (produto as any).nome },
        sucesso: true,
        erro: null,
      });
    }

    console.log('✅ Produtos com estoque zero desativados automaticamente');
  } catch (error) {
    console.error('❌ Erro em desativarProdutosEstoqueZero:', error);
  }
}

/**
 * 🚫 DESABILITADO: Função de reativação automática
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
async function reativarProdutosComEstoque(supabase: any) {
  try {
    // 1. Buscar produtos com estoque > 0 e que estão ATIVOS no admin
    const { data: produtosComEstoque, error: errProdutos } = await supabase
      .from('produtos')
      .select('id, nome, facilzap_id, estoque')
      .gt('estoque', 0)
      .eq('ativo', true);

    if (errProdutos) {
      console.error('❌ Erro ao buscar produtos com estoque:', errProdutos);
      return;
    }

    if (!produtosComEstoque || produtosComEstoque.length === 0) {
      console.log('⚪ Nenhum produto com estoque para reativar');
      return;
    }

    console.log(`📦 Verificando ${produtosComEstoque.length} produtos com estoque para reativação...`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const produtoIds = produtosComEstoque.map((p: any) => p.id);

    // 2. Buscar produtos_franqueadas que estão DESATIVADOS mas deveriam estar ativos
    const { data: franqueadas, error: errFranqueadas } = await supabase
      .from('produtos_franqueadas')
      .select('id, produto_id, franqueada_id')
      .in('produto_id', produtoIds);

    if (errFranqueadas) {
      console.error('❌ Erro ao buscar produtos_franqueadas:', errFranqueadas);
      return;
    }

    if (franqueadas && franqueadas.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const franqueadaIds = franqueadas.map((f: any) => f.id);

      // 3. Reativar em produtos_franqueadas_precos (apenas os que estão desativados)
      const { data: reativados, error: errPrecos } = await supabase
        .from('produtos_franqueadas_precos')
        .update({ ativo_no_site: true })
        .in('produto_franqueada_id', franqueadaIds)
        .eq('ativo_no_site', false) // Só atualiza os que estão FALSE
        .select('id');

      if (errPrecos) {
        console.error('❌ Erro ao reativar em franqueadas:', errPrecos);
      } else {
        const qtdReativados = reativados?.length || 0;
        if (qtdReativados > 0) {
          console.log(`✅ Reativados ${qtdReativados} produtos em franqueadas`);
        }
      }
    }

    // 4. Reativar em reseller_products (apenas os que estão desativados)
    const { data: reativadosRevend, error: errRevendedoras } = await supabase
      .from('reseller_products')
      .update({ is_active: true })
      .in('product_id', produtoIds)
      .eq('is_active', false) // Só atualiza os que estão FALSE
      .select('id');

    if (errRevendedoras) {
      console.error('❌ Erro ao reativar em revendedoras:', errRevendedoras);
    } else {
      const qtdReativados = reativadosRevend?.length || 0;
      if (qtdReativados > 0) {
        console.log(`✅ Reativados ${qtdReativados} produtos em revendedoras`);
      }
    }

    // 5. Registrar log apenas se houve reativações
    const totalReativados = (reativadosRevend?.length || 0);
    if (totalReativados > 0) {
      await supabase.from('logs_sincronizacao').insert({
        tipo: 'estoque_reativado',
        descricao: `${totalReativados} produtos reativados automaticamente (estoque > 0)`,
        payload: { 
          total_reativados: totalReativados,
          produtos_verificados: produtosComEstoque.length
        },
        sucesso: true,
        erro: null,
      });
    }

    console.log('✅ Verificação de reativação concluída');
  } catch (error) {
    console.error('❌ Erro em reativarProdutosComEstoque:', error);
  }
}

/**
 * 🗑️ Detecta e EXCLUI produtos que foram DELETADOS do FácilZap
 * Compara os IDs do FácilZap com os nossos e DELETA os que não existem mais
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function detectarProdutosExcluidos(supabase: any, produtosFacilzap: any[]): Promise<number> {
  try {
    // Criar Set de IDs que existem no FácilZap
    const idsFacilzap = new Set(
      produtosFacilzap.map(p => {
        const rec = p as unknown as Record<string, unknown>;
        return String(rec['id_externo'] ?? rec['id'] ?? '');
      }).filter(id => id !== '')
    );

    console.log(`📊 FácilZap tem ${idsFacilzap.size} produtos`);

    // 🔧 IMPORTANTE: Buscar produtos excluídos para NÃO tentar excluir novamente
    const { data: jaExcluidos } = await supabase
      .from('produtos_excluidos')
      .select('id_externo');
    
    const idsJaExcluidos = new Set(
      (jaExcluidos || []).map((e: { id_externo: string }) => String(e.id_externo))
    );
    
    console.log(`🗑️ Já temos ${idsJaExcluidos.size} produtos marcados como excluídos`);

    // 🔧 CORREÇÃO: Buscar TODOS os produtos (ativos E inativos) que vieram do FácilZap
    const { data: produtosNoBanco, error: errBusca } = await supabase
      .from('produtos')
      .select('id, nome, id_externo, facilzap_id, ativo')
      .or('id_externo.not.is.null,facilzap_id.not.is.null');

    if (errBusca) {
      console.error('❌ Erro ao buscar produtos do banco:', errBusca);
      return 0;
    }

    if (!produtosNoBanco || produtosNoBanco.length === 0) {
      console.log('✅ Nenhum produto do FácilZap no banco');
      return 0;
    }

    console.log(`📊 Nosso banco tem ${produtosNoBanco.length} produtos do FácilZap (ativos + inativos)`);

    // Encontrar produtos que NÃO existem mais no FácilZap E que ainda NÃO foram excluídos
    const produtosParaExcluir = produtosNoBanco.filter((p: { id_externo: string; facilzap_id: string }) => {
      const idExterno = p.id_externo || p.facilzap_id;
      // ✅ NÃO excluir se: já está nos excluídos OU ainda existe no FácilZap
      return idExterno && !idsJaExcluidos.has(String(idExterno)) && !idsFacilzap.has(String(idExterno));
    });

    if (produtosParaExcluir.length === 0) {
      console.log('✅ Nenhum produto excluído detectado');
      return 0;
    }

    console.log(`🗑️ Detectados ${produtosParaExcluir.length} produtos para EXCLUIR do nosso banco:`);
    produtosParaExcluir.slice(0, 5).forEach((p: { nome: string; id_externo: string }) => {
      console.log(`   - ${p.nome} (${p.id_externo})`);
    });
    if (produtosParaExcluir.length > 5) {
      console.log(`   ... e mais ${produtosParaExcluir.length - 5} produtos`);
    }

    
    // 🔒 REGISTRAR na tabela de excluídos ANTES de deletar (evita race condition)
    const idsExternosParaMarcar = produtosParaExcluir
      .map((p: { id_externo: string }) => p.id_externo)
      .filter((id: string) => id);
    
    if (idsExternosParaMarcar.length > 0) {
      await supabase
        .from('produtos_excluidos')
        .upsert(
          idsExternosParaMarcar.map((id_externo: string) => ({
            id_externo,
            excluido_em: new Date().toISOString(),
            excluido_por: 'sync_facilzap'
          })),
          { onConflict: 'id_externo' }
        );
      console.log(`✅ Marcados ${idsExternosParaMarcar.length} produtos como excluídos`);
    }
    const idsParaExcluir = produtosParaExcluir.map((p: { id: string }) => p.id);

    // 🗑️ 1. DELETAR vinculações com franqueadas (produtos_franqueadas_precos primeiro por FK)
    const { data: franqueadas } = await supabase
      .from('produtos_franqueadas')
      .select('id')
      .in('produto_id', idsParaExcluir);

    if (franqueadas && franqueadas.length > 0) {
      const franqueadaIds = franqueadas.map((f: { id: string }) => f.id);
      
      // Deletar preços primeiro (FK)
      await supabase
        .from('produtos_franqueadas_precos')
        .delete()
        .in('produto_franqueada_id', franqueadaIds);
      console.log(`✅ Deletados preços de ${franqueadaIds.length} franqueadas`);
      
      // Deletar vinculações
      await supabase
        .from('produtos_franqueadas')
        .delete()
        .in('produto_id', idsParaExcluir);
      console.log(`✅ Deletadas vinculações com franqueadas`);
    }

    // 🗑️ 2. DELETAR vinculações com revendedoras
    await supabase
      .from('reseller_products')
      .delete()
      .in('product_id', idsParaExcluir);
    console.log(`✅ Deletadas vinculações com revendedoras`);

    // 🗑️ 3. DELETAR da tabela produto_categorias (se existir)
    await supabase
      .from('produto_categorias')
      .delete()
      .in('produto_id', idsParaExcluir);
    console.log(`✅ Deletadas categorias dos produtos`);

    // 🗑️ 4. DELETAR os produtos
    const { error: errDelete } = await supabase
      .from('produtos')
      .delete()
      .in('id', idsParaExcluir);

    if (errDelete) {
      console.error('❌ Erro ao deletar produtos:', errDelete);
      // Se falhar o delete, pelo menos desativar
      await supabase
        .from('produtos')
        .update({ ativo: false, ultima_sincronizacao: new Date().toISOString() })
        .in('id', idsParaExcluir);
      console.log(`⚠️ Produtos desativados (delete falhou)`);
    } else {
      console.log(`✅ ${produtosParaExcluir.length} produtos EXCLUÍDOS PERMANENTEMENTE do banco`);
    }

    // 📝 5. Registrar log
    await supabase.from('logs_sincronizacao').insert({
      tipo: 'produtos_excluidos_facilzap',
      descricao: `${produtosParaExcluir.length} produtos DELETADOS do banco (não existem mais no FácilZap)`,
      payload: { 
        total_excluidos: produtosParaExcluir.length,
        acao: 'DELETE',
        produtos: produtosParaExcluir.slice(0, 10).map((p: { nome: string; id_externo: string }) => ({
          nome: p.nome,
          id_externo: p.id_externo
        }))
      },
      sucesso: true,
      erro: null,
    });

    return produtosParaExcluir.length;
  } catch (error) {
    console.error('❌ Erro em detectarProdutosExcluidos:', error);
    return 0;
  }
}