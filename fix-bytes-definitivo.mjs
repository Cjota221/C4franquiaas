import { readFileSync, writeFileSync } from 'fs';

const filePath = 'app/revendedora/personalizacao/page.tsx';

console.log('🔧 Corrigindo bytes UTF-8 corrompidos c3 83 c2 81...\n');

let buffer = readFileSync(filePath);

// Todos os padrões com os bytes corrompidos c3 83 c2 81 (ÃÁ)
const bytesCorruptos = [0xc3, 0x83, 0xc2, 0x81];

const corrections = [
  // EST + bytes corrompidos + ados = Estados
  { 
    wrong: Buffer.from([0x45, 0x53, 0x54, ...bytesCorruptos, 0x61, 0x64, 0x6f, 0x73]), 
    correct: 'Estados' 
  },
  // EST + bytes corrompidos + ILOS = ESTILOS
  { 
    wrong: Buffer.from([0x45, 0x53, 0x54, ...bytesCorruptos, 0x49, 0x4c, 0x4f, 0x53]), 
    correct: 'ESTILOS' 
  },
  // EST + bytes corrompidos + ilo = Estilo
  { 
    wrong: Buffer.from([0x45, 0x53, 0x54, ...bytesCorruptos, 0x69, 0x6c, 0x6f]), 
    correct: 'Estilo' 
  },
  // EST + bytes corrompidos + espaço = ESTÁ
  { 
    wrong: Buffer.from([0x45, 0x53, 0x54, ...bytesCorruptos, 0x20]), 
    correct: 'ESTÁ ' 
  },
  // sugEST + bytes corrompidos + es = sugestões
  { 
    wrong: Buffer.from([0x73, 0x75, 0x67, 0x45, 0x53, 0x54, ...bytesCorruptos, 0x65, 0x73]), 
    correct: 'sugestões' 
  },
  // SugEST + bytes corrompidos + es = Sugestões
  { 
    wrong: Buffer.from([0x53, 0x75, 0x67, 0x45, 0x53, 0x54, ...bytesCorruptos, 0x65, 0x73]), 
    correct: 'Sugestões' 
  },
  // dEST + bytes corrompidos + acar = destacar
  { 
    wrong: Buffer.from([0x64, 0x45, 0x53, 0x54, ...bytesCorruptos, 0x61, 0x63, 0x61, 0x72]), 
    correct: 'destacar' 
  },
  // EST + bytes corrompidos + e = este
  { 
    wrong: Buffer.from([0x45, 0x53, 0x54, ...bytesCorruptos, 0x65]), 
    correct: 'este' 
  }
];

let totalFixed = 0;

corrections.forEach(({ wrong, correct }, index) => {
  let count = 0;
  let offset = 0;
  
  while ((offset = buffer.indexOf(wrong, offset)) !== -1) {
    const correctBuffer = Buffer.from(correct, 'utf8');
    const before = buffer.slice(0, offset);
    const after = buffer.slice(offset + wrong.length);
    buffer = Buffer.concat([before, correctBuffer, after]);
    
    count++;
    offset += correctBuffer.length;
  }
  
  if (count > 0) {
    console.log(`✓ Correção ${index + 1}: ${correct} (${count}x)`);
    totalFixed += count;
  }
});

if (totalFixed > 0) {
  writeFileSync(filePath, buffer);
  console.log(`\n✅ Total de correções: ${totalFixed}`);
  console.log('📁 Arquivo salvo!');
  
  // Verificação final
  const content = buffer.toString('utf8');
  const remainingESTA = (content.match(/ESTÃ/g) || []).length;
  console.log(`\n📊 Verificação final: ${remainingESTA} "ESTÃ" restantes`);
  
  if (remainingESTA === 0) {
    console.log('🎉 TODOS OS PROBLEMAS CORRIGIDOS!');
  }
} else {
  console.log('\n⚠️ Nenhuma correção aplicada');
}
