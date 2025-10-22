# 🎨 Sistema de Produtos Melhorado - Franqueadas

## ✨ O que foi implementado

### 1. 🖼️ Galeria de Imagens
- **Carrossel interativo** com todas as fotos de cada produto
- **Navegação por setas** (aparecem ao passar o mouse)
- **Indicador de posição** (ex: 2/5)
- **Miniaturas clicáveis** abaixo da imagem principal
- Fallback para ícone caso não tenha imagens

### 2. 💰 Visualização Clara de Preços

**Fluxo Visual em 3 Etapas:**

```
💰 Preço Base C4  →  📈 Sua Margem  →  ✨ Preço Final
   R$ 100,00          +20%              R$ 120,00
                   (= R$ 20,00)
```

**Cores:**
- Preço Base: Cinza (referência C4)
- Sua Margem: Amarelo #F8B81F (destaque)
- Preço Final: Verde (preço de venda)

**Informações da Margem:**
- Mostra o tipo (% ou R$ fixo)
- Calcula valor em reais
- Calcula percentual equivalente

### 3. 🎯 Fluxo em 2 Etapas (Obrigatório)

#### Passo 1: Definir Margem
- Badge amarelo: "⚠️ Defina a margem"
- Borda amarela no card
- Mensagem explicativa: "Passo 1: Defina a margem usando o botão 'Ajustar Preços'"
- **Não permite ativar sem margem!**

#### Passo 2: Ativar Produto
- Badge azul: "💎 Pronto para ativar"
- Borda azul no card
- Botão "🚀 Ativar Agora" com animação pulse
- Após ativar: Badge verde "✓ Ativo na loja"

### 4. 📊 Estatísticas Atualizadas

**4 Cards no Dashboard:**
1. **Total de Produtos** - Todos vinculados
2. **⚠️ Sem Margem** - Produtos que precisam de margem (amarelo)
3. **💎 Prontos p/ Ativar** - Com margem mas inativos (azul)
4. **✓ Ativos no Site** - Publicados na loja (verde)

---

## 🎯 Como Funciona na Prática

### Para a Franqueada:

#### 1️⃣ Acessa `/franqueada/produtos`
- Vê todos os produtos vinculados pelo admin
- Produtos sem margem têm borda amarela
- Galeria de fotos visível

#### 2️⃣ Define Margens
**Individual:**
- Seleciona 1 produto
- Clica em "Ajustar Preços (1)"
- Define tipo (% ou R$)
- Aplica

**Em Massa:**
- Seleciona múltiplos produtos
- Clica em "Ajustar Preços (X)"
- Define margem única
- Aplica para todos

#### 3️⃣ Ativa Produtos
- Card fica azul com "💎 Pronto para ativar"
- Botão "🚀 Ativar Agora" piscando
- Clica para publicar
- Card fica verde "✓ Ativo na loja"

---

## 🚫 Validações Implementadas

### ❌ Não Pode Ativar Sem Margem
```typescript
if (ativo && produto.ajuste_tipo === null) {
  alert('⚠️ Defina a margem de lucro antes de ativar o produto!');
  return;
}
```

**Por quê?**
- Garante que a franqueada sempre terá lucro
- Evita vender pelo preço base (sem margem)
- Workflow claro: definir → ativar

---

## 🎨 Componentes Criados

### `ImageGallery`
```tsx
<ImageGallery imagens={produto.imagens} nome={produto.nome} />
```

**Features:**
- Carrossel automático de imagens
- Navegação com setas
- Miniaturas para acesso rápido
- Indicador de posição
- Responsivo

---

## 📱 Interface Visual

### Card de Produto

