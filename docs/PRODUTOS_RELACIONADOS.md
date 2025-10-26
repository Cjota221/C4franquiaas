# 🎯 Sistema de Produtos Relacionados

## 📋 O que foi implementado

Um sistema inteligente que sugere produtos similares aos clientes, aumentando as chances de vendas adicionais.

## 🌟 Onde aparece

### 1. **Página de Produto**
- Aparece logo abaixo dos detalhes do produto
- Título: "Produtos Relacionados"
- Subtítulo: "Você também pode gostar destes produtos"
- Mostra até **6 produtos** similares

### 2. **Carrinho de Compras**
- Aparece no final da página do carrinho
- Título: "Complete seu look"
- Subtítulo: "Produtos que combinam com o seu carrinho"
- Baseado no **primeiro item** do carrinho
- Mostra até **6 produtos** similares

## 🧠 Como funciona a Inteligência

O sistema calcula um **score de relevância** para cada produto usando 3 critérios:

### 1. **Mesma Categoria** (+10 pontos)
- Produtos da mesma categoria têm prioridade máxima
- Exemplo: Se você está vendo uma camiseta, mostra outras camisetas

### 2. **Faixa de Preço Similar** (+5 pontos)
- Produtos com preço ±30% do produto atual
- Exemplo: Produto de R$ 100 → mostra produtos entre R$ 70 e R$ 130

### 3. **Cores em Comum** (+3 pontos por cor)
- Produtos que compartilham cores
- Exemplo: Produto azul/branco → mostra outros produtos azuis ou brancos

### 🎯 Ordenação Final
Os produtos são ordenados por score (do maior para o menor) e os **top 6** são exibidos.

## 🎨 Design Responsivo

### Mobile (Celular)
- Grade de **2 colunas**
- Scroll horizontal suave
- Dica: "← Deslize para ver mais →"

### Tablet
- Grade de **3 colunas**

### Desktop
- Grade de **6 colunas** (mostra todos de uma vez)

## ✨ Interatividade

Cada card de produto tem:

1. **Imagem** com hover effect (zoom suave)
2. **Badge "Ver Produto"** aparece no hover
3. **Nome** do produto (muda de cor no hover)
4. **Preço** destacado na cor primária da loja
5. **Link direto** para a página do produto

## 🔧 Arquivos Criados

### API
```
app/api/produtos/relacionados/[id]/route.ts
```
- Recebe ID do produto
- Busca informações do produto
- Calcula scores de similaridade
- Retorna top 6 produtos

### Componente
```
components/loja/ProdutosRelacionados.tsx
```
- Componente reutilizável
- Props: produtoId, dominio, titulo, subtitulo
- Loading state
- Grid responsivo

### Integrações
```
app/loja/[dominio]/produto/[id]/page.tsx (linha ~1055)
app/loja/[dominio]/carrinho/page.tsx (linha ~295)
```

## 📊 Exemplo de Uso

### Na Página de Produto
```tsx
<ProdutosRelacionados
  produtoId={produto.id}
  dominio={dominio}
  titulo="Produtos Relacionados"
  subtitulo="Você também pode gostar destes produtos"
/>
```

### No Carrinho
```tsx
<ProdutosRelacionados
  produtoId={itens[0].id}  // Primeiro item do carrinho
  dominio={dominio}
  titulo="Complete seu look"
  subtitulo="Produtos que combinam com o seu carrinho"
/>
```

## 🎯 Personalização Futura

Você pode facilmente ajustar:

1. **Número de produtos**: Mudar `.slice(0, 6)` na API
2. **Pesos dos critérios**: Ajustar os scores (+10, +5, +3)
3. **Faixa de preço**: Mudar 0.7 e 1.3 (atualmente ±30%)
4. **Textos**: Passar props `titulo` e `subtitulo` diferentes

## 🚀 Benefícios

✅ **Aumenta vendas**: Sugere produtos que o cliente pode não ter visto  
✅ **Melhora navegação**: Cliente descobre produtos similares facilmente  
✅ **Inteligente**: Usa categoria, preço e cores para sugestões relevantes  
✅ **Responsivo**: Funciona perfeitamente em mobile e desktop  
✅ **Rápido**: Cache automático do Next.js  
✅ **Reutilizável**: Mesmo componente em produto e carrinho  

## 💡 Dicas de Uso

1. **Categorize bem seus produtos**: A categoria é o critério mais importante
2. **Configure cores**: Produtos com cores definidas terão melhores sugestões
3. **Preços equilibrados**: Produtos com preços similares aparecem juntos
4. **Imagens de qualidade**: As thumbnails aparecem bem pequenas, use imagens nítidas

---

📅 **Criado**: 26/10/2025  
🔗 **Relacionado**: Sistema de carrinho, Página de produto  
🎯 **Objetivo**: Aumentar ticket médio e cross-selling
