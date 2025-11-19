# 🔄 Guia de Sincronização Automática com FácilZap

## 📊 Situação Atual

Você já tem:

- ✅ Endpoint `/api/sync-produtos` funcionando
- ✅ `FACILZAP_TOKEN` configurado
- ✅ Sistema busca produtos da API do FácilZap
- ✅ Sincronização manual funciona perfeitamente

**O que falta:** Automatizar para rodar sozinho periodicamente

---

## 🎯 Opções de Sincronização Automática

### **Opção 1: Netlify Scheduled Functions (Recomendado) ⭐**

**Prós:**

- ✅ Grátis (Netlify oferece cron gratuito)
- ✅ Já está no Netlify
- ✅ Fácil de configurar
- ✅ Confiável

**Configuração:**

1. Instalar dependência:

```powershell
npm install @netlify/functions
```

2. Criar arquivo `netlify/functions/sync-cron.ts`:

```typescript
import { schedule } from '@netlify/functions';

// Executar a cada 15 minutos
export const handler = schedule('*/15 * * * *', async () => {
  const response = await fetch(`${process.env.URL}/api/sync-produtos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  console.log('Sync:', data);

  return { statusCode: 200, body: JSON.stringify(data) };
});
```

3. Fazer deploy no Netlify

**Frequências disponíveis:**

- `*/5 * * * *` - A cada 5 minutos
- `*/15 * * * *` - A cada 15 minutos
- `*/30 * * * *` - A cada 30 minutos
- `0 * * * *` - A cada 1 hora
- `0 */6 * * *` - A cada 6 horas

---

### **Opção 2: Serviço Externo de Cron (EasyCron, Cron-Job.org)**

**Prós:**

- ✅ Muito simples
- ✅ Interface visual
- ✅ Gratuito até certo limite

**Configuração:**

1. Acesse: https://cron-job.org (ou https://www.easycron.com)
2. Crie uma conta
3. Adicione um novo cron job:
   - **URL**: `https://c4franquiaas.netlify.app/api/sync-produtos`
   - **Método**: POST
   - **Frequência**: A cada 15 minutos
4. Salve e ative

---

### **Opção 3: GitHub Actions (Se o push funcionar)**

**Prós:**

- ✅ Gratuito para repositórios públicos
- ✅ Controle via código

**Configuração:**

Criar arquivo `.github/workflows/sync-produtos.yml`:

```yaml
name: Sincronizar Produtos FácilZap

on:
  schedule:
    # Executar a cada 15 minutos
    - cron: '*/15 * * * *'
  workflow_dispatch: # Permite executar manualmente

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sincronizar produtos
        run: |
          curl -X POST https://c4franquiaas.netlify.app/api/sync-produtos \
            -H "Content-Type: application/json"
```

---

### **Opção 4: Vercel Cron Jobs (Se migrar para Vercel)**

Muito similar ao Netlify, mas no `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/sync-produtos",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## 🎯 Recomendação

**Use a Opção 1 (Netlify Scheduled Functions)** porque:

1. Você já está no Netlify
2. É gratuito
3. Mais profissional
4. Não depende de serviços externos

---

## ⚙️ Implementação Passo a Passo (Opção 1)

### 1️⃣ Instalar pacote

```powershell
npm install @netlify/functions
```

### 2️⃣ Criar a função agendada

Arquivo: `netlify/functions/sync-cron.ts`

```typescript
import { schedule } from '@netlify/functions';

export const handler = schedule('*/15 * * * *', async () => {
  console.log('🔄 Iniciando sincronização automática...');

  try {
    const response = await fetch(`${process.env.URL}/api/sync-produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    console.log(`✅ Sincronizados: ${data.imported} produtos`);

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('❌ Erro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(error) }),
    };
  }
});
```

### 3️⃣ Commitar e fazer push

```powershell
git add netlify/functions/sync-cron.ts package.json
git commit -m "feat: Adiciona sincronização automática a cada 15 minutos"
git push
```

### 4️⃣ O Netlify vai detectar automaticamente e ativar o cron!

---

## 📊 Monitoramento

Depois de ativar, você pode ver:

1. **Logs do Netlify**:

   - Vá em Functions → sync-cron
   - Veja os logs de execução

2. **Logs no Supabase**:

```sql
SELECT * FROM logs_sincronizacao
ORDER BY timestamp DESC
LIMIT 50;
```

3. **Estatísticas**:

```sql
SELECT * FROM vw_estatisticas_sincronizacao;
```

---

## 🎛️ Ajustar Frequência

Edite o cron pattern em `sync-cron.ts`:

| Frequência | Pattern        | Execuções/dia |
| ---------- | -------------- | ------------- |
| 5 minutos  | `*/5 * * * *`  | 288           |
| 15 minutos | `*/15 * * * *` | 96            |
| 30 minutos | `*/30 * * * *` | 48            |
| 1 hora     | `0 * * * *`    | 24            |
| 6 horas    | `0 */6 * * *`  | 4             |

**Recomendação inicial:** 15-30 minutos (equilíbrio entre atualização e uso de recursos)

---

## ❓ Qual opção você prefere?

1️⃣ **Netlify Scheduled Functions** (Recomendado)
2️⃣ **Serviço externo de Cron** (Mais simples)
3️⃣ **GitHub Actions**
4️⃣ **Outra?**

Diga qual você quer e eu implemento agora! 🚀
