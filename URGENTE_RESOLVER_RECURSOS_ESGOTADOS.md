# 🚨 EMERGÊNCIA: Recursos Esgotados (Netlify + Supabase)

## ❌ SITUAÇÃO CRÍTICA

**Netlify**: Site pausado (limite atingido)
**Supabase**: "Your project is currently exhausting multiple resources"

## 🔥 CAUSA RAIZ

O cron de sincronização rodando **A CADA 1 MINUTO** está destruindo ambos os serviços:

```
Cron: */1 * * * * (a cada 1 minuto)
↓
1.440 execuções por dia
↓
Cada execução:
  - Busca TODOS os produtos do FácilZap (~200 produtos)
  - Compara com TODOS os produtos do Supabase (~400 produtos)
  - Faz centenas de INSERTs/UPDATEs/DELETEs
  - Grava logs em logs_sincronizacao
↓
RESULTADO:
  - Netlify: 48h de function runtime/dia (limite: 34h/mês) ❌
  - Supabase: ~500.000+ queries/dia (limite Free: 50.000/dia) ❌
```

---

## 🚨 DESABILITAR CRON AGORA (URGENTE!)

### **Execute ESTES comandos IMEDIATAMENTE:**

```bash
# 1. Renomear arquivo do cron (desabilita completamente)
mv netlify/functions/scheduled-sync.ts netlify/functions/scheduled-sync.ts.DESABILITADO

# 2. Criar arquivo .gitignore para não versionar o desabilitado (opcional)
echo "*.DESABILITADO" >> netlify/functions/.gitignore

# 3. Commit
git add netlify/functions/
git commit -m "URGENT: desabilitar cron sync - esgotando Netlify e Supabase"

# 4. Push
git push origin main
```

**Aguarde 5-10 minutos para o deploy no Netlify parar o cron.**

---

## 📊 VERIFICAR USO NO SUPABASE

### **A. Dashboard Supabase:**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Reports** ou **Usage**
4. Verifique:
   - **Database Read/Write**: Deve estar em 100% ou próximo
   - **API Requests**: Provavelmente milhares/hora
   - **Database Size**: Pode estar crescendo com logs

### **B. Query para Ver Tamanho dos Logs:**

Execute no Supabase SQL Editor:

```sql
-- Ver tamanho da tabela logs_sincronizacao
SELECT
    pg_size_pretty(pg_total_relation_size('logs_sincronizacao')) as tamanho_total,
    COUNT(*) as total_registros
FROM logs_sincronizacao;

-- Ver logs recentes (últimas 24h)
SELECT
    COUNT(*) as total_logs_24h,
    COUNT(CASE WHEN tipo = 'produtos_excluidos_facilzap' THEN 1 END) as exclusoes,
    COUNT(CASE WHEN tipo = 'cron_sync_error' THEN 1 END) as erros
FROM logs_sincronizacao
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### **C. Limpar Logs Antigos (Economizar Espaço):**

**⚠️ Execute SOMENTE após desabilitar o cron!**

```sql
-- Manter apenas últimos 7 dias de logs
DELETE FROM logs_sincronizacao
WHERE created_at < NOW() - INTERVAL '7 days';

-- Ver quantos foram deletados
SELECT
    COUNT(*) as logs_restantes,
    pg_size_pretty(pg_total_relation_size('logs_sincronizacao')) as tamanho_depois
FROM logs_sincronizacao;
```

---

## 📉 IMPACTO DO CRON A CADA 1 MINUTO

### **Netlify:**

- **Uso**: ~48 horas de function runtime/dia
- **Limite Free**: 125.000 segundos/mês (~34 horas/MÊS)
- **Resultado**: Estoura em menos de 1 dia ❌

### **Supabase:**

- **Queries/dia**: ~500.000+ (estimativa)
  - 1.440 syncs × ~350 queries por sync
- **Limite Free**: 500MB database, 50.000 MAU (Monthly Active Users)
- **Resultado**: Database sobrecarregado ❌

---

## ✅ SOLUÇÕES PERMANENTES

### **OPÇÃO 1: Sync Manual (RECOMENDADO para Começar)**

**Vantagens:**

- Controle total
- Zero custo adicional
- Sincroniza apenas quando necessário

**Como usar:**

1. Acesse `/admin/produtos`
2. Clique em **"Sincronizar FácilZap"**
3. Aguarde 1-2 minutos
4. Sincronize 1-2x por dia ou quando necessário

---

### **OPÇÃO 2: Cron a Cada 6 Horas (GRÁTIS)**

**Reduz 99.7% do uso!**

Editar `netlify/functions/scheduled-sync.ts`:

```typescript
export const config: Config = {
  schedule: '0 */6 * * *', // Às 00:00, 06:00, 12:00, 18:00
};
```

**Uso:**

- Netlify: ~0.13 horas/dia (OK para Free)
- Supabase: ~1.400 queries/dia (OK para Free)

---

### **OPÇÃO 3: Cron Externo (GRÁTIS + FLEXÍVEL)**

Use **Cron-Job.org** (grátis):

1. Acesse: https://cron-job.org
2. Crie conta
3. Adicione job:
   - **URL**: `https://c4franquiaas.netlify.app/api/sync-produtos`
   - **Método**: POST
   - **Frequência**: A cada 6 horas (ou conforme necessário)

