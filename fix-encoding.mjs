import { readFileSync, writeFileSync } from 'fs';

const file = 'c:\\Users\\carol\\c4-franquias-admin\\app\\revendedora\\personalizacao\\page.tsx';

// Ler arquivo
let content = readFileSync(file, 'latin1');

// Substituir caracteres quebrados por versões corretas
content = content
  .replace(/op��es/g, 'opções')
  .replace(/espec�fica/g, 'específica')
  .replace(/bot�o/g, 'botão')
  .replace(/cabe�alho/g, 'cabeçalho')
  .replace(/prim�ria/g, 'primária')
  .replace(/padr�o/g, 'padrão')
  .replace(/modera��o/g, 'moderação')
  .replace(/submiss�es/g, 'submissões')
  .replace(/Personaliza��o/g, 'Personalização')
  .replace(/t�tulo/g, 'título')
  .replace(/p�gina/g, 'página')
  .replace(/Usu�rio/g, 'Usuário')
  .replace(/aprova��o/g, 'aprovação')
  .replace(/notifica��o/g, 'notificação')
  .replace(/altera��es/g, 'alterações')
  .replace(/CAT�LOGO/g, 'CATÁLOGO')
  .replace(/VIS�VEL/g, 'VISÍVEL')
  .replace(/DESCRI��O/g, 'DESCRIÇÃO')
  .replace(/voc�!/g, 'você!')
  .replace(/Bot�es/g, 'Botões')
  .replace(/gr�tis/g, 'grátis')
  .replace(/SEÇÃO/g, 'SEÇÃO')
  // Corrigir erros do replace anterior
  .replace(/ESTÁados/g, 'Estados')
  .replace(/usESTÁate/g, 'useState')
  // Corrigir emojis
  .replace(/ðŸ"/g, '📝')
  .replace(/\?\? /g, '📝 ');

// Salvar com UTF-8
writeFileSync(file, content, 'utf8');

console.log('✅ Arquivo corrigido com sucesso!');
