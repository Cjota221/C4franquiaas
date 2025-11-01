# Guia de Integração: Melhor Envio

## 📦 Visão Geral

Este guia documenta a integração completa com o Melhor Envio para cotação de frete em tempo real.

## ✅ O que foi implementado

### 1. **Migration de Banco de Dados**
- Arquivo: `migrations/029_config_melhorenvio.sql`
- Tabela: `config_melhorenvio`
- Campos:
  - `access_token`: Token de acesso OAuth
  - `refresh_token`: Token para renovar acesso
  - `expires_at`: Data de expiração do token
  - `token_type`: Tipo de token (Bearer)

### 2. **Painel de Administração**
- Rota: `/admin/melhorenvio`
- Funcionalidades:
  - Verificar status da autorização
  - Botão para autorizar aplicativo
  - Indicador visual de conexão

### 3. **Callback OAuth**
- Rota: `/admin/melhorenvio/callback`
- Funcionalidades:
  - Recebe código de autorização
  - Troca código por access_token
  - Salva token no banco de dados
  - Redireciona para painel

### 4. **APIs**

#### API de Autorização
- Endpoint: `POST /api/admin/melhorenvio/authorize`
- Função: Trocar código OAuth por token de acesso
- Salva token no banco automaticamente

#### API de Status
- Endpoint: `GET /api/admin/melhorenvio/status`
- Função: Verificar se aplicativo está autorizado
- Retorna: `{ authorized: boolean, expires_at: string }`

#### API de Cálculo de Frete (Atualizada)
- Endpoint: `POST /api/calcular-frete`
- Fluxo:
  1. **Tenta usar Melhor Envio** (se autorizado)
  2. **Fallback para tabela** (se não autorizado ou erro)
- Parâmetros:
  ```json
  {
    "cep": "01310100",
    "dominio": "minhaloja",
    "valorCarrinho": 100,
    "peso": 500,
    "altura": 10,
    "largura": 15,
    "comprimento": 20
  }
  ```

## 🚀 Passo a Passo para Ativar

### **1. Aplicar Migration no Supabase**

```sql
-- Copie e execute no SQL Editor do Supabase:
-- Migration 029: Criar tabela para configuração do Melhor Envio
CREATE TABLE IF NOT EXISTS config_melhorenvio (
  id INTEGER PRIMARY KEY DEFAULT 1,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_in INTEGER,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT single_row CHECK (id = 1)
);

COMMENT ON TABLE config_melhorenvio IS 'Armazena tokens OAuth do Melhor Envio';
COMMENT ON COLUMN config_melhorenvio.access_token IS 'Token de acesso OAuth';
COMMENT ON COLUMN config_melhorenvio.refresh_token IS 'Token para renovar';
COMMENT ON COLUMN config_melhorenvio.expires_at IS 'Data de expiração';

CREATE INDEX IF NOT EXISTS idx_melhorenvio_expires ON config_melhorenvio(expires_at);

INSERT INTO config_melhorenvio (id, access_token, refresh_token)
VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;
```

### **2. Verificar Variáveis de Ambiente**

Verifique se `.env.local` contém:

```bash
# Melhor Envio
MELHORENVIO_CLIENT_ID=7341
MELHORENVIO_CLIENT_SECRET=D2CKz52bxlmBjjMrUMdwW6dmvAvb6AZ0oYiCGWCG
MELHORENVIO_SANDBOX=true
```

### **3. Adicionar no Netlify**

Vá em: **Site configuration → Environment variables**

Adicione:
- `MELHORENVIO_CLIENT_ID` = `7341`
- `MELHORENVIO_CLIENT_SECRET` = `D2CKz52bxlmBjjMrUMdwW6dmvAvb6AZ0oYiCGWCG`
- `MELHORENVIO_SANDBOX` = `true`

### **4. Autorizar Aplicativo**

1. Acesse: `https://c4franquiaas.netlify.app/admin/melhorenvio`
2. Clique em **"Autorizar Melhor Envio"**
3. Você será redirecionado para o Melhor Envio Sandbox
4. Faça login com suas credenciais Melhor Envio
5. Autorize o aplicativo "C4franquia"
6. Você será redirecionado de volta
7. O token será salvo automaticamente

### **5. Testar Integração**

Após autorizar, a calculadora de frete irá:
- ✅ Buscar token do banco
- ✅ Chamar API do Melhor Envio
- ✅ Retornar cotações reais (PAC, SEDEX, Jadlog, etc)
- ✅ Se falhar, usar tabela de preços como fallback

## 🔍 Como Verificar se Está Funcionando

### Teste Manual na API

```bash
# Testar calculadora
POST https://c4franquiaas.netlify.app/api/calcular-frete
Content-Type: application/json

{
  "cep": "13090100",
  "dominio": "c4",
  "valorCarrinho": 150,
  "peso": 500
}
```

### Resposta Esperada (Melhor Envio)

