// Teste simples: Verificar se a API de produtos relacionados funciona

const SLUG = 'cjota-rasteirinhas'; // Slug da revendedora de teste
const PRODUTO_ID = '1'; // ID de um produto qualquer

console.log('🧪 Testando API de Produtos Relacionados\n');
console.log(`   GET /api/catalogo/${SLUG}/produtos/relacionados/${PRODUTO_ID}\n`);

try {
  const response = await fetch(`http://localhost:3000/api/catalogo/${SLUG}/produtos/relacionados/${PRODUTO_ID}`);
  
  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const text = await response.text();
    console.log(`   ❌ Erro: ${text}`);
    process.exit(1);
  }
  
  const data = await response.json();
  
  console.log(`\n✅ API funcionando!`);
  console.log(`   Produtos retornados: ${data.produtos?.length || 0}`);
  
  if (data.produtos && data.produtos.length > 0) {
    console.log(`\n📦 Primeiros 3 produtos:`);
    data.produtos.slice(0, 3).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.nome} - R$ ${p.preco.toFixed(2)}`);
    });
  } else {
    console.log(`\n⚠️  Nenhum produto relacionado encontrado`);
  }
  
} catch (error) {
  console.error('❌ Erro ao chamar API:', error.message);
  process.exit(1);
}
