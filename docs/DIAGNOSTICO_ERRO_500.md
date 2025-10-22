# 🔍 DIAGNÓSTICO DO ERRO 500

## ❌ Erro Atual
```
/api/loja/cjotarasteirinhas/produtos: 500 (Internal Server Error)
```

---

## 🎯 PASSOS PARA RESOLVER

### **Passo 1: Verificar se a Loja Existe**

Abra o **Supabase Dashboard** → **SQL Editor** e execute:

```sql
-- Verificar se a loja existe
SELECT * FROM lojas WHERE dominio = 'cjotarasteirinhas';
```

**Resultados possíveis:**

#### ✅ Se retornar 1 linha:
A loja existe! Verifique se:
- `ativo = true` (se for `false`, a loja está desativada)
- `franqueada_id` tem um valor válido (UUID)

#### ❌ Se retornar 0 linhas:
A loja **NÃO EXISTE** no banco. **Solução**: Execute o SQL abaixo para criar:

```sql
-- Criar a loja cjotarasteirinhas
INSERT INTO lojas (
  franqueada_id,
  nome,
  dominio,
  cor_primaria,
  cor_secundaria,
  ativo
) VALUES (
  '0ea451ff-0f34-48a3-9718-cfe49e0db149', -- Substitua pelo ID da sua franqueada
  'Cjota Rasteirinhas',
  'cjotarasteirinhas',
  '#DB1472',
  '#F8B81F',
  true
);
```

---

### **Passo 2: Verificar o ID da Franqueada**

Se não sabe o `franqueada_id`, execute:

```sql
-- Buscar todas as franqueadas
SELECT id, nome, email, status FROM franqueadas;
```

Copie o `id` da franqueada desejada e use no INSERT acima.

---

### **Passo 3: Verificar Produtos Vinculados**

Depois de criar/ativar a loja, verifique se há produtos:

```sql
-- Ver produtos vinculados à franqueada
SELECT 
  pf.id,
  pf.ativo,
  p.nome,
  p.preco_base
FROM produtos_franqueadas pf
JOIN produtos p ON p.id = pf.produto_id
WHERE pf.franqueada_id = '0ea451ff-0f34-48a3-9718-cfe49e0db149' -- Seu ID
  AND pf.ativo = true;
```

**Se retornar 0 linhas:**
- A franqueada não tem produtos ativos
- **Solução**: Ative produtos em `/franqueada/produtos`

---

### **Passo 4: Testar a API Novamente**

Depois de executar os passos acima:

1. **Local**: http://localhost:3001/api/loja/cjotarasteirinhas/produtos
2. **Produção**: https://c4franquiaas.netlify.app/api/loja/cjotarasteirinhas/produtos

---

## 🛠️ SCRIPT COMPLETO DE CORREÇÃO

Execute este SQL no Supabase para criar/corrigir tudo de uma vez:

```sql
-- ============================================================================
-- 🔧 SCRIPT DE CORREÇÃO COMPLETO - Loja cjotarasteirinhas
-- ============================================================================

-- Variável: ID da franqueada (SUBSTITUA PELO SEU!)
DO $$
DECLARE
  v_franqueada_id UUID := '0ea451ff-0f34-48a3-9718-cfe49e0db149'; -- ⚠️ SUBSTITUA!
  v_loja_id UUID;
BEGIN
  
  -- PASSO 1: Criar/Atualizar a loja
  INSERT INTO lojas (franqueada_id, nome, dominio, cor_primaria, cor_secundaria, ativo)
  VALUES (v_franqueada_id, 'Cjota Rasteirinhas', 'cjotarasteirinhas', '#DB1472', '#F8B81F', true)
  ON CONFLICT (dominio) 
  DO UPDATE SET ativo = true, nome = 'Cjota Rasteirinhas'
  RETURNING id INTO v_loja_id;
  
  RAISE NOTICE 'Loja criada/atualizada: %', v_loja_id;
  
  -- PASSO 2: Atualizar contador de produtos
  UPDATE lojas
  SET produtos_ativos = (
    SELECT COUNT(*)
    FROM produtos_franqueadas
    WHERE franqueada_id = v_franqueada_id AND ativo = true
  )
  WHERE id = v_loja_id;
  
  RAISE NOTICE 'Contador de produtos atualizado';
  
END $$;

-- VERIFICAÇÃO: Ver resultado
SELECT 
  l.id,
  l.nome,
  l.dominio,
  l.ativo,
  l.produtos_ativos,
  f.nome as franqueada_nome,
  f.email as franqueada_email
FROM lojas l
JOIN franqueadas f ON f.id = l.franqueada_id
WHERE l.dominio = 'cjotarasteirinhas';
```

---

## 📊 CHECKLIST DE DIAGNÓSTICO

Execute cada query e marque:

- [ ] **Loja existe?** 
  ```sql
  SELECT * FROM lojas WHERE dominio = 'cjotarasteirinhas';
  ```

- [ ] **Loja está ativa?**
  ```sql
  SELECT ativo FROM lojas WHERE dominio = 'cjotarasteirinhas';
  ```

- [ ] **Franqueada existe?**
  ```sql
  SELECT * FROM franqueadas WHERE id = 'SEU_ID';
  ```

- [ ] **Produtos vinculados e ativos?**
  ```sql
  SELECT COUNT(*) FROM produtos_franqueadas 
  WHERE franqueada_id = 'SEU_ID' AND ativo = true;
  ```

- [ ] **Preços configurados?**
  ```sql
  SELECT COUNT(*) FROM produtos_franqueadas_precos pfp
  JOIN produtos_franqueadas pf ON pf.id = pfp.produto_franqueada_id
  WHERE pf.franqueada_id = 'SEU_ID';
  ```

---

## 🚨 ERRO COMUM

**"PGRST116: not found"**

Significa que a tabela existe mas o registro não foi encontrado.

**Solução**: Execute o script de correção acima.

---

## 📞 SE AINDA NÃO FUNCIONAR

1. Verifique o console do navegador (F12 → Console)
2. Veja os logs do servidor local (`npm run dev`)
3. Copie a mensagem de erro completa
4. Me envie para análise

---

## 📅 Criado em
22 de outubro de 2025