```
┌─────────────────────────────────────────────────────────────┐
│ ☑️  [Galeria]   Nome do Produto                     [Ações] │
│                 ⚠️ Defina a margem  Estoque: 50             │
│                                                               │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ 💰 Base C4  →  📈 Margem    →  ✨ Final           │ │
│     │ R$ 100,00      +20%            R$ 120,00            │ │
│     │                (= R$ 20,00)                          │ │
│     └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Estados Visuais

**1. Sem Margem (Amarelo):**
- Borda: `border-yellow-400`
- Badge: "⚠️ Defina a margem"
- Ação: Mensagem explicativa

**2. Com Margem, Inativo (Azul):**
- Borda: `border-gray-300`
- Badge: "💎 Pronto para ativar"
- Ação: Botão azul "🚀 Ativar Agora" (pulsando)

**3. Ativo (Verde):**
- Borda: `border-green-400`
- Badge: "✓ Ativo na loja"
- Ação: Botão verde "✓ Ativo no Site"

---

## 🔄 Fluxo de Dados

### Carregamento de Produtos
```sql
SELECT 
  pf.id,
  p.nome,
  p.preco_base,
  p.imagens,  -- ← Array de URLs
  pfp.ajuste_tipo,
  pfp.ajuste_valor,
  pfp.preco_final,
  pfp.ativo_no_site
FROM produtos_franqueadas pf
JOIN produtos p ON p.id = pf.produto_id
LEFT JOIN produtos_franqueadas_precos pfp ON pfp.produto_franqueada_id = pf.id
WHERE pf.franqueada_id = ?
```

### Processamento de Imagens
```typescript
let imagensArray: string[] = [];
if (produto.imagens && Array.isArray(produto.imagens)) {
  imagensArray = produto.imagens;
} else if (produto.imagem) {
  imagensArray = [produto.imagem];
}
```

---

## 🎯 Benefícios do Sistema

### Para a Franqueada:
✅ Vê todas as fotos do produto
✅ Entende claramente sua margem de lucro
✅ Sabe exatamente quanto vai ganhar
✅ Fluxo guiado (não esquece de definir margem)
✅ Visual profissional e intuitivo

### Para o Negócio:
✅ Garante que produtos sempre têm margem
✅ Evita vendas sem lucro
✅ Workflow padronizado
✅ Reduz erros de precificação
✅ Interface auto-explicativa (menos suporte)

---

## 🧪 Como Testar

### 1. Produto Sem Margem
```
1. Acesse /franqueada/produtos
2. Veja produto com borda amarela
3. Tente clicar em "Ativo" → Alerta de erro
4. Mensagem: "⚠️ Defina a margem de lucro antes de ativar o produto!"
```

### 2. Definir Margem
```
1. Selecione produto
2. Clique "Ajustar Preços"
3. Escolha "Porcentagem"
4. Digite "25"
5. Aplique
6. Veja: Base R$ 100 → +25% → Final R$ 125
```

### 3. Ativar Produto
```
1. Card fica azul
2. Botão "🚀 Ativar Agora" piscando
3. Clique
4. Card fica verde
5. Badge: "✓ Ativo na loja"
```

### 4. Galeria de Imagens
```
1. Passe o mouse sobre a imagem
2. Veja setas aparecerem
3. Clique nas setas para navegar
4. Clique nas miniaturas
5. Veja indicador "2/5" etc
```

---

## 🚀 Próximos Passos

### Implementar:
- [ ] Página pública `/loja/[dominio]`
- [ ] Sistema de vendas
- [ ] Cálculo de comissões
- [ ] Relatórios de performance

---

## 📄 Arquivos Modificados

- `app/franqueada/produtos/page.tsx` - Interface completa
- `docs/PRODUTOS_MELHORADOS.md` - Esta documentação

---

## 🎨 Cores do Sistema

- **Primary (Rosa):** `#DB1472`
- **Secondary (Amarelo):** `#F8B81F`
- **Sucesso (Verde):** `#10B981` (Tailwind green-500)
- **Atenção (Amarelo):** `#F59E0B` (Tailwind yellow-500)
- **Info (Azul):** `#3B82F6` (Tailwind blue-600)

---

## 💡 Dicas de UX

1. **Animação Pulse** no botão "Ativar" chama atenção
2. **Cores progressivas**: Amarelo → Azul → Verde = Workflow visual
3. **Bordas coloridas** identificam status rapidamente
4. **Badges** resumem estado em 1 olhada
5. **Galeria** permite ver produto de todos os ângulos

---

Última atualização: 21 de outubro de 2025
