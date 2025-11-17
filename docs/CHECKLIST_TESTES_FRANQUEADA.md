# 📋 Checklist de Testes - Sistema de Gestão de Produtos Franqueada

## ✅ Status: Pronto para Testes

**Data:** 17 de Novembro de 2025  
**Versão:** 1.0.0  
**Tempo Estimado:** 30-40 minutos

---

## 🎯 Pré-requisitos

Antes de iniciar os testes, certifique-se de:

1. ✅ Migration 035 aplicada no Supabase
2. ✅ Código deployado e servidor rodando
3. ✅ Acesso ao painel da franqueada
4. ✅ Produtos vinculados à franqueada de teste
5. ✅ Acesso ao painel admin para testes de sincronização

---

## 📊 FASE 1: Testes de Carregamento e Exibição (5 min)

### 1.1 Carregamento Inicial
- [ ] Acessar `/franqueada/produtos`
- [ ] Loading spinner aparece enquanto carrega
- [ ] Timeout de 10 segundos funciona (se houver demora)
- [ ] Produtos carregam corretamente
- [ ] Imagens são exibidas (ou ícone de placeholder)

**Resultado esperado:**
- Tabela com todos os produtos vinculados
- 4 cards de estatísticas no topo
- Filtros expandidos
- Sem erros no console

### 1.2 Estatísticas
- [ ] Card "Total de Produtos" mostra número correto
- [ ] Card "Sem Margem" conta produtos sem margem configurada
- [ ] Card "Prontos p/ Ativar" conta produtos com margem + disponíveis + inativos
- [ ] Card "Ativos no Site" conta produtos com toggle ligado

---

## 🔍 FASE 2: Testes de Filtros (8 min)

### 2.1 Busca por Nome/ID
- [ ] Digitar nome parcial → filtra produtos
- [ ] Digitar ID completo → mostra produto específico
- [ ] Busca case-insensitive funciona
- [ ] Debounce de 500ms (não busca a cada letra)
- [ ] Botão X limpa a busca
- [ ] Ícone de loading aparece durante debounce

### 2.2 Filtro Status no Site
- [ ] "Todos os status" → mostra todos
- [ ] "Ativos no site" → apenas produtos com toggle ON
- [ ] "Inativos no site" → apenas produtos com toggle OFF
- [ ] Contador "Exibindo X de Y" atualiza

### 2.3 Filtro Estoque
- [ ] "Todos" → mostra todos
- [ ] "Disponível" → apenas produtos com estoque > 0
- [ ] "Esgotado" → apenas produtos com estoque = 0

### 2.4 Filtro Margem de Lucro
- [ ] "Todos" → mostra todos
- [ ] "Com margem configurada" → apenas com % definida
- [ ] "Sem margem configurada" → apenas com margem null/0

### 2.5 Faixa de Preço Final
- [ ] Digitar preço mínimo → filtra produtos >= valor
- [ ] Digitar preço máximo → filtra produtos <= valor
- [ ] Digitar ambos → filtra range completo
- [ ] Limpar campos remove filtro

### 2.6 Produtos Novos (30 dias)
- [ ] Checkbox ativa filtro de produtos recentes
- [ ] Apenas produtos com created_at nos últimos 30 dias aparecem
- [ ] Badge "Novos" aparece quando ativo

### 2.7 Tags de Filtros Ativos
- [ ] Tag aparece para cada filtro ativo
- [ ] Clicar no X da tag remove filtro específico
- [ ] Botão "Limpar todos" remove todos os filtros
- [ ] Contador de filtros ativos no header

---

## 📈 FASE 3: Testes de Ordenação (5 min)

### 3.1 Ordenar por Nome
- [ ] Clicar no header "Nome do Produto"
- [ ] Primeira vez → A-Z (ASC)
- [ ] Segunda vez → Z-A (DESC)
- [ ] Ícone de seta muda (ArrowUp/ArrowDown)

### 3.2 Ordenar por Preço Final
- [ ] Clicar no header "Preço Final"
- [ ] Primeira vez → menor para maior
- [ ] Segunda vez → maior para menor
- [ ] Produtos ordenam corretamente

### 3.3 Ordenar por Data de Chegada
- [ ] Clicar no header "Data Chegada"
- [ ] Primeira vez → mais antigos primeiro
- [ ] Segunda vez → mais recentes primeiro
- [ ] Padrão inicial é DESC (recentes primeiro)

---

## ✏️ FASE 4: Edição de Margem Inline (8 min)

### 4.1 Abrir Edição
- [ ] Clicar no campo de margem (ou ícone "Definir")
- [ ] Input aparece com foco automático
- [ ] Placeholder "0" visível
- [ ] Valor atual pré-preenchido (se existir)

