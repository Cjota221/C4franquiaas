# ✅ Checklist de Testes - Tabela de Produtos

**Data:** 17/11/2025
**Status:** Migration 034 aplicada ✅

---

## 🧪 Testes para Executar

### **1. Teste Visual Básico** (2 min)

Acesse: `http://localhost:3000/admin/produtos`

**Verificar:**

- [ ] Tabela está renderizando (não mais grid de cards)
- [ ] Filtros aparecem acima da tabela
- [ ] 9 colunas visíveis: `☑ | IMG | NOME | ID | PREÇO | ESTOQUE | STATUS | DATA | AÇÕES`
- [ ] Headers clicáveis mostram ícones de ordenação
- [ ] Produtos estão listados

---

### **2. Teste de Ordenação** (3 min)

**Clicar nos headers das colunas:**

| Coluna      | Teste 1 (ASC)     | Teste 2 (DESC)    |
| ----------- | ----------------- | ----------------- |
| **Nome**    | [ ] A→Z           | [ ] Z→A           |
| **ID**      | [ ] 1→999         | [ ] 999→1         |
| **Preço**   | [ ] Menor→Maior   | [ ] Maior→Menor   |
| **Estoque** | [ ] 0→99          | [ ] 99→0          |
| **Status**  | [ ] Inativo→Ativo | [ ] Ativo→Inativo |
| **Data**    | [ ] Antigo→Novo   | [ ] Novo→Antigo   |

**Verificar:**

- [ ] Ícone muda de `↕` para `↑` ou `↓`
- [ ] Produtos reordenam instantaneamente
- [ ] Apenas UMA coluna mostra ícone de ordenação ativa

---

### **3. Teste de Filtros Simples** (5 min)

#### **3.1. Busca por Nome**

- [ ] Digite "bolsa" → Mostra apenas produtos com "bolsa" no nome
- [ ] Limpe a busca → Volta a mostrar todos

#### **3.2. Filtro de Status**

- [ ] Selecione "Apenas Ativos" → Mostra só produtos ativos
- [ ] Selecione "Apenas Inativos" → Mostra só produtos inativos
- [ ] Volte para "Todos" → Mostra todos

#### **3.3. Filtro de Estoque**

- [ ] Selecione "Apenas Disponível" → Mostra só com estoque > 0
- [ ] Selecione "Apenas Esgotado" → Mostra só estoque = 0
- [ ] Volte para "Todos"

#### **3.4. Produtos Novos (Últimos 7 dias)**

- [ ] Marque checkbox "Apenas produtos novos (7 dias)"
- [ ] Verifica se mostra só produtos criados nos últimos 7 dias
- [ ] Desmarque

---

### **4. Teste de Filtros Avançados** (3 min)

#### **4.1. Faixa de Preço**

- [ ] Preço mín: `50` | máx: `100`
- [ ] Mostra apenas produtos entre R$ 50 e R$ 100
- [ ] Limpe os campos

#### **4.2. Tags de Filtros Ativos**

- [ ] Aplique múltiplos filtros
- [ ] Verifica se tags aparecem abaixo dos filtros
- [ ] Clique no `X` de uma tag → Remove apenas aquele filtro
- [ ] Clique em "Limpar Filtros" → Remove todos

#### **4.3. Contador de Filtros**

- [ ] Aplique 3 filtros
- [ ] Badge mostra "3" ao lado de "Filtros"

---

### **5. Teste de Seleção em Massa** (2 min)

- [ ] Clique no checkbox do header → Seleciona todos da página
- [ ] Clique novamente → Desmarca todos
- [ ] Selecione 2-3 produtos individualmente
- [ ] Badge mostra "X selecionado(s)" no canto superior
- [ ] Botão "Ações (X)" fica habilitado

---

### **6. Teste de Ações** (3 min)

#### **6.1. Ver Detalhes**

- [ ] Clique em "Ver Detalhes" de um produto
- [ ] Modal de detalhes abre
- [ ] Feche o modal

#### **6.2. Toggle Status**

- [ ] Clique no botão verde "Ativo" de um produto ativo
- [ ] Status muda para "Inativo" (botão cinza)
- [ ] Clique novamente → Volta para "Ativo"

#### **6.3. Ações em Massa**

- [ ] Selecione 2+ produtos
- [ ] Clique em "Ações (X)" → Menu dropdown abre
- [ ] Clique em "Ativar Selecionados"
- [ ] Produtos ficam ativos
- [ ] Mensagem de sucesso aparece

