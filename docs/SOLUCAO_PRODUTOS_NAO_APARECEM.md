# 🔧 SOLUÇÃO: Produtos Ativos Não Aparecem no Site da Franqueada

## 🎯 PROBLEMA IDENTIFICADO

Quando você **ativa um produto** no painel admin, ele só muda o status `ativo=true` na tabela `produtos`, mas **NÃO cria vinculação** na tabela `produtos_franqueadas`.

### Por que isso acontece?

A API do site da franqueada (`/api/loja/[dominio]/produtos`) busca produtos através da tabela `produtos_franqueadas`:

```sql
SELECT * FROM produtos_franqueadas
WHERE franqueada_id = 'xxx'
AND ativo = true
```

Se o produto **não estiver vinculado** a essa franqueada, **não aparece no site**.

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1️⃣ **Novo Botão: "Vincular às Franqueadas"**

**Localização**: Painel Admin → Produtos (botão roxo, segundo da esquerda)

**Funcionalidade**:
- Busca **TODOS os produtos ativos** no sistema
- Busca **TODAS as franqueadas ativas**
- Cria vinculação automática entre eles
- Usa `UPSERT` para evitar duplicatas

**Resultado**:
- ✅ Produtos aparecem automaticamente no site de todas as franqueadas
- ✅ Vinculações criadas instantaneamente
- ✅ Mensagem de sucesso mostra quantas vinculações foram feitas

---

## 📊 COMO USAR

### Cenário 1: Primeira Vez (Vincular TODOS os produtos)

1. Acesse **Painel Admin** → **Produtos**
2. Clique no botão roxo **"Vincular às Franqueadas"**
3. Aguarde 5-10 segundos
4. ✅ Mensagem: "X vinculações criadas! (Y produtos × Z franqueadas)"
5. **Verifique no site** da franqueada se produtos aparecem

**Exemplo de mensagem**:
```
✅ 150 vinculações criadas! (10 produtos × 15 franqueadas)
```

---

### Cenário 2: Produto Novo (Workflow Completo)

**ANTES (Problema)**:
1. Sincronizar produtos do FacilZap
2. Ativar produto no admin
3. ❌ Produto NÃO aparece no site da franqueada

**AGORA (Solução)**:
1. Sincronizar produtos do FacilZap (botão verde)
2. Ativar produto no admin
3. **Clicar em "Vincular às Franqueadas"** (botão roxo) ⭐ NOVO!
4. ✅ Produto aparece no site de TODAS as franqueadas

---

### Cenário 3: Produto Já Existe (Forçar Atualização)

Se você já tem produtos mas eles não aparecem:

1. Clique em **"Vincular às Franqueadas"**
2. Sistema vai:
   - ✅ Criar vinculações que faltam
   - ✅ Atualizar vinculações existentes
   - ✅ NÃO duplicar vinculações

---

## 🔍 VERIFICAR SE FUNCIONOU

### Teste 1: API de Estatísticas

Acesse no navegador:
```
https://c4franquiaas.netlify.app/api/admin/produtos/vincular-todas-franqueadas
```

Você deve ver:
```json
{
  "status": "API ativa",
  "estatisticas": {
    "produtos_ativos": 10,
    "franqueadas_ativas": 15,
    "vinculacoes_ativas": 150,
    "vinculacoes_esperadas": 150,
    "percentual_vinculado": "100.00%",
    "faltam_vincular": 0
  }
}
```

**Valores importantes**:
- `percentual_vinculado`: deve ser 100%
- `faltam_vincular`: deve ser 0

---

### Teste 2: Site da Franqueada

1. Acesse: `https://c4franquiaas.netlify.app/loja/DOMINIO_DA_FRANQUEADA/produtos`
2. ✅ Produtos devem aparecer
3. Se não aparecer, veja console (F12) para logs de debug

---

## 🆘 TROUBLESHOOTING

### ❌ "Nenhuma franqueada ativa encontrada"

**Causa**: Não há franqueadas cadastradas ou todas estão inativas

