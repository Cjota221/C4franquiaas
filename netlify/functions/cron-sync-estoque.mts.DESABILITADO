import { Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Token do FacilZap
const FACILZAP_TOKEN = process.env.FACILZAP_TOKEN;
const FACILZAP_API_URL = 'https://api.facilzap.com.br';

interface ProdutoFacilZap {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  imagem?: string;
  imagens?: string[];
}

/**
 * 🔄 CRON JOB - Sincronização Automática de Estoque
 * Roda a cada 5 minutos automaticamente pelo Netlify
 */
export default async function handler() {
  const inicio = Date.now();
  console.log('\n🔄 [CRON] Iniciando sincronização automática...');
  console.log(`⏰ [CRON] Horário: ${new Date().toISOString()}`);

  try {
    // 1️⃣ Buscar produtos do FacilZap
    console.log('[CRON] 📡 Buscando produtos do FacilZap...');
    
    const response = await fetch(`${FACILZAP_API_URL}/api/v1/produtos?limit=1000`, {
      headers: {
        'Authorization': `Bearer ${FACILZAP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FacilZap API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const produtosFacilZap: ProdutoFacilZap[] = data.data || data.produtos || data || [];
    
    console.log(`[CRON] ✅ Recebidos ${produtosFacilZap.length} produtos do FacilZap`);

    if (produtosFacilZap.length === 0) {
      console.log('[CRON] ⚠️ Nenhum produto recebido, abortando...');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhum produto para sincronizar',
        duracao_ms: Date.now() - inicio 
      }));
    }

    // 2️⃣ Buscar produtos atuais do banco
    const idsExternos = produtosFacilZap.map(p => String(p.id));
    const { data: produtosBanco } = await supabaseAdmin
      .from('produtos')
      .select('id, id_externo, estoque, preco_base, ativo')
      .in('id_externo', idsExternos);

    const produtosBancoMap = new Map(
      (produtosBanco || []).map(p => [p.id_externo, p])
    );

    // 3️⃣ Comparar e identificar mudanças
    let atualizados = 0;
    let novos = 0;
    let semMudanca = 0;
    const erros: string[] = [];

    for (const pFacilZap of produtosFacilZap) {
      const idExterno = String(pFacilZap.id);
      const pBanco = produtosBancoMap.get(idExterno);

      // Normalizar dados
      const novoEstoque = typeof pFacilZap.estoque === 'number' ? pFacilZap.estoque : 0;
      const novoPreco = typeof pFacilZap.preco === 'number' ? pFacilZap.preco : null;
      const novoAtivo = pFacilZap.ativo !== false;

      if (pBanco) {
        // Produto existe - verificar se mudou
        const mudouEstoque = pBanco.estoque !== novoEstoque;
        const mudouPreco = pBanco.preco_base !== novoPreco;
        const mudouAtivo = pBanco.ativo !== novoAtivo;

        if (mudouEstoque || mudouPreco || mudouAtivo) {
          // Atualizar
          const { error } = await supabaseAdmin
            .from('produtos')
            .update({
              estoque: novoEstoque,
              preco_base: novoPreco,
              ativo: novoAtivo,
              ultima_sincronizacao: new Date().toISOString(),
              sincronizado_facilzap: true,
            })
            .eq('id', pBanco.id);

          if (error) {
            erros.push(`Erro ao atualizar ${pFacilZap.nome}: ${error.message}`);
          } else {
            atualizados++;
            if (mudouEstoque) {
              console.log(`[CRON] 📦 ${pFacilZap.nome}: estoque ${pBanco.estoque} → ${novoEstoque}`);
            }
          }
        } else {
          semMudanca++;
        }
      } else {
        // Produto novo - inserir
        const { error } = await supabaseAdmin
          .from('produtos')
          .insert({
            id_externo: idExterno,
            facilzap_id: idExterno,
            nome: pFacilZap.nome,
            preco_base: novoPreco,
            estoque: novoEstoque,
            ativo: novoAtivo,
            imagem: pFacilZap.imagem || null,
            imagens: pFacilZap.imagens || [],
            ultima_sincronizacao: new Date().toISOString(),
            sincronizado_facilzap: true,
          });

        if (error) {
          erros.push(`Erro ao inserir ${pFacilZap.nome}: ${error.message}`);
        } else {
          novos++;
          console.log(`[CRON] 🆕 Novo produto: ${pFacilZap.nome}`);
        }
      }
    }

    // 4️⃣ Registrar log
    const duracao = Date.now() - inicio;
    await supabaseAdmin.from('logs_sincronizacao').insert({
      tipo: 'cron_sync',
      descricao: `Sync automático: ${atualizados} atualizados, ${novos} novos, ${semMudanca} sem mudança`,
      payload: { 
        total_facilzap: produtosFacilZap.length,
        atualizados, 
        novos, 
        sem_mudanca: semMudanca,
        erros: erros.length,
        duracao_ms: duracao
      },
      sucesso: erros.length === 0,
      erro: erros.length > 0 ? erros.join('; ') : null,
    });

    // 5️⃣ Resultado
    const resultado = {
      success: true,
      message: 'Sincronização concluída',
      stats: {
        total_facilzap: produtosFacilZap.length,
        atualizados,
        novos,
        sem_mudanca: semMudanca,
        erros: erros.length,
      },
      duracao_ms: duracao,
      timestamp: new Date().toISOString(),
    };

    console.log(`\n[CRON] ✅ Sincronização concluída em ${duracao}ms`);
    console.log(`[CRON] 📊 Resultados: ${atualizados} atualizados, ${novos} novos, ${semMudanca} sem mudança`);

    return new Response(JSON.stringify(resultado), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const err = error as Error;
    console.error('[CRON] ❌ Erro fatal:', err.message);

    // Registrar erro
    await supabaseAdmin.from('logs_sincronizacao').insert({
      tipo: 'cron_sync_error',
      descricao: `Erro no sync automático: ${err.message}`,
      payload: { error: err.toString() },
      sucesso: false,
      erro: err.message,
    });

    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message,
      duracao_ms: Date.now() - inicio 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ⏰ Configuração do Cron - roda a cada 5 minutos
export const config: Config = {
  schedule: '*/5 * * * *', // A cada 5 minutos
};