---

### **7. Teste de Loading States** (1 min)

- [ ] Aplique um filtro
- [ ] Durante carregamento, overlay com spinner aparece
- [ ] Spinner desaparece quando termina

---

### **8. Teste de Empty State** (1 min)

- [ ] Busque por algo que não existe: "xyzabc123"
- [ ] Mostra ícone de caixa vazia 📭
- [ ] Mensagem: "Nenhum produto encontrado"
- [ ] Sugestão: "Tente ajustar os filtros"

---

### **9. Teste de Paginação** (2 min)

- [ ] Limpe todos os filtros
- [ ] Se tem mais de 30 produtos, mostra botões de paginação
- [ ] Clique em "Próxima →"
- [ ] Produtos da página 2 carregam
- [ ] Mostra "Página 2 de X"
- [ ] Clique em "← Anterior" → Volta para página 1

---

### **10. Teste de Responsividade** (2 min)

- [ ] Redimensione a janela do navegador
- [ ] Tabela mostra scroll horizontal em telas pequenas
- [ ] Filtros se reorganizam em coluna única no mobile
- [ ] Botões permanecem acessíveis

---

### **11. Teste de Performance** (1 min)

- [ ] Ordene por diferentes colunas rapidamente
- [ ] Aplique/remova filtros múltiplas vezes
- [ ] Interface permanece fluida (sem lag)
- [ ] Requisições são debounced (não faz múltiplas calls)

---

### **12. Teste de Data de Criação** (2 min)

**Verificar se a migration 034 funcionou:**

- [ ] Coluna "Data Criação" mostra datas formatadas (DD/MM/YYYY)
- [ ] Produtos têm datas válidas (não "-")
- [ ] Clique no header "Data Criação"
- [ ] Ordenação funciona corretamente (mais recentes primeiro/último)

**Se aparecer "-" nas datas:**
❌ Migration 034 não foi aplicada corretamente
✅ Se mostra datas: Migration funcionou!

---

## 🐛 Problemas Comuns e Soluções

### **Problema 1: Coluna "Data Criação" mostra "-"**

**Causa:** Migration 034 não aplicada ou produtos não tem `created_at`

**Solução:**

```sql
-- Rodar novamente no Supabase
UPDATE produtos SET created_at = NOW() WHERE created_at IS NULL;
```

### **Problema 2: Ordenação não funciona**

**Causa:** Possível erro na query

**Debug:**

1. Abra DevTools (F12)
2. Vá para Network
3. Clique em um header
4. Veja a requisição para `/produtos` ou similar
5. Verifique os parâmetros de ordenação

### **Problema 3: Filtros não aplicam**

**Causa:** Estado não conectado à query

**Debug:**

1. Abra React DevTools
2. Veja o state dos filtros
3. Verifique se `carregarProdutos` é chamado ao mudar filtros

### **Problema 4: Loading infinito**

**Causa:** Erro na API ou Supabase

**Debug:**

1. Veja console do navegador (F12 → Console)
2. Procure por erros vermelhos
3. Veja mensagem de erro específica

---

## ✅ Resultado Esperado

Após todos os testes:

- ✅ Tabela renderiza perfeitamente
- ✅ Ordenação funciona em todas as colunas
- ✅ 7 filtros funcionam individualmente e combinados
- ✅ Tags de filtros aparecem e removem corretamente
- ✅ Seleção em massa funciona
- ✅ Ações funcionam (ver detalhes, toggle, ações em massa)
- ✅ Loading states aparecem
- ✅ Empty state funciona
- ✅ Paginação funciona
- ✅ Performance é fluida
- ✅ Data de criação mostra corretamente

---

## 📊 Comparação Final

### **ANTES (Grid):**

- Navegação lenta em 300+ produtos
- Filtros limitados
- Sem ordenação controlada
- Baixa densidade de informação

### **DEPOIS (Tabela):**

- ✅ Gestão profissional tipo ERP
- ✅ 7 filtros avançados
- ✅ Ordenação em 6 colunas
- ✅ Alta densidade de informação
- ✅ UX moderna e eficiente

---

## 🎉 Se TODOS os testes passarem:

**FASE 3 CONCLUÍDA E VALIDADA! 🚀**

Próximo passo: **FASE 4 - Persistência em URL** (opcional)

---

**Criado em:** 17/11/2025
**Duração estimada dos testes:** ~25 minutos
