# 🎨 Guia de Cores - C4 Franquias

## Paleta de Cores Oficial

### Cores Primárias

| Cor | Código HEX | Uso | Exemplo |
|-----|-----------|-----|---------|
| **Rosa C4** | `#DB1472` | Cor principal da marca, botões primários, destaques | Botão "Gerenciar Categorias", header do modal, links ativos |
| **Amarelo** | `#F8B81F` | Cor secundária, acentos, hovers | Botão "Vincular/Desvincular", badges de categoria |
| **Cinza Escuro** | `#333` | Texto principal | Títulos, labels, texto dos cards |
| **Branco** | `#FFFFFF` | Backgrounds principais | Cards, modais, página |

### Cores Secundárias

| Cor | Código HEX | Uso |
|-----|-----------|-----|
| **Verde** | `#22C55E` | Ações positivas (ativar) |
| **Vermelho** | `#EF4444` | Ações destrutivas (desativar, deletar) |
| **Cinza Claro** | `#F3F4F6` | Backgrounds secundários |
| **Cinza Médio** | `#9CA3AF` | Texto secundário |

---

## 📋 Aplicação por Componente

### Página de Produtos (`/admin/produtos`)

#### Título Principal
```tsx
className="text-3xl font-bold mb-6 text-[#333]"
```

#### Campo de Busca
- **Border normal:** `border-2 border-gray-300`
- **Focus:** `focus:border-[#DB1472] focus:ring-2 focus:ring-[#DB1472]/20`

#### Botões de Ação

**Gerenciar Categorias (Primário):**
```tsx
className="bg-[#DB1472] text-white hover:bg-[#DB1472]/90"
```

**Vincular/Desvincular (Secundário):**
```tsx
className="bg-[#F8B81F] text-[#333] hover:bg-[#F8B81F]/90"
```

**Ações em Massa (Neutro):**
```tsx
className="bg-[#333] text-white hover:bg-[#333]/90"
```

#### Spinners/Loading
```tsx
className="border-2 border-[#DB1472] border-t-transparent"
```

#### Badge de Selecionados
```tsx
className="text-[#DB1472] bg-[#DB1472]/10"
```

#### Cards de Produtos

**Título:**
```tsx
className="text-[#333]"
```

**Estoque (positivo):**
```tsx
className="text-[#DB1472] font-bold"
```

**Estoque (zero):**
```tsx
className="text-red-600 font-bold"
```

**Badge de Categoria:**
```tsx
className="bg-[#F8B81F]/20 text-[#333]"
```

**Seleção (ring):**
```tsx
className="ring-4 ring-[#DB1472]"
```

**Botão Ver Detalhes:**
```tsx
className="bg-[#DB1472] text-white hover:bg-[#DB1472]/90"
```

**Botão Ativo:**
```tsx
className="bg-green-500 text-white hover:bg-green-600"
```

**Botão Inativo:**
```tsx
className="bg-gray-400 text-white hover:bg-gray-500"
```

---

### Modal de Categorias

#### Header
```tsx
className="bg-[#DB1472] text-white"
```

#### Área de Criar Categoria
```tsx
className="bg-[#F8B81F]/10 border border-[#F8B81F]/30"
```

#### Botão Criar Categoria
```tsx
className="bg-[#DB1472] text-white hover:bg-[#DB1472]/90"
```

#### Botão Criar Subcategoria
```tsx
className="bg-[#F8B81F] text-[#333] hover:bg-[#F8B81F]/90"
```

#### Botões de Ação nas Categorias

**+ Sub:**
```tsx
className="bg-[#F8B81F] text-[#333] hover:bg-[#F8B81F]/80"
```

**Editar:**
```tsx
className="bg-[#DB1472] text-white hover:bg-[#DB1472]/90"
```

**Deletar:**
```tsx
className="bg-red-500 text-white hover:bg-red-600"
```

---

### Modal Vincular/Desvincular

#### Header
```tsx
className="bg-[#DB1472] text-white"
```

#### Botão Vincular (ativo)
```tsx
className="bg-[#DB1472] text-white"
```

#### Botão Desvincular (ativo)
```tsx
className="bg-red-500 text-white"
```

#### Botões (inativos)
```tsx
className="bg-gray-200 text-[#333]"
```

---

## 🎯 Regras de Uso

### ✅ SEMPRE Use:
- `#DB1472` para ações principais e elementos de marca
- `#F8B81F` para acentos e ações secundárias
- `#333` para texto principal
- Hover com `/90` ou `/80` de opacidade (ex: `hover:bg-[#DB1472]/90`)

