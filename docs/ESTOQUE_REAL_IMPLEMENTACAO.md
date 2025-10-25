# 📦 Implementação de Estoque REAL - Sistema Multi-tenant

## 🎯 Problema Resolvido

**ANTES (❌ ERRADO):**
- Dados de estoque FAKE (mock data)
- Variações com `disponivel: true` para todos
- Contagem de estoque exibida nos cards ("15 unidades")
- Cliente via informações falsas

**DEPOIS (✅ CORRETO):**
- Estoque REAL do banco de dados central
- Variações com estoque individual por SKU
- Sem exibição de contagem nos cards
- Sistema reflete a VERDADE única do Admin

---

## 🏗️ Arquitetura Multi-tenant

```
┌─────────────────────────────────────────────┐
│   PAINEL ADMINISTRADOR (Fonte da Verdade)  │
│                                             │
│  - Catálogo Mestre                         │
│  - Estoque Central (SKU individual)        │
│  - produtos.variacoes_meta (JSONB)         │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         FRANQUEADA (Ativa Produtos)         │
│                                             │
│  - Seleciona produtos para vender          │
│  - produtos_franqueadas (vinculação)       │
│  - Personaliza preços (opcional)           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│       SITE PÚBLICO (Cliente Final)          │
│                                             │
│  - Vê produtos ativados pela franqueada    │
│  - Estoque é o CENTRAL (tempo real)        │
│  - Preços personalizados da franqueada     │
└─────────────────────────────────────────────┘
```

---

## 📊 Estrutura de Dados

### Banco de Dados (PostgreSQL/Supabase)

```sql
-- Tabela produtos (Central)
CREATE TABLE produtos (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  preco_base NUMERIC NOT NULL,
  estoque INTEGER,  -- Soma total de todas variações
  variacoes_meta JSONB DEFAULT '[]'::jsonb,  -- ⭐ FONTE DA VERDADE
  ...
);

-- Estrutura do variacoes_meta (JSONB)
[
  {
    "id": "v1",
    "sku": "FLV-34-PRE",
    "nome": "34",
    "estoque": 1,        -- ⭐ ESTOQUE REAL
    "codigo_barras": "7891234567890"
  },
  {
    "id": "v2",
    "sku": "FLV-37-PRE",
    "nome": "37",
    "estoque": 0,        -- ⭐ ESGOTADO
    "codigo_barras": "7891234567891"
  }
]
```

---

## 🔧 Implementação Backend

### API Endpoint: `/api/loja/[dominio]/produtos`

**Query Flow:**
1. Busca loja pelo domínio
2. Busca produtos vinculados (`produtos_franqueadas`)
3. JOIN com tabela `produtos` (pega `variacoes_meta`)
4. Processa variações com estoque REAL
5. Calcula estoque total (soma de variações)
6. Retorna JSON com dados reais

**Código Crítico:**

```typescript
// ⭐ Processar variações com estoque REAL
if (produto.variacoes_meta && Array.isArray(produto.variacoes_meta)) {
  variacoes = produto.variacoes_meta.map((variacao, idx) => {
    const estoqueVariacao = typeof variacao.estoque === 'number' 
      ? variacao.estoque 
      : 0;
    
    const disponivel = estoqueVariacao > 0;
    
    // Somar ao estoque total
    estoqueTotal += estoqueVariacao;
    
    return {
      sku: variacao.sku,
      tamanho: variacao.nome || variacao.sku?.split('-').pop(),
      estoque: estoqueVariacao,    // ⭐ REAL do banco
      disponivel,                   // ⭐ TRUE só se > 0
      codigo_barras: variacao.codigo_barras
    };
  });
}
```

**JSON Retornado:**

```json
{
  "produtos": [
    {
      "id": "produto-123",
      "nome": "Flat Verona",
      "preco_final": 149.90,
      "estoque": 5,  // ⭐ Soma de todas variações
      "variacoes": [
        {
          "sku": "FLV-34-PRE",
          "tamanho": "34",
          "estoque": 1,
          "disponivel": true
        },
        {
          "sku": "FLV-37-PRE",
          "tamanho": "37",
          "estoque": 0,
          "disponivel": false  // ⭐ Esgotado
        }
      ]
    }
  ]
}
```

---

## 🎨 Implementação Frontend

### 1. Página de Detalhes do Produto

**Arquivo:** `app/loja/[dominio]/produto/[id]/page.tsx`

**Mudanças Críticas:**

```typescript
// ❌ REMOVIDO: Mock data
// produtoData.variacoes = [
//   { sku: 'SKU-34', tamanho: '34', disponivel: true },
//   ...
// ];

// ✅ ADICIONADO: Validação e uso de dados REAIS
if (!produtoData.variacoes || produtoData.variacoes.length === 0) {
  console.warn('⚠️ Produto sem variações no banco de dados!');
  console.warn('Execute: node scripts/sync_variacoes_from_facilzap.mjs --apply');
  produtoData.variacoes = [];
} else {
  console.log('✅ Usando variações REAIS da API');
  produtoData.variacoes.forEach((v, idx) => {
    console.log(`Variação ${idx + 1}: ${v.tamanho} - 
      SKU: ${v.sku} - 
      Estoque: ${v.estoque} - 
      Disponível: ${v.disponivel}`);
  });
}
```

