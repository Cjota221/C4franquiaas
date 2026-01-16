# 💰 C4 WALLET - GUIA DE IMPLEMENTAÇÃO COMPLETA

## 📋 Resumo do Módulo

O **C4 Wallet** é um sistema completo de carteira digital para revendedoras, incluindo:

- ✅ Recarga via PIX (Mercado Pago)
- ✅ Sistema de reservas "Caixinha"
- ✅ Extrato detalhado de transações
- ✅ Painel de separação para estoquistas
- ✅ Gestão administrativa de carteiras
- ✅ Feature flag para rollout controlado

---

## 🗄️ PASSO 1: Aplicar a Migration SQL

Execute o arquivo `migrations/C4_WALLET_COMPLETO.sql` no Supabase SQL Editor.

Isso criará:

- `wallets` - Carteiras das revendedoras
- `wallet_transactions` - Histórico de transações (extrato)
- `reservas` - Reservas de produtos (caixinha)
- `wallet_recargas` - Recargas PIX pendentes/pagas
- `wallet_config` - Configurações da feature
- Views: `vw_wallet_resumo`, `vw_fila_separacao`
- Functions: `fazer_reserva`, `cancelar_reserva`, `creditar_carteira`
- RLS policies para segurança

---

## ⚙️ PASSO 2: Configurar Variáveis de Ambiente

Adicione no `.env.local`:

```env
# Mercado Pago (para PIX)
MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret

# Supabase Service Role (para webhooks)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

---

## 🔗 PASSO 3: Configurar Webhook do Mercado Pago

1. Acesse o Dashboard do Mercado Pago
2. Vá em **Configurações > Webhooks**
3. Adicione o URL: `https://seu-dominio.com/api/wallet/webhook/mercadopago`
4. Selecione eventos: `payment`

---

## 🎯 PASSO 4: Habilitar Feature Flag

Por padrão, o C4 Wallet está habilitado apenas para:

- Slug: `vivaz`

Para adicionar mais lojas, execute no SQL:

```sql
UPDATE wallet_config
SET valor = '["vivaz", "outra-loja", "mais-uma"]'
WHERE chave = 'allowed_slugs';
```

Para habilitar para todos:

```sql
UPDATE wallet_config SET valor = 'true' WHERE chave = 'feature_enabled';
```

---

## 📂 Arquivos Criados

### Backend (APIs)

- `app/api/wallet/route.ts` - API principal da carteira
- `app/api/wallet/recarga/route.ts` - Criar recarga PIX
- `app/api/wallet/reserva/route.ts` - Fazer reservas
- `app/api/wallet/reserva/cancelar/route.ts` - Cancelar reserva (estorno)
- `app/api/wallet/webhook/mercadopago/route.ts` - Webhook do MP

### Frontend (Páginas)

- `app/revendedora/carteira/page.tsx` - Minha Carteira (revendedora)
- `app/admin/separacao/page.tsx` - Fila de Separação (estoquista)
- `app/admin/carteiras/page.tsx` - Gestão de Carteiras (admin)

### Componentes

- `components/ReservarCaixinha.tsx` - Botão de reserva no checkout
- `lib/wallet.ts` - Funções utilitárias e tipos

---

## 🧪 PASSO 5: Testar o Fluxo

### Teste 1: Criar Carteira

1. Acesse `/revendedora/carteira` como revendedora da loja `vivaz`
2. A carteira será criada automaticamente

### Teste 2: Simular Recarga (Desenvolvimento)

Como não há token do Mercado Pago configurado, o sistema usa mock:

```sql
-- Creditar R$ 500 manualmente para teste
SELECT creditar_carteira(
  (SELECT id FROM wallets WHERE revendedora_id = 'SEU_USER_ID'),
  500.00,
  'CREDITO_PIX',
  'Recarga de teste',
  'teste',
  'TESTE_001'
);
```

### Teste 3: Fazer Reserva

1. Tenha saldo na carteira
2. Vá na página de produto
3. Use o componente `ReservarCaixinha`
4. O saldo será debitado e o estoque reservado

### Teste 4: Separação

1. Acesse `/admin/separacao`
2. Veja a fila de itens aguardando separação
3. Clique em "Iniciar Separação" e depois "Marcar Separado"

---

## 📊 Configurações Padrão

| Configuração            | Valor       | Descrição                            |
| ----------------------- | ----------- | ------------------------------------ |
| recarga_minima          | R$ 150,00   | Mínimo para recarga PIX              |
| recarga_maxima          | R$ 5.000,00 | Máximo para recarga PIX              |
| itens_minimos_envio     | 5           | Mínimo de itens para solicitar envio |
| dias_expiracao_reserva  | 30          | Dias até reserva expirar             |
| taxa_reserva_percentual | 0%          | Taxa por reserva                     |

---

## 🔒 Segurança (RLS)

- Revendedora só vê própria carteira e transações
- Admin vê todas as carteiras
- Estoquista pode gerenciar reservas
- Webhook usa Service Role Key (ignora RLS)

---

## 🚀 Próximos Passos (Futuro)

1. [ ] Notificações push quando recarga é confirmada
2. [ ] Dashboard de métricas do wallet
3. [ ] Sistema de cashback automático
4. [ ] Crédito parcelado
5. [ ] Integração com remessas (botão "Solicitar Envio")

---

## ❓ Troubleshooting

### "Carteira não encontrada"

- A carteira é criada automaticamente quando a revendedora é aprovada
- Para criar manualmente: `INSERT INTO wallets (revendedora_id) VALUES ('user_id')`

### "Saldo insuficiente"

- Verifique o saldo real no banco
- Faça ajuste manual pelo painel admin

### Webhook não está funcionando

1. Verifique se o URL está correto
2. Verifique logs do Netlify
3. Teste com: `curl -X POST https://seu-site/api/wallet/webhook/mercadopago`

---

## ✅ Checklist de Deploy

- [ ] Executar SQL no Supabase
- [ ] Adicionar variáveis de ambiente no Netlify
- [ ] Configurar webhook no Mercado Pago
- [ ] Testar recarga em ambiente de sandbox
- [ ] Validar feature flag
- [ ] Testar fluxo completo com loja real

---

_Módulo desenvolvido para C4 Franquias - Junho 2025_
