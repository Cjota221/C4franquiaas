-- ============================================
-- 📰 INSERIR NOTÍCIA: VÍDEOS PARA VENDER MAIS
-- Execute no Supabase SQL Editor
-- ============================================

-- Insere a notícia para TODAS as lojas ativas
INSERT INTO noticias_loja (loja_id, titulo, resumo, conteudo, slug, autor, ativo)
SELECT 
  id as loja_id,
  'NOVIDADE NO SISTEMA – VÍDEOS PARA VENDER MAIS ✨' as titulo,
  'Nós adicionamos vídeos dentro da plataforma, pensados 100% para aumentar a conversão de vendas.' as resumo,
  '## O que foi implementado?

🔹 **Carrossel de vídeos** na página inicial, no estilo TikTok/Reels
🔹 **Vídeos dentro de cada produto**, ajudando o cliente a visualizar melhor o modelo

---

## Por que isso é tão poderoso?

Hoje, **vídeo vende muito mais do que foto**.

O cliente entende melhor o produto, fica mais tempo no site e se sente mais seguro para comprar — o que aumenta diretamente as chances de fechamento.

📊 **Dados do mercado:**
- 73% dos consumidores preferem vídeo para conhecer produtos
- 84% já compraram após assistir um vídeo da marca
- Tempo na página aumenta em até 180%

---

## Como funciona para vocês?

✅ Os vídeos dos produtos já estão sendo subidos por nós
✅ Vocês não precisam gravar nem subir vídeos agora
✅ Basta usar o site normalmente e aproveitar essa ferramenta a favor das vendas

---

Essa atualização foi pensada exatamente para ajudar vocês a venderem com **mais facilidade**, **mais profissionalismo** e **menos esforço** no atendimento.

Qualquer dúvida, entrem em contato! 💕

**Estamos evoluindo o sistema constantemente para ajudar vocês a venderem mais 🚀**' as conteudo,
  'novidade-videos-para-vender-mais' as slug,
  'Equipe C4' as autor,
  true as ativo
FROM lojas
WHERE ativo = true
ON CONFLICT (loja_id, slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  resumo = EXCLUDED.resumo,
  conteudo = EXCLUDED.conteudo,
  atualizado_em = NOW();

-- Verificar se foi inserido
SELECT l.nome as loja, n.titulo, n.criado_em 
FROM noticias_loja n
JOIN lojas l ON l.id = n.loja_id
WHERE n.slug = 'novidade-videos-para-vender-mais'
ORDER BY n.criado_em DESC;