**Renderização Condicional:**

```tsx
{/* Seletor de Tamanho */}
<div className="grid grid-cols-4 gap-2">
  {produto.variacoes.map((variacao) => {
    const isAvailable = variacao.disponivel; // ⭐ REAL da API

    return (
      <button
        disabled={!isAvailable}  // ⭐ Desabilita se estoque = 0
        className={`
          ${isAvailable 
            ? 'bg-white hover:scale-105' 
            : 'bg-gray-100 cursor-not-allowed opacity-60'
          }
        `}
      >
        <span 
          className={!isAvailable ? 'line-through' : ''}
          style={!isAvailable ? {
            textDecorationColor: '#9ca3af',
            color: '#9ca3af'
          } : {}}
        >
          {variacao.tamanho}
        </span>
      </button>
    );
  })}
</div>
```

### 2. Cards de Produto (Home/Listagem)

**Arquivos:**
- `components/loja/ProdutoCard.tsx`
- `components/loja/ProdutoCardResponsive.tsx`

**Mudanças:**

```tsx
// ❌ REMOVIDO: Exibição de estoque
// {produto.estoque > 0 && (
//   <p className="text-sm text-gray-600">
//     {produto.estoque} unidades
//   </p>
// )}

// ✅ SUBSTITUÍDO POR: Comentário explicativo
{/* ❌ REMOVIDO: Exibição de estoque
    ⭐ RAZÃO: Cliente não deve ver contagem exata
    ✅ Disponibilidade indicada pelo botão
*/}
```

---

## 🔄 Fluxo de Sincronização

### Como Atualizar Estoque no Banco

```bash
# 1. Sincronizar produto específico
node scripts/sync_produto_by_id.mjs --id PRODUTO_ID

# 2. Sincronizar todas variações do Facilzap
node scripts/sync_variacoes_from_facilzap.mjs --apply

# 3. Verificar se salvou corretamente
node scripts/check_variacoes.mjs
```

**O que o script faz:**
1. Busca produto no Facilzap via API
2. Extrai `variacoes` com estoque individual
3. Calcula estoque total (soma)
4. Salva em `produtos.variacoes_meta` (JSONB)
5. Atualiza `produtos.estoque` (total)

---

## 🐛 Debug e Troubleshooting

### Verificar Logs no Console

**Backend (API):**
```
[API loja/produtos] ✅ Produto Flat Verona TEM 8 variações
[API loja/produtos]   Variação 1: { sku: 'FLV-34', estoque: 1, disponivel: true }
[API loja/produtos]   Variação 2: { sku: 'FLV-37', estoque: 0, disponivel: false }
[API loja/produtos] ✅ Estoque total calculado: 5
```

**Frontend (Browser):**
```
[Produto Detalhe] ✅ Usando variações REAIS da API: 8
[Produto Detalhe]   Variação 1: 34 - SKU: FLV-34 - Estoque: 1 - Disponível: true
[Produto Detalhe]   Variação 2: 37 - SKU: FLV-37 - Estoque: 0 - Disponível: false
```

### Problemas Comuns

**1. Produto sem variações**
```
⚠️ ATENÇÃO: Produto sem variações no banco de dados!
Execute: node scripts/sync_variacoes_from_facilzap.mjs --apply
```
**Solução:** Sincronizar produto com Facilzap

**2. Todas variações indisponíveis**
```
Variação 1: 34 - Estoque: 0 - Disponível: false
Variação 2: 35 - Estoque: 0 - Disponível: false
```
**Solução:** Produto realmente esgotado no Facilzap. Reabastecer estoque.

**3. Estoque não atualiza**
```
// Verificar no banco
SELECT id, nome, estoque, variacoes_meta 
FROM produtos 
WHERE id = 'produto-id';
```

---

## ✅ Checklist de Validação

- [x] API retorna `variacoes` com `estoque` e `disponivel`
- [x] Frontend remove mock data
- [x] Cards NÃO exibem contagem de estoque
- [x] Seletor de tamanhos usa `variacao.disponivel`
- [x] Tamanhos esgotados ficam riscados (`line-through`)
- [x] Tamanhos esgotados são `disabled`
- [x] Logs detalhados em dev mode
- [x] Estoque total = soma de variações

---

## 🎯 Benefícios da Solução

1. **✅ Fonte Única da Verdade**
   - Estoque sempre sincronizado com Admin
   - Elimina dados falsos/desatualizados

2. **✅ Experiência do Cliente**
   - Não vê estoque exato (evita ansiedade)
   - Vê apenas disponibilidade (Sim/Não)
   - Tamanhos esgotados claramente marcados

3. **✅ Multi-tenant Escalável**
   - Franqueadas veem estoque central
   - Não gerenciam estoque próprio
   - Um estoque para todas as lojas

4. **✅ Confiabilidade**
   - Impossível vender produto esgotado
   - Botão desabilitado = estoque 0
   - Validação em tempo real

---

## 📚 Referências

- **Documentação:** `docs/SISTEMA_VARIACOES.md`
- **Scripts:** `scripts/sync_variacoes_from_facilzap.mjs`
- **Schema:** `migrations/003_add_variacoes_meta.sql`
