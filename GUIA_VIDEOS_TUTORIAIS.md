# 🎥 SISTEMA DE VÍDEOS TUTORIAIS - GUIA COMPLETO

## ✅ O que foi criado:

### 1. **Tabela no Supabase** (`tutorial_videos`)
- Armazena: título, descrição, URL do vídeo, página onde aparece, ativo/inativo, ordem
- RLS configurado: Admin gerencia, revendedoras só veem ativos

### 2. **Componente VideoTutorialButton**
- Bolinha flutuante rosa com animação de pulso
- Aparece no canto inferior direito
- Ao clicar, abre modal com vídeo
- Tooltip ao passar o mouse

### 3. **API /api/tutoriais**
- GET: Listar vídeos (com filtro por página)
- POST: Criar novo vídeo
- PATCH: Editar/ativar/desativar
- DELETE: Remover vídeo

### 4. **Página Admin /admin/tutoriais**
- Interface completa para gerenciar vídeos
- Lista por página
- Criar, editar, ativar/desativar, deletar
- Escolher em qual página aparece cada vídeo

### 5. **Integrado na página de Produtos**
- Já adicionado `<VideoTutorialButton pagina="produtos" />`

---

## 🚀 COMO USAR:

### PASSO 1: Executar Migration no Supabase
1. Abra o Supabase SQL Editor
2. Cole o conteúdo do arquivo `MIGRATION_TUTORIAL_VIDEOS.sql`
3. Execute o SQL
4. Verifique se a tabela foi criada com: `SELECT * FROM tutorial_videos;`

### PASSO 2: Fazer Commit e Push
```bash
git add .
git commit -m "feat: sistema de vídeos tutoriais com bolinha flutuante"
git push
```

### PASSO 3: Aguardar Deploy do Netlify
- Netlify vai fazer build automático
- Aguarde finalizar

### PASSO 4: Configurar Vídeos no Admin
1. Acesse: `https://seu-site.com/admin/tutoriais`
2. Clique em "Novo Vídeo"
3. Preencha:
   - **Título**: Ex: "Como Ativar Produtos"
   - **Descrição**: Ex: "Aprenda a ativar e gerenciar produtos"
   - **URL do Vídeo**: URL de EMBED do YouTube
     - Formato: `https://www.youtube.com/embed/VIDEO_ID`
     - Como pegar: No YouTube → Compartilhar → Incorporar → Copiar URL do iframe
   - **Página**: Escolha onde aparece (Produtos, Carrinhos, Promoções, etc)
   - **Ordem**: 0 (se for o primeiro)
4. Clique em "Criar Vídeo"

### PASSO 5: Testar
1. Faça login como revendedora
2. Acesse `/revendedora/produtos`
3. Veja a bolinha rosa flutuante no canto inferior direito
4. Clique na bolinha
5. Vídeo abre em modal

---

## 📝 COMO PEGAR URL DE EMBED DO YOUTUBE:

### Opção 1: Pelo botão Compartilhar
1. Abra o vídeo no YouTube
2. Clique em "Compartilhar"
3. Clique em "Incorporar"
4. Copie a URL que aparece no `src=` do iframe
   - Exemplo: `https://www.youtube.com/embed/dQw4w9WgXcQ`

### Opção 2: Manualmente
- URL normal: `https://www.youtube.com/watch?v=VIDEO_ID`
- URL embed: `https://www.youtube.com/embed/VIDEO_ID`
- Basta trocar `watch?v=` por `embed/`

---

## 🎨 COMO ADICIONAR EM OUTRAS PÁGINAS:

Para adicionar a bolinha em outra página, basta adicionar o componente:

```tsx
import VideoTutorialButton from '@/components/VideoTutorialButton';

// No final do return, antes de fechar </div>:
<VideoTutorialButton pagina="carrinhos" />
```

**Páginas disponíveis:**
- `produtos` - /revendedora/produtos
- `carrinhos` - /revendedora/carrinhos-abandonados
- `promocoes` - /revendedora/promocoes
- `personalizacao` - /revendedora/personalizacao
- `configuracoes` - /revendedora/configuracoes

---

## 💡 RECURSOS:

### Bolinha Flutuante:
- ✅ Animação de pulso chamativa
- ✅ Tooltip ao passar o mouse
- ✅ Posicionada no canto inferior direito
- ✅ Fica sobre todo o conteúdo (z-index alto)

### Modal:
- ✅ Vídeo em iframe responsivo (16:9)
- ✅ Botão fechar no canto
- ✅ Clique fora fecha
- ✅ Design bonito com gradiente

### Admin:
- ✅ Lista organizada por página
- ✅ Ativar/desativar sem deletar
- ✅ Edição inline
- ✅ Ordenação

---

## 🔧 PRÓXIMOS PASSOS:

1. ✅ Executar migration
2. ✅ Fazer commit/push
3. ✅ Aguardar deploy
4. ✅ Subir vídeos no YouTube
5. ✅ Configurar no admin
6. ✅ Adicionar componente nas outras 4 páginas:
   - /revendedora/carrinhos-abandonados
   - /revendedora/promocoes
   - /revendedora/personalizacao
   - /revendedora/configuracoes

---

## ❓ DÚVIDAS COMUNS:

**Q: Posso usar Vimeo?**
A: Sim! Use a URL de embed do Vimeo: `https://player.vimeo.com/video/VIDEO_ID`

**Q: Posso ter vários vídeos na mesma página?**
A: Sim! Use o campo "Ordem" para definir qual aparece. O componente mostra apenas o primeiro ativo.

**Q: Como desativar temporariamente?**
A: No admin, clique no ícone de olho. Fica inativo mas não deleta.

**Q: A bolinha atrapalha o conteúdo?**
A: Não! Ela fica flutuante sobre o conteúdo, não empurra nada.

---

**Criado em:** 04/01/2026
**Status:** ✅ Pronto para usar
