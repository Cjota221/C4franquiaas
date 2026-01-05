import { readFileSync, writeFileSync } from 'fs';

const filePath = 'app/revendedora/personalizacao/page.tsx';

console.log('🔧 Corrigindo bytes UTF-8 corrompidos...\n');

// Ler buffer bruto
let buffer = readFileSync(filePath);

// Padrões corrompidos em bytes hexadecimais
const patterns = [
  // ESTÃÁilos → Estilos
  { wrong: Buffer.from([0x45, 0x53, 0x54, 0xc3, 0x83, 0xc2, 0x81, 0x69, 0x6c, 0x6f, 0x73]), correct: 'Estilos', name: 'ESTÃÁilos' },
  // Outros padrões comuns
  { wrong: Buffer.from('ESTÃƒÂ ', 'utf8'), correct: 'ESTÁ ', name: 'ESTÃƒÂ ' },
  { wrong: Buffer.from('FunÃ§Ã£o', 'utf8'), correct: 'Função', name: 'FunÃ§Ã£o' },
  { wrong: Buffer.from('seÃ§Ã£o', 'utf8'), correct: 'seção', name: 'seÃ§Ã£o' },
  { wrong: Buffer.from('Botoes', 'utf8'), correct: 'Botões', name: 'Botoes' },
  { wrong: Buffer.from('Cabealho', 'utf8'), correct: 'Cabeçalho', name: 'Cabealho' }
];

let totalReplacements = 0;

patterns.forEach(({ wrong, correct, name }) => {
  let count = 0;
  let offset = 0;
  
  while ((offset = buffer.indexOf(wrong, offset)) !== -1) {
    // Substituir bytes
    const correctBuffer = Buffer.from(correct, 'utf8');
    
    // Criar novo buffer
    const before = buffer.slice(0, offset);
    const after = buffer.slice(offset + wrong.length);
    buffer = Buffer.concat([before, correctBuffer, after]);
    
    count++;
    offset += correctBuffer.length;
  }
  
  if (count > 0) {
    console.log(`✓ ${name} → ${correct} (${count}x)`);
    totalReplacements += count;
  }
});

if (totalReplacements > 0) {
  writeFileSync(filePath, buffer);
  console.log(`\n✅ Total de correções: ${totalReplacements}`);
  console.log('📁 Arquivo salvo!');
} else {
  console.log('\n⚠️ Nenhuma correção aplicada');
}