### ❌ NUNCA Use:
- ~~Gradientes coloridos~~ (ex: `from-indigo-600 to-purple-600`)
- ~~Cores azul/índigo~~ para elementos da marca
- ~~Emojis inline~~ em botões (manter interface limpa)
- ~~Classes Tailwind coloridas padrão~~ sem as cores da marca

### 📐 Padrões de Hover:
```tsx
// Botões sólidos
hover:bg-[#DB1472]/90

// Backgrounds claros
hover:bg-[#F8B81F]/20

// Estados neutros
hover:bg-gray-300
```

---

## 🔄 Antes vs Depois

### ❌ Antes (Inconsistente):
```tsx
// Gradientes aleatórios
className="bg-gradient-to-r from-indigo-600 to-purple-600"

// Cores Tailwind padrão
className="bg-indigo-500 text-white"
className="border-indigo-500 ring-indigo-200"

// Emojis inline
"📁 Gerenciar Categorias"
"🔗 Vincular/Desvincular"
"✓ Ativo"
```

### ✅ Depois (Consistente):
```tsx
// Cores da marca
className="bg-[#DB1472] text-white"

// Cores customizadas
className="bg-[#DB1472] text-white"
className="border-[#DB1472] ring-[#DB1472]/20"

// Textos limpos
"Gerenciar Categorias"
"Vincular/Desvincular"
"Ativo"
```

---

## 🎨 Variações de Opacidade

| Opacidade | Uso | Exemplo |
|-----------|-----|---------|
| `#DB1472` | Sólido, botões, headers | `bg-[#DB1472]` |
| `#DB1472/90` | Hover de botões | `hover:bg-[#DB1472]/90` |
| `#DB1472/20` | Focus ring, backgrounds sutis | `ring-[#DB1472]/20` |
| `#DB1472/10` | Badges, highlights | `bg-[#DB1472]/10` |

| Opacidade | Uso | Exemplo |
|-----------|-----|---------|
| `#F8B81F` | Sólido, botões secundários | `bg-[#F8B81F]` |
| `#F8B81F/90` | Hover de botões | `hover:bg-[#F8B81F]/90` |
| `#F8B81F/30` | Borders | `border-[#F8B81F]/30` |
| `#F8B81F/20` | Backgrounds, badges | `bg-[#F8B81F]/20` |

---

## 📱 Acessibilidade

### Contraste de Cores (WCAG AA)

✅ **Bom contraste:**
- `#DB1472` em branco (4.7:1) ✓
- `#333` em branco (12.6:1) ✓✓✓
- `#F8B81F` em `#333` (8.2:1) ✓✓

❌ **Evitar:**
- Texto amarelo em branco (baixo contraste)
- Rosa claro em branco

---

## 🛠️ Como Aplicar em Novos Componentes

### Template de Botão Primário:
```tsx
<button className="px-4 py-2 bg-[#DB1472] text-white rounded-lg hover:bg-[#DB1472]/90 transition-all shadow-md font-medium">
  Texto do Botão
</button>
```

### Template de Botão Secundário:
```tsx
<button className="px-4 py-2 bg-[#F8B81F] text-[#333] rounded-lg hover:bg-[#F8B81F]/90 transition-all shadow-md font-medium">
  Texto do Botão
</button>
```

### Template de Input com Focus:
```tsx
<input 
  type="text"
  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#DB1472] focus:ring-2 focus:ring-[#DB1472]/20 transition-all"
/>
```

### Template de Badge:
```tsx
<span className="text-xs bg-[#F8B81F]/20 text-[#333] px-2 py-1 rounded font-medium">
  Badge Text
</span>
```

### Template de Loading Spinner:
```tsx
<div className="animate-spin rounded-full h-5 w-5 border-2 border-[#DB1472] border-t-transparent"></div>
```

---

## 🎓 Checklist de Revisão

Antes de commitar mudanças visuais, verifique:

- [ ] Usa `#DB1472` para elementos principais
- [ ] Usa `#F8B81F` para acentos
- [ ] Usa `#333` para texto
- [ ] Não tem gradientes coloridos
- [ ] Não tem cores azul/índigo/roxo
- [ ] Hovers consistentes (`/90` ou `/80`)
- [ ] Sem emojis inline em botões
- [ ] Focus states com cores da marca
- [ ] Loading spinners rosa `#DB1472`
- [ ] Badges amarelos `#F8B81F/20`

---

**Última atualização:** 21 de outubro de 2025  
**Aplicado em:** Página de Produtos, Modais de Categorias  
**Próximos:** Todas as outras páginas admin
