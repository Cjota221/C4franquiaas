# 📱 Guia de Configuração - Evolution API (WhatsApp Grátis)

## O que é a Evolution API?

A Evolution API é uma solução **gratuita e open-source** para enviar mensagens via WhatsApp.
Funciona conectando um número de WhatsApp real através de QR Code.

## 🚀 Como Instalar

### Opção 1: Docker (Recomendado)

```bash
# Clonar repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Rodar com Docker
docker-compose up -d
```

A API estará disponível em `http://localhost:8080`

### Opção 2: VPS Barata

Recomendo:

- **Hostinger VPS** - R$ 19/mês
- **Contabo** - €5/mês
- **Oracle Cloud** - Grátis (sempre grátis)
- **DigitalOcean** - $5/mês

```bash
# No servidor, rode:
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua_chave_secreta \
  atendai/evolution-api:latest
```

### Opção 3: Serviços Gerenciados

- **Railway.app** - Grátis para começar
- **Render.com** - Plano grátis disponível
- **Fly.io** - Generoso plano grátis

---

## ⚙️ Configuração no Projeto

### 1. Variáveis de Ambiente

Adicione no Netlify (ou .env.local):

```env
# Evolution API
EVOLUTION_API_URL=https://sua-api.com
EVOLUTION_API_KEY=sua_chave_secreta
EVOLUTION_INSTANCE=c4franquias
```

### 2. Criar Instância

Após instalar a Evolution API, crie uma instância:

```bash
curl -X POST "https://sua-api.com/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: sua_chave_secreta" \
  -d '{
    "instanceName": "c4franquias",
    "qrcode": true
  }'
```

### 3. Conectar WhatsApp

Acesse o painel da Evolution API ou faça:

```bash
curl "https://sua-api.com/instance/qrcode/c4franquias" \
  -H "apikey: sua_chave_secreta"
```

Escaneie o QR Code com o WhatsApp que será usado para enviar mensagens.

---

## 📨 Funcionalidades Implementadas

### 1. Notificação de Aprovação de Revendedora ✅

Quando você aprovar uma revendedora, ela recebe:

- Email (se Resend configurado)
- WhatsApp (se Evolution configurada)

### 2. Carrinho Abandonado ✅

Sistema automático de recuperação:

| Tempo    | Ação                        |
| -------- | --------------------------- |
| 30 min   | Primeiro lembrete amigável  |
| 2 horas  | Segundo lembrete (urgência) |
| 24 horas | Carrinho expira             |

#### Como funciona:

1. Cliente adiciona produtos ao carrinho
2. Sistema registra o carrinho com telefone
3. Se não finalizar, recebe lembretes via WhatsApp
4. Se finalizar, carrinho é marcado como "recuperado"

#### Ativar o processamento:

Crie um cron job para chamar a cada 30 minutos:

```bash
# Netlify Scheduled Functions, Vercel Cron, ou cron externo
curl -X GET "https://seu-site.netlify.app/api/whatsapp/carrinho-abandonado" \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

---

## 🔐 Segurança

### Proteger endpoint de cron

Adicione no Netlify:

```env
CRON_SECRET=uma_chave_secreta_longa_aqui
```

### Limites de envio

A Evolution API não tem limites, mas o WhatsApp tem regras:

- Não envie spam
- Respeite opt-out
- Máximo ~200 mensagens/dia para números novos
- Números "aquecidos" podem enviar mais

---

## 📊 Monitoramento

### Ver logs da Evolution API

```bash
docker logs -f evolution-api
```

### Status da instância

```bash
curl "https://sua-api.com/instance/connectionState/c4franquias" \
  -H "apikey: sua_chave_secreta"
```

---

## 💡 Dicas

### 1. Use um número dedicado

Não use seu WhatsApp pessoal! Compre um chip para isso.

### 2. Personalize as mensagens

Edite os templates em `lib/whatsapp/evolution.ts`

### 3. Teste antes de produção

Use números de teste antes de enviar para clientes reais.

### 4. Backup do número

A Evolution API salva a sessão, mas faça backup regular.

---

## 🆘 Problemas Comuns

### "Número desconectado"

- Reescaneie o QR Code
- Verifique se o WhatsApp não foi banido

### "Mensagem não enviada"

- Verifique o formato do telefone (55 + DDD + número)
- Confira se a API está rodando

### "Rate limit"

- Reduza a velocidade de envio
- Espere algumas horas

---

## ✅ Checklist de Configuração

- [ ] Evolution API instalada e rodando
- [ ] Instância criada
- [ ] WhatsApp conectado (QR Code escaneado)
- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] Teste de envio funcionando
- [ ] Cron job configurado para carrinho abandonado

---

## 📚 Links Úteis

- [Documentação Evolution API](https://doc.evolution-api.com/)
- [GitHub Evolution API](https://github.com/EvolutionAPI/evolution-api)
- [Discord da Comunidade](https://discord.gg/evolution-api)
