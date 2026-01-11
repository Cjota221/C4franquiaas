# Documentação Técnica: Integração com FácilZap

**Data:** 10 de Janeiro de 2026  
**Status:** Documentação de análise (apenas leitura, sem alterações)  
**Autor:** Análise automatizada do código fonte

---

## 1. Autenticação e Configuração

### 1.1 Credenciais e Variáveis de Ambiente

| Variável                  | Arquivo                 | Descrição                                   |
| ------------------------- | ----------------------- | ------------------------------------------- |
| `FACILZAP_TOKEN`          | `.env.local`            | Token de autenticação para API FácilZap     |
| `FACILZAP_WEBHOOK_SECRET` | `.env.local` (opcional) | Secret para validação de webhooks recebidos |

**Localização das configurações:**

```
.env.local (linha 11):
FACILZAP_TOKEN=18984781NwjPAXr39xBwwUODRw4eK1QhcAzKKP3bebFihcEmiavGx9u24J4xCeDP3WQD8KOOGTt7ky88zQjFl

.env.example (linha 24):
FACILZAP_TOKEN=  (template vazio)
```

### 1.2 Autenticação nas Chamadas HTTP

**Método:** Bearer Token no header `Authorization`

```typescript
// lib/facilzapClient.ts (linhas 717-724)
const client = axios.create({
  baseURL: FACILZAP_API,
  timeout: TIMEOUT,
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
```

### 1.3 Cliente HTTP Centralizado

**Arquivo:** `lib/facilzapClient.ts` (1038 linhas)

**Constantes de Configuração:**

```typescript
// lib/facilzapClient.ts (linhas 50-55)
const FACILZAP_API = 'https://api.facilzap.app.br';
const PAGE_SIZE = 50;
const TIMEOUT = 10000; // 10 segundos
const MAX_RETRIES = 3;
const RETRY_MIN_TIMEOUT = 1000; // 1 segundo
const RETRY_MAX_TIMEOUT = 10000; // 10 segundos
```

**Sistema de Retry com Backoff Exponencial:**

```typescript
// lib/facilzapClient.ts (linhas 60-107)
async function fetchWithRetry<T>(client, path, page): Promise<T> {
  return pRetry(
    async () => {
      // Erros que NÃO fazem retry (aborta imediatamente):
      // - 401: Token inválido
      // - 403: Acesso negado
      // - 404: Recurso não encontrado
      // Rate limit (429): Aguarda tempo especificado em Retry-After header
      // Outros erros: Faz retry com backoff exponencial (1s, 2s, 4s, 8s...)
    },
    {
      retries: MAX_RETRIES,
      factor: 2, // Backoff exponencial
      minTimeout: RETRY_MIN_TIMEOUT,
      maxTimeout: RETRY_MAX_TIMEOUT,
    },
  );
}
```

---

## 2. Endpoints da FácilZap que Usamos Hoje

### 2.1 Tabela de Endpoints

| Endpoint                        | Método | Arquivo                 | Função                        | Descrição                       |
| ------------------------------- | ------ | ----------------------- | ----------------------------- | ------------------------------- |
| `GET /produtos`                 | GET    | `lib/facilzapClient.ts` | `fetchAllProdutosFacilZap()`  | Busca todos produtos (paginado) |
| `GET /produtos?page=X&length=Y` | GET    | `lib/facilzapClient.ts` | `fetchProdutosFacilZapPage()` | Busca uma página específica     |
| `GET /produtos/:id`             | GET    | `lib/facilzapClient.ts` | `fetchProdutoFacilZapById()`  | Busca detalhes de um produto    |
| `PUT /produtos/:id`             | PUT    | `lib/facilzapClient.ts` | `updateEstoqueFacilZap()`     | Atualiza estoque de um produto  |

### 2.2 Detalhamento por Recurso

#### A) Produtos - Listagem Paginada

**Endpoint:** `GET https://api.facilzap.app.br/produtos?page={page}&length={length}`

**Quem chama:**

