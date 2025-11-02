# 🔧 BASTIDORES TÉCNICOS - Melhor Envio

## 🏗️ ARQUITETURA DO SISTEMA

### Como o frete funciona agora (passo a passo técnico)

```
┌──────────────────────────────────────────────────────────────┐
│  FLUXO COMPLETO DO CÁLCULO DE FRETE                          │
└──────────────────────────────────────────────────────────────┘

1️⃣ CLIENTE NA LOJA
   └─> Digite CEP: [01310-100] [OK]

2️⃣ FRONTEND (ShippingCalculator.tsx)
   └─> Limpa CEP: "01310-100" → "01310100"
   └─> Valida: 8 dígitos? ✅
   └─> Chama API: POST /api/shipping/calculate

3️⃣ API ROUTE (app/api/shipping/calculate/route.ts)
   └─> Recebe JSON:
       {
         "to": { "postal_code": "01310100" },
         "from": { "postal_code": "13560340" },
         "package": { "height": 10, "width": 15, "length": 20, "weight": 0.5 }
       }
   └─> Valida CEP (8 dígitos)
   └─> Chama MelhorEnvioService.calcularFrete()

4️⃣ SERVICE LAYER (lib/melhor-envio-service.ts)
   └─> Busca token no banco: config_melhorenvio.access_token
   └─> Verifica expiração: expires_at > hoje?
   └─> Chama Melhor Envio API:
       POST https://melhorenvio.com.br/api/v2/me/shipment/calculate

5️⃣ MELHOR ENVIO (API Externa)
   └─> Consulta 7 transportadoras
   └─> Calcula 14 serviços
   └─> Retorna cotações com preços reais

6️⃣ RESPOSTA
   └─> API converte formato
   └─> Frontend exibe para cliente:
       📦 PAC - R$ 18,50 - 8 dias
       📦 SEDEX - R$ 32,00 - 2 dias
```

---

## 📁 ARQUIVOS IMPORTANTES

### 1. **ShippingCalculator.tsx** (Calculadora da Loja)

**Localização:** `components/loja/ShippingCalculator.tsx`

**O que faz:**

- Componente visual que o cliente vê
- Input de CEP + Botão "OK"
- Exibe opções de frete

**Mudança que fizemos:**

```typescript
// ANTES (API antiga, preço fixo)
fetch('/api/calcular-frete', { ... })

// DEPOIS (API nova, Melhor Envio real)
fetch('/api/shipping/calculate', { ... })
```

**Valores atuais (FIXOS - precisa melhorar depois):**

- CEP Origem: `13560340` (São Carlos)
- Peso: `0.5 kg`
- Dimensões: `10 x 15 x 20 cm`
- Seguro: `R$ 50`

---

### 2. **/api/shipping/calculate** (API Nova)

**Localização:** `app/api/shipping/calculate/route.ts`

**O que faz:**

- Valida CEP (exatamente 8 dígitos)
- Chama Melhor Envio Service
- Retorna cotações

**Validações implementadas:**

```typescript
// 1. CEP não pode estar vazio
if (!to?.postal_code) {
  return NextResponse.json({ error: 'CEP obrigatório' }, { status: 400 });
}

// 2. Limpa caracteres não-numéricos
const toCep = to.postal_code.toString().replace(/\D/g, '');

// 3. Valida exatamente 8 dígitos
if (toCep.length !== 8) {
  return NextResponse.json(
    {
      error: `CEP inválido: "${to.postal_code}". Deve ter 8 dígitos.`,
    },
    { status: 400 },
  );
}
```

---

### 3. **MelhorEnvioService** (Biblioteca)

**Localização:** `lib/melhor-envio-service.ts`

**O que faz:**

