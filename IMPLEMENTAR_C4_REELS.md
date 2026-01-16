# 🎬 C4 Reels - Sistema de Vídeos de Produtos

## 📋 Componentes Criados

### 1. `VideoUploader` - Upload de Vídeos

- **Localização:** `components/video/VideoUploader.tsx`
- **Funcionalidade:** Upload de vídeos com validação
- **Limites:** 30MB, 60 segundos, MP4/WebM/MOV
- **Features:**
  - ✅ Validação de tamanho e duração
  - ✅ Extração de metadados (duração, dimensões)
  - ✅ Geração automática de thumbnail
  - ✅ Preview com controles de play/pause/mute
  - ✅ Barra de progresso durante upload
  - ✅ Detecção de vídeo vertical

### 2. `ProductReelsFeed` - Feed de Vídeos (estilo TikTok)

- **Localização:** `components/video/ProductReelsFeed.tsx`
- **Funcionalidade:** Feed de vídeos com scroll infinito
- **Features:**
  - ✅ IntersectionObserver para auto play/pause
  - ✅ Lazy loading de vídeos
  - ✅ Muted por padrão (autoplay funciona)
  - ✅ Glassmorphism card com info do produto
  - ✅ Contador de views e likes
  - ✅ Layouts horizontal e vertical
  - ✅ Snap scrolling

### 3. `ProductStoryCircle` - Círculo Animado (Stories)

- **Localização:** `components/video/ProductStoryCircle.tsx`
- **Funcionalidade:** Círculo estilo Instagram Stories
- **Features:**
  - ✅ Borda animada com gradiente rotativo
  - ✅ Modal fullscreen ao clicar
  - ✅ Barra de progresso estilo stories
  - ✅ Controles de som
  - ✅ Suporte a múltiplos stories (ProductStoriesRow)

---

## 🔧 PASSO 1: Executar Migration no Supabase

**Copie e execute o arquivo `CRIAR_BUCKET_VIDEOS_REELS.sql` no SQL Editor do Supabase.**

Este script irá:

1. Criar bucket `videos` no Storage (30MB limite)
2. Criar políticas RLS para o bucket
3. Adicionar colunas `video_url`, `video_thumbnail`, `video_duration` na tabela `produtos`
4. Criar tabela `reels` para analytics

```sql
-- Verificar se funcionou:
SELECT 'Bucket videos' AS item, EXISTS(
  SELECT 1 FROM storage.buckets WHERE id = 'videos'
) AS existe;

SELECT 'Campo video_url em produtos' AS item, EXISTS(
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'produtos' AND column_name = 'video_url'
) AS existe;

SELECT 'Tabela reels' AS item, EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'reels'
) AS existe;
```

---

## 🔧 PASSO 2: Uso dos Componentes

### Upload de Vídeo no Admin (Formulário de Produto)

```tsx
import { VideoUploader } from '@/components/video';

// Dentro do formulário de edição de produto
<VideoUploader
  currentVideoUrl={produto.video_url}
  folder="produtos"
  onVideoUploaded={(url, thumbnail, duration) => {
    setFormData({
      ...formData,
      video_url: url,
      video_thumbnail: thumbnail,
      video_duration: duration,
    });
  }}
  onVideoRemoved={() => {
    setFormData({
      ...formData,
      video_url: null,
      video_thumbnail: null,
      video_duration: null,
    });
  }}
/>;
```

### Feed de Reels na Home do Site

```tsx
import { ProductReelsFeed } from '@/components/video';

// Na página home do site da revendedora
<section className="py-8">
  <h2 className="text-2xl font-bold mb-4">🎬 C4 Reels</h2>
  <ProductReelsFeed
    reels={produtosComVideo.map((p) => ({
      id: p.id,
      video_url: p.video_url,
      thumbnail_url: p.video_thumbnail,
      produto: {
        id: p.id,
        nome: p.nome,
        preco: p.preco_final,
        imagem: p.imagem,
      },
      views: p.video_views || 0,
      likes: p.video_likes || 0,
    }))}
    primaryColor={loja.cor_primaria}
    layout="horizontal"
    onProductClick={(produto) => router.push(`/site/${slug}/produto/${produto.id}`)}
  />
</section>;
```

### Story Circle na Página do Produto

```tsx
import { ProductStoryCircle } from '@/components/video';

// Na página de detalhes do produto, acima da imagem principal
{
  produto.video_url && (
    <div className="mb-4 flex justify-center">
      <ProductStoryCircle
        videoUrl={produto.video_url}
        thumbnailUrl={produto.video_thumbnail}
        productName={produto.nome}
        storeName={loja.nome}
        primaryColor={loja.cor_primaria}
        size="lg"
      />
    </div>
  );
}
```

---

## 📱 Integração Completa (Exemplo)

### Adicionar seção Reels na Home do Site

Edite `app/site/[slug]/components/SiteHome.tsx` ou similar:

```tsx
'use client';

import { ProductReelsFeed } from '@/components/video';

export function ReelsSection({ produtos, corPrimaria, slug }) {
  const produtosComVideo = produtos.filter((p) => p.video_url);

  if (produtosComVideo.length === 0) return null;

  return (
    <section className="py-8 px-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎬</span>
        <h2 className="text-xl font-bold">C4 Reels</h2>
      </div>

      <ProductReelsFeed
        reels={produtosComVideo.map((p) => ({
          id: p.id,
          video_url: p.video_url,
          thumbnail_url: p.video_thumbnail,
          produto: {
            id: p.id,
            nome: p.nome,
            preco: p.preco_final || p.preco_base,
            imagem: p.imagem,
          },
          views: 0,
          likes: 0,
        }))}
        primaryColor={corPrimaria}
        layout="horizontal"
        onProductClick={(produto) => {
          window.location.href = `/site/${slug}/produto/${produto.id}`;
        }}
      />
    </section>
  );
}
```

---

## 🎯 Checklist de Implementação

- [ ] Executar `CRIAR_BUCKET_VIDEOS_REELS.sql` no Supabase
- [ ] Adicionar `VideoUploader` no formulário de edição de produtos (admin)
- [ ] Adicionar seção `ProductReelsFeed` na home do site
- [ ] Adicionar `ProductStoryCircle` na página de produto (se tiver vídeo)
- [ ] Testar upload de vídeo MP4 vertical (formato ideal)
- [ ] Verificar autoplay no mobile (deve funcionar pois está muted)

---

## ⚠️ Notas Importantes

1. **Autoplay Mobile:** Funciona porque os vídeos começam muted
2. **Performance:** Lazy loading garante que só vídeos visíveis são carregados
3. **Formato Ideal:** Vídeos verticais 9:16 (1080x1920) até 30MB
4. **Duração:** Máximo 60 segundos
5. **Bucket:** Os vídeos são armazenados em `storage/videos/produtos/`