- `app/api/sync-produtos/route.ts` → Botão "Sincronizar FácilZap" no painel admin
- `app/api/cron-estoque/route.ts` → Cron job de atualização de estoque
- `app/api/test-sync/route.ts` → Testes manuais

**Parâmetros:**
| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| `page` | number | 1 | Número da página |
| `length` | number | 50 | Itens por página |

**Formato da Resposta (inferido do código):**

```json
{
  "data": [
    {
      "id": "string ou number",
      "codigo": "string (alternativo ao id)",
      "nome": "string",
      "ativado": "boolean",
      "ativo": "boolean (alternativo)",
      "preco": "number ou string",
      "estoque": {
        "disponivel": "number",
        "estoque": "number"
      },
      "imagens": ["string"] ou "fotos": ["string"],
      "variacoes": [
        {
          "id": "string",
          "sku": "string",
          "nome": "string (ex: tamanho 34)",
          "preco": "number",
          "estoque": { "estoque": "number" }
        }
      ],
      "catalogos": [
        {
          "precos": { "preco": "number" }
        }
      ],
      "cod_barras": [
        { "numero": "string" }
      ]
    }
  ]
}
```

**Código da Chamada:**

```typescript
// lib/facilzapClient.ts (linhas 728-729)
const path = `/produtos?page=${page}&length=${PAGE_SIZE}`;
data = await fetchWithRetry(client, path, page);
```

---

#### B) Produtos - Detalhes por ID

**Endpoint:** `GET https://api.facilzap.app.br/produtos/{id}`

**Quem chama:**

- `app/api/produtos/[id]/route.ts` → Quando o admin visualiza detalhes de um produto

**Código:**

```typescript
// lib/facilzapClient.ts (linhas 886-906)
export async function fetchProdutoFacilZapById(id: string): Promise<ExternalProduct | null> {
  const resp = await client.get(`/produtos/${encodeURIComponent(id)}`);
  return resp.data;
}
```

---

#### C) Produtos - Atualização de Estoque (Push para FácilZap)

**Endpoint:** `PUT https://api.facilzap.app.br/produtos/{id}`

**Quem chama:**

- **NINGUÉM atualmente** (função existe mas não está sendo usada em produção)
- Documentado em `CHECKLIST_ATIVAR_ERP.md` e `ERP_BIDIRECIONAL_COMPLETO.md`

**Body da Requisição:**

```json
{
  "estoque": 10
}
```

**Código:**

```typescript
// lib/facilzapClient.ts (linhas 950-1005)
export async function updateEstoqueFacilZap(
  facilzapId: string,
  novoEstoque: number,
): Promise<boolean> {
  const response = await axios.put(
    `${FACILZAP_API}/produtos/${encodeURIComponent(facilzapId)}`,
    { estoque: novoEstoque },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.status === 200 || response.status === 204;
}
```

**Tratamento de Erros:**

- 401: Token inválido ou expirado
- 404: Produto não encontrado no FácilZap
- 422: Dados inválidos (estoque fora do range permitido)

---

## 3. Fluxo de Sincronização de PRODUTOS

### 3.1 Diagrama do Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                    INÍCIO DA SINCRONIZAÇÃO                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ Quem dispara a sincronização? │
              └───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Botão Manual │    │  GET Request │    │ Cron Externo │
│ (Admin UI)   │    │ /sync-produtos│   │(cron-job.org)│
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ POST /api/sync-produtos       │
              │ (app/api/sync-produtos/route.ts)
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ fetchAllProdutosFacilZap()    │
              │ (lib/facilzapClient.ts)       │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ Loop: GET /produtos?page=N    │
              │ (paginado, 50 por página)     │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ Para cada produto:            │
              │ - Extrair id_externo          │
              │ - Extrair nome, preço         │
              │ - Processar variações         │
              │ - Calcular estoque total      │
              │ - Normalizar imagens          │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ Comparar com BD existente     │
              │ (Busca por id_externo)        │
              └───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ NOVO         │    │ ALTERADO     │    │ INALTERADO   │