**Solução**:
1. Vá em **Painel Admin** → **Franqueados**
2. Verifique se há franqueadas com status `ativo=true`
3. Se necessário, crie/ative uma franqueada

---

### ❌ "Nenhum produto ativo encontrado"

**Causa**: Não há produtos com `ativo=true`

**Solução**:
1. Vá em **Painel Admin** → **Produtos**
2. Ative alguns produtos
3. Tente vincular novamente

---

### ❌ "Produtos vinculados mas não aparecem no site"

**Possíveis causas**:

1. **Produto sem estoque**:
   - Veja `variacoes_meta` do produto
   - Se todas variações têm `estoque=0`, produto não aparece

2. **Filtro de categoria ativo**:
   - URL com `?categoria=xxx` filtra produtos
   - Remova filtro ou vincule produto à categoria

3. **Cache do navegador**:
   - Limpe cache (Ctrl+F5)
   - Ou abra em aba anônima

4. **Loja inativa**:
   - Verifique se `lojas.ativo = true`
   - Verifique se domínio está correto

---

## 📝 SEQUÊNCIA RECOMENDADA

Para adicionar produtos novos ao site:

```
1. 🟢 Sincronizar FacilZap      (botão verde)
   ↓
2. ✏️ Ativar produtos            (marcar checkbox)
   ↓
3. 🟣 Vincular às Franqueadas   (botão roxo) ⭐ ESSENCIAL
   ↓
4. 🏷️ Vincular categorias       (botão amarelo - opcional)
   ↓
5. ✅ Verificar no site
```

---

## 🤖 AUTOMAÇÃO FUTURA (Opcional)

### Opção 1: Vincular Automaticamente ao Ativar

Criar trigger no Supabase:

```sql
-- Quando produto é ativado, vincular a todas franqueadas
CREATE OR REPLACE FUNCTION auto_vincular_franqueadas()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ativo = true AND OLD.ativo = false THEN
    INSERT INTO produtos_franqueadas (produto_id, franqueada_id, ativo)
    SELECT NEW.id, f.id, true
    FROM franqueadas f
    WHERE f.ativo = true
    ON CONFLICT (produto_id, franqueada_id) DO UPDATE
    SET ativo = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_vincular
AFTER UPDATE ON produtos
FOR EACH ROW
EXECUTE FUNCTION auto_vincular_franqueadas();
```

### Opção 2: Vincular Automaticamente ao Sincronizar

Modificar `/api/sync-produtos` para criar vinculações após importar produtos.

---

## 📊 ARQUITETURA DAS TABELAS

```
produtos (tabela mestre)
  ├── id
  ├── nome
  ├── ativo ⭐ (true/false)
  └── ...

produtos_franqueadas (vinculações)
  ├── id
  ├── produto_id ⭐ (FK para produtos)
  ├── franqueada_id ⭐ (FK para franqueadas)
  ├── ativo ⭐ (true/false)
  └── ...

franqueadas
  ├── id
  ├── nome
  ├── ativo ⭐ (true/false)
  └── ...

lojas
  ├── id
  ├── franqueada_id ⭐ (FK para franqueadas)
  ├── dominio
  ├── ativo ⭐ (true/false)
  └── ...
```

**Regra**: Para produto aparecer no site da franqueada:
1. ✅ `produtos.ativo = true`
2. ✅ `produtos_franqueadas.ativo = true`
3. ✅ `produtos_franqueadas.franqueada_id` = franqueada da loja
4. ✅ `franqueadas.ativo = true`
5. ✅ `lojas.ativo = true`

---

## 📅 ARQUIVOS CRIADOS

✅ `app/api/admin/produtos/vincular-todas-franqueadas/route.ts` - API de vinculação  
✅ `app/admin/produtos/page.tsx` - Botão roxo adicionado  
✅ `docs/SOLUCAO_PRODUTOS_NAO_APARECEM.md` - Este guia  

---

📅 **Data**: 28/10/2025  
🔗 **API**: `/api/admin/produtos/vincular-todas-franqueadas`  
🎯 **Solução**: Botão "Vincular às Franqueadas" no painel admin
