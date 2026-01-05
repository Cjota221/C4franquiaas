import { readFileSync, writeFileSync } from 'fs';

const filePath = 'app/revendedora/personalizacao/page.tsx';

console.log('🔧 Corrigindo TODOS os "ESTÃ" restantes...\n');

let buffer = readFileSync(filePath);

// Lista de correções baseadas nos erros encontrados
const corrections = [
  // Estados (linhas 118, 121)
  { wrong: 'ESTÃados', correct: 'Estados', name: 'ESTÃados → Estados' },
  
  // ESTÁ (linha 450)
  { wrong: 'ESTÃ FIXO', correct: 'ESTÁ FIXO', name: 'ESTÃ → ESTÁ' },
  { wrong: 'ESTÃ ', correct: 'ESTÁ ', name: 'ESTÃ (com espaço)' },
  
  // ESTILOS (linha 543)  
  { wrong: 'ESTÃILOS', correct: 'ESTILOS', name: 'ESTÃILOS → ESTILOS' },
  
  // Estilo (linhas 706, 708, 760, 807)
  { wrong: 'ESTÃilo', correct: 'Estilo', name: 'ESTÃilo → Estilo' },
  
  // destacar (linha 752)
  { wrong: 'dESTÃacar', correct: 'destacar', name: 'dESTÃacar → destacar' },
  
  // sugestões (linhas 859, 869)
  { wrong: 'sugESTÃes', correct: 'sugestões', name: 'sugESTÃes → sugestões' },
  { wrong: 'SugESTÃes', correct: 'Sugestões', name: 'SugESTÃes → Sugestões' },
  
  // este (linhas 1154, 1237)
  { wrong: 'ESTÃe', correct: 'este', name: 'ESTÃe → este' },
  
  // Outras palavras comuns que podem estar corrompidas
  { wrong: 'moderao', correct: 'moderação', name: 'moderao → moderação' },
  { wrong: 'pgina', correct: 'página', name: 'pgina → página' },
  { wrong: 'Botãoes', correct: 'Botões', name: 'Botãoes → Botões' },
  { wrong: 'tambem', correct: 'também', name: 'tambem → também' }
];

let totalFixed = 0;

corrections.forEach(({ wrong, correct, name }) => {
  const wrongBuffer = Buffer.from(wrong, 'utf8');
  let count = 0;
  let offset = 0;
  
  while ((offset = buffer.indexOf(wrongBuffer, offset)) !== -1) {
    const correctBuffer = Buffer.from(correct, 'utf8');
    const before = buffer.slice(0, offset);
    const after = buffer.slice(offset + wrongBuffer.length);
    buffer = Buffer.concat([before, correctBuffer, after]);
    
    count++;
    offset += correctBuffer.length;
  }
  
  if (count > 0) {
    console.log(`✓ ${name} (${count}x)`);
    totalFixed += count;
  }
});

if (totalFixed > 0) {
  writeFileSync(filePath, buffer);
  console.log(`\n✅ Total de correções: ${totalFixed}`);
  console.log('📁 Arquivo salvo!');
} else {
  console.log('\n⚠️ Nenhuma correção aplicada');
}

// Verificar se ainda tem problemas
const content = buffer.toString('utf8');
const remainingESTA = (content.match(/ESTÃ/g) || []).length;
console.log(`\n📊 Verificação: ${remainingESTA} "ESTÃ" restantes`);
