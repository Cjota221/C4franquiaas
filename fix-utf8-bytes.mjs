import { readFileSync, writeFileSync } from 'fs';

const file = 'app/revendedora/personalizacao/page.tsx';
let content = readFileSync(file, 'utf8');

console.log('🔍 Buscando TODOS os caracteres UTF-8 problemáticos...\n');

// Mostrar onde estão os problemas
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('Ã') || line.includes('ƒ') || line.includes('Â')) {
    console.log(`Linha ${i + 1}: ${line.substring(0, 100)}`);
  }
});

// Substituir caractere por caractere
content = content
  .replace(/ESTÃƒÂilos/g, 'Estilos')
  .replace(/ESTÃƒÂILOS/g, 'ESTILOS')
  .replace(/ESTÃƒÂilo/g, 'Estilo')
  // Remover qualquer sequência de bytes UTF-8 corrompidos
  .replace(/Ãƒ/g, '')
  .replace(/ÃƒÂ/g, '')
  .replace(/Â(?=[A-Z])/g, '') // Remove  antes de letras maiúsculas
  ;

// Salvar
writeFileSync(file, content, 'utf8');

console.log('\n✅ Arquivo limpo e salvo!');