### 4.2 Salvar Margem
- [ ] Digitar valor (ex: 50)
- [ ] Pressionar Enter → salva
- [ ] Clicar fora (blur) → salva
- [ ] Preço final recalcula automaticamente
- [ ] Margem aparece com ícone verde TrendingUp
- [ ] Lucro calculado aparece abaixo do preço final

### 4.3 Validações
- [ ] Digitar valor negativo → alerta "Margem inválida"
- [ ] Digitar valor > 1000 → alerta "Margem inválida"
- [ ] Digitar texto/letras → não aceita
- [ ] Pressionar ESC → cancela edição

### 4.4 Remover Margem
- [ ] Limpar campo (deixar vazio) → salva como null
- [ ] Preço final volta para preço base
- [ ] Ícone muda para TrendingDown cinza

---

## 🔘 FASE 5: Toggle Ativo no Site (6 min)

### 5.1 Ativar Produto
- [ ] Produto com margem configurada
- [ ] Produto disponível (não desativado pela C4)
- [ ] Produto com estoque
- [ ] Clicar no toggle → ativa
- [ ] Toggle muda para verde "Ativo"
- [ ] Recarrega dados

### 5.2 Validações de Ativação
- [ ] Produto SEM margem → alerta "Configure a margem..."
- [ ] Produto desativado pela C4 → alerta "Produto desativado pela C4"
- [ ] Produto sem estoque → alerta "Sem estoque disponível"
- [ ] Badge vermelho "Desativado pela C4" visível
- [ ] Badge laranja "Sem estoque" visível

### 5.3 Desativar Produto
- [ ] Produto ativo → clicar no toggle
- [ ] Toggle muda para cinza "Inativo"
- [ ] Sem validações ao desativar
- [ ] Recarrega dados

---

## 🎯 FASE 6: Seleção em Massa (5 min)

### 6.1 Seleção Individual
- [ ] Checkbox de cada linha seleciona produto
- [ ] Contador atualiza "{X} produto(s) selecionado(s)"
- [ ] Linha selecionada fica com fundo rosa claro
- [ ] Barra de ações em massa aparece

### 6.2 Selecionar Todos
- [ ] Checkbox do header seleciona todos visíveis
- [ ] Produtos filtrados são selecionados (não todos do banco)
- [ ] Clicar novamente → desseleciona todos

### 6.3 Cancelar Seleção
- [ ] Botão "Cancelar" limpa seleção
- [ ] Barra de ações desaparece
- [ ] Checkboxes desmarcados

---

## ⚡ FASE 7: Ações em Massa (8 min)

### 7.1 Ativar Selecionados
- [ ] Selecionar 3 produtos com margem e disponíveis
- [ ] Clicar em "Ativar"
- [ ] Loading "Processando..." aparece
- [ ] Alerta de sucesso "✅ 3 produto(s) ativado(s)"
- [ ] Toggles mudam para verde
- [ ] Seleção limpa automaticamente

### 7.2 Validações de Ativação em Massa
- [ ] Selecionar produtos SEM margem → alerta "{X} produto(s) sem margem"
- [ ] Selecionar produtos desativados/sem estoque → alerta "{X} produto(s) não podem ser ativados"

### 7.3 Desativar Selecionados
- [ ] Selecionar produtos ativos
- [ ] Clicar em "Desativar"
- [ ] Alerta de sucesso
- [ ] Toggles mudam para cinza
- [ ] Sem validações ao desativar

### 7.4 Aplicar Margem em Massa
- [ ] Selecionar 5 produtos
- [ ] Clicar em "Aplicar Margem"
- [ ] Modal abre
- [ ] Informação "{X} produto(s) selecionado(s)" visível
- [ ] Digitar margem (ex: 45.5)
- [ ] Clicar em "Aplicar"
- [ ] Loading aparece
- [ ] Alerta "✅ Margem de 45.5% aplicada a 5 produto(s)"
- [ ] Modal fecha
- [ ] Produtos atualizam com nova margem
- [ ] Preços finais recalculados

### 7.5 Validações do Modal
- [ ] Margem vazia → alerta "Digite uma margem válida"
- [ ] Margem < 0 → alerta
- [ ] Margem > 1000 → alerta
- [ ] Botão "Cancelar" fecha modal sem salvar

---

## 🔄 FASE 8: Sincronização Automática (10 min)

**⚠️ Requer acesso ao Painel Admin**

