# 🚨 INVESTIGAÇÃO: POR QUE A SINCRONIZAÇÃO PAROU

## ❌ PROBLEMA REAL
- **ANTES**: Tudo funcionava, estoque sendo atualizado normalmente
- **AGORA**: Nada sincroniza mais (parou do nada)
- **CRÍTICO**: Sistema não pode entrar em produção assim

---

## 🔍 POSSÍVEIS CAUSAS (ordem de probabilidade)

### 1. **Token do FácilZap Expirou** 🔑 (MAIS PROVÁVEL)
**Sintoma**: API para de responder ou retorna 401
**Como verificar**: Execute `node test-sync-facilzap.mjs`

### 2. **Cron Job / Webhook Parou de Ser Chamado** ⏰
**Sintoma**: Produtos não atualizam há horas/dias
**Como verificar**: Query 1 do `DIAGNOSTICO_SYNC_COMPLETO.sql`

### 3. **Erro no Código que Quebrou o Processo** 🐛
**Sintoma**: Sync inicia mas falha no meio
**Como verificar**: Logs de erro, Query 5 do diagnóstico

### 4. **Banco de Dados com Lock/Timeout** 💾
**Sintoma**: Queries lentas ou travadas
**Como verificar**: Performance do Supabase

### 5. **API do FácilZap Fora do Ar** 🌐
**Sintoma**: Requisições falham com timeout
**Como verificar**: Status da API FácilZap

---

## 🛠️ PASSO A PASSO PARA DESCOBRIR O PROBLEMA

### **PASSO 1: Diagnóstico Rápido no Banco** ⚡

Abra **Supabase SQL Editor** e execute:

```sql
-- Quando foi a última sincronização?
SELECT 
  MAX(ultima_sincronizacao) as ultima_sync,
  COUNT(*) as total_produtos
FROM produtos
WHERE sincronizado_facilzap = true;
```

**Se retornar data/hora antiga (mais de 2h):**
→ Sincronização parou de rodar

**Se retornar data recente (últimos minutos):**
→ Sincronização está rodando, mas produtos não estão aparecendo nos sites

---

### **PASSO 2: Testar Token do FácilZap** 🔑

Execute no terminal:

```powershell
node test-sync-facilzap.mjs
```

**Possíveis resultados:**

✅ **"SUCESSO! API respondendo normalmente"**
→ Token OK, problema é em outro lugar

❌ **"TOKEN INVÁLIDO ou EXPIRADO"** (Status 401)
→ **ESTE É O PROBLEMA!** Renove o token

❌ **"ERRO DE DNS / CONEXÃO RECUSADA"**
→ Problema de rede ou API fora do ar

---

### **PASSO 3: Sincronização Manual** 🧪

Teste manualmente clicando no botão **"Sincronizar FácilZap"** no painel admin.

**O que observar:**
- Console do navegador (F12) - tem erros?
- Quanto tempo demora? (mais de 30s = problema)
- Retorna sucesso ou erro?

---

### **PASSO 4: Verificar Inconsistências** 🔍

Execute no Supabase:

```sql
-- Produtos com estoque mas inativos (inconsistência)
SELECT 
  id, nome, estoque, ativo,
  ultima_sincronizacao
FROM produtos
WHERE estoque > 0 AND ativo = false
LIMIT 20;
```

**Se retornar muitos produtos:**
→ Lógica de ativação/desativação quebrada

---

## 📊 DIAGNÓSTICO COMPLETO (Se nada acima resolver)

Execute **TODAS** as queries do arquivo:
`DIAGNOSTICO_SYNC_COMPLETO.sql`

Copie os resultados e me envie para análise.

---

## 🎯 CHECKLIST DE VERIFICAÇÃO

Use este checklist para ir eliminando possibilidades:

- [ ] **Token válido**: `node test-sync-facilzap.mjs` retorna sucesso
- [ ] **Última sync recente**: Query mostra timestamp de hoje
- [ ] **Sem erros em logs**: Query 5 não retorna erros
- [ ] **Trigger ativo**: Query 4 lista o trigger
- [ ] **Produtos consistentes**: Query 6 não mostra muitas inconsistências
- [ ] **API respondendo**: FácilZap retorna dados
- [ ] **Servidor rodando**: `npm run dev` sem erros

---

## 🆘 AÇÕES IMEDIATAS

**1. Execute AGORA:**
```powershell
node test-sync-facilzap.mjs
```

**2. Me envie o resultado completo** (toda a saída do terminal)

**3. Execute esta query no Supabase:**
```sql
SELECT 
  MAX(ultima_sincronizacao) as ultima_sync,
  COUNT(*) as total
FROM produtos;
```

**4. Me diga:**
- Quando exatamente parou de funcionar? (dia/hora aproximada)
- Alguma mudança foi feita antes disso? (deploy, atualização, etc)
- Está acontecendo em dev, produção ou ambos?

---

## 💡 TEORIA PRINCIPAL

**Baseado na sua descrição ("funcionava até hoje de manhã, agora parou do nada"):**

🔑 **Aposto que é o Token do FácilZap que expirou!**

Tokens de API geralmente têm validade de:
- 24h (tokens temporários)
- 30 dias (tokens normais)
- 90 dias (tokens de longa duração)

**Solução rápida se for isso:**
1. Renove o token no painel do FácilZap
2. Atualize no `.env.local` ou Supabase
3. Faça deploy/restart
4. Teste novamente

---

## 🎬 PRÓXIMOS PASSOS

1. ⏳ Execute `test-sync-facilzap.mjs`
2. ⏳ Me envie o resultado
3. ⏳ Execute queries SQL básicas
4. ⏳ Me diga quando parou exatamente

Com essas informações, vou descobrir EXATAMENTE onde está o problema! 🔍