│ admin_aprovado│   │ Preserva     │    │ Atualiza só  │
│ = false      │    │ aprovação    │    │ timestamp    │
│ ativo=false  │    │ existente    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ UPSERT na tabela 'produtos'   │
              │ (onConflict: 'id_externo')    │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ Pós-processamento:            │
              │ - Desativar estoque=0         │
              │ - Reativar estoque>0          │
              │ - Registrar logs              │
              └───────────────────────────────┘
```

### 3.2 Gatilhos da Sincronização

| Gatilho                      | Arquivo/Rota                                              | Método       |
| ---------------------------- | --------------------------------------------------------- | ------------ |
| Botão "Sincronizar FácilZap" | `app/admin/produtos/page.tsx` → `POST /api/sync-produtos` | Manual       |
| Requisição GET direta        | `GET /api/sync-produtos`                                  | Cron externo |
| POST com parâmetros          | `POST /api/sync-produtos` + `{page, length}`              | Sync parcial |

### 3.3 Funções Envolvidas na Sincronização

| Função                        | Arquivo                          | Linha | Descrição                   |
| ----------------------------- | -------------------------------- | ----- | --------------------------- |
| `handleSync()`                | `app/api/sync-produtos/route.ts` | 24    | Orquestra a sincronização   |
| `fetchAllProdutosFacilZap()`  | `lib/facilzapClient.ts`          | 710   | Busca todas páginas da API  |
| `fetchProdutosFacilZapPage()` | `lib/facilzapClient.ts`          | 832   | Busca uma página específica |
| `processVariacoes()`          | `lib/facilzapClient.ts`          | 509   | Extrai variações e estoque  |
| `extractPrecoBase()`          | `lib/facilzapClient.ts`          | 673   | Extrai preço base           |
| `normalizeToProxy()`          | `lib/facilzapClient.ts`          | 109   | Normaliza URLs de imagens   |
| `extractBarcode()`            | `lib/facilzapClient.ts`          | 327   | Extrai código de barras     |

### 3.4 Transformação dos Dados

**Mapeamento: FácilZap → Banco de Dados**

| Campo FácilZap                                        | Campo no Banco (`produtos`) | Transformação              |
| ----------------------------------------------------- | --------------------------- | -------------------------- |
| `id` ou `codigo`                                      | `id_externo`                | String                     |
| `nome`                                                | `nome`                      | String, default "Sem nome" |
| `preco` ou `catalogos[0].precos.preco`                | `preco_base`                | Number ou null             |
| `estoque.disponivel` ou soma de `variacoes[].estoque` | `estoque`                   | Integer                    |
| `ativado` ou `ativo`                                  | `ativo`                     | Boolean, considera estoque |
| `imagens[0]` ou `fotos[0]`                            | `imagem`                    | URL via proxy Netlify      |
| `imagens[]` ou `fotos[]`                              | `imagens`                   | Array de URLs via proxy    |
| `cod_barras[0].numero`                                | `codigo_barras`             | String ou null             |
| `variacoes[]`                                         | `variacoes_meta`            | JSONB array                |

**Estrutura de `variacoes_meta` gerada:**

```json
[
  {
    "id": "v1",
    "sku": "FLV-34-PRE",
    "nome": "34",
    "codigo_barras": "7891234567890",
    "estoque": 5
  }
]
```

### 3.5 Operações no Banco

**INSERT (Produto Novo):**

```typescript
// app/api/sync-produtos/route.ts (linhas 80-115)
{
  id_externo,
  nome,
  preco_base,
  estoque,
  ativo: false,              // SEMPRE false inicialmente
  imagem,
  imagens,
  codigo_barras,
  variacoes_meta,
  facilzap_id: id_externo,
  sincronizado_facilzap: true,
  ultima_sincronizacao: new Date().toISOString(),
  admin_aprovado: false,     // Aguarda aprovação
  admin_rejeitado: false,
  eh_produto_novo: true,     // Marca como novo
}
```

**UPDATE (Produto Existente):**

```typescript
// app/api/sync-produtos/route.ts (linhas 147-189)
{
  // Campos atualizados:
  estoque: novoEstoque,
  preco_base: novoPreco,
  imagens: novasImagens,
  variacoes_meta: novasVariacoes,
  ultima_sincronizacao: new Date().toISOString(),

  // Campos PRESERVADOS:
  ativo: existente.ativo,           // Mantém status atual
  admin_aprovado: existente.admin_aprovado,  // Preserva aprovação
  admin_rejeitado: existente.admin_rejeitado,
  eh_produto_novo: false,           // Não é mais novo
}
```

---

## 4. Fluxo de Atualização de ESTOQUE

### 4.1 Origem das Atualizações de Estoque

| Fonte                  | Frequência     | Arquivo                             | Endpoint                   |
| ---------------------- | -------------- | ----------------------------------- | -------------------------- |
| Sincronização completa | Manual ou cron | `app/api/sync-produtos/route.ts`    | POST /api/sync-produtos    |
| Cron de estoque        | Configurável   | `app/api/cron-estoque/route.ts`     | GET /api/cron-estoque      |
| Webhook FácilZap       | Tempo real     | `app/api/webhook/facilzap/route.ts` | POST /api/webhook/facilzap |

### 4.2 Cron Job de Estoque

**Arquivo:** `app/api/cron-estoque/route.ts`

**O que faz:**

1. Busca produtos existentes no banco (máximo 200)
2. Busca primeira página da FácilZap (100 produtos)
3. Compara estoques
4. Atualiza apenas produtos com estoque diferente

**Código resumido:**

```typescript
// app/api/cron-estoque/route.ts (linhas 15-95)
async function handleSyncEstoque() {
  // 1. Buscar produtos do banco
  const { data: produtos } = await supabase
    .from('produtos')
    .select('id, id_externo, estoque, nome')
    .not('id_externo', 'is', null)
    .limit(200);

  // 2. Buscar estoque do FácilZap
  const response = await client.get('/produtos', {
    params: { page: 1, length: 100 },
  });

  // 3. Criar mapa de estoque
  const estoqueMap = new Map<string, number>();
  for (const prod of facilzapProdutos) {
    // Soma estoque das variações ou usa estoque direto
  }

  // 4. Atualizar produtos com estoque diferente
  for (const prod of produtos) {
    const novoEstoque = estoqueMap.get(prod.id_externo);
    if (novoEstoque !== prod.estoque) {
      await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', prod.id);
    }
  }
}
```

### 4.3 Processamento de Variações e Estoque

**Função:** `processVariacoes()` em `lib/facilzapClient.ts` (linhas 509-670)

**Lógica de extração de estoque:**

```typescript
// Campos de variação procurados (em ordem):
['variacoes', 'variations', 'skus', 'opcoes', 'items'];

