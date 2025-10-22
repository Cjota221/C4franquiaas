# 🧪 Guia de Teste - Sistema de Produtos Melhorado

## 🎯 URL de Teste
```
http://localhost:3001/franqueada/produtos
```

---

## 📋 Checklist de Testes

### ✅ Teste 1: Visualizar Produtos Sem Margem

**O que você vai ver:**
- [ ] Cards com **borda amarela**
- [ ] Badge: "⚠️ Defina a margem"
- [ ] Mensagem: "Passo 1: Defina a margem usando o botão 'Ajustar Preços'"
- [ ] Botão de ativar não funciona (mostra alerta)

**Estatísticas:**
- [ ] Card "⚠️ Sem Margem" mostra quantidade de produtos sem margem

---

### ✅ Teste 2: Galeria de Imagens

**Ações:**
1. [ ] Passe o mouse sobre a imagem de um produto
2. [ ] Veja as **setas aparecerem** (esquerda e direita)
3. [ ] Clique na seta direita → Próxima imagem
4. [ ] Clique na seta esquerda → Imagem anterior
5. [ ] Veja o **indicador** "1/5", "2/5", etc
6. [ ] Clique nas **miniaturas** abaixo da imagem
7. [ ] Miniatura selecionada tem **borda rosa**

---

### ✅ Teste 3: Definir Margem (Individual)

**Passos:**
1. [ ] Clique no **checkbox** de 1 produto
2. [ ] Clique em "Ajustar Preços (1)"
3. [ ] Modal abre
4. [ ] Selecione "Porcentagem (%)"
5. [ ] Digite **25** (25% de margem)
6. [ ] Veja prévia: "Os preços serão aumentados em 25%"
7. [ ] Clique em "Aplicar Ajuste"
8. [ ] Modal fecha
9. [ ] Card do produto agora mostra:
   - [ ] **Preço Base C4**: R$ 100,00 (exemplo)
   - [ ] **Sua Margem**: +25% (em amarelo)
   - [ ] Cálculo: = R$ 25,00 (25%)
   - [ ] **Preço Final**: R$ 125,00 (em verde)
10. [ ] Badge muda para: "💎 Pronto para ativar"
11. [ ] Borda fica cinza/azul
12. [ ] Botão "🚀 Ativar Agora" aparece **piscando**

---

### ✅ Teste 4: Definir Margem em Massa

**Passos:**
1. [ ] Clique em "☑️ Selecionar Todos"
2. [ ] Todos os checkboxes ficam marcados
3. [ ] Clique em "Ajustar Preços (X)" onde X = total de produtos
4. [ ] Modal abre
5. [ ] Selecione "Valor Fixo (R$)"
6. [ ] Digite **15** (R$ 15,00 de margem)
7. [ ] Veja prévia: "Será adicionado R$ 15.00 ao preço base"
8. [ ] Clique em "Aplicar Ajuste"
9. [ ] Todos os produtos agora têm margem de +R$ 15,00

---

### ✅ Teste 5: Tentar Ativar Sem Margem (Validação)

**Passos:**
1. [ ] Encontre produto com borda amarela (sem margem)
2. [ ] Tente clicar no botão de status
3. [ ] Veja **alerta aparecer**: "⚠️ Defina a margem de lucro antes de ativar o produto!"
4. [ ] Produto continua inativo

**Por quê?**
- Sistema **não permite** ativar produto sem margem
- Garante que franqueada sempre terá lucro

---

### ✅ Teste 6: Ativar Produto

**Passos:**
1. [ ] Produto com margem definida (badge azul "💎 Pronto para ativar")
2. [ ] Botão "🚀 Ativar Agora" está **piscando** (animação pulse)
3. [ ] Clique no botão
4. [ ] Card muda:
   - [ ] Borda fica **verde**
   - [ ] Badge: "✓ Ativo na loja"
   - [ ] Botão: "✓ Ativo no Site" (verde)
5. [ ] Estatística "✓ Ativos no Site" aumenta

---

### ✅ Teste 7: Ativar em Massa

**Passos:**
1. [ ] Selecione múltiplos produtos com margem definida
2. [ ] Clique em "✓ Ativar (X)"
3. [ ] Todos os produtos selecionados ficam ativos
4. [ ] Cards ficam verdes
5. [ ] Estatística atualiza

---

### ✅ Teste 8: Desativar Produto

**Passos:**
1. [ ] Produto ativo (verde)
2. [ ] Clique no botão "✓ Ativo no Site"
3. [ ] Produto fica inativo
4. [ ] Mas **mantém a margem definida**
5. [ ] Volta para badge "💎 Pronto para ativar"

---

### ✅ Teste 9: Estatísticas

**Verifique os 4 cards:**

1. [ ] **Total de Produtos**: Soma de todos
2. [ ] **⚠️ Sem Margem** (amarelo): Produtos sem ajuste_tipo
3. [ ] **💎 Prontos p/ Ativar** (azul): Com margem mas inativos
4. [ ] **✓ Ativos no Site** (verde): Publicados na loja

**Comportamento:**
- [ ] Números mudam dinamicamente
- [ ] Total = Sem Margem + Prontos + Ativos

---

## 🎨 Checklist Visual

### Cores Corretas:

#### Produto Sem Margem:
- [ ] Borda: **Amarela** (`border-yellow-400`)
- [ ] Badge: **Amarelo** com texto "⚠️ Defina a margem"
- [ ] Área de preços: Mostra apenas "Preço Base C4"
- [ ] Margem: Exibe "Não definida" em amarelo

