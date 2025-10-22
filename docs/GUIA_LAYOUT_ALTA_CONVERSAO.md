# 🚀 Guia de Implementação - Layout de Alta Conversão (Mobile-First)

## 📋 Visão Geral

Este guia documenta a implementação do novo layout de e-commerce focado em **conversão mobile** (80% do tráfego), seguindo o briefing da Janai.

**Criado em**: 22 de outubro de 2025  
**Stack**: React + Next.js + Tailwind CSS + TypeScript

---

## 🎯 Componentes Criados

### 1️⃣ ProductCard.tsx
**Localização**: `components/ProductCard.tsx`

**Características Principais**:
- ✅ **Imagens 1:1** (aspect-square) - Quadradas, sem distorção
- ✅ **object-fit: cover** - Preenchimento total da imagem
- ✅ **Hover Desktop** - Troca para 2ª imagem ao passar o mouse
- ✅ **Dots Mobile** - Indicadores para navegar entre imagens
- ✅ **Badge de Desconto** - Mostra % de desconto automaticamente
- ✅ **Tag Customizável** - "PROMO", "BESTSELLER", etc.
- ✅ **mt-auto no botão** - Botão sempre alinhado na parte inferior

**Props**:
```typescript
interface ProductCardProps {
  id: string;
  nome: string;
  preco_final: number;
  preco_base?: number;        // Preço "de" riscado
  imagens: string[];          // Array de URLs
  slug?: string;
  tag?: string;               // Badge
  parcelamento?: string;      // "6x de R$ 41,65"
  dominio: string;
}
```

**Exemplo de Uso**:
```tsx
<ProductCard
  id="123"
  nome="Scarpin Clássico Nude"
  preco_final={249.90}
  preco_base={299.90}
  imagens={[
    "https://example.com/img1.jpg",
    "https://example.com/img2.jpg",
    "https://example.com/img3.jpg"
  ]}
  tag="PROMO"
  parcelamento="ou 6x de R$ 41,65 s/ juros"
  dominio="cjotarasteirinhas"
/>
```

---

### 2️⃣ ProductGrid.tsx
**Localização**: `components/ProductGrid.tsx`

**Grid Responsivo** (Requisito Principal do Briefing):
```css
Mobile (default):  grid-cols-2
Tablet (md:):      md:grid-cols-3
Desktop (lg:):     lg:grid-cols-4
```

**Props**:
```typescript
interface ProductGridProps {
  produtos: Produto[];
  dominio: string;
  titulo?: string;        // Ex: "Os Mais Amados"
  subtitulo?: string;     // Ex: "Confira nossos bestsellers"
}
```

**Exemplo de Uso**:
```tsx
<ProductGrid
  produtos={listaDeProdutos}
  dominio="cjotarasteirinhas"
  titulo="Os Mais Amados"
  subtitulo="Produtos que nossas clientes adoram"
/>
```

---

### 3️⃣ BuyBox.tsx
**Localização**: `components/BuyBox.tsx`

**Características**:
- ✅ **Seleção de Cores** - Com swatches (hex colors)
- ✅ **Seleção de Tamanhos** - Grid responsivo
- ✅ **Validação Obrigatória** - Alerta se não selecionar tamanho
- ✅ **Integração com Variações** - Suporta estoque por tamanho/cor
- ✅ **Controle de Quantidade** - Com limites de estoque
- ✅ **Trust Badges** - Frete Grátis, Troca Fácil, Compra Segura
- ✅ **Loading State** - "Adicionando..." ao clicar
- ✅ **Callback para Galeria** - Troca imagem ao selecionar cor

**Props**:
```typescript
interface BuyBoxProps {
  produtoId: string;
  nome: string;
  preco_final: number;
  preco_base?: number;
  cores?: Cor[];              // Array de cores
  variacoes?: Variacao[];     // Variações complexas
  tamanhos?: string[];        // Tamanhos simples
  parcelamento?: string;
  estoque: number;
  onAddToCart: (data) => void;
  onChangeColor?: (cor) => void;  // Callback para galeria
}
```

**Tipos de Variações Suportados**:

**Opção 1 - Simples** (Recomendada):
```typescript
const cores = [
  { nome: "Nude", hex: "#E0BBAA", imagem_url: "url-foto-nude.jpg" },
  { nome: "Preto", hex: "#000000", imagem_url: "url-foto-preta.jpg" }
];

const tamanhos = ["34", "35", "36", "37", "38", "39"];
```