### 8.1 Desativar Produto no Admin
1. [ ] No admin: desativar produto que está ativo na franqueada
2. [ ] Aguardar 2-3 segundos
3. [ ] No painel da franqueada: recarregar página
4. [ ] **Resultado esperado:** Toggle automaticamente OFF
5. [ ] Badge "Desativado pela C4" aparece
6. [ ] Toggle desabilitado (não permite ativar)

### 8.2 Zerar Estoque no Admin
1. [ ] No admin: alterar estoque para 0
2. [ ] Aguardar 2-3 segundos
3. [ ] No painel da franqueada: recarregar página
4. [ ] **Resultado esperado:** Toggle automaticamente OFF
5. [ ] Badge "Sem estoque" aparece
6. [ ] Status muda para "Esgotado"

### 8.3 Reativar Produto no Admin
1. [ ] No admin: reativar produto
2. [ ] Aguardar 2-3 segundos
3. [ ] No painel da franqueada: recarregar página
4. [ ] **Resultado esperado:** 
   - Toggle permanece OFF (não ativa automaticamente)
   - Badge "Desativado pela C4" desaparece
   - Toggle habilitado (franqueada pode ativar manualmente)

### 8.4 Repor Estoque no Admin
1. [ ] No admin: alterar estoque de 0 para > 0
2. [ ] Aguardar 2-3 segundos
3. [ ] No painel da franqueada: recarregar página
4. [ ] **Resultado esperado:**
   - Toggle permanece OFF
   - Badge "Sem estoque" desaparece
   - Status muda para "Disponível"
   - Franqueada pode ativar manualmente

---

## 🎨 FASE 9: UI/UX e Responsividade (5 min)

### 9.1 Desktop
- [ ] Tabela ocupa largura completa
- [ ] 9 colunas visíveis
- [ ] Scroll horizontal não necessário (até 1366px)
- [ ] Hover nas linhas funciona

### 9.2 Tablet (768px - 1024px)
- [ ] Tabela com scroll horizontal suave
- [ ] Estatísticas em 2 colunas
- [ ] Filtros empilhados corretamente

### 9.3 Mobile (< 768px)
- [ ] Cards de estatísticas em 1 coluna
- [ ] Tabela com scroll horizontal
- [ ] Botões de ação empilhados
- [ ] Modal ocupa 100% da largura (padding 4)

### 9.4 Estados Vazios
- [ ] Sem produtos vinculados → mensagem amigável
- [ ] Filtros sem resultado → mensagem "Nenhum produto encontrado"
- [ ] Ícone de Package e texto explicativo

---

## 🐛 FASE 10: Testes de Erros (5 min)

### 10.1 Erros de Rede
- [ ] Desligar internet durante carregamento
- [ ] Mensagem de erro aparece
- [ ] Loading para após timeout
- [ ] Console mostra erro amigável

### 10.2 Erros de Permissão
- [ ] Deslogar usuário
- [ ] Tentar acessar página
- [ ] Redirect para login ou mensagem de erro

### 10.3 Dados Corrompidos
- [ ] Produto sem nome → exibe "-" ou placeholder
- [ ] Produto sem imagem → ícone de Package
- [ ] Preço null → exibe R$ 0.00

---

## 📊 Resumo de Testes

| Fase | Testes | Passaram | Falharam | Status |
|------|--------|----------|----------|--------|
| 1. Carregamento | 8 | - | - | ⏳ |
| 2. Filtros | 20 | - | - | ⏳ |
| 3. Ordenação | 9 | - | - | ⏳ |
| 4. Edição Margem | 14 | - | - | ⏳ |
| 5. Toggle Status | 11 | - | - | ⏳ |
| 6. Seleção Massa | 8 | - | - | ⏳ |
| 7. Ações Massa | 17 | - | - | ⏳ |
| 8. Sincronização | 12 | - | - | ⏳ |
| 9. UI/UX | 13 | - | - | ⏳ |
| 10. Erros | 6 | - | - | ⏳ |
| **TOTAL** | **118** | **-** | **-** | **⏳** |

---

## 🚀 Após os Testes

### Se todos passarem:
1. ✅ Marcar task 8 como completa
2. ✅ Criar documentação de uso para franqueadas
3. ✅ Deploy para produção
4. ✅ Notificar franqueadas da nova interface

### Se houver falhas:
1. 🐛 Documentar bugs encontrados
2. 🔧 Priorizar correções críticas
3. 🧪 Executar testes de regressão
4. 📝 Atualizar checklist com lições aprendidas

---

## 📝 Notas de Teste

**Testador:** _____________  
**Data:** _____________  
**Ambiente:** Dev / Staging / Produção  
**Browser:** _____________  
**Observações:**

```
[Espaço para anotações durante os testes]







```

---

**Documentação gerada por Manus AI**  
**Última atualização:** 17/11/2025
