# 🚀 Sistema de Envios Melhor Envio - Próximos Passos

## ✅ O que já foi implementado

- ✅ **Migration 030**: Schema completo (pedidos_envio, envio_rastreamento, envio_notificacoes)
- ✅ **Service Library**: MelhorEnvioService com 8 métodos (calcular, gerar etiqueta, rastrear, etc)
- ✅ **APIs REST**:
  - POST `/api/envios/gerar-etiqueta` - Gera etiqueta automaticamente
  - GET `/api/envios/rastreamento/[orderId]` - Busca rastreamento atualizado
  - POST `/api/envios/webhook` - Recebe eventos do Melhor Envio
  - POST `/api/envios/imprimir` - Imprime etiquetas em lote
- ✅ **Painel Admin**: `/admin/envios` - Listagem, filtros, impressão em lote
- ✅ **Documentação**: `docs/SISTEMA_ENVIOS_COMPLETO.md`
- ✅ **Token Produção**: Válido até 01/11/2026 (salvo no banco)

---

## 📋 ETAPAS OBRIGATÓRIAS (em ordem)

### 1️⃣ **Aplicar Migration 030 no Supabase** ⚠️ URGENTE

**Por que**: Sem isso, nenhuma API de envio vai funcionar (tabelas não existem)

**Como fazer**:

1. Acesse: https://supabase.com/dashboard/project/seu-projeto/editor
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Abra o arquivo `migrations/030_pedidos_envio.sql` local
5. **Copie TODO o conteúdo** e cole no editor SQL do Supabase
6. Clique em **Run** (▶)
7. Verifique se criou 3 tabelas: `pedidos_envio`, `envio_rastreamento`, `envio_notificacoes`

**Validação**:

```sql
-- Rode isso no SQL Editor para confirmar:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%envio%';
```

Deve retornar:

- `pedidos_envio`
- `envio_rastreamento`
- `envio_notificacoes`

---

### 2️⃣ **Configurar Webhook do Melhor Envio**

**Por que**: Para receber atualizações automáticas de rastreamento

**Como fazer**:

1. Acesse: https://melhorenvio.com.br/painel/gerenciar/tokens
2. Clique em **Webhooks** ou **Configurações da API**
3. Adicione novo webhook com:
   - **URL**: `https://c4franquiaas.netlify.app/api/envios/webhook`
   - **Eventos**: Marque TODOS (order.paid, order.generated, tracking.update, etc)
4. Salve

**Validação**: Melhor Envio vai fazer um teste de conexão (deve retornar 200 OK)

---

### 3️⃣ **Integrar com Webhook do Mercado Pago**

**Por que**: Para gerar etiqueta AUTOMATICAMENTE quando o pagamento for aprovado

**Arquivo a editar**: `app/api/mp-webhook/route.ts`

**O que adicionar** (após linha ~60, onde atualiza status do pedido):