**Opção 2 - Complexa** (Padrão E-commerce):
```typescript
const variacoes = [
  { id: "101", sku: "SCP-NU-34", tamanho: "34", cor: "Nude", estoque: 10 },
  { id: "102", sku: "SCP-NU-35", tamanho: "35", cor: "Nude", estoque: 0 },
  { id: "103", sku: "SCP-PR-34", tamanho: "34", cor: "Preto", estoque: 5 }
];
```

**Exemplo de Uso**:
```tsx
<BuyBox
  produtoId="123"
  nome="Scarpin Clássico Nude"
  preco_final={249.90}
  preco_base={299.90}
  cores={cores}
  tamanhos={tamanhos}
  parcelamento="ou 6x de R$ 41,65 s/ juros"
  estoque={50}
  onAddToCart={(data) => {
    console.log('Adicionar ao carrinho:', data);
    // Integrar com seu sistema de carrinho
  }}
  onChangeColor={(cor) => {
    console.log('Trocar para cor:', cor.nome);
    // Atualizar imagem principal na galeria
  }}
/>
```

---

## 🎨 Paleta de Cores Padrão

```css
Primária (Rosa):     #DB1472
Secundária (Amarela): #F8B81F
Texto Principal:     #1F2937 (gray-900)
Texto Secundário:    #6B7280 (gray-600)
Fundo:               #FFFFFF
Borda:               #E5E7EB (gray-200)
```

---

## 📱 Breakpoints Tailwind

```css
sm:  640px   (Pequeno mobile)
md:  768px   (Tablet)
lg:  1024px  (Desktop)
xl:  1280px  (Desktop grande)
2xl: 1536px  (Ultra-wide)
```

**Nossa Estratégia** (Mobile-First):
- **Default** (< 768px): Mobile
- **md:** (≥ 768px): Tablet
- **lg:** (≥ 1024px): Desktop

---

## 🔧 Configurações Necessárias no Backend

### Produto (Schema Completo):

```typescript
interface Produto {
  // Básico
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  
  // Preços
  preco_final: number;
  preco_base?: number;         // "De" riscado
  parcelamento?: string;
  
  // Imagens (ARRAY COMPLETO)
  imagens: string[];           // Todas as fotos do produto
  
  // Variações
  cores?: Cor[];
  variacoes?: Variacao[];
  tamanhos?: string[];
  
  // Estoque
  estoque: number;
  
  // Marketing
  tag?: string;                // "PROMO", "NOVO", "BESTSELLER"
  ativo: boolean;
}

interface Cor {
  nome: string;
  hex: string;
  imagem_url?: string;         // URL da foto principal desta cor
}

interface Variacao {
  id: string;
  sku: string;
  tamanho: string;
  cor?: string;
  estoque: number;
  codigo_barras?: string;
}
```

---

## 🚀 Como Integrar na Sua Loja Existente

### 1. Atualizar a Página de Listagem (PLP)

**Arquivo**: `app/loja/[dominio]/produtos/page.tsx`

```tsx
import ProductGrid from '@/components/ProductGrid';

export default function ProdutosPage({ params }) {
  const [produtos, setProdutos] = useState([]);
  
  useEffect(() => {
    // Buscar produtos da API
    fetch(`/api/loja/${params.dominio}/produtos`)
      .then(res => res.json())
      .then(data => setProdutos(data.produtos));
  }, [params.dominio]);

  return (
    <div className="container mx-auto px-4">
      <ProductGrid
        produtos={produtos}
        dominio={params.dominio}
        titulo="Todos os Produtos"
      />
    </div>
  );
}
```

### 2. Atualizar a Página de Produto (PDP)

**Arquivo**: `app/loja/[dominio]/produtos/[id]/page.tsx`

```tsx
import BuyBox from '@/components/BuyBox';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';

export default function ProdutoDetalhePage({ params }) {
  const [produto, setProduto] = useState(null);
  const addItem = useCarrinhoStore(state => state.addItem);
  
  const handleAddToCart = (data) => {
    addItem({
      id: data.produtoId,
      nome: produto.nome,
      preco: produto.preco_final,
      quantidade: data.quantidade,
      imagem: produto.imagens[0],
      estoque: produto.estoque,
      variacaoId: data.variacaoId,
      cor: data.cor,
      tamanho: data.tamanho
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Galeria de Imagens (Esquerda) */}
      <div>
        {/* Seu componente de galeria existente */}
      </div>

      {/* BuyBox (Direita) */}
      <div>
        <BuyBox
          produtoId={produto.id}
          nome={produto.nome}
          preco_final={produto.preco_final}
          preco_base={produto.preco_base}
          cores={produto.cores}
          variacoes={produto.variacoes_meta}
          parcelamento={produto.parcelamento}
          estoque={produto.estoque}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  );
}
```

