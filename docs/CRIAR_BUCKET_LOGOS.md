# 🪣 CRIAR BUCKET "LOGOS" NO SUPABASE - GUIA RÁPIDO

## 🚨 ERRO COMUM
```
"Bucket logos not found" ou "backend not folder"
```

**Causa**: O bucket `logos` não existe no Supabase Storage.

---

## ✅ SOLUÇÃO RÁPIDA (5 passos)

### 1️⃣ Abrir Supabase Dashboard
```
https://supabase.com/dashboard
```

### 2️⃣ Ir em Storage
- Menu lateral esquerdo
- Clique em **"Storage"**

### 3️⃣ Criar Novo Bucket
- Clique em **"New bucket"**
- Nome: `logos`
- Configurações:
  - ✅ **Public bucket** (marcar essa opção!)
  - File size limit: 2MB
  - Allowed MIME types: `image/jpeg, image/png, image/webp, image/svg+xml`

### 4️⃣ Configurar Permissões (RLS)
**IMPORTANTE**: Como é bucket público, não precisa de políticas RLS especiais.

Se quiser restringir upload apenas para usuários autenticados:

```sql
-- Política de INSERT (Upload)
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Política de SELECT (Download) - Público
CREATE POLICY "Qualquer um pode ver logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logos');

-- Política de DELETE (Opcional)
CREATE POLICY "Usuários podem deletar seus próprios arquivos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 5️⃣ Testar Upload
- Volte ao sistema: http://localhost:3001/franqueada/loja
- Tente fazer upload de uma logo
- Deve funcionar agora! ✅

---

## 🔍 VERIFICAR SE O BUCKET EXISTE

### No Supabase Dashboard:
1. Storage → Buckets
2. Procure por `logos` na lista
3. Se existir, clique nele
4. Veja a aba **Policies** para verificar permissões

### Via SQL:
```sql
SELECT * FROM storage.buckets WHERE name = 'logos';
```

Se retornar vazio, o bucket não existe!

---

## 🎨 ESTRUTURA DO BUCKET

```
logos/
├── [user_id]-[timestamp].jpg
├── [user_id]-[timestamp].png
├── [user_id]-[timestamp].webp
└── [user_id]-[timestamp].svg
```

Cada arquivo tem nome único: `usuario_id-timestamp.extensao`

---

## ⚙️ CONFIGURAÇÕES RECOMENDADAS

| Configuração | Valor |
|-------------|-------|
| **Nome** | `logos` |
| **Público** | ✅ Sim |
| **Tamanho máx** | 2MB |
| **MIME types** | image/jpeg, image/png, image/webp, image/svg+xml |
| **RLS** | Políticas acima (opcional) |

---

## 🚨 TROUBLESHOOTING

### Erro: "new row violates row-level security"
**Causa**: RLS está bloqueando o upload.

**Solução**: 
1. Desabilite RLS temporariamente OU
2. Configure as políticas acima

### Erro: "File size exceeds limit"
**Causa**: Imagem maior que 2MB.

**Solução**: 
- Compactar imagem antes de enviar
- Aumentar limite no bucket (não recomendado)

### Erro: "Invalid MIME type"
**Causa**: Tipo de arquivo não permitido.

**Solução**: 
- Use apenas: PNG, JPG, WEBP, SVG
- Adicione mais tipos permitidos no bucket

---

## 📸 TESTANDO O UPLOAD

### 1. Via Interface:
```
http://localhost:3001/franqueada/loja
→ Aba "Identidade Visual"
→ Botão "Escolher Arquivo"
→ Selecione uma imagem
→ Deve aparecer preview
→ Clique "Salvar"
```

### 2. Via API (cURL):
```bash
curl -X POST http://localhost:3001/api/franqueada/loja/upload-logo \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@logo.png"
```

**Resposta esperada**:
```json
{
  "url": "https://supabase.co/storage/v1/object/public/logos/arquivo.png"
}
```

---

## ✅ CHECKLIST FINAL

- [ ] Bucket `logos` criado
- [ ] Marcado como **público**
- [ ] Tamanho máximo: 2MB
- [ ] MIME types configurados
- [ ] Políticas RLS (opcional)
- [ ] Testado upload pela interface
- [ ] Logo aparece no preview

---

## 📅 Última atualização
22 de outubro de 2025
