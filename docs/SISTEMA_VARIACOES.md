# 👟 Sistema de Variações de Produtos (Tamanhos)

## 📋 Visão Geral

O sistema agora suporta **variações de produtos** (como tamanhos de calçados), onde cada variação possui:
- **SKU único**
- **Estoque individual**
- **Código de barras próprio**

## 🔄 Sincronização das Variações

### Script de Sincronização
Use o script para buscar variações do Facilzap:

```bash
# Modo dry-run (apenas visualizar)
node scripts/sync_variacoes_from_facilzap.mjs --page=1 --length=50

# Aplicar alterações
node scripts/sync_variacoes_from_facilzap.mjs --page=1 --length=50 --apply
```

### O que é Sincronizado
Para cada produto com variações:
- `variacoes_meta[]` - Array de variações
  - `id` - ID da variação
  - `sku` - Código SKU único
  - `estoque` - Quantidade disponível
  - `codigo_barras` - EAN/código de barras

### Estoque Total
O campo `estoque` do produto principal é a **soma** dos estoques de todas as variações.

---

## 🛍️ Experiência do Cliente

### Página do Produto (/loja/[dominio]/produtos/[id])

Quando um produto tem variações, o cliente vê:

#### 1️⃣ Seletor de Tamanhos
```
┌─────────────────────────────────┐
│  Selecione o Tamanho:           │
├─────┬─────┬─────┬─────┬─────────┤
│ 33  │ 34  │ 35  │ 36  │ 37      │
│     │     │     │  X  │         │  ← Esgotado
├─────┼─────┼─────┼─────┼─────────┤
│ 38  │ 39  │ 40  │     │         │
└─────┴─────┴─────┴─────┴─────────┘
```