---

## 🎯 Checklist de Implementação

### Backend (API)
- [ ] API retorna `imagens` como **array** (não apenas 1 imagem)
- [ ] API retorna `preco_base` para calcular desconto
- [ ] API retorna `tag` para badges ("PROMO", "NOVO")
- [ ] API retorna `parcelamento` formatado
- [ ] API retorna `variacoes_meta` com estoque por tamanho/cor
- [ ] API retorna `slug` para URLs amigáveis

### Frontend
- [ ] Instalar `lucide-react`: `npm install lucide-react`
- [ ] Copiar componentes para `/components`:
  - `ProductCard.tsx`
  - `ProductGrid.tsx`
  - `BuyBox.tsx`
- [ ] Atualizar página de listagem com `<ProductGrid />`
- [ ] Atualizar página de produto com `<BuyBox />`
- [ ] Integrar `onAddToCart` com seu sistema de carrinho
- [ ] Testar em **mobile real** (não só no DevTools)

### Testes Mobile
- [ ] Cards mostram 2 colunas no mobile
- [ ] Imagens são quadradas (1:1) e preenchem o espaço
- [ ] Dots aparecem nos cards (quando múltiplas imagens)
- [ ] Troca de imagens funciona ao tocar nos dots
- [ ] BuyBox: Seleção de tamanho é obrigatória
- [ ] BuyBox: Alerta aparece se tentar adicionar sem tamanho
- [ ] Botões são grandes o suficiente para tocar (min 44px)
- [ ] Página rola suavemente até o seletor de tamanho

---

## 📊 Métricas de Sucesso

**Objetivo**: Aumentar conversão mobile em **30%**

**KPIs a Monitorar**:
- Taxa de cliques nos cards (CTR)
- Taxa de adição ao carrinho
- Taxa de abandono no seletor de tamanhos
- Tempo médio na página de produto
- Taxa de checkout completado

---

## 🐛 Troubleshooting

### Problema: Imagens não ficam quadradas
**Solução**: Certifique-se de usar `aspect-square` no contêiner e `object-cover` na `<Image />`.

### Problema: Hover não funciona no mobile
**Esperado**: Hover é apenas para desktop. No mobile, use os **dots** para navegar.

### Problema: Grid não muda para 2 colunas no mobile
**Solução**: Verifique se está usando `grid-cols-2` (sem prefixo `sm:` ou `md:`).

### Problema: Imagens carregam lentamente
**Solução**: 
1. Use Next.js `<Image />` (otimização automática)
2. Configure `sizes` corretamente
3. Use `loading="lazy"` para imagens fora da viewport

---

## 💡 Dicas de Performance

1. **Imagens**:
   - Use WebP quando possível
   - Tamanho ideal: 800x800px para as principais
   - Use CDN (Supabase Storage, Cloudinary, etc.)

2. **Lazy Loading**:
   - Apenas as primeiras 8 cards carregam de imediato
   - Resto usa `loading="lazy"`

3. **Estado**:
   - Use `useState` para dados locais (cor/tamanho selecionado)
   - Use Zustand/Context para carrinho global

---

## 📚 Recursos Adicionais

- **Tailwind Docs**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/
- **Next.js Image**: https://nextjs.org/docs/api-reference/next/image
- **Fontes Google**: https://fonts.google.com/specimen/Inter

---

## ✅ Próximos Passos (Roadmap)

### Fase 1 (Atual) - Layout Base
- [x] ProductCard responsivo
- [x] ProductGrid com 2/3/4 colunas
- [x] BuyBox com variações
- [ ] Integração completa com API existente

### Fase 2 - Otimizações
- [ ] Slider de imagens no card (swipe real, não dots)
- [ ] Favoritos (persistir no localStorage)
- [ ] Quick View (modal com produto rápido)
- [ ] Filtros de produtos

### Fase 3 - Conversão Avançada
- [ ] Countdown timer para promoções
- [ ] "X pessoas estão vendo" (prova social)
- [ ] Recomendações personalizadas
- [ ] "Compre junto" (cross-sell)

---

**Criado por**: GitHub Copilot  
**Para**: Iara (Desenvolvedora) / Janai (E-commerce)  
**Data**: 22 de outubro de 2025

Qualquer dúvida, consulte este guia ou entre em contato! 🚀