**Vantagens:**

- Não consome recursos do Netlify
- Flexível (pode mudar frequência facilmente)
- Grátis

---

### **OPÇÃO 4: Upgrade de Planos (PAGO)**

Se precisar sincronizar com alta frequência:

**Netlify Pro: $19/mês**

- 1.000.000 segundos de functions (240 horas)

**Supabase Pro: $25/mês**

- 8GB database
- 500.000 queries/dia
- Melhor performance

---

## 🎯 PLANO DE AÇÃO IMEDIATO

### **1. AGORA (Próximos 5 minutos):**

- [ ] Executar comandos acima (desabilitar cron)
- [ ] Verificar push no GitHub
- [ ] Aguardar deploy no Netlify (~5 min)

### **2. DEPOIS (Próximas 24 horas):**

- [ ] Verificar se Netlify reativou site
- [ ] Verificar uso no Supabase Dashboard
- [ ] Limpar logs antigos (opcional)

### **3. DECISÃO (Próximos dias):**

- [ ] Escolher: Manual, Cron 6h, Cron externo ou Upgrade
- [ ] Implementar solução escolhida
- [ ] Testar por 1 semana

---

## 🔧 OTIMIZAÇÕES ADICIONAIS

### **A. Reduzir Payload da Sincronização:**

Editar `app/api/sync-produtos/route.ts` para:

- Buscar apenas produtos modificados (últimas 24h)
- Não fazer logs de produtos "inalterados"
- Limitar batches

### **B. Adicionar Cache:**

Implementar cache Redis/Memcached para:

- Reduzir queries ao Supabase
- Acelerar sync

### **C. Webhooks do FácilZap:**

Se FácilZap suportar, configurar webhooks para:

- Produto criado → POST /api/webhook/produto-criado
- Produto atualizado → POST /api/webhook/produto-atualizado
- Produto deletado → POST /api/webhook/produto-deletado

**Vantagem**: Sync em tempo real sem polling!

---

## 📊 MONITORAMENTO

### **Após Desabilitar o Cron:**

Execute estas queries para confirmar:

```sql
-- 1. Ver últimos logs (deve parar de crescer)
SELECT
    tipo,
    descricao,
    created_at
FROM logs_sincronizacao
ORDER BY created_at DESC
LIMIT 10;

-- 2. Confirmar que sync automático parou
-- (não deve ter logs novos de "cron_sync")
SELECT
    COUNT(*) as total_logs_ultima_hora
FROM logs_sincronizacao
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND tipo LIKE 'cron%';
-- Deve retornar 0 após desabilitar
```

---

## ⚠️ SINAIS DE ALERTA

Se após desabilitar o cron, ainda houver problemas:

### **Netlify:**

- Site continua pausado → Aguardar 24h ou contactar suporte

### **Supabase:**

- Uso continua alto → Verificar se há outros processos consumindo
- Execute:
  ```sql
  SELECT * FROM pg_stat_activity
  WHERE state = 'active';
  ```

---

## 📞 SUPORTE

### **Netlify:**

- Dashboard: https://app.netlify.com
- Support: Contact Support no dashboard

### **Supabase:**

- Dashboard: https://supabase.com/dashboard
- Discord: https://discord.supabase.com

---

## ✅ CHECKLIST FINAL

- [ ] Cron desabilitado (arquivo renomeado)
- [ ] Commit e push executados
- [ ] Deploy completado no Netlify
- [ ] Aguardando 24h para reativação
- [ ] Uso do Supabase monitorado
- [ ] Logs antigos limpos (opcional)
- [ ] Decisão tomada sobre solução permanente

---

## 🎉 EXPECTATIVA PÓS-CORREÇÃO

**Uso Normal (sem cron):**

- Netlify: ~1-2 horas/mês (sync manual 1-2x/dia)
- Supabase: ~1.000-2.000 queries/dia (operação normal)

**Com Cron a cada 6h:**

- Netlify: ~3-4 horas/mês (OK para Free)
- Supabase: ~1.400 queries/dia (OK para Free)

---

**Execute os comandos AGORA e aguarde a recuperação dos serviços!**
