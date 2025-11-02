# 📦 Sistema Completo de Envios - Melhor Envio

## 🎯 Visão Geral

Sistema completo de gestão de envios integrado ao Melhor Envio, com automação end-to-end desde o pagamento até a entrega.

## 🚀 Funcionalidades Implementadas

### 1. Cálculo de Frete ✅

- Cotação em tempo real
- Múltiplas transportadoras
- Prazo de entrega
- Valor do frete

### 2. Gestão de Etiquetas 🏷️

- **Geração Automática**: Etiqueta criada ao confirmar pagamento
- **Impressão**: PDF em lote ou individual
- **Rastreamento**: Código de rastreio gerado
- **Status**: Acompanhamento em tempo real

### 3. Rastreamento 📍

- **Histórico Completo**: Todos os eventos de rastreamento
- **Atualização Automática**: Via webhook do Melhor Envio
- **Notificações**: Cliente recebe updates por email/WhatsApp

### 4. Logística Reversa 🔄

- **Devoluções**: Gerar envio reverso
- **Trocas**: Gestão completa
- **Rastreamento**: Acompanhamento da devolução

### 5. Automações ⚡

- Etiqueta gerada automaticamente após pagamento
- Notificação ao cliente quando enviado
- Atualização de status via rastreamento
- Email/WhatsApp automático

## 📊 Fluxo Completo

```
1. CLIENTE FAZ PEDIDO
   ↓
2. PAGAMENTO CONFIRMADO (Webhook Mercado Pago)
   ↓
3. 🤖 AUTOMAÇÃO: Adicionar ao Carrinho Melhor Envio
   ↓
4. 🤖 AUTOMAÇÃO: Fazer Checkout
   ↓
5. 🤖 AUTOMAÇÃO: Gerar Etiqueta
   ↓
6. 🤖 AUTOMAÇÃO: Enviar Email/WhatsApp ao Cliente
   ↓
7. ADMIN: Imprime Etiqueta e Posta
   ↓
8. 🤖 WEBHOOK: Melhor Envio atualiza status
   ↓
9. 🤖 AUTOMAÇÃO: Notifica cliente de cada mudança
   ↓
10. ENTREGUE ✅
```

## 🗄️ Estrutura do Banco de Dados

### Tabela: `pedidos_envio`

Armazena todos os dados do envio:

- IDs do Melhor Envio
- Código de rastreio
- Status do envio
- URL da etiqueta
- Valores e prazos

### Tabela: `envio_rastreamento`

Histórico completo de rastreamento:

- Status
- Localização
- Data/hora do evento
- Mensagem

### Tabela: `envio_notificacoes`

Log de notificações enviadas:

- Tipo (email, WhatsApp, SMS)
- Destinatário
- Status de envio

## 🔧 APIs Criadas

### `/api/envios/gerar-etiqueta`

**POST** - Gera etiqueta para um pedido

```json
{
  "pedido_id": "uuid",
  "servico_id": 1 // PAC, SEDEX, etc
}
```

### `/api/envios/rastreamento/[orderId]`

**GET** - Busca rastreamento atualizado

### `/api/envios/webhook`

**POST** - Recebe atualizações do Melhor Envio

### `/api/envios/cancelar`

**POST** - Cancela um envio

### `/api/envios/logistica-reversa`

**POST** - Cria envio de devolução

## 📱 Painel Admin

### Dashboard de Envios

- Lista todos os envios
- Status em tempo real
- Filtros (pendente, enviado, entregue)
- Ações em lote

### Detalhes do Envio

- Rastreamento completo
- Timeline de eventos
- Imprimir etiqueta
- Cancelar/Reversa

## ⚙️ Variáveis de Ambiente Necessárias

```env
# Melhor Envio
MELHORENVIO_CLIENT_ID=seu_client_id
MELHORENVIO_CLIENT_SECRET=seu_client_secret
MELHORENVIO_REDIRECT_URI=https://seusite.com/api/melhorenvio-callback
MELHORENVIO_SANDBOX=false

# Endereço de Origem (CEP do estoque/loja)
MELHORENVIO_CEP_ORIGEM=01310100
MELHORENVIO_ENDERECO_ORIGEM=Avenida Paulista, 1000
```

## 📋 Próximos Passos

1. ✅ Aplicar migration 030
2. ✅ Criar APIs de envio
3. ✅ Criar painel admin
4. ✅ Implementar automação (hook no webhook do Mercado Pago)
5. ✅ Configurar webhook do Melhor Envio
6. ✅ Implementar notificações

## 🎓 Como Usar

### Para o Admin:

1. Aguardar pedido pago
2. Sistema gera etiqueta automaticamente
3. Acessar `/admin/envios`
4. Imprimir etiquetas do dia
5. Postar nos Correios/Transportadora
6. Acompanhar rastreamento

### Para o Cliente:

1. Recebe email: "Seu pedido foi enviado!"
2. Acessa link de rastreamento
3. Recebe updates automáticos
4. Confirma entrega

## 🔐 Segurança

- Token armazenado criptografado no Supabase
- Webhook com validação de assinatura
- Row Level Security (RLS) nas tabelas
- Logs de todas as ações

## 📞 Suporte

Em caso de problemas:

1. Verificar logs em `/admin/envios/logs`
2. Verificar status da integração em `/admin/configuracoes/melhorenvio`
3. Renovar token se expirado
