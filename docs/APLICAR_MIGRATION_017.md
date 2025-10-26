# Migration 017: Adicionar Campo de Imagem nas Categorias

## 📋 O que essa migration faz?

Adiciona a coluna `imagem` na tabela `categorias` para permitir upload de imagens/ícones nas categorias.

## ⚙️ Como aplicar no Supabase

### Passo 1: Acessar o SQL Editor

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral esquerdo
4. Clique em **New Query**

### Passo 2: Executar a Migration

Cole o SQL abaixo e clique em **RUN**:

```sql
-- Migration 017: Adicionar campo de imagem nas categorias
ALTER TABLE categorias 
ADD COLUMN IF NOT EXISTS imagem TEXT;

COMMENT ON COLUMN categorias.imagem IS 'URL da imagem de capa/ícone da categoria';
```

### Passo 3: Verificar se funcionou

Execute este comando para confirmar:

```sql
SELECT id, nome, imagem FROM categorias LIMIT 5;
```

✅ Se aparecer a coluna `imagem` (mesmo que vazia), deu certo!

## 🔄 Atualizar Tipos TypeScript (Opcional)

Se estiver usando Supabase CLI localmente:

```bash
npx supabase gen types typescript --project-id SEU_PROJECT_ID > types/supabase.ts
```

## ✨ Como usar após aplicar

1. **Criar categoria com imagem**:
   - Abra o modal "Gerenciar Categorias"
   - Preencha o nome
   - Cole a URL da imagem no campo "URL da imagem"
   - Clique em "Criar"

2. **Editar imagem de categoria existente**:
   - Clique em "Editar" na categoria
   - Cole a URL da imagem
   - Salve

3. **Preview automático**:
   - Ao colar a URL, aparece preview da imagem
   - Se URL inválida, mostra placeholder

## 🖼️ Formatos recomendados

- **Formato**: JPG, PNG, WebP
- **Tamanho**: 400x200px (ou proporção 2:1)
- **Hospedagem**: Pode usar Imgur, Cloudinary, ou Supabase Storage
- **Exemplo URL**: `https://i.imgur.com/exemplo.jpg`

## ❓ Troubleshooting

**A coluna não aparece?**
- Verifique se está no projeto correto
- Tente remover `IF NOT EXISTS` e rodar novamente
- Confira permissões de admin

**Erro ao salvar categoria?**
- A migration deve ser aplicada ANTES de usar o modal
- Recarregue a página após aplicar a migration

**Imagem não aparece?**
- Verifique se a URL é válida (abra em outra aba)
- Confirme que não tem bloqueio CORS
- Teste com URL pública tipo Imgur

---

📅 **Data**: Criado em conjunto com implementação de upload de imagem  
🔗 **Relacionado**: `components/ModalCategorias.tsx`, `app/api/admin/categorias/action/route.ts`
