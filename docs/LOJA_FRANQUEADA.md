# Site da Franqueada - Guia de Uso

## 🎯 Estrutura Criada

Foi implementado um site completo de e-commerce para as franqueadas em `/loja/[dominio]` com as seguintes funcionalidades:

### 📁 Páginas

1. **Home** (`/loja/[dominio]`)
   - Hero section com nome da loja
   - Seção de diferenciais (qualidade, preços, atendimento)
   - Grid com 6 produtos em destaque
   - Botão para ver catálogo completo

2. **Catálogo** (`/loja/[dominio]/produtos`)
   - Busca por nome ou categoria
   - Grid responsivo de produtos (1-4 colunas)
   - Contador de resultados
   - Loading skeleton
   - Estado vazio

3. **Produto Individual** (`/loja/[dominio]/produtos/[id]`)
   - Galeria de imagens com miniaturas
   - Informações completas (nome, preço, estoque, descrição)
   - Seletor de quantidade
   - Botão adicionar ao carrinho com feedback visual
   - Link direto para o carrinho após adicionar

4. **Carrinho** (`/loja/[dominio]/carrinho`)
   - Lista de produtos adicionados
   - Controles de quantidade (+/-)
   - Botão remover item
   - Resumo do pedido com total
   - Botões: Continuar comprando e Finalizar compra
   - Estado vazio com call-to-action

### 🎨 Componentes

- **LojaHeader**: Menu de navegação + logo + ícone carrinho com contador
- **LojaFooter**: Informações de contato e redes sociais
- **ProdutoCard**: Card de produto com imagem, preço e botão add carrinho

### 🔌 APIs

- `GET /api/loja/[dominio]/info` - Informações da loja e franqueada
- `GET /api/loja/[dominio]/produtos` - Lista de produtos ativos
- `GET /api/loja/[dominio]/produtos/[id]` - Detalhes de um produto

### 💾 State Management

- **Zustand Store** (`lib/store/carrinhoStore.ts`)
  - Persistência em localStorage
  - Funções: addItem, removeItem, updateQuantidade, clearCarrinho, getTotal, getTotalItens
  - Validação de estoque

### 🎨 Tema Dinâmico

O layout carrega as cores da tabela `lojas`:
- `cor_primaria` - Usado em header, botões principais, preços
- `cor_secundaria` - Usado em badges, botões secundários

As cores são aplicadas via CSS variables (`--cor-primaria`, `--cor-secundaria`)

## 🧪 Como Testar

### 1. Criar uma Loja de Teste

No Supabase, execute este SQL para criar uma loja de teste:

```sql
-- Criar loja de teste
INSERT INTO lojas (franqueada_id, dominio, nome, logo, cor_primaria, cor_secundaria, ativo)
VALUES (
  (SELECT id FROM franqueadas LIMIT 1), -- Pega primeira franqueada
  'teste',
  'Loja Teste',
  NULL,
  '#DB1472', -- Rosa C4
  '#F8B81F', -- Amarelo C4
  true
);
```

### 2. Verificar Produtos Vinculados

Certifique-se de que a franqueada tem produtos vinculados e ativos:

```sql
-- Ver produtos vinculados
SELECT 
  p.nome,
  pf.ativo_no_site,
  pfp.preco_final,
  p.estoque
FROM produtos_franqueadas pf
JOIN produtos p ON pf.produto_id = p.id
LEFT JOIN produtos_franqueadas_precos pfp ON pfp.produto_franqueada_id = pf.id
WHERE pf.franqueada_id = (SELECT franqueada_id FROM lojas WHERE dominio = 'teste')
  AND pf.ativo = true
LIMIT 10;
```

Se não houver produtos, use o botão **"🔄 Revincular Produtos"** na página de franqueadas do admin.

### 3. Ativar Produtos no Site

Se os produtos estiverem com `ativo_no_site = false`, ative-os:

```sql
-- Ativar produtos no site
UPDATE produtos_franqueadas
SET ativo_no_site = true
WHERE franqueada_id = (SELECT franqueada_id FROM lojas WHERE dominio = 'teste')
  AND ativo = true;
```

### 4. Acessar a Loja

Abra o navegador em:
```
http://localhost:3000/loja/teste
```

### 5. Testar Fluxo Completo

1. ✅ **Home**: Deve mostrar banner + produtos em destaque
2. ✅ **Ver Produtos**: Clicar no botão para ir ao catálogo
3. ✅ **Buscar**: Testar busca por nome de produto
4. ✅ **Ver Detalhes**: Clicar em um produto
5. ✅ **Adicionar ao Carrinho**: Escolher quantidade e adicionar
6. ✅ **Ver Carrinho**: Clicar no ícone do carrinho no header
7. ✅ **Alterar Quantidade**: Usar botões +/-
8. ✅ **Remover Item**: Testar botão de remover
9. ✅ **Continuar Comprando**: Voltar ao catálogo
10. ✅ **Finalizar Compra**: Verificar resumo (botão ainda não implementado)

## 🎨 Personalização de Cores

Para alterar as cores de uma loja específica:

```sql
UPDATE lojas
SET 
  cor_primaria = '#FF1493',  -- Sua cor primária
  cor_secundaria = '#FFD700'  -- Sua cor secundária
WHERE dominio = 'teste';
```

## 📱 Responsividade

O site é mobile-first e se adapta a todos os tamanhos:

- **Mobile**: Menu inferior fixo, 1 coluna de produtos
- **Tablet**: 2-3 colunas de produtos
- **Desktop**: 4 colunas de produtos, menu superior

## 🛒 Carrinho de Compras

O carrinho é persistido no localStorage como `c4-carrinho-storage`.

Para limpar o carrinho manualmente (console do navegador):
```javascript
localStorage.removeItem('c4-carrinho-storage');
```

## 🚀 Próximos Passos

1. **Finalização de Compra via WhatsApp**
   - Enviar mensagem formatada com itens do carrinho
   - Incluir link para pagamento

2. **Páginas Institucionais**
   - Sobre Nós
   - Contato
   - Política de Privacidade

3. **Melhorias**
   - Filtros por categoria
   - Ordenação (preço, nome, novidades)
   - Wishlist / Favoritos
   - Avaliações de produtos

## 📊 Monitoramento

Todas as APIs incluem logs detalhados no console. Para debugar:

1. Abra o DevTools (F12)
2. Vá em Console
3. Veja os logs de cada requisição:
   - `[INFO /api/loja/.../info]`
   - `[INFO /api/loja/.../produtos]`

## ⚠️ Troubleshooting

### Loja não encontrada
- Verifique se `lojas.ativo = true`
- Verifique se o domínio está correto

### Produtos não aparecem
- Verifique `produtos_franqueadas.ativo = true`
- Verifique `produtos_franqueadas.ativo_no_site = true`
- Use o botão "Revincular Produtos" no admin

### Carrinho não persiste
- Verifique localStorage no DevTools → Application → Local Storage
- Procure por `c4-carrinho-storage`

### Cores não aplicadas
- Verifique se `lojas.cor_primaria` e `lojas.cor_secundaria` estão preenchidas
- Use formato hexadecimal: `#RRGGBB`
