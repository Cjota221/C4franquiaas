#!/usr/bin/env node

// Simular a função extractBarcode melhorada
function extractBarcode(item) {
  if (!item) return null;

  console.log('[TEST] Campos disponíveis:', Object.keys(item));

  const arrKeys = ['cod_barras', 'codigos', 'codigos_de_barras', 'codigos_barras', 'barcodes', 'eans'];
  for (const k of arrKeys) {
    const v = item[k];
    
    // Verificar se é um objeto com 'numero' (estrutura FácilZap)
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const obj = v;
      if ('numero' in obj) {
        const numero = obj['numero'];
        if (typeof numero === 'string' && numero.trim() !== '') {
          console.log(`[TEST] ✅ Encontrado em '${k}.numero': ${numero}`);
          return numero.trim();
        }
        if (typeof numero === 'number') {
          console.log(`[TEST] ✅ Encontrado em '${k}.numero': ${numero}`);
          return String(numero);
        } else {
          console.log(`[TEST] ⚠️ '${k}.numero' está vazio ou null:`, numero);
        }
      }
    }
  }

  console.log('[TEST] ❌ Código de barras NÃO encontrado');
  return null;
}

// Testar com estrutura FácilZap
console.log('=== TESTE 1: cod_barras com numero vazio (realidade atual) ===');
const variacao1 = {
  id: 1734266,
  ativada: true,
  nome: "33",
  sku: "FZ3469603.1",
  cod_barras: {
    tipo: "ean13",
    numero: ""
  }
};
const result1 = extractBarcode(variacao1);
console.log('Resultado:', result1);

console.log('\n=== TESTE 2: cod_barras com numero preenchido ===');
const variacao2 = {
  id: 1734267,
  ativada: true,
  nome: "34",
  sku: "FZ3469603.2",
  cod_barras: {
    tipo: "ean13",
    numero: "7891234567890"
  }
};
const result2 = extractBarcode(variacao2);
console.log('Resultado:', result2);

console.log('\n=== TESTE 3: cod_barras como string direta ===');
const variacao3 = {
  id: 1734268,
  nome: "35",
  sku: "FZ3469603.3",
  codigo_barras: "7891234567891"
};
const result3 = extractBarcode(variacao3);
console.log('Resultado:', result3);
