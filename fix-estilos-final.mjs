import { readFileSync, writeFileSync } from 'fs';

const file = 'app/revendedora/personalizacao/page.tsx';
let content = readFileSync(file, 'utf8');

console.log('🔍 Procurando caracteres corrompidos restantes...\n');

// Listar problemas encontrados
const problems = [
  { search: 'ESTÃilos', replace: 'Estilos', count: (content.match(/ESTÃilos/g) || []).length },
  { search: 'ESTÃILOS', replace: 'ESTILOS', count: (content.match(/ESTÃILOS/g) || []).length },
  { search: 'ESTÃilo', replace: 'Estilo', count: (content.match(/ESTÃilo/g) || []).length },
  { search: 'dESTÃacar', replace: 'destacar', count: (content.match(/dESTÃacar/g) || []).length },
  { search: /Ã°Å¸.{1,10}Barra/g, replace: 'Barra', count: (content.match(/Ã°Å¸.{1,10}Barra/g) || []).length },
];

let totalFixed = 0;
problems.forEach(p => {
  if (p.count > 0) {
    console.log(`❌ Encontrado "${p.search}" → ${p.count}x`);
    totalFixed += p.count;
  }
});

console.log(`\n📊 Total de problemas: ${totalFixed}\n`);

// Aplicar correções
content = content
  .replace(/ESTÃilos/g, 'Estilos')
  .replace(/ESTÃILOS/g, 'ESTILOS')
  .replace(/ESTÃilo/g, 'Estilo')
  .replace(/dESTÃacar/g, 'destacar')
  .replace(/Ã°Å¸.{1,10}Barra/g, 'Barra')
  .replace(/Ã°Å¸[^\s]{1,15}/g, ''); // Remove emojis corrompidos

// Verificar se ainda há problemas
const remaining = [
  (content.match(/Ã/g) || []).length,
  (content.match(/Å/g) || []).length,
  (content.match(/¸/g) || []).length,
  (content.match(/°/g) || []).length,
].reduce((a, b) => a + b, 0);

console.log(`✅ Corrigido: ${totalFixed} problemas`);
console.log(`⚠️  Caracteres restantes: ${remaining}\n`);

// Salvar
writeFileSync(file, content, 'utf8');

console.log('💾 Arquivo salvo!');

// Verificar linhas específicas
const lines = content.split('\n');
[139, 458, 543, 549].forEach(lineNum => {
  const line = lines[lineNum - 1];
  if (line && line.includes('Est')) {
    console.log(`\nLinha ${lineNum}: ${line.substring(0, 100)}`);
  }
});