```json
{
  "success": true,
  "usando_melhorenvio": true,
  "cep": "13090100",
  "opcoes": [
    {
      "nome": "PAC",
      "valor": 18.50,
      "prazo": "7-10 dias úteis",
      "codigo": "Correios",
      "transportadora": "Correios",
      "servico_id": "1",
      "company": {
        "id": 1,
        "name": "Correios",
        "picture": "..."
      }
    },
    {
      "nome": "SEDEX",
      "valor": 28.90,
      "prazo": "2-3 dias úteis",
      "codigo": "Correios",
      "transportadora": "Correios",
      "servico_id": "2"
    },
    {
      "nome": "Jadlog",
      "valor": 22.40,
      "prazo": "4-5 dias úteis",
      "codigo": "Jadlog",
      "transportadora": "Jadlog",
      "servico_id": "3"
    }
  ],
  "configuracao": {
    "freteGratisValor": 150,
    "cepOrigem": "01310100"
  }
}
```

### Resposta com Fallback (Tabela)

```json
{
  "success": true,
  "usando_tabela": true,
  "cep": "13090100",
  "destino": "Campinas - SP",
  "opcoes": [
    {
      "nome": "Correios - PAC",
      "valor": 15.90,
      "prazo": "7 dias úteis",
      "codigo": "PAC",
      "transportadora": "Correios"
    },
    {
      "nome": "Correios - SEDEX",
      "valor": 25.90,
      "prazo": "3 dias úteis",
      "codigo": "SEDEX",
      "transportadora": "Correios"
    }
  ]
}
```

## 🔄 Fluxo de Autorização OAuth

```
┌──────────────┐
│   Usuário    │
└──────┬───────┘
       │ 1. Clica "Autorizar"
       ▼
┌─────────────────────┐
│  /admin/melhorenvio │
└──────┬──────────────┘
       │ 2. Redireciona para Melhor Envio
       ▼
┌────────────────────────────────┐
│  https://sandbox.melhorenvio   │
│  /oauth/authorize?client_id... │
└──────┬─────────────────────────┘
       │ 3. Usuário autoriza
       ▼
┌────────────────────────────────┐
│  /admin/melhorenvio/callback   │
│  ?code=ABC123                  │
└──────┬─────────────────────────┘
       │ 4. Chama API /authorize
       ▼
┌──────────────────────────────────┐
│  POST /api/admin/melhorenvio/    │
│  authorize { code: "ABC123" }    │
└──────┬───────────────────────────┘
       │ 5. Troca code por token
       ▼
┌────────────────────────────────┐
│  POST melhorenvio.com.br       │
│  /oauth/token                  │
└──────┬─────────────────────────┘
       │ 6. Retorna access_token
       ▼
┌────────────────────────────────┐
│  Salva no Supabase             │
│  config_melhorenvio            │
└──────┬─────────────────────────┘
       │ 7. Redireciona
       ▼
┌────────────────────────────────┐
│  /admin/melhorenvio            │
│  ✅ Autorizado!                │
└────────────────────────────────┘
```

## 🐛 Troubleshooting

### Problema: "Token não encontrado"
**Solução:** Aplicar migration 029 no Supabase

### Problema: "Melhor Envio não disponível"
**Solução:** Verificar se autorização foi feita (acessar `/admin/melhorenvio`)

### Problema: "Retornando valores fixos R$15.90"
**Solução:** 
1. Verificar se token está válido no banco
2. Verificar se `expires_at` não passou
3. Re-autorizar se necessário

### Problema: "Sandbox não funciona"
**Solução:** Melhor Envio sandbox pode ter restrições. Para produção:
- Mudar `MELHORENVIO_SANDBOX=false`
- Usar credenciais de produção
- Re-autorizar aplicativo

## 📊 Logs para Debug

A API mostra logs detalhados:

```
[Calcular Frete] 🚀 Request recebido: { cep, dominio, valorCarrinho }
[Calcular Frete] 🔍 Tentando usar Melhor Envio...
[Melhor Envio] 📦 Cotando frete...
[Melhor Envio] ✅ Cotações recebidas: 5
[Calcular Frete] ✅ Usando cotação do Melhor Envio
```

Ou com fallback:

```
[Melhor Envio] Token não encontrado, usando fallback
[Calcular Frete] ⚠️ Melhor Envio não disponível, usando cálculo por tabela
[Calcular Frete] ✅ CEP válido: São Paulo - SP
```

## 🎯 Próximos Passos

Após a integração básica funcionar:

1. **Geração de Etiquetas**: Implementar POST para `/api/v2/me/shipment/generate`
2. **Rastreamento**: Implementar GET para `/api/v2/me/shipment/tracking`
3. **Refresh Token**: Renovar automaticamente quando expirar
4. **Webhook**: Receber atualizações de status de envio

## ✨ Vantagens do Melhor Envio

- ✅ Cotação em tempo real
- ✅ Múltiplas transportadoras (Correios, Jadlog, Azul, etc)
- ✅ Preços reais (sem estimativa)
- ✅ Geração de etiquetas
- ✅ Rastreamento integrado
- ✅ Desconto de até 70% nos fretes
- ✅ Fallback automático para tabela

## 📝 Credenciais do App

**App:** C4franquia  
**Client ID:** 7341  
**Client Secret:** D2CKz52bxlmBjjMrUMdwW6dmvAvb6AZ0oYiCGWCG  
**Callback URL:** https://c4franquiaas.netlify.app/admin/melhorenvio/callback  
**Ambiente:** Sandbox (teste)

---

**Status:** ✅ Pronto para uso  
**Data:** 2025-01-XX  
**Última atualização:** Integração OAuth completa
