#!/usr/bin/env node

/**
 * Script para vincular todos os produtos ativos a todas as revendedoras
 * Usa a API existente: /api/admin/produtos/vincular-todas-revendedoras
 */

const SITE_URL = 'https://c4franquiaas.netlify.app';

async function vincularProdutos() {
  console.log('🔗 Vinculando produtos às revendedoras...\n');

  try {
    const response = await fetch(`${SITE_URL}/api/admin/produtos/vincular-todas-revendedoras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro:', data.error);
      process.exit(1);
    }

    console.log('✅ Vinculação concluída!\n');
    console.log('📊 Resultado:');
    console.log(`   - Revendedoras processadas: ${data.revendedoras}`);
    console.log(`   - Produtos processados: ${data.produtos}`);
    console.log(`   - Vínculos criados: ${data.vinculosCriados}`);
    console.log(`   - Vínculos existentes: ${data.vinculosExistentes}`);
    console.log(`   - Erros: ${data.erros}\n`);

    if (data.detalhes && data.detalhes.length > 0) {
      console.log('📝 Detalhes por revendedora:');
      data.detalhes.forEach(detalhe => {
        console.log(`   - ${detalhe.store_name}: ${detalhe.vinculados} produtos`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao vincular produtos:', error.message);
    process.exit(1);
  }
}

vincularProdutos();
