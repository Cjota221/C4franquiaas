import { readFileSync, writeFileSync } from 'fs';

const filePath = 'app/revendedora/personalizacao/page.tsx';

// Ler como buffer bruto
const buffer = readFileSync(filePath);

console.log('🔍 Procurando padrão "ilos"...\n');

// Converter para string e procurar
const content = buffer.toString('utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('ilos')) {
    console.log(`\n📍 Linha ${idx + 1}:`);
    console.log(`Texto: ${line.substring(0, 100)}`);
    
    // Encontrar posição de "ilos"
    const pos = line.indexOf('ilos');
    if (pos > 0) {
      const start = Math.max(0, pos - 10);
      const end = Math.min(line.length, pos + 10);
      const snippet = line.substring(start, end);
      const snippetBuffer = Buffer.from(snippet, 'utf8');
      
      console.log(`Snippet: "${snippet}"`);
      console.log(`Hex: ${snippetBuffer.toString('hex')}`);
      console.log(`Bytes:`, Array.from(snippetBuffer).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
    }
  }
});

console.log('\n\n💡 Analisando padrão...');
// Procurar o padrão específico no buffer bruto
const searchPattern = Buffer.from('ilos', 'utf8');
let offset = 0;
let found = 0;

while ((offset = buffer.indexOf(searchPattern, offset)) !== -1) {
  found++;
  // Pegar 20 bytes antes
  const start = Math.max(0, offset - 20);
  const snippet = buffer.slice(start, offset + 10);
  
  console.log(`\n🔎 Ocorrência ${found}:`);
  console.log(`Posição: ${offset}`);
  console.log(`Hex: ${snippet.toString('hex')}`);
  console.log(`UTF-8: ${snippet.toString('utf8')}`);
  
  offset += searchPattern.length;
}

console.log(`\n📊 Total encontrado: ${found}`);
