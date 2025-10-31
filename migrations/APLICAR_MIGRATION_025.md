# 🚀 APLICAR MIGRATION 025 - Configurações de Frete

## ❗ URGENTE - Execute AGORA

**Problema identificado**: Campos `frete_gratis_valor` e `valor_frete` não existem na tabela `lojas`.

## 📋 Passo a Passo

### 1️⃣ Abrir Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de raio ⚡)

### 2️⃣ Executar Migration

1. Clique em **New Query** (Nova Consulta)
2. **Copie TODO o conteúdo** do arquivo `025_add_frete_config.sql`
3. **Cole** no editor SQL
4. Clique em **RUN** (ou aperte Ctrl+Enter)

### 3️⃣ Verificar Resultado

Você deve ver:

```
Success. No rows returned
```

Ou:

```
ALTER TABLE
COMMENT
COMMENT  
UPDATE X rows
```

### 4️⃣ Validar as Colunas

Execute esta query de validação:

```sql
SELECT 
  id,
  dominio,
  frete_gratis_valor,
  valor_frete
FROM lojas
LIMIT 5;
```

**Resultado esperado**: Deve mostrar as colunas com valores `150.00` e `15.90`

### 5️⃣ Configurar Frete Grátis para R$ 2,00

Depois da migration, vá em:

1. **Login como franqueada**: https://c4franquiaas.netlify.app/franqueada/configuracoes
2. Clique em **Promoções**
3. **Valor Mínimo para Frete Grátis**: Digite `2`
4. **Valor do Frete**: Deixe `15.90` (ou ajuste se quiser)
5. Clique em **Salvar Configurações**

### 6️⃣ Testar

1. Recarregue a loja (Ctrl+Shift+R)
2. Vá ao checkout com produto de R$ 5,05
3. O frete deve aparecer **GRÁTIS** ✅

---

## 🐛 Se der erro

**Erro: "column already exists"**
→ As colunas já existem, pule para o passo 5️⃣

**Erro: "permission denied"**
→ Use o SQL Editor com credenciais de admin

**Valores continuam undefined após migration**
→ Execute: `SELECT frete_gratis_valor, valor_frete FROM lojas WHERE dominio = 'cjotarasteirinhas';`
→ Me envie o resultado

---

## ✅ Checklist

- [ ] Migration 025 executada sem erros
- [ ] Colunas `frete_gratis_valor` e `valor_frete` criadas
- [ ] Lojas existentes atualizadas com valores padrão
- [ ] Configuração salva em Promoções (R$ 2,00)
- [ ] Frete grátis funcionando na loja
