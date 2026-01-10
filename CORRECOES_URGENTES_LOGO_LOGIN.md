# 🐛 CORREÇÕES URGENTES

## Problema 1: Upload de Logo não funciona

## Problema 2: Botão "Entrar" não aparece no login

---

## 🔧 CORREÇÃO 1: Upload de Logo

### Diagnóstico:

- Erro: "Erro ao enviar imagem"
- Causa: Bucket 'logos' não existe ou não tem permissões públicas

### Solução:

#### Passo 1: Criar Bucket no Supabase

1. Acesse: https://supabase.com/dashboard
2. Projeto: **C4 Franquias**
3. Menu lateral: **Storage**
4. Clicar em **"New bucket"**
5. Preencher:
   - Nome: `logos`
   - Public bucket: ✅ **Marcar**
   - Allowed MIME types: deixar vazio (aceita tudo)
6. Clicar em **"Create bucket"**

#### Passo 2: Configurar Políticas RLS (Row Level Security)

No **SQL Editor**, executar:

```sql
-- Permitir que todos possam ver logos (public)
CREATE POLICY "Logos são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Permitir que usuários autenticados façam upload
CREATE POLICY "Usuários podem fazer upload de logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários atualizem suas próprias logos
CREATE POLICY "Usuários podem atualizar suas logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários deletem suas próprias logos
CREATE POLICY "Usuários podem deletar suas logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Passo 3: Testar

1. Fazer login como revendedora Pro
2. Ir em **Minha Loja**
3. Tentar fazer upload de logo
4. Deve funcionar agora! ✅

---

## 🔧 CORREÇÃO 2: Botão "Entrar" não aparece

### Diagnóstico:

- Usuária vê email e senha
- Mas não vê o botão "Entrar"
- Possível causa: CSS não carregou ou ela está em página diferente

### Soluções Possíveis:

#### Opção A: Limpar cache do navegador

1. No navegador mobile, segurar o botão de **recarregar**
2. Selecionar **"Limpar cache e recarregar"**
3. OU usar modo anônimo

#### Opção B: Verificar URL correta

A revendedora deve acessar:

**✅ URL CORRETA:**

```
https://c4franquias.com/login/revendedora
```

**❌ URLs ERRADAS (não usar):**

- `https://c4franquias.com/login` (login antigo)
- `https://c4franquias.com/franqueado/login` (login de franqueado)
- `https://c4franquias.com/revendedora/login` (não existe)

#### Opção C: Forçar atualização do código

Se o problema persistir, pode ser que o deploy não finalizou. Aguardar 2-3 minutos e tentar novamente.

---

## 📋 Checklist de Verificação:

### Upload de Logo:

- [ ] Bucket 'logos' criado no Supabase Storage
- [ ] Bucket marcado como **Public**
- [ ] Políticas RLS aplicadas
- [ ] Testado upload de logo

### Login da Revendedora:

- [ ] URL correta: `/login/revendedora`
- [ ] Cache do navegador limpo
- [ ] Botão "Acessar Minha Conta" apareceu
- [ ] Login funcionando

---

## 🆘 Se ainda não funcionar:

### Para Upload de Logo:

Execute este SQL para debug:

```sql
-- Ver se bucket existe
SELECT * FROM storage.buckets WHERE name = 'logos';

-- Ver políticas do bucket
SELECT * FROM storage.policies WHERE bucket_id = 'logos';
```

### Para Login:

1. Abrir Console do Navegador (F12)
2. Ver se há erros em vermelho
3. Tirar print e enviar para análise

---

**Status:** Aguardando aplicação das correções
**Data:** 09/01/2026
