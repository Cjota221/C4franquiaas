import { readFileSync, writeFileSync } from 'fs';

const file = 'c:\\Users\\carol\\c4-franquias-admin\\app\\revendedora\\personalizacao\\page.tsx';

// Ler arquivo
let content = readFileSync(file, 'utf8');

// Substituir caracteres problemáticos
content = content.replace(/usESTÃate/g, 'useState');

// Salvar com UTF-8
writeFileSync(file, content, 'utf8');

console.log('✅ useState corrigido!');
