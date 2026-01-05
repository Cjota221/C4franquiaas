import { readFileSync, writeFileSync } from 'fs';

const file = 'app/revendedora/personalizacao/page.tsx';

// Ler como buffer
const buffer = readFileSync(file);

// Converter para string e mostrar os bytes problemáticos
let content = buffer.toString('utf8');
const index = content.indexOf('usEST');
if (index !== -1) {
  const bytes = buffer.slice(index, index + 20);
  console.log('Bytes encontrados:', bytes);
  console.log('String:', bytes.toString('utf8'));
}

// Tentar diferentes padrões de replace
content = content.replace(/usEST[\u0080-\uFFFF]+ate/g, 'useState');
content = content.replace(/usEST.{1,6}ate/g, 'useState');  

// Salvar
writeFileSync(file, content, 'utf8');

console.log('✅ Tentativa de correção completa!');

// Verificar
const newContent = readFileSync(file, 'utf8');
if (newContent.includes('usEST')) {
  console.log('⚠️ Ainda há problemas no arquivo!');
  // Mostrar onde
  const lines = newContent.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('usEST')) {
      console.log(`Linha ${i + 1}: ${line.substring(0, 80)}`);
    }
  });
} else {
  console.log('✅ Arquivo limpo!');
}
