# 🔍 ANÁLISE COMPLETA - Lógica de Filtros do Painel de Revendedoras

## 📋 Estado Atual do Código

### **Arquivo**: `app/admin/revendedoras/page.tsx`

---

## 1️⃣ **CAMPOS DO BANCO E TABELAS UTILIZADAS**

### **Tabela Principal: `resellers`**
```sql
Campos usados:
- id (UUID)
- status (string: 'pendente', 'aprovada', 'rejeitada')
- is_active (boolean)
- logo_url (string | null)
- banner_url (string | null)
- banner_mobile_url (string | null)
- colors (JSONB: { primary: string, secondary: string })
```

### **Tabela Relacionada: `reseller_products`**
```sql
Campos usados:
- reseller_id (UUID - FK para resellers.id)
- margin_percent (numeric | null)
- custom_price (numeric | null)
- is_active (boolean)
```

---

## 2️⃣ **TRECHOS DE CÓDIGO RELEVANTES**

### **A) Função de Estatísticas (Cards)**
**Localização**: Linhas 78-131

```typescript
const carregarEstatisticas = useCallback(async () => {
  const supabase = createClient();
  
  // 1. BUSCA DADOS DA TABELA resellers
  const { data, error } = await supabase
    .from('resellers')
    .select('id, status, is_active, logo_url, banner_url, banner_mobile_url, colors');
  
  // 2. CALCULA "SEM PERSONALIZAÇÃO"
  const semPersonalizacao = data?.filter(r => {
    const hasLogo = !!(r.logo_url && r.logo_url.trim());
    const hasBanner = !!(r.banner_url && r.banner_url.trim()) || 
                      !!(r.banner_mobile_url && r.banner_mobile_url.trim());
    let hasColors = false;
    try {
      const colors = typeof r.colors === 'string' ? JSON.parse(r.colors) : (r.colors || {});
      hasColors = !!(colors.primary && colors.secondary);
    } catch { /* ignore */ }
    
    // CRITÉRIO: NÃO tem logo E NÃO tem banner E NÃO tem cores
    return !hasLogo && !hasBanner && !hasColors;
  }).length || 0;
  
  // 3. CALCULA "SEM MARGEM"
  let semMargem = 0;
  if (data && data.length > 0) {
    const resellerIds = data.map(r => r.id);
    
    // Busca produtos com margem
    const { data: productsData } = await supabase
      .from('reseller_products')
      .select('reseller_id, margin_percent, custom_price')
      .in('reseller_id', resellerIds)
      .eq('is_active', true);
    
    // Identifica quais resellers TÊM pelo menos 1 produto com margem
    const resellersComMargem = new Set<string>();
    productsData?.forEach(p => {
      if (p.margin_percent || p.custom_price) {
        resellersComMargem.add(p.reseller_id);
      }
    });
    
    // CRITÉRIO: Revendedoras que NÃO aparecem no Set
    semMargem = resellerIds.filter(id => !resellersComMargem.has(id)).length;
  }
}, []);
```

---

### **B) Função de Listagem (Tabela)**
**Localização**: Linhas 135-309

```typescript
const carregarRevendedoras = useCallback(async () => {
  const supabase = createClient();
  
  // 1. BUSCA DADOS DA TABELA resellers (com paginação)
  let query = supabase
    .from('resellers')
    .select('*', { count: 'exact' });
  
  // 2. PROCESSA CADA REVENDEDORA (linhas 183-213)
  const processadas = await Promise.all(data.map(async (r) => {
    // Busca contagem de produtos
    const { count: totalProdutos } = await supabase
      .from('reseller_products')
      .select('*', { count: 'exact', head: true })
      .eq('reseller_id', r.id)
      .eq('is_active', true);
    
    // Extrai cores
    let primaryColor = null;
    let secondaryColor = null;
    try {
      const colors = typeof r.colors === 'string' ? JSON.parse(r.colors) : (r.colors || {});
      primaryColor = colors.primary || null;
      secondaryColor = colors.secondary || null;
    } catch { /* ignore */ }
    
    // VERIFICA PERSONALIZAÇÃO
    const hasLogo = !!(r.logo_url && typeof r.logo_url === 'string' && r.logo_url.trim() !== '');
    const hasBanner = !!(
      (r.banner_url && typeof r.banner_url === 'string' && r.banner_url.trim() !== '') || 
      (r.banner_mobile_url && typeof r.banner_mobile_url === 'string' && r.banner_mobile_url.trim() !== '')
    );
    const hasColors = !!(primaryColor && secondaryColor);
    
    return {
      ...r,
      has_logo: hasLogo,
      has_banner: hasBanner,
      has_colors: hasColors,
      has_margin: totalProdutos ? totalProdutos > 0 : false, // ⚠️ ATENÇÃO AQUI!
      total_products: totalProdutos || 0,
    };
  }));
  
  // 3. APLICA FILTROS CLIENT-SIDE (linhas 270-290)
  let filtered = processadas;
  switch (filtroAtivacao) {
    case 'ativas':
      filtered = processadas.filter(r => r.is_active);
      break;
    case 'inativas':
      filtered = processadas.filter(r => !r.is_active);
      break;
    case 'personalizadas':
      // CRITÉRIO: TEM logo OU TEM banner OU TEM cores
      filtered = processadas.filter(r => r.has_logo || r.has_banner || r.has_colors);
      break;
    case 'sem_personalizacao':
      // CRITÉRIO: NÃO tem logo E NÃO tem banner E NÃO tem cores
      filtered = processadas.filter(r => !r.has_logo && !r.has_banner && !r.has_colors);
      break;
    case 'sem_margem':
      // CRITÉRIO: NÃO tem margem
      filtered = processadas.filter(r => !r.has_margin);
      break;
    case 'completas':
      // CRITÉRIO: TEM logo E TEM banner E TEM cores E TEM margem E TEM produtos
      filtered = processadas.filter(r => 
        r.has_logo && r.has_banner && r.has_colors && r.has_margin && r.total_products > 0
      );
      break;
  }
}, [currentPage, filtroStatus, filtroAtivacao, buscaDebounced]);
```

