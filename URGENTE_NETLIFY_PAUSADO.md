# 🚨 PROBLEMA URGENTE: Netlify Pausado (Limite de Uso)

## ❌ O QUE ACONTECEU

Site está fora do ar com mensagem:

```
This site was paused as it reached its usage limits.
```

## 🔍 CAUSA PROVÁVEL

O **cron de sincronização rodando A CADA 1 MINUTO** consumiu todos os recursos do plano Netlify:

```typescript
// netlify/functions/scheduled-sync.ts
export const config: Config = {
  schedule: '*/1 * * * *', // ⚠️ RODA 1.440 VEZES POR DIA!
};
```

**Cálculo de uso:**

- 1.440 execuções/dia (60 minutos × 24 horas)
- Cada execução: ~30-60 segundos
- Total: ~24-48 horas de execução de function/dia
- Limite Netlify Free: 125.000 segundos/mês (~34 horas/mês)

**Com cron a cada 1 minuto, você estoura o limite em ~1 dia!**

---

## ✅ SOLUÇÕES IMEDIATAS

### **OPÇÃO 1: Desabilitar Cron Temporariamente** (RECOMENDADO)

1. **Renomear arquivo do cron:**

   ```
   netlify/functions/scheduled-sync.ts
   →
   netlify/functions/scheduled-sync.ts.DESABILITADO
   ```

2. **Commit e deploy:**

   ```bash
   git add netlify/functions/
   git commit -m "temp: desabilitar cron sync para economizar recursos"
   git push origin main
   ```

3. **Aguardar Netlify reativar o site** (pode levar algumas horas)

4. **Sincronizar manualmente quando necessário:**
   - Acesse `/admin/produtos`
   - Clique em "Sincronizar FácilZap"

---

### **OPÇÃO 2: Reduzir Frequência do Cron** (MELHOR A LONGO PRAZO)

Mudar de **1 minuto** para **1 hora** ou **6 horas**:

**Editar:** `netlify/functions/scheduled-sync.ts`

```typescript
// ANTES (consome muito):
export const config: Config = {
  schedule: '*/1 * * * *', // A cada 1 minuto
};

// DEPOIS - Opção A (a cada 1 hora):
export const config: Config = {
  schedule: '0 * * * *', // A cada 1 hora no minuto 0
};

// DEPOIS - Opção B (a cada 6 horas):
export const config: Config = {
  schedule: '0 */6 * * *', // Às 00:00, 06:00, 12:00, 18:00
};

// DEPOIS - Opção C (2x por dia):
export const config: Config = {
  schedule: '0 9,21 * * *', // Às 09:00 e 21:00
};
```

**Economia:**

- 1 hora: 24 execuções/dia (reduz 98% do uso!)
- 6 horas: 4 execuções/dia (reduz 99.7% do uso!)

---

### **OPÇÃO 3: Fazer Upgrade do Plano Netlify**

**Netlify Pro: $19/mês**

- 1.000.000 segundos de functions (240 horas)
- Suporta cron a cada 1 minuto

**Como fazer upgrade:**

1. Acesse: https://app.netlify.com
2. Site Settings → Billing
3. Upgrade to Pro

---

### **OPÇÃO 4: Mover Cron para Outro Serviço** (GRÁTIS)

Use serviço externo para chamar a API de sync:

**A. Cron-Job.org (Grátis):**

1. Acesse: https://cron-job.org
2. Crie conta gratuita
3. Adicione job:
   - URL: `https://c4franquiaas.netlify.app/api/sync-produtos`
   - Método: POST
   - Frequência: A cada 1 hora (ou conforme necessário)

**B. GitHub Actions (Grátis):**

Criar arquivo `.github/workflows/sync-produtos.yml`:

```yaml
name: Sync Produtos

on:
  schedule:
    - cron: '0 * * * *' # A cada 1 hora
  workflow_dispatch: # Permite executar manualmente

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Chamar API de Sync
        run: |
          curl -X POST https://c4franquiaas.netlify.app/api/sync-produtos
```

---

## 🎯 RECOMENDAÇÃO FINAL

**Faça AGORA:**

1. **Desabilitar cron** (renomear arquivo)
2. **Commit e push**
3. **Aguardar site voltar**

**Depois, escolha:**

- **Melhor opção gratuita:** Cron a cada 6 horas (4x/dia)
- **Se precisa atualizar rápido:** Upgrade para Netlify Pro
- **Alternativa grátis:** Cron-Job.org chamando a API

---

## 📝 COMANDOS PARA DESABILITAR CRON

Execute no terminal:

```bash
# 1. Renomear arquivo do cron
mv netlify/functions/scheduled-sync.ts netlify/functions/scheduled-sync.ts.DESABILITADO

# 2. Commit
git add netlify/functions/
git commit -m "temp: desabilitar cron sync para economizar recursos Netlify"

# 3. Push
git push origin main
```

---

## 🔄 SINCRONIZAÇÃO MANUAL

Enquanto o cron está desabilitado, sincronize manualmente:

1. Acesse: `/admin/produtos`
2. Clique: **"Sincronizar FácilZap"**
3. Aguarde: 1-2 minutos para processar

---

## ⏱️ CRONOGRAMA DE SYNC RECOMENDADO

Dependendo da necessidade:

| Frequência | Execuções/dia | Uso mensal | Plano necessário |
| ---------- | ------------- | ---------- | ---------------- |
| 1 minuto   | 1.440         | 48h        | Pro ($19/mês)    |
| 5 minutos  | 288           | 9.6h       | Free             |
| 15 minutos | 96            | 3.2h       | Free             |
| 1 hora     | 24            | 0.8h       | Free             |
| 6 horas    | 4             | 0.13h      | Free             |

**Para plano Free (125.000s/mês):** Máximo 1 execução a cada **3-4 minutos**

---

## 📞 CONTATO NETLIFY

Se o site não voltar após desabilitar o cron:

1. Acesse: https://app.netlify.com
2. Vá em: Support → Contact Support
3. Explique: "Desabilitei o cron que causou o limite. Por favor reative meu site."

---

## ✅ CHECKLIST

- [ ] Renomear `scheduled-sync.ts` para `.DESABILITADO`
- [ ] Commit e push
- [ ] Aguardar site voltar (1-24 horas)
- [ ] Decidir: Upgrade, Reduzir frequência ou Mover para serviço externo
- [ ] Testar sincronização manual no painel admin