**Estados dos Botões**:
- ✅ **Disponível**: Fundo branco, borda cinza, hover amarelo
- ⚠️ **Selecionado**: Fundo amarelo (#F8B81F), borda amarela, sombra
- ❌ **Esgotado**: Fundo cinza, X vermelho, cursor not-allowed

#### 2️⃣ Indicador de Seleção
Quando seleciona um tamanho:
```
┌────────────────────────────────────┐
│ ✓ Tamanho selecionado: 36          │
└────────────────────────────────────┘
```

#### 3️⃣ Aviso se Não Selecionar
```
⚠️ Por favor, selecione um tamanho para adicionar ao carrinho
```

---

## 🛒 Lógica do Carrinho

### Identificação Única
Produtos com variações diferentes são tratados como **itens separados**:

```javascript
// Mesmo produto, tamanhos diferentes = itens diferentes
Rasteirinha Soft Preta - Tamanho 35
Rasteirinha Soft Preta - Tamanho 37
```

### Estrutura do Item
```typescript
{
  id: "produto123",
  nome: "Rasteirinha Soft Preta",
  preco: 89.90,
  quantidade: 2,
  variacaoId: "var456",       // ID da variação
  variacaoSku: "RSP-35",      // SKU específico
  imagem: "...",
  estoque: 5
}
```

### Validações
- ❌ Não permite adicionar ao carrinho sem selecionar tamanho (se houver variações)
- ✅ Valida estoque da variação específica
- ✅ Diferentes tamanhos do mesmo produto são linhas separadas

---

## 👨‍💼 Painel Admin

### Visualização de Estoque
```
📦 Estoque: ✓ Disponível
```
ou
```
📦 Estoque: ❌ Esgotado
```

**NÃO mostra quantidade numérica** - apenas status.

### Detalhes do Produto
No modal de detalhes, pode ver:
- Total de variações disponíveis
- SKU de cada variação
- Estoque individual de cada tamanho

---

## 👩‍💼 Painel da Franqueada

### Visualização de Produtos
Cada produto mostra:
```
┌────────────────────────────────┐
│ Rasteirinha Soft Preta         │
│                                │
│ Preço: R$ 89,90                │
│ 📦 ✓ Disponível                │  ← Sem número
│ ✓ Ativo na loja                │
└────────────────────────────────┘
```

**Importante**: A franqueada vê apenas se há estoque disponível, não a quantidade exata.

---

## 🔧 Estrutura Técnica

### Componente: SeletorVariacoes.tsx
```typescript
interface Variacao {
  id: string | null;
  sku: string | null;
  estoque: number;
  codigo_barras: string | null;
}

<SeletorVariacoes
  variacoes={produto.variacoes_meta}
  variacaoSelecionada={variacaoId}
  onSelecionar={(id) => setVariacaoId(id)}
/>
```

### API: /api/loja/[dominio]/produtos
Retorna produtos com:
```json
{
  "produtos": [
    {
      "id": "123",
      "nome": "Rasteirinha Soft Preta",
      "preco_final": 89.90,
      "variacoes_meta": [
        {
          "id": "var1",
          "sku": "RSP-35",
          "estoque": 5,
          "codigo_barras": "7891234567890"
        },
        {
          "id": "var2",
          "sku": "RSP-36",
          "estoque": 0,
          "codigo_barras": "7891234567891"
        }
      ]
    }
  ]
}
```

### Carrinho Store
```typescript
type ProdutoCarrinho = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagem: string;
  estoque: number;
  variacaoId?: string | null;    // Novo
  variacaoSku?: string;           // Novo
};
```

---

## 📊 Fluxo Completo

### 1. Sincronização
```bash
node scripts/sync_variacoes_from_facilzap.mjs --apply
```
↓
### 2. Dados no Banco
```sql
produtos.variacoes_meta = [
  { id: "v1", sku: "RSP-35", estoque: 5 },
  { id: "v2", sku: "RSP-36", estoque: 3 }
]
```
↓
### 3. API Retorna
```
GET /api/loja/cjotarasteirinhas/produtos
→ produtos com variacoes_meta
```
↓
### 4. Cliente Vê
```
Seletor de Tamanhos: [ 35 ] [ 36 ] [X 37] [ 38 ]
```
↓
### 5. Cliente Seleciona
```
Tamanho 36 selecionado → variacaoId = "v2"
```
↓
### 6. Adiciona ao Carrinho
```javascript
addItem({
  id: "prod123",
  variacaoId: "v2",
  variacaoSku: "RSP-36",
  quantidade: 1
})
```
↓
### 7. Carrinho
```
Rasteirinha Soft Preta - Tamanho 36
SKU: RSP-36
R$ 89,90 x 1 = R$ 89,90
```

---

## ✅ Vantagens do Sistema

### Para o Cliente
- ✅ Escolha clara de tamanhos disponíveis
- ✅ Visual imediato de esgotados
- ✅ Não pode comprar tamanho indisponível
- ✅ Sabe exatamente o que está adicionando

### Para a Franqueada
- ✅ Controle por SKU individual
- ✅ Rastreamento preciso de vendas
- ✅ Gestão de estoque por variação
- ✅ Interface simples e intuitiva

### Para o Sistema
- ✅ Integração direta com Facilzap
- ✅ Sincronização automática de estoques
- ✅ Carrinho suporta múltiplas variações
- ✅ Código limpo e escalável

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras
- [ ] Filtrar produtos por tamanho disponível
- [ ] Alerta de "últimas unidades" por tamanho
- [ ] Histórico de vendas por SKU
- [ ] Sugestão de reposição por popularidade
- [ ] Tabela de medidas (CM) por tamanho

---

## 📝 Notas Importantes

### ⚠️ Avisos
- Produtos **sem variações** funcionam normalmente (adição direta ao carrinho)
- Produtos **com variações** exigem seleção de tamanho
- Estoque **zerado** = botão desabilitado automaticamente
- SKUs devem ser **únicos** por variação

### 🔍 Debug
Para verificar se variações estão carregando:
```javascript
// No console do navegador
console.log(produto.variacoes_meta);
```

Saída esperada:
```javascript
[
  { id: "v1", sku: "RSP-35", estoque: 5, codigo_barras: "..." },
  { id: "v2", sku: "RSP-36", estoque: 0, codigo_barras: "..." }
]
```

---

## 📅 Data de Implementação
22 de outubro de 2025

## ✅ Status
✅ Implementado e funcional
✅ Testado localmente
✅ Pronto para produção
