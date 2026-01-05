import { readFileSync } from 'fs';

const filePath = 'app/revendedora/personalizacao/page.tsx';
const buffer = readFileSync(filePath);
const content = buffer.toString('utf8');

console.log('🔍 Analisando todos os "ESTÃ"...\n');

const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('ESTÃ')) {
    const lineNum = idx + 1;
    console.log(`\n📍 Linha ${lineNum}:`);
    console.log(`Texto: ${line.trim()}`);
    
    // Encontrar onde está "ESTÃ"
    const pos = line.indexOf('ESTÃ');
    if (pos >= 0) {
      const start = Math.max(0, pos - 5);
      const end = Math.min(line.length, pos + 15);
      const snippet = line.substring(start, end);
      const snippetBuffer = Buffer.from(snippet, 'utf8');
      
      console.log(`Snippet: "${snippet}"`);
      console.log(`Hex: ${snippetBuffer.toString('hex')}`);
    }
  }
});