// Para cada variação:
// - Extrai estoque com normalizeEstoque()
// - Soma ao estoque total
// - Extrai SKU, nome, código de barras

// Se não tiver variações:
// - Usa estoque direto do produto
```

**Função `normalizeEstoque()`:**

```typescript
// lib/facilzapClient.ts (linhas 176-302)
// Trata múltiplos formatos:
// - Number direto: 10
// - String: "10"
// - Objeto: { estoque: 10 }
// - Objeto: { disponivel: 10 }
// - Objeto: { quantidade: 10 }
// - Objeto: { qty: 10 }
// - Objeto: { stock: 10 }
```

### 4.4 Onde o Estoque é Gravado

| Tabela     | Campo            | Descrição                               |
| ---------- | ---------------- | --------------------------------------- |
| `produtos` | `estoque`        | Estoque total (soma de todas variações) |
| `produtos` | `variacoes_meta` | Array JSONB com estoque por variação    |

**Estrutura `variacoes_meta`:**

```json
[
  { "id": "v1", "sku": "FLV-34", "nome": "34", "estoque": 5 },
  { "id": "v2", "sku": "FLV-36", "nome": "36", "estoque": 3 },
  { "id": "v3", "sku": "FLV-38", "nome": "38", "estoque": 0 }
]
// produtos.estoque = 8 (5+3+0)
```

---

## 5. Webhooks da FácilZap

### 5.1 Status Atual: WEBHOOKS CONFIGURADOS

**Endpoint para receber webhooks:**

```
POST https://seudominio.com/api/webhook/facilzap
```

**Arquivo:** `app/api/webhook/facilzap/route.ts` (514 linhas)

### 5.2 Autenticação do Webhook

**Métodos aceitos (qualquer um):**

1. Header: `X-FacilZap-Signature: {secret}`
2. Header: `X-Webhook-Secret: {secret}`
3. Query Parameter: `?secret={secret}`

**Código de validação:**

```typescript
// app/api/webhook/facilzap/route.ts (linhas 359-412)
const headerSignature =
  request.headers.get('x-facilzap-signature') || request.headers.get('x-webhook-secret');
