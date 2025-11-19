# 📊 Guia de Monitoramento da Sincronização Automática

## 🎯 O que você precisa verificar

### ✅ Checklist Diário

- [ ] Função está rodando no Netlify?
- [ ] Produtos estão sendo sincronizados?
- [ ] Estoque zero está desativando produtos?
- [ ] Não há erros nos logs?

---

## 1️⃣ Monitorar no NETLIFY

### Acessar os logs:

1. **Acesse**: https://app.netlify.com
2. **Clique no site**: c4franquiaas
3. **Menu lateral**: Functions
4. **Clique em**: scheduled-sync
5. **Veja**:
   - 📊 Quantas vezes rodou hoje
   - ⏰ Próxima execução (deve ser daqui 1 minuto)
   - 📝 Logs de cada execução

### O que procurar nos logs:

✅ **SUCESSO** - Você verá:

```
🔄 [Cron] Iniciando sincronização automática...
📡 [Cron] Chamando: https://...
✅ [Cron] Sincronização concluída!
📦 [Cron] Produtos importados: 371
```

❌ **ERRO** - Se aparecer:

```
❌ [Cron] Erro na sincronização
❌ [Cron] Erro fatal
```

→ Me chame para investigar!

---

## 2️⃣ Monitorar no SUPABASE

### Opção A: Via SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em: **SQL Editor**
4. Abra o arquivo: `MONITORAR_SINCRONIZACAO.sql`
5. Execute as queries que você precisa

### Queries Principais:

**Ver últimas sincronizações:**

```sql
SELECT * FROM logs_sincronizacao
ORDER BY timestamp DESC
LIMIT 30;
```

**Dashboard resumido:**

```sql
SELECT * FROM vw_estatisticas_sincronizacao;
```

**Produtos desativados por estoque zero:**

```sql
SELECT * FROM logs_sincronizacao
WHERE tipo = 'estoque_zerado'
ORDER BY timestamp DESC;
```

### Opção B: Via Interface (Table Editor)

1. Acesse: https://supabase.com/dashboard
2. Menu lateral: **Table Editor**
3. Selecione a tabela: **logs_sincronizacao**
4. Veja os registros mais recentes
5. Filtre por:
   - `tipo = 'estoque_zerado'` → Ver produtos desativados
   - `sucesso = false` → Ver erros
   - Ordernar por `timestamp DESC` → Mais recentes primeiro

---

## 3️⃣ Alertas Importantes

### 🚨 Problemas para ficar atento:

| Sintoma                             | O que pode ser               | Como resolver                     |
| ----------------------------------- | ---------------------------- | --------------------------------- |
| Função não roda há 5+ minutos       | Netlify parou o cron         | Verificar deploy, reativar função |
| Sincronização traz 0 produtos       | Token FácilZap expirado      | Renovar FACILZAP_TOKEN no Netlify |
| Muitos erros nos logs               | API FácilZap fora do ar      | Aguardar, cron vai tentar de novo |
| Produtos com estoque=0 ainda ativos | Lógica de desativação falhou | Rodar manualmente: ver query #5   |

---

## 4️⃣ Comandos Úteis

### Forçar sincronização manual (se precisar):

**Via terminal local:**

```powershell
curl -X POST http://localhost:3000/api/sync-produtos
```

**Via Postman/Insomnia:**

- Method: POST
- URL: `https://c4franquiaas.netlify.app/api/sync-produtos`
- Body: `{}`

### Ver logs em tempo real (Netlify CLI):

```powershell
netlify functions:log scheduled-sync
```

---

## 5️⃣ Métricas Esperadas

Com sincronização a cada 1 minuto:

| Métrica              | Valor Esperado |
| -------------------- | -------------- |
| Execuções por hora   | 60             |
| Execuções por dia    | 1,440          |
| Tempo médio por sync | 2-5 segundos   |
| Taxa de sucesso      | > 95%          |

---

## 6️⃣ Troubleshooting

### Problema: Função não aparece no Netlify

**Solução:**

1. Verificar se o deploy foi bem-sucedido
2. Ir em: Site → Deploys → Ver logs do último deploy
3. Procurar por: "Functions bundled"
4. Deve aparecer: `scheduled-sync.ts`

### Problema: Produtos não desativam quando estoque = 0

**Solução:**

1. Rodar no Supabase:

```sql
SELECT * FROM vw_produtos_estoque_zero;
```

2. Se aparecerem produtos, executar manualmente:

```sql
-- Pegar IDs dos produtos com estoque zero
WITH produtos_zero AS (
  SELECT id FROM produtos WHERE estoque = 0
)
-- Desativar nas franqueadas
UPDATE produtos_franqueadas_precos
SET ativo_no_site = false
WHERE produto_franqueada_id IN (
  SELECT pf.id FROM produtos_franqueadas pf
  WHERE pf.produto_id IN (SELECT id FROM produtos_zero)
);

-- Desativar nas revendedoras
UPDATE reseller_products
SET is_active = false
WHERE product_id IN (SELECT id FROM produtos_zero);
```

### Problema: Muitos logs, como limpar?

**Solução:**

```sql
-- Manter apenas últimos 7 dias
DELETE FROM logs_sincronizacao
WHERE timestamp < NOW() - INTERVAL '7 days';

-- Ou usar a função automática
SELECT limpar_logs_sincronizacao_antigos();
```

---

## 7️⃣ Dashboard Recomendado

### Ver status geral agora:

```sql
-- Dashboard rápido
SELECT
  'Última sync' as info,
  TO_CHAR(MAX(ultima_sincronizacao), 'HH24:MI:SS') as valor
FROM produtos
UNION ALL
SELECT
  'Produtos sincronizados',
  COUNT(*)::text
FROM produtos WHERE sincronizado_facilzap = true
UNION ALL
SELECT
  'Produtos esgotados hoje',
  COUNT(*)::text
FROM logs_sincronizacao
WHERE tipo = 'estoque_zerado'
  AND timestamp::date = CURRENT_DATE;
```

---

## 📞 Precisa de Ajuda?

Se ver algo estranho:

1. Copie os logs do erro (Netlify ou Supabase)
2. Anote horário que aconteceu
3. Me chame e me mostre! 🚀

**Tudo pronto! Seu sistema está rodando em piloto automático!** ✈️
