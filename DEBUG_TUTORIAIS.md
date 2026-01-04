# 🔍 DEBUG: Problema ao Salvar Vídeos Tutoriais

## ✅ Correções Aplicadas

1. **Logs adicionados** em `/api/tutoriais` (POST e PATCH)
2. **Logs adicionados** em `page.tsx` (handleSubmit)
3. **Tratamento de erros** melhorado com alerts

---

## 🚀 Como Testar Agora

### 1. **Verificar se a migration foi executada**

Execute no **SQL Editor do Supabase**:

```sql
-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'tutorial_videos'
);

-- Se retornar FALSE, execute a migration completa
```

Se retornar **false**, copie e execute todo o conteúdo de `MIGRATION_TUTORIAL_VIDEOS_SAFE.sql`

---

### 2. **Verificar Permissions RLS**

Execute no Supabase:

```sql
-- Verificar se você está como admin
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE id = auth.uid();
```

Seu `role` deve ser **"admin"**. Se não for, execute:

```sql
-- Substituir YOUR_EMAIL pelo seu email
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'YOUR_EMAIL';
```

---

### 3. **Testar Criação de Vídeo**

1. Acesse `/admin/tutoriais`
2. Clique em "Novo Vídeo"
3. Preencha:
   - **Título**: "Teste de Vídeo"
   - **Link**: `https://www.youtube.com/embed/dQw4w9WgXcQ`
   - **Página**: Produtos
4. Clique em "Criar Vídeo"
5. **Abra o Console do Navegador** (F12)
6. Veja os logs:

```
📝 Submetendo formulário...
📋 Form Data: {titulo: "Teste de Vídeo", ...}
🚀 POST /api/tutoriais {titulo: "Teste de Vídeo", ...}
📹 POST /api/tutoriais - Body recebido: {...}
📝 Dados para inserir: {...}
✅ Vídeo criado com sucesso: {...}
```

---

## ❌ Erros Comuns

### **Erro: "relation tutorial_videos does not exist"**
**Causa**: Tabela não foi criada  
**Solução**: Execute `MIGRATION_TUTORIAL_VIDEOS_SAFE.sql` no Supabase

### **Erro: "new row violates row-level security policy"**
**Causa**: Seu usuário não tem role "admin"  
**Solução**: Execute o UPDATE acima para definir role como admin

### **Erro: "Campos obrigatórios: titulo, video_url, pagina"**
**Causa**: Algum campo está vazio  
**Solução**: Preencha todos os campos obrigatórios

### **Erro: Network Error ou CORS**
**Causa**: Servidor Next.js não está rodando  
**Solução**: Execute `npm run dev`

---

## 📊 Verificar Dados Salvos

Execute no Supabase:

```sql
-- Ver todos os vídeos
SELECT * FROM tutorial_videos ORDER BY created_at DESC;

-- Contar vídeos
SELECT COUNT(*) as total FROM tutorial_videos;

-- Ver vídeos por página
SELECT pagina, COUNT(*) as total 
FROM tutorial_videos 
GROUP BY pagina;
```

---

## 🔧 Se Ainda Não Funcionar

**Me envie o seguinte:**

1. Console do navegador após tentar salvar
2. Resultado da query: `SELECT * FROM auth.users WHERE id = auth.uid();`
3. Resultado da query: `SELECT * FROM tutorial_videos;`
4. Screenshot da mensagem de erro (se houver)

---

## 📝 Checklist

- [ ] Migration executada no Supabase
- [ ] Usuário tem role "admin"
- [ ] Tabela `tutorial_videos` existe
- [ ] RLS policies criadas
- [ ] Console do navegador aberto (F12)
- [ ] Campos preenchidos corretamente
- [ ] Servidor Next.js rodando
