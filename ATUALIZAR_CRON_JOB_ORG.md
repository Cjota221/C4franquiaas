# 📝 Atualizar URLs no Cron-Job.org

## 🎯 Objetivo

Usar os endpoints corretos que têm melhor controle de rate limiting e sincronização.

---

## 📋 Passos

### 1️⃣ Acessar Cron-Job.org

1. Acesse: https://cron-job.org
2. Faça login
3. Vá em "Cronjobs"

---

### 2️⃣ Atualizar "Atualização de estoque"

**Cron atual:**

- ❌ URL: `https://c4franquiaas.netlify.app/api/cron-estoque`

**Mudar para:**

- ✅ URL: `https://c4franquiaas.netlify.app/api/sync-estoque-polling`
- ✅ Frequência: Manter "A cada 2 minutos" (ou `*/2 * * * *`)

**Como fazer:**

1. Clique em "EDITAR" no cron "Atualização de estoque"
2. Substitua a URL por: `https://c4franquiaas.netlify.app/api/sync-estoque-polling`
3. Clique em "Salvar"

---

### 3️⃣ Atualizar "Atualização de produtos"

**Cron atual:**

- ❌ URL: `https://c4franquiaas.netlify.app/api/sync-produtos`

**Mudar para:**

- ✅ URL: `https://c4franquiaas.netlify.app/api/sync-produtos`
- ✅ Frequência: Pode aumentar para "A cada 2 horas" (`0 */2 * * *`)

**Como fazer:**

1. Clique em "EDITAR" no cron "Atualização de produtos"
2. OPCIONAL: Mude a frequência de 1 hora para 2 horas
3. Clique em "Salvar"

---

## ✅ Resultado Esperado

Após salvar, você terá:

| Cron                    | URL                         | Frequência | O que faz                            |
| ----------------------- | --------------------------- | ---------- | ------------------------------------ |
| Atualização de estoque  | `/api/sync-estoque-polling` | 2 minutos  | Sincroniza estoque com rate limiting |
| Atualização de produtos | `/api/sync-produtos`        | 1-2 horas  | Sincroniza produtos completos        |

---

## 🔍 Como Testar

### Testar manualmente:

```bash
# Estoque
curl https://c4franquiaas.netlify.app/api/sync-estoque-polling -X POST

# Produtos
curl https://c4franquiaas.netlify.app/api/sync-produtos -X POST
```

### Ver status:

```bash
# Status do sync de estoque
curl https://c4franquiaas.netlify.app/api/sync-estoque-polling

# Deve retornar:
{
  "service": "Stock Sync Service (Polling)",
  "status": "idle",
  "schedule": "A cada 2 minutos (Cron)"
}
```

---

## 💡 Diferenças dos Endpoints

### `/api/cron-estoque` (antigo)

- ⚠️ Sem controle de concorrência
- ⚠️ Timeout simples (20s)
- ✅ Funciona, mas menos robusto

### `/api/sync-estoque-polling` (NOVO - recomendado)

- ✅ Controle de concorrência (impede execuções simultâneas)
- ✅ Rate limiting respeitado (2 req/s)
- ✅ Timeout de 5 minutos (300s)
- ✅ Throttling entre páginas (1.2s delay)
- ✅ Serviço dedicado com estado

---

## ⚠️ Importante

Após atualizar:

1. ✅ Aguarde 2 minutos
2. ✅ Verifique logs no Cron-Job.org
3. ✅ Status deve ser "200 OK"
4. ✅ Corpo deve mostrar `{"success": true, "updated": X}`

---

## 🆘 Se der erro

Execute no Supabase SQL Editor:

```sql
SELECT tipo, descricao, erro, created_at
FROM logs_sincronizacao
WHERE tipo LIKE '%sync%'
ORDER BY created_at DESC
LIMIT 10;
```

Me envie os resultados para diagnóstico.
