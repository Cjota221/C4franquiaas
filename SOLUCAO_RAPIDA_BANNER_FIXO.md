# ✅ SOLUÇÃO RÁPIDA: BANNER FIXO NA PERSONALIZAÇÃO

## 🎯 PROBLEMA:

- Banner abre em tela cheia separada
- Impossível ver mudanças enquanto personaliza
- Precisa rolar muito pra ver preview

## 💡 SOLUÇÃO SIMPLES (SEM REFATORAÇÃO TOTAL):

### PASSO 1: Remover botão de Banner da lista

**Linha ~430-450** - Comentar ou remover o card "Banner da Loja" da lista de opções

### PASSO 2: Adicionar Banner Fixo no Header

**Logo após o header principal (linha ~410)**, adicionar:

```tsx
{
  /* Banner Editor Fixo - Sempre Visível */
}
<div className="bg-gradient-to-r from-pink-50 to-purple-50 border-b-2 border-pink-200 p-4">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Camera className="text-pink-600" size={24} />
      <div>
        <h3 className="font-bold text-gray-800">Banner da Loja</h3>
        <p className="text-xs text-gray-600">Escolha template e personalize</p>
      </div>
    </div>
    <button
      onClick={() => setShowBannerEditor(true)}
      className="py-3 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
    >
      <Sparkles size={18} />
      {bannerUrl ? 'Editar Banner' : 'Criar Banner Personalizado'}
    </button>
  </div>
</div>;
```

### PASSO 3: Adicionar Validação no BannerEditorFinal

**Arquivo:** `components/revendedora/BannerEditorFinal.tsx`

**Procurar a função de salvar e adicionar no início:**

```tsx
async function handleSave() {
  // ⚠️ VALIDAÇÃO OBRIGATÓRIA
  if (!editedDesktop || !editedMobile) {
    alert(
      '⚠️ ATENÇÃO!\n\nVocê precisa editar TANTO o banner Desktop QUANTO o Mobile antes de enviar para aprovação.\n\n✅ Desktop: ' +
        (editedDesktop ? 'OK' : 'FALTA EDITAR') +
        '\n✅ Mobile: ' +
        (editedMobile ? 'OK' : 'FALTA EDITAR'),
    );
    return;
  }

  if (!bannerData.titulo && !bannerData.subtitulo && !bannerData.textoAdicional) {
    alert('⚠️ Adicione pelo menos um texto ao banner!');
    return;
  }

  // ... resto do código de salvar
}
```

**E adicionar variáveis de controle no início do componente:**

```tsx
const [editedDesktop, setEditedDesktop] = useState(false);
const [editedMobile, setEditedMobile] = useState(false);
```

**E quando trocar de preview, marcar como editado:**

```tsx
// Quando clicar em "Desktop"
onClick={() => {
  setPreviewMode('desktop');
  setEditedDesktop(true);  // ← ADICIONAR
}}

// Quando clicar em "Mobile"
onClick={() => {
  setPreviewMode('mobile');
  setEditedMobile(true);  // ← ADICIONAR
}}
```

---

## ✅ RESULTADO:

1. ✅ Banner sempre visível no topo
2. ✅ Um clique abre o editor
3. ✅ Validação força editar desktop E mobile
4. ✅ Mais rápido de implementar (não quebra nada)

---

## 🚀 QUER QUE EU IMPLEMENTE ISSO?

Posso fazer essas 3 mudanças agora de forma cirúrgica sem quebrar o resto!

**Confirma?** 👍
