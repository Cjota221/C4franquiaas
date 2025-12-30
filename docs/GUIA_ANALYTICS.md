# 📊 Sistema de Analytics - Guia de Configuração

## O que foi implementado

### 1. Sistema Interno de Analytics
- **Visualizações de página** - Rastreia todas as páginas visitadas
- **Visualizações de produto** - Rastreia quais produtos são mais vistos
- **Eventos de carrinho** - Add to cart, checkout, compras
- **Buscas** - Termos mais buscados e taxa de clique
- **Sessões** - Agrupa atividades de um mesmo visitante

### 2. Dashboard de Analytics
- Acesse em: `/admin/analytics`
- Métricas em tempo real
- Gráficos de visualizações diárias
- Ranking de produtos e buscas
- Filtro por período (7, 30, 90 dias)

### 3. Integração com Google Analytics 4 (opcional)
- Eventos customizados enviados automaticamente
- Funções prontas para tracking manual

---

## ⚙️ Como Aplicar

### Passo 1: Executar Migrations no Supabase

Acesse o **Supabase SQL Editor** e execute em ordem:

```sql
-- 1. Primeiro execute o arquivo:
-- migrations/040_analytics_system.sql

-- 2. Depois execute:
-- migrations/040b_analytics_functions.sql
```

### Passo 2: Adicionar o Componente de Tracking

No arquivo `app/layout.tsx`, adicione:

```tsx
import { AnalyticsTracker, GoogleAnalytics } from '@/components/Analytics'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* Google Analytics (opcional - adicione seu ID) */}
        <GoogleAnalytics measurementId="G-XXXXXXXXXX" />
        
        {/* Tracker interno */}
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        
        {children}
      </body>
    </html>
  )
}
```

### Passo 3: Adicionar Tracking nos Catálogos

No componente de catálogo (`app/catalogo/[slug]/page.tsx`), adicione:

```tsx
import { useAnalytics } from '@/components/Analytics'

function CatalogoPage({ params }) {
  const { trackProductView, trackAddToCart, trackSearch } = useAnalytics(lojaId)
  
  // Ao clicar em um produto
  const handleProductClick = (produto) => {
    trackProductView({
      id: produto.id,
      nome: produto.nome,
      categoria: produto.categoria,
      preco: produto.preco,
      source: 'catalogo'
    })
  }
  
  // Ao adicionar ao carrinho
  const handleAddToCart = (produto, quantidade, tamanho) => {
    trackAddToCart({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade,
      variacao: tamanho
    })
  }
  
  // Ao fazer uma busca
  const handleSearch = (query, results) => {
    trackSearch({
      query,
      resultsCount: results.length
    })
  }
}
```

---

## 🔍 O que você vai conseguir rastrear

### Por Produto
- ✅ Quantas vezes foi visualizado
- ✅ Quantas vezes foi adicionado ao carrinho
- ✅ Taxa de conversão (visualização → carrinho)
- ✅ De onde veio o clique (busca, catálogo, relacionados)

### Por Revendedora/Loja
- ✅ Total de visualizações do catálogo
- ✅ Número de sessões/visitantes
- ✅ Produtos mais populares
- ✅ Buscas mais frequentes
- ✅ Taxa de conversão

### Por Dispositivo
- ✅ Mobile vs Desktop vs Tablet
- ✅ Navegadores mais usados
- ✅ Sistemas operacionais

### Por Origem de Tráfego
- ✅ Referrer (de onde veio)
- ✅ UTM parameters (campanhas)
- ✅ Links diretos vs orgânicos

---

## 🎯 Google Analytics 4 (Opcional)

Para análises ainda mais avançadas, configure o GA4:

### 1. Criar conta no Google Analytics
- Acesse: https://analytics.google.com
- Crie uma propriedade GA4
- Copie o ID de medição (G-XXXXXXXXXX)

### 2. Adicionar no sistema
No `layout.tsx`:
```tsx
<GoogleAnalytics measurementId="G-SEU_ID_AQUI" />
```

### 3. Eventos enviados automaticamente
- `page_view` - Cada página visitada
- `view_item` - Visualização de produto
- `add_to_cart` - Adição ao carrinho
- `begin_checkout` - Início do checkout
- `purchase` - Compra finalizada
- `search` - Buscas realizadas

---

## 📈 Acessando os Dados

### Dashboard Interno
- URL: `/admin/analytics`
- Visualize métricas em tempo real
- Gráficos e rankings

### Queries Diretas (Supabase)

**Top 10 produtos mais vistos (últimos 30 dias):**
```sql
SELECT produto_nome, COUNT(*) as views
FROM product_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY produto_nome
ORDER BY views DESC
LIMIT 10;
```

**Sessões por loja:**
```sql
SELECT l.nome, COUNT(DISTINCT pv.session_id) as sessoes
FROM page_views pv
JOIN lojas l ON l.id = pv.loja_id
WHERE pv.created_at >= NOW() - INTERVAL '30 days'
GROUP BY l.nome
ORDER BY sessoes DESC;
```

**Taxa de conversão por loja:**
```sql
SELECT * FROM analytics_store_ranking;
```

---

## 🚀 Próximos Passos

1. Execute as migrations no Supabase
2. Adicione o componente de tracking no layout
3. Integre o tracking nos componentes do catálogo
4. (Opcional) Configure o Google Analytics 4
5. Acesse `/admin/analytics` para ver os dados

Dúvidas? Entre em contato com o suporte técnico.
