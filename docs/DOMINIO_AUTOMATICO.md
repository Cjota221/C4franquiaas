# 🎯 Sistema de Domínio Automático

## 📋 Como Funciona

O sistema **gera automaticamente** o domínio da loja a partir do nome digitado pela franqueada.

---

## ✨ Exemplos de Geração

| Nome da Loja | Domínio Gerado | URL Completa |
|--------------|----------------|--------------|
| CJ Rasteninhas | `cjrasteninhas` | https://c4franquiaas.netlify.app/loja/cjrasteninhas |
| Maria Cosméticos | `mariacosmeticos` | https://c4franquiaas.netlify.app/loja/mariacosmeticos |
| Loja da Ana Silva | `lojadaanasilva` | https://c4franquiaas.netlify.app/loja/lojadaanasilva |
| Beleza & Cia | `belezacia` | https://c4franquiaas.netlify.app/loja/belezacia |
| Júlia's Store | `juliastore` | https://c4franquiaas.netlify.app/loja/juliastore |
| Café São José | `cafesaojose` | https://c4franquiaas.netlify.app/loja/cafesaojose |

---

## 🔧 Regras de Geração

A função `gerarDominio()` aplica as seguintes transformações:

```typescript
function gerarDominio(nomeLoja: string): string {
  return nomeLoja
    .toLowerCase()                    // 1. Converte para minúsculas
    .normalize('NFD')                 // 2. Normaliza caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // 3. Remove acentos
    .replace(/[^a-z0-9]/g, '')       // 4. Remove caracteres especiais e espaços
    .substring(0, 50);                // 5. Limita a 50 caracteres
}
```

### Passo a Passo:

1. **Minúsculas**: `"CJ Rasteninhas"` → `"cj rasteninhas"`
2. **Normalização**: `"María Café"` → `"maria cafe"` (prepara para remover acentos)
3. **Remove Acentos**: `"São José"` → `"sao jose"`
4. **Remove Especiais**: `"Beleza & Cia!"` → `"belezacia"`
5. **Limita Tamanho**: Máximo 50 caracteres

---

## 📝 Interface da Página

### Campo Nome da Loja:
```
┌─────────────────────────────────────┐
│ Nome da Loja *                      │
│ [CJ Rasteninhas________________]    │
│ Este será o nome exibido na loja    │
└─────────────────────────────────────┘
```

### Exibição da URL (Automática):
```
┌─────────────────────────────────────┐
│ URL da Loja                         │
│                                     │
│ c4franquiaas.netlify.app/loja/     │
│ cjrasteninhas                       │
│                                     │
│ ✨ Gerada automaticamente a partir  │
│    do nome da loja                  │
└─────────────────────────────────────┘
```

---

## 🎨 Atualização em Tempo Real

Conforme a franqueada digita o nome, a URL atualiza automaticamente:

```typescript
// useEffect que monitora o nome
useEffect(() => {
  if (nome && !loja) {
    // Só gera automaticamente quando está criando
    const novoDominio = gerarDominio(nome);
    setDominio(novoDominio);
  }
}, [nome, loja]);
```

### Comportamento:

- **Criando nova loja**: Domínio atualiza em tempo real
- **Editando loja existente**: Domínio **não muda** (mantém o original)

---

## ✅ Validações

### Frontend:

```typescript
// Validação antes de salvar
if (!nome) {
  setError('Preencha o nome da loja');
  return;
}

if (dominio.length < 3) {
  setError('O nome da loja deve ter pelo menos 3 caracteres válidos');
  return;
}
```

### Backend:

As APIs já validam:
- Domínio único (não pode duplicar)
- Mínimo de 3 caracteres
- Sanitização adicional

---

## 🚫 O Que a Franqueada **NÃO** Faz Mais

❌ **Não digita o domínio manualmente**  
❌ **Não escolhe a URL**  
❌ **Não precisa se preocupar com caracteres especiais**

---

## ✅ O Que a Franqueada **FAZ**

✅ **Digita apenas o nome da loja**  
✅ **Vê a URL sendo gerada automaticamente**  
✅ **Sistema garante URL válida**

---

## 📊 Fluxo Completo

```
1. Franqueada acessa /franqueada/loja
   
2. Digita nome: "CJ Rasteninhas"
   
3. Sistema gera automaticamente:
   - Nome: CJ Rasteninhas
   - Domínio: cjrasteninhas
   - URL: c4franquiaas.netlify.app/loja/cjrasteninhas
   
4. Franqueada faz upload de logo
   
5. Escolhe cores primária e secundária
   
6. Clica em "Salvar Alterações"
   
7. Sistema valida:
   - Nome preenchido? ✓
   - Domínio tem 3+ caracteres? ✓
   - Domínio é único? ✓
   
8. Loja criada com sucesso! 🎉
   
9. Franqueada copia link:
   https://c4franquiaas.netlify.app/loja/cjrasteninhas
   
10. Compartilha com clientes ✓
```

---

## 🔍 Casos Especiais

### Nome com Números:
```
Nome: "Loja 123"
Domínio: "loja123"
✓ Números são mantidos
```

### Nome com Emoji:
```
Nome: "Loja 💄 Beleza"
Domínio: "lojabeleza"
✓ Emojis são removidos
```

### Nome Curto:
```
Nome: "C4"
Domínio: "c4"
❌ Erro: mínimo 3 caracteres
```

### Nome com Espaços e Acentos:
```
Nome: "São João Café & Cia"
Domínio: "saojoaocafecia"
✓ Tudo limpo e válido
```

### Nome Muito Longo:
```
Nome: "Super Mega Loja de Cosméticos e Produtos de Beleza Premium"
Domínio: "supermegalojadecosmeticoseprodutosdebelezapremiu"
✓ Limitado a 50 caracteres
```

---

## 🛠️ Código Implementado

### Localização:
```
app/franqueada/loja/page.tsx
```

### Função Principal:
```typescript
function gerarDominio(nomeLoja: string): string {
  return nomeLoja
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 50);
}
```

### Hook de Atualização:
```typescript
useEffect(() => {
  if (nome && !loja) {
    const novoDominio = gerarDominio(nome);
    setDominio(novoDominio);
  }
}, [nome, loja]);
```

---

## 🎯 Benefícios

✅ **Simplicidade**: Franqueada só digita o nome  
✅ **Automatização**: Sistema cuida da URL  
✅ **Sem Erros**: Validação garante URL válida  
✅ **Experiência Melhor**: Menos campos para preencher  
✅ **Consistência**: Todas as URLs seguem o mesmo padrão

---

## 📅 Última Atualização
22 de outubro de 2025

## 🎉 Status
✅ Implementado e funcionando  
✅ Build local bem-sucedido  
✅ Pronto para deploy