#### Produto Pronto para Ativar:
- [ ] Borda: **Cinza** normal
- [ ] Badge: **Azul** com texto "💎 Pronto para ativar"
- [ ] Botão: **Azul** "🚀 Ativar Agora" (pulsando)
- [ ] Área de preços: Mostra Base → Margem → Final completo

#### Produto Ativo:
- [ ] Borda: **Verde** (`border-green-400`)
- [ ] Badge: **Verde** com texto "✓ Ativo na loja"
- [ ] Botão: **Verde** "✓ Ativo no Site"
- [ ] Área de preços: Completa com destaque no preço final

---

## 🎯 Fluxo Visual de Preços

### Verifique se aparece assim:

```
┌───────────────────────────────────────────────────────────┐
│  💰 Preço Base C4    →    📈 Sua Margem    →    ✨ Preço Final  │
│     R$ 100,00              +25%                  R$ 125,00     │
│                         (= R$ 25,00)                            │
│                           (25%)                                 │
└───────────────────────────────────────────────────────────┘
```

**Cores:**
- [ ] Preço Base: Cinza escuro
- [ ] Margem: **Amarelo** (`#F8B81F`)
- [ ] Preço Final: **Verde** forte
- [ ] Background: Gradiente cinza claro → verde claro

---

## 🖼️ Galeria de Imagens

### Verifique:

**Imagem Principal:**
- [ ] 128x128px (w-32 h-32)
- [ ] Bordas arredondadas
- [ ] Object-fit: cover

**Setas de Navegação:**
- [ ] Aparecem ao **passar o mouse**
- [ ] Fundo: Preto semi-transparente
- [ ] Ícones: Brancos
- [ ] Hover: Preto mais escuro

**Indicador:**
- [ ] Posição: Centro inferior
- [ ] Formato: "2/5", "3/5", etc
- [ ] Fundo: Preto semi-transparente
- [ ] Texto: Branco

**Miniaturas:**
- [ ] 32x32px (w-8 h-8)
- [ ] Borda: 2px
- [ ] Ativa: Borda **rosa** (`border-pink-600`)
- [ ] Inativa: Borda cinza clara
- [ ] Clicáveis

---

## 🔍 Busca

### Teste:
1. [ ] Digite nome de produto
2. [ ] Lista filtra em tempo real
3. [ ] Estatísticas mantêm valores totais (não filtram)
4. [ ] Limpe busca → Todos voltam

---

## 🚨 Erros Esperados (Validações)

### 1. Ativar Sem Margem
**Mensagem:** "⚠️ Defina a margem de lucro antes de ativar o produto!"

### 2. Aplicar Ajuste Sem Valor
**Mensagem:** "Selecione produtos e informe o valor do ajuste"

### 3. Aplicar Ajuste Sem Seleção
**Mensagem:** "Selecione produtos e informe o valor do ajuste"

---

## 📱 Responsividade

### Desktop (md+):
- [ ] Estatísticas: 4 colunas
- [ ] Área de preços: Horizontal
- [ ] Galeria: 128px

### Mobile:
- [ ] Estatísticas: 1 coluna
- [ ] Área de preços: Vertical (se necessário)
- [ ] Galeria: Mantém tamanho

---

## ✅ Cenários Completos

### Cenário 1: Nova Franqueada
```
1. Franqueada aprovada pelo admin
2. Produtos vinculados automaticamente
3. Acessa /franqueada/produtos
4. Vê todos com borda amarela
5. Define margens individuais ou em massa
6. Ativa os que quiser
7. Produtos aparecem na loja pública
```

### Cenário 2: Ajustar Preços Sazonais
```
1. Franqueada tem produtos ativos
2. Desativa temporariamente
3. Seleciona todos
4. Ajusta margem para +30% (promoção)
5. Reativa produtos
6. Novos preços na loja
```

### Cenário 3: Diferentes Margens
```
1. Produto A: +50% (margem alta)
2. Produto B: +R$ 10,00 (margem fixa)
3. Produto C: +15% (margem baixa)
4. Ativa todos
5. Loja mostra preços diferentes
```

---

## 🎯 Resultado Esperado Final

Após todos os testes, você deve ter:

- [x] Galeria funcionando com navegação suave
- [x] Preços calculados corretamente
- [x] Workflow claro (sem margem → com margem → ativo)
- [x] Validações impedindo ativação sem margem
- [x] Estatísticas atualizando em tempo real
- [x] Interface visual e intuitiva
- [x] Cores e badges indicando status
- [x] Animações chamando atenção para ações importantes

---

## 📊 Valores de Teste Sugeridos

### Margens Realistas:

**Porcentagem:**
- 15% - Margem baixa
- 25% - Margem média
- 50% - Margem alta
- 100% - Margem dobrada

**Valor Fixo:**
- R$ 5,00 - Pequena margem
- R$ 15,00 - Margem média
- R$ 30,00 - Margem alta

---

## 🐛 Se Algo Não Funcionar

### Galeria não aparece:
- Verifique se produtos têm campo `imagens` populado
- Console do navegador: Procure erros de imagem

### Preços não calculam:
- Verifique se `preco_base` está definido
- Console: Verifique se `ajuste_tipo` e `ajuste_valor` estão salvando

### Não consegue ativar:
- Confirme que margem está definida
- Verifique console do navegador
- Veja se alerta aparece

### Estatísticas erradas:
- Recarregue a página
- Verifique se produtos foram salvos no banco

---

## 📄 Documentação

**Completa em:** `docs/PRODUTOS_MELHORADOS.md`

**Links úteis:**
- Sistema: http://localhost:3001/franqueada/produtos
- Admin: http://localhost:3001/admin/franqueadas
- Login: http://localhost:3001/franqueada/login

---

Última atualização: 21 de outubro de 2025
Status: ✅ Pronto para testar
