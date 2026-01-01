# ✅ PRODUTOS RELACIONADOS - GUIA DE TESTE

## 🎯 O QUE FOI IMPLEMENTADO

### 1. Nova API (SEM filtro de categoria)
- **Endpoint**: `/api/catalogo/[slug]/produtos/relacionados/[id]`
- **Lógica**: Busca produtos ATIVOS da revendedora, embaralha e retorna 8
- **Preço**: Calculado com margem da revendedora

### 2. Componente Integrado
- Aparece automaticamente em **TODAS** páginas de produto
- Carrossel horizontal (deslizar no mobile)
- Link correto: `/catalogo/[slug]/produto/[id]`

### 3. Configurável
- Toggle: Personalização → "Mostrar Produtos Relacionados"
- Ativo por padrão (`show_related_products = true`)

---

## 🧪 COMO TESTAR

### Passo 1: Iniciar servidor
```powershell
npm run dev
```

Aguarde aparecer: `✓ Ready in X.Xs`

### Passo 2: Abrir catálogo
Acesse no navegador:
```
http://localhost:3000/catalogo/cjota-rasteirinhas
```

### Passo 3: Clicar em qualquer produto
Exemplo:
```
http://localhost:3000/catalogo/cjota-rasteirinhas/produto/1
```

### Passo 4: Rolar para baixo
- Abaixo da descrição do produto
- Procurar seção: **"✨ Você também pode gostar"**
- Deve aparecer carrossel com até 8 produtos

---

## ✅ O QUE VOCÊ DEVE VER

```
┌─────────────────────────────────────────────┐
│  📦 Imagem do Produto                       │
│  📝 Descrição                               │
├─────────────────────────────────────────────┤
│  ✨ Você também pode gostar                 │
│  Produtos selecionados especialmente...    │
│                                             │
│  [Produto 1] [Produto 2] [Produto 3] ...  │
│  ← Deslizar →                              │
└─────────────────────────────────────────────┘
```

### Cada card de produto relacionado mostra:
- ✅ Imagem
- ✅ Nome
- ✅ Preço (com margem da revendedora)
- ✅ Hover: "Ver Produto"
- ✅ Click: Leva para `/catalogo/[slug]/produto/[id]`

---

## 🔍 VERIFICAÇÕES TÉCNICAS

### Console do navegador (F12)
Procurar por:
```
🔍 [Produtos Relacionados] Buscando para produto X no slug Y
✅ Retornando N produtos relacionados
```

### Network (F12 → Network)
Procurar requisição:
```
GET /api/catalogo/cjota-rasteirinhas/produtos/relacionados/1
Status: 200 OK
Response: { produtos: [...] }
```

### Se não aparecer
1. Verificar console por erros
2. Ver se `show_related_products !== false` no themeSettings
3. Confirmar que revendedora tem produtos ATIVOS
4. Verificar se Network mostra a chamada da API

---

## 🐛 TROUBLESHOOTING

### "Nenhum produto relacionado aparece"
**Causa**: Revendedora não tem produtos ativos

**Solução**:
1. Login como revendedora
2. Ir em `/revendedora/produtos/novos`
3. Definir margem de lucro
4. Ativar produtos

### "Erro 404 na API"
**Causa**: Route não foi compilada

**Solução**:
```powershell
# Parar servidor (Ctrl+C)
# Limpar cache
Remove-Item -Recurse -Force .next
# Reiniciar
npm run dev
```

### "Link leva para página errada"
**Causa**: Cache do navegador

**Solução**:
- Ctrl + Shift + R (hard refresh)
- Ou abrir em aba anônima

---

## 📊 DADOS DO TESTE (test-relacionados.mjs)

```
✅ Revendedora: Cjota Rasteirinhas (cjota-rasteirinhas)
📦 Produtos ATIVOS vinculados: 112
✨ Produtos relacionados encontrados: 56
```

**Conclusão**: API está funcionando! Dados estão no banco!

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Testar visualmente** (seguir passos acima)
2. ⏳ **Executar Migration 052** (notificações RLS)
3. ⏳ **Executar SCRIPT_VINCULAR_PRODUTOS** (revendedoras antigas)
4. ⏳ **Testar em produção** (deploy Netlify)

---

## 📞 SUPORTE

Se produtos relacionados **ainda não aparecem** após seguir os passos:
1. Compartilhe screenshot do console (F12)
2. Compartilhe screenshot do Network (chamada API)
3. Confirme que está vendo a página correta do produto

**Commit atual**: `dd42251` - Produtos Relacionados funcionando (sem filtro de categoria)
