# 📊 Melhorias na Extração de Produtos da API FácilZap

**Data:** 21 de outubro de 2025  
**Arquivo Principal:** `lib/facilzapClient.ts`

---

## 🎯 Objetivo

Garantir extração completa e confiável de variações, SKUs, códigos de barras e estoque da API FácilZap, com logging detalhado para diagnóstico.

---

## ✅ Melhorias Implementadas

### 1. **Função `normalizeEstoque()`**

#### Campos Suportados (em ordem de prioridade):
1. ✅ `estoque` (number direto)
2. ✅ `estoque` (string com conversão)
3. ✅ `estoque.estoque` (object.number)
4. ✅ `estoque.estoque` (object.string)
5. ✅ `estoque.disponivel` (object.number)
6. ✅ `estoque.disponivel` (object.string)
7. ✅ `quantidade` (number)
8. ✅ `quantidade` (string)
9. ✅ `qty` (number)
10. ✅ `qty` (string)
11. ✅ `stock` (number)
12. ✅ `stock` (string)

#### Logs de Debug:
```
[normalizeEstoque] Entrada: object { estoque: 5, disponivel: 10 }
[normalizeEstoque] 📦 Objeto recebido com campos: [ 'estoque', 'disponivel' ]
[normalizeEstoque] ✅ Retornando obj.estoque (number): 5
```

---

### 2. **Função `extractBarcode()`**

#### Estruturas Suportadas:
1. ✅ `cod_barras` (string direto)
2. ✅ `cod_barras` (array de strings)
3. ✅ `cod_barras` (objeto `{ tipo, numero }`)
4. ✅ `cod_barras` (array de objetos `[{ tipo, numero }]`)
5. ✅ `codigo_barras`, `codigoBarras`, `ean`, `gtin`, `barcode`
6. ✅ `ean13`, `ean8`, `upc`
7. ✅ Busca genérica em campos contendo 'cod', 'ean', 'bar', 'gtin'

#### Logs de Debug:
```
[extractBarcode] Campos disponíveis: [ 'id', 'nome', 'sku', 'cod_barras' ]
[extractBarcode] ✅ Encontrado em 'cod_barras.numero': 7891234567890
```

---

### 3. **Função `processVariacoes()`**

#### Campos de Variações Suportados:
1. ✅ `variacoes` (array) ← **MAIS COMUM**
2. ✅ `variations` (array)
3. ✅ `skus` (array)
4. ✅ `opcoes` (array)
5. ✅ `items` (array) ← **NOVO**

#### Dados Extraídos de Cada Variação:
- **ID**: `id` → `codigo` (fallback)
- **SKU**: `sku` → `codigo` → `id` (fallback em cadeia)
- **Nome**: `nome` → `name` → `titulo` (fallback) ← **MELHORADO**
- **Código de Barras**: 
  - Busca na variação primeiro
  - Fallback: array do produto `cod_barras[index]`
  - Suporte para `cod_barras[index].numero`
- **Estoque**: usa `normalizeEstoque()` com todos os campos

#### Logs de Debug:
```
[processVariacoes] ==========================================
[processVariacoes] 📦 Produto: 3469603
[processVariacoes] Nome: Rasteirinha Feminina Havaiana Café
[processVariacoes] Campos disponíveis no produto: [ 'id', 'nome', 'variacoes', 'cod_barras' ]
[processVariacoes] 🏷️ Array de códigos de barras do produto: [ {...}, {...} ]
[processVariacoes] ✅ Variações encontradas em 'variacoes': 8 itens
[processVariacoes] ------------------------------------------
[processVariacoes] 🔍 Variação 1/8
[processVariacoes] Campos disponíveis: [ 'id', 'nome', 'sku', 'estoque', 'cod_barras' ]
[processVariacoes] ✅ Dados extraídos da variação 1: {
  id: 1734266,
  sku: 'FZ3469603.1',
  nome: '33',
  codigo_barras: null,
  estoque: 1
}
[processVariacoes] ==========================================
[processVariacoes] 📊 RESULTADO FINAL:
[processVariacoes] Estoque total: 15
[processVariacoes] Número de variações: 8
[processVariacoes] Primeiro código de barras: null
[processVariacoes] ==========================================
```

---

## 🔧 Como Usar o Debug

### 1. Ativar DEBUG_SYNC

