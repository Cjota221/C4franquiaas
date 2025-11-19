import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { fetchAllProdutosFacilZap, fetchProdutosFacilZapPage, ProdutoDB } from '@/lib/facilzapClient';

// extractCategoryNames removed: categories should be managed manually in admin panel

export async function POST(request: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: 'supabase_config_missing', message: 'Missing SUPABASE configuration (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).' }, { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const parsed = await request.json().catch(() => ({} as unknown));
  const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {} as Record<string, unknown>;
  const page = Number(body?.page) > 0 ? Number(body.page) : undefined;
  const length = Number(body?.length) > 0 ? Number(body.length) : undefined;

  try {
    console.log('🔄 Iniciando sincronização com FácilZap...');
    
    let produtos: ProdutoDB[] = [];
    if (page) {
      console.log(`📄 Buscando página ${page} do FácilZap...`);
      const res = await fetchProdutosFacilZapPage(page, length ?? 50);
      produtos = res.produtos ?? [];
    } else {
      console.log('📚 Buscando TODOS os produtos do FácilZap...');
      const res = await fetchAllProdutosFacilZap();
      produtos = res.produtos ?? [];
    }

    console.log(`✅ Recebidos ${produtos.length} produtos do FácilZap`);

    if (!produtos || produtos.length === 0) {
      console.log('⚠️ Nenhum produto recebido do FácilZap');
      return NextResponse.json({ ok: true, imported: 0 });
    }

    const BATCH_SIZE = 50;
    let importedCount = 0;
    for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
      const slice = produtos.slice(i, i + BATCH_SIZE);

      const batch = slice.map((p: ProdutoDB) => {
        const rec = p as unknown as Record<string, unknown>;
        const id_externo = (rec['id_externo'] ?? rec['id'] ?? null) as string | null;
        const nome = (rec['nome'] ?? rec['name'] ?? null) as string | null;
        const preco_base = (rec['preco_base'] ?? rec['preco'] ?? null) as number | string | null;
        const estoque = (rec['estoque'] ?? rec['stock'] ?? null) as number | string | null;
        const ativoVal = rec['ativo'];
        const ativo = typeof ativoVal === 'boolean' ? ativoVal : (ativoVal ?? true) as boolean;
        const imagem = (rec['imagem'] ?? null) as string | null;
        const imagens = Array.isArray(rec['imagens']) ? rec['imagens'] as string[] : (rec['imagens'] ? [String(rec['imagens'])] : [] as string[]);
        const codigo_barras = (rec['codigo_barras'] ?? rec['barcode'] ?? null) as string | null;
        const variacoes_meta = (rec['variacoes_meta'] ?? rec['variacoes'] ?? []) as unknown;

        return {
          id_externo,
          nome,
          preco_base,
          estoque,
          ativo,
          imagem,
          imagens,
          codigo_barras,
          variacoes_meta,
          last_synced_at: new Date().toISOString(),
          // 🆕 Novas colunas para sincronização com FácilZap
          facilzap_id: id_externo, // Mesmo valor do id_externo
          sincronizado_facilzap: true, // Marca como sincronizado
          ultima_sincronizacao: new Date().toISOString(), // Timestamp da sync
        };
      });

      // 🔍 Log detalhado dos produtos sendo atualizados
      console.log(`📦 Atualizando batch de ${batch.length} produtos:`);
      batch.forEach((p, idx) => {
        if (idx < 3) { // Mostrar apenas os 3 primeiros para não poluir
          console.log(`  - ${p.nome}: estoque=${p.estoque}, ativo=${p.ativo}`);
        }
      });

      const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'id_externo' });
      if (error) {
        const msg = error?.message ?? 'Erro ao salvar produtos.';
        const body: Record<string, unknown> = { error: 'supabase_upsert_failed', message: String(msg) };
        if (process.env.DEBUG_SYNC === 'true') body['raw'] = error;
        return NextResponse.json(body, { status: 500 });
      }

      console.log(`✅ Batch de ${batch.length} produtos atualizado com sucesso`);

      // 🆕 Registrar log de sincronização bem-sucedida
      const logResult = await supabase.from('logs_sincronizacao').insert({
        tipo: 'produto_atualizado',
        facilzap_id: null, // Batch sync, sem ID específico
        descricao: `Sincronização em lote: ${batch.length} produtos`,
        payload: { count: batch.length, page: page ?? 'all' },
        sucesso: true,
        erro: null,
      });
      if (logResult.error) {
        console.warn('⚠️ Erro ao registrar log (não crítico):', logResult.error);
      }

      // Note: removed automatic categories extraction/upsert to avoid external coupling.
      // Categories should be managed manually in the admin panel and linked to products via the categorias API.

      importedCount += batch.length;
    }

    // 🆕 Desativar produtos com estoque zero em todas franqueadas/revendedoras
    console.log('🔄 Verificando produtos com estoque zero...');
    await desativarProdutosEstoqueZero(supabase);

    console.log(`✅ SINCRONIZAÇÃO CONCLUÍDA: ${importedCount} produtos atualizados`);
    return NextResponse.json({ ok: true, imported: importedCount }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const body: Record<string, unknown> = { error: msg };
    if (process.env.DEBUG_SYNC === 'true') body['raw'] = err;
    return NextResponse.json(body, { status: 500 });
  }
}

/**
 * 🆕 Desativa automaticamente produtos com estoque zero
 * em todas franqueadas e revendedoras
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

