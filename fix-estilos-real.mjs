import { readFile, writeFile } from 'fs/promises';

const filePath = 'app/revendedora/personalizacao/page.tsx';

try {
  // Ler arquivo como buffer para ver bytes reais
  const buffer = await readFile(filePath);
  let content = buffer.toString('utf8');
  
  console.log('🔍 Procurando "ilos" no arquivo...\n');
  
  const lines = content.split('\n');
  let foundIssues = 0;
  
  lines.forEach((line, index) => {
    if (line.includes('ilos')) {
      console.log(`Linha ${index + 1}:`);
      console.log(line);
      console.log('Bytes:', Buffer.from(line).toString('hex'));
      console.log('');
      foundIssues++;
    }
  });
  
  console.log(`\n📊 Total de linhas com "ilos": ${foundIssues}\n`);
  
  // Substituições específicas com regex para pegar todas as variações
  const replacements = [
    // Estilos corrupted variations
    [/EST[ÃƒÂ]+ilos/gi, 'Estilos'],
    [/EST[ÃƒÂ]+ILOS/g, 'ESTILOS'],
    // Função
    [/Fun[ÃƒÂ§]+[ÃƒÂ£]+o/g, 'Função'],
    // seção  
    [/se[ÃƒÂ§]+[ÃƒÂ£]+o/g, 'seção'],
    // Estados
    [/EST[ÃƒÂ]+ados/g, 'Estados'],
    // submissões
    [/submiss[ÃƒÂµ]+es/g, 'submissões'],
    // sugestões
    [/sug EST[ÃƒÂ]+es/g, 'sugestões'],
    [/SugEST[ÃƒÂ]+es/g, 'Sugestões'],
    // ESTÁ
    [/EST[ÃƒÂ]+\s/g, 'ESTÁ '],
    // Botões
    [/Bot[ÃƒÂµ]+es/g, 'Botões'],
    [/Boto/g, 'Botão'],
    // Cabeçalho
    [/Cabealho/g, 'Cabeçalho'],
    // Anúncion
    [/Ann[Ãƒ]+cion/g, 'Anúncios']
  ];
  
  let originalContent = content;
  
  replacements.forEach(([pattern, replacement]) => {
    const before = content;
    content = content.replace(pattern, replacement);
    if (content !== before) {
      console.log(`✓ Aplicado: ${pattern} → ${replacement}`);
    }
  });
  
  if (content !== originalContent) {
    await writeFile(filePath, content, 'utf8');
    console.log('\n✅ Arquivo corrigido e salvo!');
  } else {
    console.log('\n⚠️ Nenhuma mudança aplicada');
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}