Adicione no `.env.local`:
```bash
DEBUG_SYNC=true
```

### 2. Executar Sincronização

```bash
# Sincronizar todos os produtos
npm run sync

# Sincronizar um produto específico
node scripts/sync_produto_by_id.mjs --id=3469603

# Testar extração da API
node scripts/test_facilzap_api.mjs <TOKEN>
```

### 3. Analisar Logs

Os logs mostrarão:
- ✅ Campos encontrados e valores extraídos
- ⚠️ Avisos quando campos alternativos são usados
- ❌ Erros quando nenhum valor é encontrado
- 📦 Estrutura dos objetos recebidos

---

## 📋 Checklist de Validação

Use esta checklist para validar a extração:

### Produto Completo
- [ ] ID externo capturado
- [ ] Nome capturado
- [ ] Preço base capturado (catalogos ou variacoes[0])
- [ ] Estoque total calculado
- [ ] Imagens extraídas e convertidas para proxy

### Variações
- [ ] Array de variações encontrado (variacoes/variations/skus/opcoes/items)
- [ ] ID de cada variação capturado
- [ ] SKU de cada variação capturado
- [ ] Nome de cada variação capturado
- [ ] Estoque de cada variação capturado
- [ ] Código de barras tentado extrair (pode ser null se não existir)

### Códigos de Barras
- [ ] Tentativa de extração do produto principal
- [ ] Tentativa de extração de cada variação
- [ ] Fallback para array cod_barras do produto
- [ ] Suporte para estrutura { tipo, numero }

### Estoque
- [ ] Estoque como number direto
- [ ] Estoque como string convertido
- [ ] Estoque em objeto.estoque
- [ ] Estoque em objeto.disponivel
- [ ] Campos alternativos (quantidade, qty, stock)

---

## 🐛 Problemas Conhecidos e Soluções

### 1. **Códigos de Barras Vazios**

**Problema:** API retorna `{ tipo: "ean13", numero: "" }`

**Causa:** Dados não preenchidos no sistema FácilZap

**Solução:** 
- ✅ Código agora extrai corretamente quando preenchido
- ⚠️ Preencher códigos de barras no sistema FácilZap
- 🔄 Re-sincronizar produtos após preenchimento

### 2. **Variações Não Encontradas**

**Problema:** Logs mostram "Nenhuma variação encontrada"

**Diagnóstico com DEBUG_SYNC:**
```
[processVariacoes] ⚠️ Nenhuma variação encontrada nos campos: variacoes, variations, skus, opcoes, items
[processVariacoes] Campos disponíveis no produto: [ 'id', 'nome', 'preco', ... ]
```

**Solução:**
- Verificar estrutura real da API
- Adicionar novo campo se necessário na função `processVariacoes()`

### 3. **Estoque Zerado**

**Problema:** Produtos com estoque sendo salvos como 0

**Diagnóstico com DEBUG_SYNC:**
```
[normalizeEstoque] Entrada: object { ... }
[normalizeEstoque] 📦 Objeto recebido com campos: [ 'campo_desconhecido' ]
[normalizeEstoque] ❌ Retornando 0 (nenhum campo válido encontrado)
```

**Solução:**
- Identificar nome do campo no log
- Adicionar campo na função `normalizeEstoque()`

---

## 📊 Commits Relacionados

| Commit | Descrição | Data |
|--------|-----------|------|
| `c2403fb` | Suporte para cod_barras.numero | 21/10/2025 |
| `c3197f1` | Correção erro 500 com IDs numéricos | 21/10/2025 |
| `2059686` | Melhorias em logs e campos alternativos | 21/10/2025 |

---

## 🚀 Próximos Passos

1. **Testar com DEBUG_SYNC=true** em produção para identificar casos edge
2. **Preencher códigos de barras** no sistema FácilZap
3. **Re-sincronizar produtos** para aplicar melhorias
4. **Monitorar logs** para identificar novos campos necessários
5. **Criar relatório** de produtos sem variações/códigos de barras

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Ative `DEBUG_SYNC=true`
2. Execute a sincronização
3. Copie os logs completos
4. Analise os campos disponíveis vs campos procurados
5. Adicione novos campos se necessário

---

**Documentação criada em:** 21/10/2025  
**Última atualização:** Commit `2059686`
