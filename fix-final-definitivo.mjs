import { readFile, writeFile } from 'fs/promises';

const filePath = 'app/revendedora/personalizacao/page.tsx';

try {
  let content = await readFile(filePath, 'utf8');
  
  console.log('🔍 Corrigindo caracteres corrompidos...\n');
  
  // O problema real: EST + bytes UTF-8 corrompidos + ilos
  // Bytes c383c281 = ÃÁ em UTF-8
  const originalContent = content;
  
  // SUBSTITUIÇÕES EXATAS baseadas nos bytes que encontramos
  const fixes = [
    ['ESTÃÁilos', 'Estilos'],
    ['ESTÃÁILOS', 'ESTILOS'], 
    ['ESTÃÁe', 'Este'],
    ['ESTÃÁilo', 'Estilo'],
    ['ESTÃÁados', 'Estados'],
    ['ESTÃ ', 'ESTÁ '],
    ['FunÃ§Ã£o', 'Função'],
    ['seÃ§Ã£o', 'seção'],
    ['submissÃµes', 'submissões'],
    ['sugESTÃes', 'sugestões'],
    ['SugESTÃes', 'Sugestões'],
    ['BotÃµes', 'Botões'],
    ['BotÃ£o', 'Botão'],
    ['Botoes', 'Botões'],
    ['Boto ', 'Botão '],
    ['Cabealho', 'Cabeçalho'],
    ['Anncion', 'Anúncios']
  ];
  
  fixes.forEach(([wrong, correct]) => {
    const count = (content.match(new RegExp(wrong, 'g')) || []).length;
    if (count > 0) {
      content = content.replaceAll(wrong, correct);
      console.log(`✓ ${wrong} → ${correct} (${count}x)`);
    }
  });
  
  if (content !== originalContent) {
    await writeFile(filePath, content, 'utf8');
    console.log('\n✅ Arquivo salvo!');
    console.log('\n📋 Verificação:');
    const remainingIlos = (content.match(/ilos/gi) || []).length;
    console.log(`   - "ilos" encontrados: ${remainingIlos}`);
    const estilos = (content.match(/Estilos/g) || []).length;
    console.log(`   - "Estilos" corretos: ${estilos}`);
  } else {
    console.log('\n⚠️ Nenhuma correção aplicada');
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}
