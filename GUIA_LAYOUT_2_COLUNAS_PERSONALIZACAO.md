# 🎨 REORGANIZAR PÁGINA DE PERSONALIZAÇÃO - LAYOUT 2 COLUNAS

## 🎯 OBJETIVO:

Deixar o editor de banners **FIXO** à direita, sempre visível, enquanto as personalizações rolam à esquerda.

## 📐 LAYOUT NOVO:

```
┌────────────────────────────────────────────────────────┐
│                     TOPO FIXO                          │
│  ← Voltar  |  Personalização da Loja                  │
└────────────────────────────────────────────────────────┘
┌─────────────────────────┬──────────────────────────────┐
│  ESQUERDA (ROLA)        │  DIREITA (FIXO)              │
│  =====================  │  ====================        │
│  □ Cores                │  ┌──────────────────┐        │
│  □ Botões               │  │                  │        │
│  □ Cards                │  │  PREVIEW BANNER  │        │
│  □ Logo                 │  │                  │        │
│  □ Cabeçalho            │  │  [Desktop/Mobile]│        │
│  □ Anúncio              │  │                  │        │
│  □ Fontes               │  │  ...textos...    │        │
│  □ WhatsApp             │  │                  │        │
│  □ Produtos Relacionados│  │  ✏️ Editar Textos │        │
│  □ Prazo de Entrega     │  │  💾 Salvar Banner │        │
│                         │  └──────────────────┘        │
│  [Salvar Personalizações]                              │
└─────────────────────────┴──────────────────────────────┘
```

## 🔧 MUDANÇAS NECESSÁRIAS:

### 1. Remover Seção Separada de Banner

**Arquivo:** `app/revendedora/personalizacao/page.tsx`

**Remover:**

- `activeSection === "banner"` (linha ~891)
- Todo o código que mostra banner em tela cheia

**Resultado:** Banner não abre mais em tela cheia separada

---

### 2. Criar Layout de 2 Colunas

**Adicionar após o header principal:**

```tsx
{
  /* Layout 2 Colunas */
}
<div className="flex gap-6 p-6">
  {/* COLUNA ESQUERDA - Personalizações (Rola) */}
  <div className="flex-1 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
    {/* Todo o conteúdo de personalização aqui */}
    {/* Cores, Botões, Cards, etc */}
  </div>

  {/* COLUNA DIREITA - Banner Editor (Fixo) */}
  <div className="w-[480px] sticky top-6 h-fit">
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="text-pink-500" size={24} />
        <h3 className="font-bold text-lg">Banner da Loja</h3>
      </div>

      {/* Botão Criar/Editar Banner */}
      <button
        onClick={() => setShowBannerEditor(true)}
        className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
      >
        <Sparkles size={20} />
        {bannerUrl ? 'Editar Banner' : 'Criar Banner'}
      </button>

      {/* Preview do Banner Atual */}
      {bannerUrl && (
        <div className="mt-4">
          <div className="relative aspect-[1920/600] rounded-lg overflow-hidden border-2 border-gray-200">
            <Image src={bannerUrl} alt="Banner" fill className="object-cover" />
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            {pendingBanner ? '⏳ Aguardando aprovação' : '✅ Banner aprovado'}
          </p>
        </div>
      )}
    </div>
  </div>
</div>;
```

---

### 3. Validação Antes de Enviar

**Adicionar validação no BannerEditorFinal:**

```tsx
async function handleSave() {
  // Validar se editou desktop E mobile
  if (!bannerData.desktopPosition || !bannerData.mobilePosition) {
    alert('⚠️ Você precisa editar TANTO o banner Desktop QUANTO o Mobile antes de enviar!');
    return;
  }

  if (!bannerData.titulo && !bannerData.subtitulo && !bannerData.textoAdicional) {
    alert('⚠️ Adicione pelo menos um texto ao banner!');
    return;
  }

  // Continua com o save...
}
```

---

### 4. Estilização Responsiva

**Para Desktop (tela grande):**

```css
@media (min-width: 1024px) {
  /* 2 colunas */
  display: flex;
}
```

**Para Mobile (tela pequena):**

```css
@media (max-width: 1023px) {
  /* 1 coluna, banner vai pro topo */
  flex-direction: column;
}
```

---

## ✅ RESULTADO ESPERADO:

1. ✅ Banner editor sempre visível à direita
2. ✅ Personalizações rolam à esquerda
3. ✅ Não pode enviar sem editar desktop E mobile
4. ✅ Preview atualiza em tempo real
5. ✅ Layout responsivo (mobile = vertical)

---

## 🚀 IMPLEMENTAÇÃO RÁPIDA:

Quer que eu implemente isso agora? Vou:

1. Remover a seção separada de banner
2. Criar layout de 2 colunas
3. Adicionar validação de desktop/mobile
4. Tornar responsivo

**Confirma para eu começar?** 🎨