---

## 3️⃣ **DEFINIÇÕES ATUAIS DOS FILTROS**

### **🟢 "PERSONALIZADA"** (filtro `personalizadas`)

**Critério HOJE:**
```typescript
r.has_logo || r.has_banner || r.has_colors
```

**Significado:**
- Uma revendedora é considerada "personalizada" se tiver **PELO MENOS UM** dos seguintes:
  - ✅ `logo_url` preenchido e não vazio
  - ✅ `banner_url` OU `banner_mobile_url` preenchido e não vazio
  - ✅ `colors.primary` E `colors.secondary` preenchidos

**Exemplo prático:**
- ✅ Tem logo mas não tem banner/cores → **PERSONALIZADA**
- ✅ Tem cores mas não tem logo/banner → **PERSONALIZADA**
- ✅ Tem banner mas não tem logo/cores → **PERSONALIZADA**
- ❌ Não tem nada → **NÃO PERSONALIZADA**

---

### **🔴 "SEM PERSONALIZAÇÃO"** (filtro `sem_personalizacao`)

**Critério HOJE:**
```typescript
!r.has_logo && !r.has_banner && !r.has_colors
```

**Significado:**
- Uma revendedora é considerada "sem personalização" se **NÃO** tiver **NENHUM** dos seguintes:
  - ❌ Sem logo (`logo_url` vazio ou null)
  - ❌ Sem banner (`banner_url` e `banner_mobile_url` vazios ou null)
  - ❌ Sem cores (`colors.primary` ou `colors.secondary` vazios ou null)

**Exemplo prático:**
- ❌ Logo: null, Banner: null, Cores: null → **SEM PERSONALIZAÇÃO**
- ❌ Logo: null, Banner: null, Cores: {} → **SEM PERSONALIZAÇÃO**
- ✅ Logo: "url.jpg", Banner: null, Cores: null → **PERSONALIZADA** (não é "sem personalização")

---

### **🟠 "SEM MARGEM"** (filtro `sem_margem`)

#### **⚠️ PROBLEMA IDENTIFICADO - DIVERGÊNCIA ENTRE CARD E TABELA!**

**Critério no CARD (função `carregarEstatisticas`):**
```typescript
// Busca produtos com margin_percent OU custom_price
const resellersComMargem = new Set<string>();
productsData?.forEach(p => {
  if (p.margin_percent || p.custom_price) {
    resellersComMargem.add(p.reseller_id);
  }
});

// Sem margem = revendedoras que NÃO têm NENHUM produto com margem
semMargem = resellerIds.filter(id => !resellersComMargem.has(id)).length;
```

**Critério na TABELA (função `carregarRevendedoras`):**
```typescript
// ⚠️ ERRO AQUI!
has_margin: totalProdutos ? totalProdutos > 0 : false
// Tradução: has_margin = true se tiver ALGUM produto (não verifica margem!)
```

**Significado CORRETO (no card):**
- Uma revendedora está "sem margem" se **TODOS** os seus produtos ativos tiverem:
  - `margin_percent` = null/0
  - `custom_price` = null/0

**Significado ERRADO (na tabela):**
- Atualmente está usando: "tem margem se tiver ALGUM produto"
- ❌ Isso está **INCORRETO** porque não verifica se o produto TEM margem configurada

---

## 4️⃣ **DIVERGÊNCIAS IDENTIFICADAS**

### **🔴 PROBLEMA CRÍTICO #1: `has_margin` mal calculado**

**Localização**: Linha 224
```typescript
has_margin: totalProdutos ? totalProdutos > 0 : false
```

