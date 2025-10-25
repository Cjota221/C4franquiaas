import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Carregar variáveis de ambiente
const envFile = readFileSync('.env.local', 'utf-8');
const envLines = envFile.split('\n');
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    process.env[key.trim()] = value;
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 INVESTIGANDO PROBLEMA: Produtos sem imagem no modal e sem variações no site\n');

// Buscar produtos
const { data: produtos, error } = await supabase
  .from('produtos')
  .select('id, id_externo, nome, imagem, imagens, variacoes_meta, estoque')
  .limit(10);

if (error) {
  console.error('❌ Erro ao buscar produtos:', error);
  process.exit(1);
}

console.log(`📦 Analisando ${produtos.length} produtos:\n`);

produtos.forEach((p, index) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${index + 1}. ${p.nome}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`   ID UUID: ${p.id}`);
  console.log(`   ID Externo: ${p.id_externo || 'N/A'}`);
  console.log(`   Estoque Total: ${p.estoque}`);
  
  // Verificar campo imagem
  console.log(`\n   🖼️  IMAGEM PRINCIPAL:`);
  if (!p.imagem) {
    console.log(`      ❌ NULL/VAZIO`);
  } else {
    console.log(`      ✅ ${p.imagem.substring(0, 100)}...`);
  }
  
  // Verificar campo imagens (array)
  console.log(`\n   🖼️  ARRAY DE IMAGENS:`);
  if (!p.imagens) {
    console.log(`      ❌ NULL`);
  } else if (!Array.isArray(p.imagens)) {
    console.log(`      ❌ NÃO É ARRAY (tipo: ${typeof p.imagens})`);
  } else if (p.imagens.length === 0) {
    console.log(`      ⚠️  ARRAY VAZIO`);
  } else {
    console.log(`      ✅ ${p.imagens.length} imagens:`);
    p.imagens.forEach((img, i) => {
      console.log(`         ${i + 1}. ${typeof img === 'string' ? img.substring(0, 80) + '...' : `TIPO INVÁLIDO: ${typeof img}`}`);
    });
  }
  
  // Verificar variações
  console.log(`\n   📊 VARIAÇÕES (variacoes_meta):`);
  if (!p.variacoes_meta) {
    console.log(`      ❌ NULL`);
  } else if (!Array.isArray(p.variacoes_meta)) {
    console.log(`      ❌ NÃO É ARRAY (tipo: ${typeof p.variacoes_meta})`);
  } else if (p.variacoes_meta.length === 0) {
    console.log(`      ⚠️  ARRAY VAZIO - PROBLEMA IDENTIFICADO!`);
  } else {
    console.log(`      ✅ ${p.variacoes_meta.length} variações:`);
    p.variacoes_meta.forEach((v, i) => {
      console.log(`         ${i + 1}. SKU: ${v.sku || 'N/A'} | Nome: ${v.nome || 'N/A'} | Estoque: ${v.estoque || 0}`);
    });
  }
  
  // DIAGNÓSTICO
  console.log(`\n   🩺 DIAGNÓSTICO:`);
  const problemas = [];
  
  if (!p.imagem && (!p.imagens || p.imagens.length === 0)) {
    problemas.push('❌ SEM IMAGENS (nem principal nem array)');
  }
  
  if (!p.variacoes_meta || p.variacoes_meta.length === 0) {
    problemas.push('❌ SEM VARIAÇÕES (variacoes_meta vazio)');
  }
  
  if (p.variacoes_meta && Array.isArray(p.variacoes_meta) && p.variacoes_meta.length > 0) {
    const semNome = p.variacoes_meta.filter(v => !v.nome || v.nome === '').length;
    if (semNome > 0) {
      problemas.push(`⚠️  ${semNome} variações SEM CAMPO NOME`);
    }
  }
  
  if (problemas.length === 0) {
    console.log(`      ✅ Produto OK`);
  } else {
    console.log(`      PROBLEMAS ENCONTRADOS:`);
    problemas.forEach(prob => console.log(`      ${prob}`));
  }
});

console.log(`\n${'='.repeat(80)}\n`);

// Estatísticas
const semImagem = produtos.filter(p => !p.imagem && (!p.imagens || p.imagens.length === 0)).length;
const semVariacoes = produtos.filter(p => !p.variacoes_meta || p.variacoes_meta.length === 0).length;
const semNomeNasVariacoes = produtos.filter(p => 
  p.variacoes_meta && 
  Array.isArray(p.variacoes_meta) && 
  p.variacoes_meta.some(v => !v.nome)
).length;

console.log(`📊 ESTATÍSTICAS (de ${produtos.length} produtos):`);
console.log(`   • Sem imagens: ${semImagem} (${(semImagem/produtos.length*100).toFixed(1)}%)`);
console.log(`   • Sem variações: ${semVariacoes} (${(semVariacoes/produtos.length*100).toFixed(1)}%)`);
console.log(`   • Com variações sem nome: ${semNomeNasVariacoes} (${(semNomeNasVariacoes/produtos.length*100).toFixed(1)}%)`);

console.log(`\n💡 CORRELAÇÃO:`);
const semImagemESemVariacoes = produtos.filter(p => 
  (!p.imagem && (!p.imagens || p.imagens.length === 0)) &&
  (!p.variacoes_meta || p.variacoes_meta.length === 0)
).length;

console.log(`   • Produtos SEM imagem E SEM variações: ${semImagemESemVariacoes}`);
if (semImagemESemVariacoes > 0) {
  console.log(`\n   ⚠️  PROBLEMA CONFIRMADO: ${semImagemESemVariacoes} produtos têm ambos os problemas!`);
  console.log(`   📝 Esses produtos precisam ser re-sincronizados do FácilZap.`);
}

console.log('\n✅ Diagnóstico concluído!\n');
