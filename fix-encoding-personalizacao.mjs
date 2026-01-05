import { readFileSync, writeFileSync } from 'fs';

const file = 'app/revendedora/personalizacao/page.tsx';
let content = readFileSync(file, 'utf8');

console.log('🔍 Limpando caracteres corrompidos...\n');

// Contar antes
const beforeCount = (content.match(/ï¿½/g) || []).length;
console.log(`❌ Encontrados ${beforeCount} caracteres corrompidos`);

// REMOVER/SUBSTITUIR todos os padrões problemáticos
content = content
  // Comentários em português - SIMPLIFICAR
  .replace(/\/\/ Novas opï¿½ï¿½es/g, '// Novas opcoes')
  .replace(/\/\/ Cor especï¿½fica do botï¿½o \(usa primary se nï¿½o definido\)/g, '// Cor do botao')
  .replace(/\/\/ Cor especï¿½fica do cabeï¿½alho \(usa primary se nï¿½o definido\)/g, '// Cor do cabecalho')
  .replace(/\/\/ Usa cor primï¿½ria por padrï¿½o/g, '// Usa cor primaria por padrao')
  .replace(/\/\/ ESTÃados para moderaï¿½ï¿½o de banners/g, '// Estados para moderacao de banners')
  .replace(/\/\/ Carregar submissï¿½es de banner/g, '// Carregar submissoes de banner')
  .replace(/\/\/ Logo vai direto, sem moderaï¿½ï¿½o/g, '// Logo vai direto, sem moderacao')
  .replace(/\/\/ Banners vï¿½o para moderaï¿½ï¿½o/g, '// Banners vao para moderacao')
  .replace(/\/\* Aviso de Moderaï¿½ï¿½o \*\//g, '/* Aviso de Moderacao */')
  .replace(/\/\* ESTÃilo do Cabeï¿½alho \*\//g, '/* Estilo do Cabecalho */')
  .replace(/\/\* Cor Personalizada do Cabeï¿½alho \*\//g, '/* Cor Personalizada do Cabecalho */')
  .replace(/\/\* Cor do Botï¿½o \*\//g, '/* Cor do Botao */')
  .replace(/\/\* Ã°Å¸âÂ Botï¿½o Criar Banner Personalizado \*\//g, '/* Botao Criar Banner Personalizado */')
  
  // Strings de erro e console
  .replace(/console\.error\("Erro ao carregar submissï¿½es:", error\);/g, 'console.error("Erro ao carregar submissoes:", error);')
  .replace(/throw new Error\("Usuï¿½rio nï¿½o autenticado"\);/g, 'throw new Error("Usuario nao autenticado");')
  
  // Document title
  .replace(/document\.title = `Personalizaï¿½ï¿½o - \$\{data\.store_name\} \| C4 Franquias`;/g, 'document.title = `Personalizacao - ${data.store_name} | C4 Franquias`;')
  
  // Alerts
  .replace(/alert\("Ã°Å¸âÂ Banner enviado para aprovaï¿½ï¿½o!\\n\\nVocï¿½ receberï¿½ uma notificaï¿½ï¿½o quando for aprovado\."\);/g, 'alert("Banner enviado para aprovacao!\\n\\nVoce recebera uma notificacao quando for aprovado.");')
  
  // Textos de UI (JSX)
  .replace(/Suas alteraï¿½ï¿½es foram aplicadas/g, 'Suas alteracoes foram aplicadas')
  .replace(/Aguardando aprovaï¿½ï¿½o/g, 'Aguardando aprovacao')
  .replace(/para vocï¿½!/g, 'para voce!')
  .replace(/ESTÃilos/g, 'Estilos')
  .replace(/Botï¿½es/g, 'Botoes')
  .replace(/Salvar Alteraï¿½ï¿½es/g, 'Salvar Alteracoes')
  .replace(/Frete grï¿½tis/g, 'Frete gratis')
  .replace(/ESTÃilo do Cabeï¿½alho/g, 'Estilo do Cabecalho')
  .replace(/Cor do Cabeï¿½alho/g, 'Cor do Cabecalho')
  .replace(/Diferente da cor primï¿½ria/g, 'Diferente da cor primaria')
  .replace(/primï¿½ria tambï¿½m/g, 'primaria tambem')
  .replace(/para o cabeï¿½alho para dESTÃacar/g, 'para o cabecalho para destacar')
  .replace(/ESTÃilo do Botï¿½o de Compra/g, 'Estilo do Botao de Compra')
  .replace(/Cor do Botï¿½o/g, 'Cor do Botao')
  .replace(/Opï¿½ï¿½es do Site/g, 'Opcoes do Site')
  .replace(/Banners passam por aprovaï¿½ï¿½o/g, 'Banners passam por aprovacao')
  .replace(/Banner aguardando aprovaï¿½ï¿½o/g, 'Banner aguardando aprovacao')
  .replace(/Enviar para aprovaï¿½ï¿½o/g, 'Enviar para aprovacao')
  .replace(/Enviar novo banner para aprovaï¿½ï¿½o/g, 'Enviar novo banner para aprovacao')
  .replace(/Botï¿½o WhatsApp Flutuante/g, 'Botao WhatsApp Flutuante')
  .replace(/botï¿½es/g, 'botoes')
  
  // Emojis corrompidos
  .replace(/Ã°Å¸âÂ /g, '')
  .replace(/ï¿½til quando sua logo ï¿½ escura e a cor /g, 'Util quando sua logo e escura e a cor ')
  
  // Placeholders
  .replace(/Ex: Ã°Å¸âÂ Frete grï¿½tis acima de R\$ 150!/g, 'Ex: Frete gratis acima de R$ 150!')
  
  // Qualquer caractere corrompido restante
  .replace(/ï¿½/g, '');

// Contar depois
const afterCount = (content.match(/ï¿½/g) || []).length;

console.log(`\n✅ Arquivo limpo!`);
console.log(`📊 Removidos: ${beforeCount - afterCount} caracteres corrompidos`);
console.log(`⚠️  Restantes: ${afterCount}`);

// Salvar
writeFileSync(file, content, 'utf8');

console.log('\n💾 Arquivo salvo com sucesso!');
