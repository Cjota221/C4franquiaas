import { readFileSync, writeFileSync } from 'fs';

const file = 'app/revendedora/personalizacao/page.tsx';

// Ler como buffer e converter
const buffer = readFileSync(file);
let content = buffer.toString('utf8');

// Mostrar o que encontramos
const matches = content.match(/usEST.{1,3}ate/g);
console.log('Encontrado:', matches);

// Substituir todas as variações
content = content.replace(/usEST[ÃÁ]+ate/g, 'useState');

// Salvar
writeFileSync(file, content, 'utf8');

console.log('✅ Arquivo corrigido!');
