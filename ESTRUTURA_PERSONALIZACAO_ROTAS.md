# 🎨 ESTRUTURA DE PERSONALIZAÇÃO - ROTAS PARA TUTORIAIS

## 📍 ROTAS CRIADAS:

```
/revendedora/personalizacao                    → Página principal (visão geral)
/revendedora/personalizacao/banner            → Criar banners personalizados
/revendedora/personalizacao/logo              → Upload e config de logo
/revendedora/personalizacao/cores             → Escolher cores do catálogo
/revendedora/personalizacao/estilos           → Fontes e tipografia
/revendedora/personalizacao/redes-sociais     → Links redes sociais
```

## 🎥 VÍDEOS TUTORIAIS POR PÁGINA:

Agora você pode criar vídeos diferentes para cada seção:

1. **Banner** (`pagina: 'personalizacao-banner'`)
   - Como usar o editor de banners
   - Upload de imagem vs criação com blocos
   - Desktop vs Mobile

2. **Logo** (`pagina: 'personalizacao-logo'`)
   - Como fazer upload do logo
   - Formatos aceitos (PNG, JPG)
   - Posicionamento e formato

3. **Cores** (`pagina: 'personalizacao-cores'`)
   - Como escolher cores do tema
   - Significado de cada cor
   - Preview das mudanças

4. **Estilos** (`pagina: 'personalizacao-estilos'`)
   - Escolher fonte do título
   - Escolher fonte do corpo
   - Combinações recomendadas

5. **Redes Sociais** (`pagina: 'personalizacao-redes-sociais'`)
   - Como adicionar links
   - Ícones disponíveis
   - Onde aparece no catálogo

## 🚀 COMO USAR:

### 1. Criar vídeos no Admin:
- Acesse: `/admin/tutoriais`
- Clique em "Novo Vídeo"
- Escolha a página no dropdown (agora tem as novas opções!)

### 2. Vídeos aparecem automaticamente:
- Cada subpágina carrega APENAS o vídeo dela
- Botão flutuante com preview
- Click → Modal com vídeo completo

## 📝 PRÓXIMA MIGRAÇÃO:

Execute no Supabase SQL Editor:

```sql
-- Adicionar novas opções de página no enum
ALTER TABLE tutorial_videos DROP CONSTRAINT IF EXISTS tutorial_videos_pagina_check;

-- Adicionar check constraint com novas páginas
ALTER TABLE tutorial_videos ADD CONSTRAINT tutorial_videos_pagina_check 
CHECK (pagina IN (
  'produtos',
  'carrinhos',
  'promocoes',
  'personalizacao',
  'personalizacao-banner',
  'personalizacao-logo',
  'personalizacao-cores',
  'personalizacao-estilos',
  'personalizacao-redes-sociais',
  'configuracoes'
));
```

## ✅ STATUS:

- [x] Estrutura de rotas criada
- [x] Páginas separadas por seção
- [ ] Adicionar VideoTutorialButton em cada página
- [ ] Atualizar dropdown no Admin com novas opções
- [ ] Criar vídeos para cada seção