- Gerencia toda comunicação com Melhor Envio
- 10 métodos disponíveis:
  1. `calcularFrete()` - Cotação
  2. `getCompanies()` - Transportadoras
  3. `getServices()` - Serviços
  4. `adicionarAoCarrinho()` - Carrinho
  5. `fazerCheckout()` - Checkout
  6. `gerarEtiqueta()` - Etiqueta
  7. `imprimirEtiqueta()` - PDF
  8. `rastrearEnvio()` - Rastreamento
  9. `cancelarEnvio()` - Cancelamento
  10. `verificarSaldo()` - Saldo

**Como funciona o token:**

```typescript
// 1. Busca no banco
const { data: config } = await supabase
  .from('config_melhorenvio')
  .select('access_token, expires_at')
  .eq('id', 1)
  .single();

// 2. Verifica expiração
if (config.expires_at && new Date(config.expires_at) < new Date()) {
  throw new Error('Token expirado');
}

// 3. Usa nas requisições
headers: {
  'Authorization': `Bearer ${config.access_token}`
}
```

---

## 🗃️ BANCO DE DADOS

### Tabela: **config_melhorenvio**

```sql
CREATE TABLE config_melhorenvio (
  id INTEGER PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  token_type TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Dados atuais:**

```
id: 1
access_token: eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
refresh_token: not-applicable
expires_at: 2026-11-02 00:00:00 (1 ano de validade!)
```

---

## 🌍 AMBIENTES

### Produção (ATUAL - onde você está)

```env
NEXT_PUBLIC_MELHORENVIO_SANDBOX=false
BASE_URL=https://melhorenvio.com.br/api/v2
```

**Características:**

- ✅ Transportadoras reais
- ✅ Preços reais
- ✅ Gera etiquetas de verdade
- ✅ Cobra de verdade
- ✅ Token válido até 02/11/2026

### Sandbox (Teste - NÃO está ativado)

```env
NEXT_PUBLIC_MELHORENVIO_SANDBOX=true
BASE_URL=https://sandbox.melhorenvio.com.br/api/v2
```

**Características:**

- 🎮 Modo simulação
- 💰 Dinheiro fake
- 📦 Entregas fake
- 🧪 Apenas para desenvolvedores testarem

**IMPORTANTE:** Você **NÃO** precisa do sandbox. Já está em produção!

---

## 🔑 VARIÁVEIS DE AMBIENTE (Netlify)

### Obrigatórias (já configuradas)

```env
# Melhor Envio
NEXT_PUBLIC_MELHORENVIO_CLIENT_ID=20735
MELHORENVIO_CLIENT_SECRET=[secreto]
MELHORENVIO_REDIRECT_URI=https://c4franquiaas.netlify.app/admin/configuracoes/melhorenvio/callback
NEXT_PUBLIC_MELHORENVIO_SANDBOX=false

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ylmmxsdxmovlkpfqamvh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[secreto]

# Base
NEXT_PUBLIC_BASE_URL=https://c4franquiaas.netlify.app
```

---

## 🎯 PRÓXIMAS MELHORIAS TÉCNICAS

### 1. Peso e Dimensões Dinâmicas

**Problema atual:**

```typescript
// Valores fixos em ShippingCalculator.tsx
package: {
  height: 10,
  width: 15,
  length: 20,
  weight: 0.5
}
```

**Solução:**

```typescript
// Buscar do banco de dados
const { data: produto } = await supabase
  .from('produtos')
  .select('peso, altura, largura, comprimento')
  .eq('id', produtoId)
  .single();

package: {
  height: produto.altura,
  width: produto.largura,
  length: produto.comprimento,
  weight: produto.peso / 1000 // gramas → kg
}
```

**Impacto:**

- Frete correto para cada produto
- Produtos pesados = frete mais caro
- Produtos leves = frete mais barato

---

### 2. Gerar Etiqueta no Pagamento

**Localização:** `app/api/mp-webhook/route.ts`

**Fluxo:**

```
Cliente paga → Mercado Pago webhook → Gera etiqueta → Salva no banco
```

**Código a implementar:**

```typescript
// Quando payment.status === 'approved'
const etiqueta = await MelhorEnvioService.gerarEtiqueta({
  pedido_id: payment.external_reference,
  servico_id: pedido.frete_servico_id,
  // ... dados do destinatário
});