```typescript
// Após atualizar o status do pedido para "confirmado"
if (status === 'approved') {
  // ✅ Gerar etiqueta automaticamente
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://c4franquiaas.netlify.app';
    const response = await fetch(`${baseUrl}/api/envios/gerar-etiqueta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: paymentData.external_reference }),
    });

    const result = await response.json();
    console.log('[MP Webhook] Etiqueta gerada:', result);
  } catch (error) {
    console.error('[MP Webhook] Erro ao gerar etiqueta:', error);
    // Não bloquear o webhook se falhar
  }
}
```

**Validação**: Faça um pedido de teste e confirme que a etiqueta é gerada automaticamente

---

### 4️⃣ **Deploy no Netlify**

**Por que**: Para ativar o sistema em produção

**Como fazer**:

```powershell
git push  # Já fizemos isso! ✅
```

**Aguardar**: Netlify vai fazer deploy automático (~3 minutos)

**Verificar logs**: https://app.netlify.com/sites/c4franquiaas/deploys

**Validação**:

- Acesse: https://c4franquiaas.netlify.app/admin/envios
- Deve carregar sem erros (tabela vazia é normal)

---

### 5️⃣ **Implementar Notificações (Email/WhatsApp)**

**Status atual**: Sistema salva notificações no banco, mas não envia ainda

**O que fazer**: Editar `app/api/envios/webhook/route.ts`

**Função a implementar** (linha ~55):

```typescript
async function enviarNotificacao(envio: any, tipo: string, mensagem: string) {
  // 1. Salvar no banco (já funciona)
  await supabase.from('envio_notificacoes').insert({
    envio_id: envio.id,
    tipo,
    mensagem,
    data_envio: new Date().toISOString(),
  });

  // 2. Enviar Email (via Resend, SendGrid, etc)
  if (envio.pedido?.email) {
    try {
      // TODO: Integrar com seu provedor de email
      // Exemplo com Resend:
      // await resend.emails.send({
      //   from: 'noreply@c4franquias.com',
      //   to: envio.pedido.email,
      //   subject: `Atualização do Pedido #${envio.pedido.numero_pedido}`,
      //   html: mensagem
      // });
      console.log('[Notificação] Email enviado para:', envio.pedido.email);
    } catch (error) {
      console.error('[Notificação] Erro ao enviar email:', error);
    }
  }

  // 3. Enviar WhatsApp (via FácilZap - você já tem integrado!)
  if (envio.pedido?.telefone) {
    try {
      // TODO: Use a API do FácilZap que você já configurou
      // Veja: docs/CONFIGURAR_WEBHOOK_FACILZAP.md
      console.log('[Notificação] WhatsApp enviado para:', envio.pedido.telefone);
    } catch (error) {
      console.error('[Notificação] Erro ao enviar WhatsApp:', error);
    }
  }
}
```

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Fluxo Completo

1. Faça um pedido de teste na loja
2. Pague com Mercado Pago (sandbox)
3. Verifique se etiqueta foi gerada automaticamente em `/admin/envios`
4. Confira no banco: `SELECT * FROM pedidos_envio ORDER BY created_at DESC LIMIT 1;`

### Teste 2: Rastreamento

1. Acesse `/admin/envios`
2. Clique em "Ver Detalhes" de um envio
3. Deve mostrar histórico de rastreamento

### Teste 3: Impressão de Etiquetas

1. Em `/admin/envios`, selecione um ou mais envios com status "pending"
2. Clique em "Imprimir Etiquetas Selecionadas"
3. Deve abrir PDF do Melhor Envio

### Teste 4: Webhook (após configurar no Melhor Envio)

1. Simule um evento no painel do Melhor Envio
2. Verifique os logs: `SELECT * FROM envio_rastreamento ORDER BY created_at DESC;`
3. Deve aparecer o evento capturado

---

## 📊 MONITORAMENTO

### Verificar se está tudo funcionando:

```sql
-- 1. Verificar envios criados
SELECT COUNT(*) as total_envios FROM pedidos_envio;

-- 2. Últimos rastreamentos
SELECT * FROM envio_rastreamento
ORDER BY created_at DESC
LIMIT 10;

-- 3. Notificações enviadas
SELECT tipo, COUNT(*) as total
FROM envio_notificacoes
GROUP BY tipo;

-- 4. Envios por status
SELECT status_envio, COUNT(*) as total
FROM pedidos_envio
GROUP BY status_envio;
```

---

## 🚨 TROUBLESHOOTING

### Erro: "Tabela pedidos_envio não encontrada"

**Solução**: Aplicar migration 030 (Etapa 1)

### Erro: "Invalid access token"

**Solução**: Token expirou. Gerar novo em https://melhorenvio.com.br/painel/gerenciar/tokens

### Webhook não recebe eventos

**Solução**:

1. Confirmar URL registrada no Melhor Envio
2. Testar manualmente: `POST https://c4franquiaas.netlify.app/api/envios/webhook`
3. Verificar logs Netlify: https://app.netlify.com/sites/c4franquiaas/logs

### Etiqueta não gera automaticamente

**Solução**: Verificar se integração com MP webhook foi feita (Etapa 3)

---

## 📚 DOCUMENTAÇÃO COMPLETA

Veja: `docs/SISTEMA_ENVIOS_COMPLETO.md`

---

## ✅ CHECKLIST FINAL

- [ ] Migration 030 aplicada no Supabase
- [ ] Webhook configurado no painel Melhor Envio
- [ ] Integração com MP webhook implementada
- [ ] Deploy no Netlify bem-sucedido
- [ ] Teste de pedido completo realizado
- [ ] Notificações implementadas (email/WhatsApp)
- [ ] Monitoramento configurado

---

**🎯 Prioridade MÁXIMA**: Etapas 1, 2 e 3 são essenciais para o sistema funcionar!

**⏱️ Tempo estimado**: 30-45 minutos para configuração completa

**💡 Dica**: Teste em sandbox primeiro, depois passe para produção
