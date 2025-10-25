#!/usr/bin/env node

/**
 * Script para corrigir URLs de imagem com parâmetros duplicados (facilzap= e url=)
 * 
 * Problema: Algumas URLs estão com formato:
 *   proxy-facilzap-image?facilzap=...&url=...
 * 
 * Solução: Limpar para formato correto:
 *   /.netlify/functions/proxy-facilzap-image?url=...
 * 
 * Uso:
 *   node scripts/fix_duplicate_proxy_urls.mjs --dry-run  # Ver mudanças sem aplicar
 *   node scripts/fix_duplicate_proxy_urls.mjs --apply    # Aplicar correções
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const args = process.argv.slice(2);
const isDryRun = !args.includes('--apply');

console.log('\n🔧 Correção de URLs de Imagem com Parâmetros Duplicados\n');
console.log(`Modo: ${isDryRun ? '🔍 DRY RUN (visualizar)' : '✅ APLICAR MUDANÇAS'}\n`);

// ============ Ler Variáveis de Ambiente ============
let SUPABASE_URL, SERVICE_KEY;

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    
    if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = value;
    if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') SERVICE_KEY = value;
  });
} catch (err) {
  console.error('❌ Erro ao ler .env.local:', err.message);
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente ausentes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ============ Função de Limpeza de URL ============

function limparURL(url) {
  if (!url) return null;
  
  // Se não tiver parâmetros duplicados, retornar como está
  if (!url.includes('facilzap=') || !url.includes('url=')) {
    return url;
  }
  
  console.log('  🔍 URL com parâmetros duplicados detectada');
  
  try {
    // Extrair o parâmetro 'url=' que contém a URL correta
    const urlMatch = url.match(/[?&]url=([^&]+)/);
    if (urlMatch) {
      const decoded = decodeURIComponent(urlMatch[1]);
      
      // Criar URL limpa com proxy correto
      const urlLimpa = `https://c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(decoded)}`;
      
      console.log(`    ❌ Antes:  ${url.substring(0, 100)}...`);
      console.log(`    ✅ Depois: ${urlLimpa.substring(0, 100)}...`);
      
      return urlLimpa;
    }
  } catch (e) {
    console.error('  ⚠️ Erro ao processar URL:', e.message);
  }
  
  return url; // Retornar original se não conseguir processar
}

// ============ Buscar Produtos com Problemas ============

async function corrigirURLs() {
  console.log('📊 Buscando produtos com URLs problemáticas...\n');
  
  // Buscar TODOS os produtos - vamos filtrar na aplicação
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, nome, imagem, imagens');
  
  if (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    return;
  }
  
  if (!produtos || produtos.length === 0) {
    console.log('✅ Nenhum produto encontrado!');
    return;
  }
  
  // Filtrar produtos que TEM URLs com parâmetros duplicados
  const produtosProblematicos = produtos.filter(p => {
    const imagemProblematica = p.imagem && p.imagem.includes('facilzap=') && p.imagem.includes('url=');
    const imagensProblematicas = Array.isArray(p.imagens) && p.imagens.some(img => 
      img && img.includes('facilzap=') && img.includes('url=')
    );
    return imagemProblematica || imagensProblematicas;
  });
  
  if (produtosProblematicos.length === 0) {
    console.log('✅ Nenhum produto com URLs problemáticas encontrado!');
    console.log(`   (Total de produtos no banco: ${produtos.length})`);
    return;
  }
  
  console.log(`📦 Encontrados ${produtosProblematicos.length} produtos com URLs problemáticas`);
  console.log(`   (de um total de ${produtos.length} produtos no banco)\n`);
  
  let corrigidos = 0;
  let erros = 0;
  
  for (const produto of produtosProblematicos) {
    console.log(`\n🔧 Produto: ${produto.nome}`);
    console.log(`   ID: ${produto.id}`);
    
    let precisaAtualizar = false;
    let novaImagem = produto.imagem;
    let novasImagens = produto.imagens || [];
    
    // Corrigir imagem principal
    if (produto.imagem && produto.imagem.includes('facilzap=') && produto.imagem.includes('url=')) {
      console.log('\n  📸 Corrigindo imagem principal:');
      novaImagem = limparURL(produto.imagem);
      if (novaImagem !== produto.imagem) {
        precisaAtualizar = true;
      }
    }
    
    // Corrigir array de imagens
    if (Array.isArray(produto.imagens) && produto.imagens.length > 0) {
      const imagensCorrigidas = produto.imagens.map((img, idx) => {
        if (img && img.includes('facilzap=') && img.includes('url=')) {
          console.log(`\n  📸 Corrigindo imagem ${idx + 1}/${produto.imagens.length}:`);
          const limpa = limparURL(img);
          if (limpa !== img) {
            precisaAtualizar = true;
          }
          return limpa;
        }
        return img;
      });
      
      novasImagens = imagensCorrigidas;
    }
    
    // Aplicar atualização se necessário
    if (precisaAtualizar) {
      if (isDryRun) {
        console.log('\n  ℹ️ [DRY RUN] Mudanças NÃO foram aplicadas');
      } else {
        const { error: updateError } = await supabase
          .from('produtos')
          .update({
            imagem: novaImagem,
            imagens: novasImagens
          })
          .eq('id', produto.id);
        
        if (updateError) {
          console.error(`\n  ❌ Erro ao atualizar:`, updateError.message);
          erros++;
        } else {
          console.log('\n  ✅ Produto atualizado com sucesso!');
          corrigidos++;
        }
      }
    } else {
      console.log('  ℹ️ Nenhuma correção necessária');
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMO DA CORREÇÃO\n');
  console.log(`Total de produtos analisados: ${produtos.length}`);
  
  if (isDryRun) {
    console.log(`\n⚠️ MODO DRY RUN - Nenhuma mudança foi aplicada`);
    console.log(`\nPara aplicar as correções, execute:`);
    console.log(`  node scripts/fix_duplicate_proxy_urls.mjs --apply\n`);
  } else {
    console.log(`✅ Produtos corrigidos: ${corrigidos}`);
    console.log(`❌ Erros: ${erros}\n`);
  }
}

// Executar
corrigirURLs().catch(err => {
  console.error('\n❌ Erro fatal:', err);
  process.exit(1);
});