// Salvar no banco
await supabase.from('pedidos_envio').insert({
  pedido_id,
  etiqueta_id: etiqueta.id,
  rastreio: etiqueta.tracking,
  status: 'pendente',
});
```

---

### 3. Rastreamento Automático

**Localização:** `app/api/envios/webhook/route.ts`

**Fluxo:**

```
Melhor Envio webhook → Atualiza status → Notifica cliente
```

**Eventos:**

```
order.paid → Pago
order.generated → Etiqueta gerada
order.posted → Postado
order.delivered → Entregue
tracking.update → Atualização de rastreio
```

---

## 📊 DIAGNÓSTICO - Checklist Técnico

### ✅ Testes que passam (6/6)

1. **Config DB** - Tabela config_melhorenvio existe
2. **Env Vars** - CLIENT_ID configurado
3. **Auth** - Token válido no banco
4. **Carriers** - 7 transportadoras disponíveis
5. **Services** - 14 serviços disponíveis
6. **Calculate** - Cálculo de frete funciona

### ⏳ Pendente

1. **Migration 030** - Tabelas de envio (pedidos_envio, rastreamento, notificações)
2. **Webhook** - Configurar URL no painel Melhor Envio
3. **Integração MP** - Gerar etiqueta ao receber pagamento
4. **Notificações** - Email/WhatsApp para cliente

---

## 🐛 DEBUGGING

### Como ver logs no Netlify

1. Acesse: https://app.netlify.com/sites/c4franquiaas/functions
2. Clique na function: `shipping-calculate`
3. Veja os logs em tempo real

### Logs importantes

```typescript
console.log('[ShippingCalculator] 🚀 Calculando frete:', { cep });
console.log('[API] 📥 Body recebido:', body);
console.log('[API] ✅ CEP validado:', { from: fromCep, to: toCep });
console.log('[Service] 📦 Enviando para Melhor Envio:', payload);
console.log('[Service] ✅ Cotações recebidas:', cotacoes.length);
```

### Erros comuns

```
422 - CEP inválido → Verificar se tem 8 dígitos
401 - Token expirado → Renovar token no Melhor Envio
400 - Dados faltando → Verificar payload
500 - Erro interno → Ver logs do Netlify
```

---

## 🔐 SEGURANÇA

### Token de Acesso

- **Validade:** 1 ano (até 02/11/2026)
- **Armazenamento:** Banco Supabase (criptografado)
- **Uso:** Apenas no backend (NEVER no frontend!)

### Refresh Token

- **Valor atual:** `not-applicable` (token manual)
- **Quando usar:** Se precisar renovar automaticamente

### Client Secret

- **Onde está:** Variável de ambiente Netlify
- **Nunca expor:** No código ou frontend

---

## 📚 DOCUMENTAÇÃO OFICIAL

- **Melhor Envio API:** https://docs.melhorenvio.com.br
- **Calculadora:** https://docs.melhorenvio.com.br/shipment/calculator
- **Carrinho:** https://docs.melhorenvio.com.br/cart
- **Rastreamento:** https://docs.melhorenvio.com.br/tracking

---

## 💡 DICAS TÉCNICAS

1. **Sempre valide CEP** - Use regex `/^[0-9]{8}$/`
2. **Cache de cotações** - Considere cachear por 1h para mesmo CEP/produto
3. **Timeout** - APIs externas podem demorar, use timeout de 10s
4. **Fallback** - Se Melhor Envio cair, tenha um plano B
5. **Monitoramento** - Use Sentry ou similar para errors em produção

---

## 🎯 MÉTRICAS DE SUCESSO

- ✅ Calculadora conectada ao Melhor Envio
- ✅ Token válido e funcionando
- ✅ 7 transportadoras disponíveis
- ⏳ Taxa de conversão de cálculos (a medir)
- ⏳ Tempo médio de resposta < 3s
- ⏳ Taxa de erro < 1%