const querySecret = url.searchParams.get('secret');
const providedSecret = headerSignature || querySecret;

if (FACILZAP_WEBHOOK_SECRET && providedSecret !== FACILZAP_WEBHOOK_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 5.3 Eventos Suportados

| Evento                                         | Handler                  | Ação                                 |
| ---------------------------------------------- | ------------------------ | ------------------------------------ |
| `produto_criado` / `product.created`           | `handleProdutoEstoque()` | Cria/atualiza produto no banco       |
| `produto_atualizado` / `product.updated`       | `handleProdutoEstoque()` | Atualiza produto existente           |
| `estoque_atualizado` / `product.stock.updated` | `handleProdutoEstoque()` | Atualiza estoque e desativa se zerou |
| `pedido_criado` / `order.created`              | `handleNovoPedido()`     | **BAIXA estoque** dos itens          |
| `pedido_cancelado` / `order.cancelled`         | `handleNovoPedido()`     | **DEVOLVE estoque** dos itens        |
| `sync.full`                                    | Trigger                  | Dispara sincronização completa       |

### 5.4 Fluxo do Webhook de Produto/Estoque

```typescript
// app/api/webhook/facilzap/route.ts (linhas 55-128)
async function handleProdutoEstoque(data, eventType) {
  const facilzapId = extractFacilZapId(data);
  const novoEstoque = normalizeEstoque(data.estoque);

  // Upsert do produto
  const { data: produto } = await supabaseAdmin
    .from('produtos')
    .upsert(updateData, { onConflict: 'id_externo' })
    .select()
    .single();

  // Regra de negócio: Desativar se estoque zerou
  if (novoEstoque <= 0) {
    await desativarProdutoNasFranquias(produto.id, facilzapId);
  }
  // Reativar se voltou a ter estoque
  else if (estoqueAnterior === 0 && novoEstoque > 0) {
    await reativarProdutoNasFranquias(produto.id);
  }

  // Registrar log
  await supabaseAdmin.from('logs_sincronizacao').insert({...});
}
```

### 5.5 Fluxo do Webhook de Pedido

```typescript
// app/api/webhook/facilzap/route.ts (linhas 238-350)
async function handleNovoPedido(data, eventType) {
  const isCancelamento = eventType.includes('cancelado');
  const itens = data.itens || data.items || [];

  for (const item of itens) {
    const produtoId = item.produto_id || item.product_id;
    const quantidade = item.quantidade || 1;

    // Buscar produto
    const { data: produto } = await supabaseAdmin
      .from('produtos')
      .select('id, nome, estoque')
      .or(`facilzap_id.eq.${produtoId},id_externo.eq.${produtoId}`)
      .single();

    // Calcular novo estoque
    const novoEstoque = isCancelamento
      ? estoqueAtual + quantidade  // DEVOLVE
      : Math.max(0, estoqueAtual - quantidade);  // BAIXA

    // Atualizar
    await supabaseAdmin
      .from('produtos')
      .update({ estoque: novoEstoque })
      .eq('id', produto.id);

    // Se zerou, desativar nas franquias
    if (!isCancelamento && novoEstoque <= 0) {
      await desativarProdutoNasFranquias(produto.id, ...);
    }
  }
}
```

### 5.6 Endpoint de Status do Webhook

**GET /api/webhook/facilzap** retorna:

```json
{
  "status": "active",
  "endpoint": "/api/webhook/facilzap",
  "supported_events": [
    "produto_criado / product.created",
    "produto_atualizado / product.updated",
    "estoque_atualizado / product.stock.updated",
    "pedido_criado / order.created",
    "pedido_cancelado / order.cancelled",
    "sync.full"
  ],
  "authentication": {
    "enabled": true,
    "methods": [
      "Header: X-FacilZap-Signature",
      "Header: X-Webhook-Secret",
      "Query Parameter: ?secret=VALOR"
    ]
  }
}
```

---

## 6. Resumo Visual da Integração

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FACILZAP                                    │
│                        api.facilzap.app.br                               │
└─────────────────────────────────────────────────────────────────────────┘
          │                           │                           │
          │ GET /produtos             │ PUT /produtos/:id         │ Webhook
          │ (PULL)                    │ (PUSH) - não usado        │ (PUSH)
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ sync-produtos   │         │ updateEstoque   │         │ webhook/facilzap│
│ cron-estoque    │         │ FacilZap()      │         │                 │
│                 │         │ (preparado mas  │         │ Eventos:        │
│ Gatilhos:       │         │ não utilizado)  │         │ - produto.*     │
│ - Botão manual  │         │                 │         │ - estoque.*     │
│ - GET /sync     │         │                 │         │ - pedido.*      │
│ - Cron externo  │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
          │                                                       │
          │                                                       │
          ▼                                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE (PostgreSQL)                            │
│                                                                          │
│  produtos                                                                │
│  ├─ id (UUID)                                                           │
│  ├─ id_externo (FK para FácilZap)                                       │
│  ├─ nome, preco_base                                                    │
│  ├─ estoque (total)                                                     │
│  ├─ variacoes_meta (JSONB - estoque por variação)                      │
│  ├─ ativo, admin_aprovado                                               │
│  ├─ facilzap_id, sincronizado_facilzap                                 │
│  └─ ultima_sincronizacao                                                │
│                                                                          │
│  logs_sincronizacao                                                      │
│  ├─ tipo (webhook_*, produto_*)                                         │
│  ├─ facilzap_id, produto_id                                             │
│  ├─ payload (JSONB)                                                     │
│  └─ sucesso, erro                                                       │
└─────────────────────────────────────────────────────────────────────────┘
          │
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PAINEL ADMIN / LOJAS                             │
│                                                                          │
│  - Listagem de produtos                                                  │
│  - Aprovação de produtos novos                                           │
│  - Vinculação com revendedoras                                           │
│  - Catálogo público                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Notas Importantes

### 7.1 O que FUNCIONA hoje:

- ✅ Sincronização manual (botão "Sincronizar FácilZap")
- ✅ Sincronização via GET /api/sync-produtos (para cron externo)
- ✅ Busca paginada de produtos
- ✅ Extração de variações e estoque
- ✅ Webhook para receber eventos
- ✅ Baixa de estoque via webhook de pedido
- ✅ Normalização de imagens via proxy

### 7.2 O que EXISTE mas NÃO está em uso:

- ⚠️ `updateEstoqueFacilZap()` - Push de estoque para FácilZap
- ⚠️ `updateEstoquesFacilZapBatch()` - Push em lote

### 7.3 Pontos de Atenção:

- ⚠️ Webhook depende do FácilZap estar configurado para enviar eventos
- ⚠️ Cron de estoque limita a 200 produtos (pode perder atualizações)
- ⚠️ Não há validação de que o webhook realmente veio do FácilZap (além do secret)

---

**Documento gerado para análise. Nenhuma alteração de código foi realizada.**