**O que deveria ser:**
```typescript
// Buscar produtos COM margem configurada
const { data: produtosComMargem } = await supabase
  .from('reseller_products')
  .select('id')
  .eq('reseller_id', r.id)
  .eq('is_active', true)
  .or('margin_percent.not.is.null,custom_price.not.is.null');

has_margin: (produtosComMargem?.length || 0) > 0
```

---

### **⚠️ PROBLEMA #2: Inconsistência entre card e tabela**

| Local | Lógica |
|-------|--------|
| **Card (estatísticas)** | ✅ Verifica se produtos têm `margin_percent` ou `custom_price` |
| **Tabela (listagem)** | ❌ Apenas verifica se revendedora tem produtos (qualquer um) |

**Resultado:**
- O card mostra o número correto
- Mas ao clicar no card "Sem Margem", a tabela filtra errado
- Revendedoras com produtos SEM margem não aparecem no filtro

---

## 5️⃣ **RESUMO DA LÓGICA ATUAL**

### **Tabelas e Joins:**
```
resellers
  ├─ campos diretos: logo_url, banner_url, banner_mobile_url, colors
  └─ JOIN com reseller_products (N:1)
       └─ campos: margin_percent, custom_price, is_active
```

### **Fluxo de Dados:**
```
1. carregarEstatisticas() → Calcula números dos cards
   ├─ semPersonalizacao: conta resellers sem logo/banner/cores
   └─ semMargem: conta resellers sem NENHUM produto com margem ✅

2. carregarRevendedoras() → Lista na tabela
   ├─ Busca resellers
   ├─ Para cada um, busca total_products
   ├─ Calcula has_margin ERRADO (só verifica se tem produtos) ❌
   └─ Aplica filtros client-side usando has_margin ERRADO
```

---

## 6️⃣ **O QUE PRECISA SER CORRIGIDO**

### **Correção Necessária:**

**Arquivo**: `app/admin/revendedoras/page.tsx`
**Linha**: 224
**Função**: `carregarRevendedoras()`

**De:**
```typescript
has_margin: totalProdutos ? totalProdutos > 0 : false
```

**Para:**
```typescript
// Buscar se tem ALGUM produto COM margem configurada
const { count: produtosComMargem } = await supabase
  .from('reseller_products')
  .select('*', { count: 'exact', head: true })
  .eq('reseller_id', r.id)
  .eq('is_active', true)
  .or('margin_percent.not.is.null,custom_price.not.is.null');

has_margin: (produtosComMargem || 0) > 0
```

---

## 7️⃣ **DIAGRAMA DA LÓGICA ATUAL**

```
REVENDEDORA
├─ Logo?
│  ├─ logo_url NOT NULL AND logo_url != '' → has_logo = true
│  └─ logo_url IS NULL OR logo_url = '' → has_logo = false
│
├─ Banner?
│  ├─ (banner_url NOT NULL AND != '') OR (banner_mobile_url NOT NULL AND != '') → has_banner = true
│  └─ banner_url IS NULL AND banner_mobile_url IS NULL → has_banner = false
│
├─ Cores?
│  ├─ colors.primary NOT NULL AND colors.secondary NOT NULL → has_colors = true
│  └─ colors.primary IS NULL OR colors.secondary IS NULL → has_colors = false
│
└─ Margem? ⚠️ PROBLEMA AQUI!
   ├─ CARD: Verifica se TEM produto com (margin_percent OR custom_price) ✅
   └─ TABELA: Verifica se TEM produto (qualquer um) ❌

FILTROS:
├─ "Personalizada": has_logo OR has_banner OR has_colors
├─ "Sem Personalização": NOT has_logo AND NOT has_banner AND NOT has_colors
├─ "Sem Margem": NOT has_margin (mas has_margin está errado na tabela!)
└─ "Completa": has_logo AND has_banner AND has_colors AND has_margin AND total_products > 0
```

---

## ✅ **CONCLUSÃO**

### **Funcionando Corretamente:**
- ✅ Detecção de logo (`logo_url`)
- ✅ Detecção de banner (`banner_url`, `banner_mobile_url`)
- ✅ Detecção de cores (`colors.primary`, `colors.secondary`)
- ✅ Filtro "Personalizada" (OR entre logo/banner/cores)
- ✅ Filtro "Sem Personalização" (NOT AND entre logo/banner/cores)
- ✅ Card "Sem Margem" (calcula corretamente)

### **Funcionando INCORRETAMENTE:**
- ❌ **`has_margin`** na função `carregarRevendedoras()` (linha 224)
  - Verifica apenas se tem produtos, não se produtos têm margem
  - Causa divergência entre card e tabela
  - Filtro "Sem Margem" não funciona corretamente

### **Impacto do Bug:**
- Card "Sem Margem: 8" está correto
- Mas ao clicar, a tabela mostra resultados errados
- Revendedoras que TÊM produtos mas SEM margem não aparecem

---

## 🔧 **PRÓXIMO PASSO**

Aguardando sua confirmação para aplicar a correção na linha 224 e sincronizar a lógica de `has_margin` entre o card e a tabela.
