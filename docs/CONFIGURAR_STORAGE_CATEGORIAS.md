# 📦 Configurar Storage para Imagens de Categorias

## 🎯 O que vamos fazer

Criar um bucket no Supabase Storage para armazenar as imagens das categorias de forma segura e organizada.

---

## 📋 Passo a Passo

### 1️⃣ Acessar o Supabase Storage

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**

---

### 2️⃣ Criar Novo Bucket

1. Clique no botão **"New bucket"** (ou "Criar bucket")
2. Preencha os campos:

```
Nome do bucket: categorias
Public bucket: ✅ MARQUE (permite acesso público às imagens)
```

3. Clique em **"Create bucket"**

---

### 3️⃣ Configurar Políticas de Acesso (RLS)

Após criar o bucket, você precisa configurar as permissões:

#### 📖 Permitir Leitura Pública (todos podem VER as imagens)

1. No bucket **categorias**, clique em **"Policies"** (ou "Políticas")
2. Clique em **"New Policy"** → **"For full customization"**
3. Crie a política de **SELECT** (leitura):

```sql
-- Nome: Public Read Access
-- Allowed operation: SELECT
-- Policy definition:
true
```

Ou use o editor SQL:

```sql
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'categorias');
```

#### 📝 Permitir Upload/Delete (apenas admin)

1. Crie política de **INSERT** (upload):

```sql
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'categorias' 
  AND auth.role() = 'authenticated'
);
```

2. Crie política de **DELETE** (exclusão):

```sql
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'categorias' 
  AND auth.role() = 'authenticated'
);
```

---

### 4️⃣ Verificar Configuração

Execute este teste no **SQL Editor**:

```sql
-- Verificar se o bucket existe
SELECT * FROM storage.buckets WHERE name = 'categorias';

-- Deve retornar:
-- id | name        | public
-- xxx| categorias  | true
```

---

## ✅ Pronto!

Agora o bucket está configurado e pronto para receber uploads de imagens de categorias.

### 🔗 URL das Imagens

As imagens ficarão acessíveis em:

```
https://SEU_PROJECT_ID.supabase.co/storage/v1/object/public/categorias/NOME_ARQUIVO.jpg
```

### 📁 Estrutura de Pastas (opcional)

Você pode organizar por subpastas:

```
categorias/
  ├── icons/        (ícones pequenos)
  ├── banners/      (imagens grandes)
  └── temp/         (uploads temporários)
```

---

## 🆘 Troubleshooting

**Erro "bucket not found"**
- Verifique se o nome está correto: `categorias` (minúsculo)

**Erro "permission denied"**
- Verifique se o bucket está marcado como **public**
- Confira as políticas RLS

**Imagens não aparecem**
- Teste a URL no navegador
- Verifique se a política SELECT está ativa

---

📅 **Criado**: 26/10/2025  
🔗 **Próximo passo**: Após configurar, volte e me avise para continuar a implementação!
