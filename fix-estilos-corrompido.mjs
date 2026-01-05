import { readFileSync, writeFileSync } from 'fs';

const file = 'app/revendedora/personalizacao/page.tsx';
let content = readFileSync(file, 'utf8');

console.log('🔧 Corrigindo "Estilos" corrompido...\n');

// Contar antes
const beforeEST = (content.match(/EST[ÃƒÂ]+ilos/gi) || []).length;
console.log(`❌ Encontrado "EST...ilos": ${beforeEST}x`);

// Substituir TODAS as variações de "Estilos" corrompido
content = content
  .replace(/EST[ÃƒÂ]+ilos/gi, 'Estilos')
  .replace(/EST[ÃƒÂ]+ILOS/gi, 'ESTILOS')
  .replace(/EST[ÃƒÂ]+ilo/gi, 'Estilo');

// Verificar depois
const afterEST = (content.match(/EST[ÃƒÂ]+ilos/gi) || []).length;

console.log(`✅ Corrigido: ${beforeEST} → ${afterEST}`);

// Salvar
writeFileSync(file, content, 'utf8');

console.log('\n💾 Arquivo salvo!');

// Verificar se funcionou
const check = readFileSync(file, 'utf8');
const stillBad = (check.match(/EST[ÃƒÂ]/g) || []).length;
console.log(`\n📊 Verificação: ${stillBad === 0 ? '✅ Limpo!' : `⚠️  Ainda há ${stillBad} problemas`}`);
