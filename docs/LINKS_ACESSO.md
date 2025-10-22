# 🔗 Links de Acesso - Sistema C4 Franquias

## 🎯 Servidor Local
**Porta**: 3001 (ou 3000 se estiver livre)

Para iniciar o servidor:
```powershell
npm run dev
```

---

## 👨‍💼 PAINEL ADMINISTRATIVO (Admin)

### 🏠 Dashboard Admin
```
http://localhost:3001/admin/dashboard
```

### 📦 Gestão de Produtos
```
http://localhost:3001/admin/produtos
```

### 👥 Gestão de Franqueadas (UNIFICADO)
```
http://localhost:3001/admin/franqueadas
```
**Funcionalidades**:
- ⏳ Aprovar/Rejeitar pendentes
- ✓ Ver todas aprovadas
- 🟢 Ativar/desativar lojas
- 📊 5 filtros e estatísticas

### 👔 Gestão de Afiliados
```
http://localhost:3001/admin/afiliados
```

### 💰 Gestão de Vendas
```
http://localhost:3001/admin/vendas
```

### 💵 Gestão de Comissões
```
http://localhost:3001/admin/comissoes
```

---

## 🏪 PAINEL DA FRANQUEADA (Revendedora)

### 📝 Cadastro Público (Novo)
```
http://localhost:3001/cadastro/franqueada
```
**Para quem quer se tornar franqueada**
- Preenche formulário
- Status inicial: 'pendente'
- Aguarda aprovação do admin

### 🔐 Login da Franqueada
```
http://localhost:3001/franqueada/login
```
**Credenciais**: Email e senha definidos após aprovação

### 🏠 Dashboard da Franqueada
```
http://localhost:3001/franqueada/dashboard
```
**Mostra**:
- 📦 Total de produtos
- ✅ Produtos ativos
- 💰 Vendas totais
- 💵 Comissão acumulada

### 📦 Produtos da Franqueada
```
http://localhost:3001/franqueada/produtos
```
**Funcionalidades COMPLETAS** (✨ MELHORADO):
- �️ **Galeria de imagens** com carrossel interativo
  - Navegação por setas (ao passar mouse)
  - Miniaturas clicáveis
  - Indicador de posição (1/5, 2/5...)
- � **Visualização clara de preços**
  - Preço Base C4 (cinza)
  - Sua Margem (amarelo #F8B81F)
  - Preço Final (verde)
  - Mostra cálculo: +25% = R$ 25,00 (25%)
- 🎯 **Fluxo em 2 etapas OBRIGATÓRIO**
  - Passo 1: Definir margem (borda amarela)
  - Passo 2: Ativar produto (borda azul → verde)
  - **NÃO permite ativar sem margem!**
- 📊 **Estatísticas com 4 cards**
  - Total de produtos
  - ⚠️ Sem margem (amarelo)
  - � Prontos p/ ativar (azul)
  - ✓ Ativos no site (verde)
- 🔍 Buscar produtos
- ☑️ Seleção múltipla
- 💵 Ajuste de preços em massa (% ou fixo)

### 👤 Perfil da Franqueada
```
http://localhost:3001/franqueada/perfil
```
**Exibe**:
- Nome, email, telefone
- CPF, cidade, estado
- Status da conta
- Data de aprovação

---

## 🛒 LOJAS PÚBLICAS (Clientes)

### 🏪 Loja da Franqueada
```
http://localhost:3001/loja/[dominio]
```
**Exemplo**:
```
http://localhost:3001/loja/teste
http://localhost:3001/loja/maria-bolos
```

✅ **Status**: Implementado!

**Funcionalidades**:
- 🏠 **Home**: Banner + produtos em destaque + diferenciais
- 📦 **Catálogo**: Busca + grid responsivo de produtos
- 🔍 **Produto Individual**: Galeria + seletor quantidade + add carrinho
- 🛒 **Carrinho**: Lista itens + controles + resumo + finalizar
- 🎨 **Tema Dinâmico**: Cores da tabela `lojas` aplicadas automaticamente
- 💾 **Persistência**: Carrinho salvo no localStorage

**Como criar loja de teste**:
Ver arquivo: `docs/LOJA_FRANQUEADA.md`

---

## 🔐 Fluxo Completo de Teste

### 1️⃣ CADASTRAR NOVA FRANQUEADA

**Passo a passo**:
```
1. Acesse: http://localhost:3001/cadastro/franqueada
2. Preencha:
   - Nome: Maria Silva
   - Email: maria@exemplo.com
   - Telefone: (11) 98765-4321
   - CPF: 123.456.789-00
   - Cidade: São Paulo
   - Estado: SP
3. Clique em "Cadastrar"
4. Status será 'pendente'
```

---

### 2️⃣ APROVAR FRANQUEADA (Admin)

**Passo a passo**:
```
1. Acesse: http://localhost:3001/admin/franqueadas
2. Veja a franqueada com badge "⏳ Pendente"
3. Clique no botão "✓ Aprovar"
4. Sistema automaticamente:
   - Cria user_id no Supabase Auth
   - Vincula TODOS os produtos ativos
   - Muda status para 'aprovada'
   - Envia email (futuro) com credenciais
```

---

### 3️⃣ LOGIN DA FRANQUEADA

**Passo a passo**:
```
1. Acesse: http://localhost:3001/franqueada/login
2. Use o email cadastrado: maria@exemplo.com
3. Senha padrão (definida no sistema)
4. Clique em "Entrar"
5. Redireciona para: /franqueada/dashboard
```

---

### 4️⃣ GERENCIAR PRODUTOS

**Passo a passo**:
```
1. No dashboard, clique em "Gerenciar Produtos"
   OU acesse: http://localhost:3001/franqueada/produtos

2. Veja lista de produtos vinculados

3. AJUSTAR PREÇOS EM MASSA:
   a) Selecione produtos (checkbox)
   b) Clique em "Ajustar Preços"
   c) Escolha tipo:
      - Porcentagem: +10% ou -15%
      - Fixo: +R$ 5,00 ou -R$ 3,00
   d) Digite valor
   e) Clique em "Aplicar"
   f) Preços atualizados!

4. ATIVAR/DESATIVAR:
   - Individual: Toggle no card
   - Em massa: Selecione + botão "Ativar/Desativar"
```

---

## 🧪 Testes Rápidos

### ✅ Teste 1: Cadastro
```
→ http://localhost:3001/cadastro/franqueada
→ Preencher formulário
→ Ver se aparece em /admin/franqueadas como "Pendente"
```

### ✅ Teste 2: Aprovação
```
→ http://localhost:3001/admin/franqueadas
→ Clicar em "✓ Aprovar"
→ Ver se status muda para "Aprovada"
```

### ✅ Teste 3: Login
```
→ http://localhost:3001/franqueada/login
→ Fazer login com email
→ Ver se redireciona para dashboard
```

### ✅ Teste 4: Ajuste de Preços
```
→ http://localhost:3001/franqueada/produtos
→ Selecionar produtos
→ Ajustar +10%
→ Ver se preço final está correto
```

### ✅ Teste 5: Ativar Produtos
```
→ http://localhost:3001/franqueada/produtos
→ Ativar produto
→ Ver badge mudar para "Ativo"
```

---

## 📊 Filtros no Admin

### No painel `/admin/franqueadas`:

```
📊 Todos           → Ver todas franqueadas
⏳ Pendentes       → Apenas aguardando aprovação
✓ Aprovadas        → Todas aprovadas (com ou sem loja)
✕ Rejeitadas       → Cadastros rejeitados
🟢 Ativas          → Com loja online ativa
🔴 Inativas        → Com loja online desativada
```

---

## 🔍 Busca no Admin

### Buscar por:
- Nome da franqueada
- Email
- Domínio da loja (quando implementado)

Exemplo: Digite "maria" e aparece tudo relacionado

---

## 🚨 Troubleshooting

### Problema: "Could not find the 'lojas' table"
**Solução**: Aplicar migration 010
```sql
-- No Supabase Dashboard > SQL Editor
-- Executar: migrations/010_APLICAR_AGORA.sql
```

### Problema: "Franqueada não aprovada"
**Solução**: Aprovar no admin primeiro
```
http://localhost:3001/admin/franqueadas
→ Clicar em "✓ Aprovar"
```

### Problema: Não consigo fazer login
**Solução**: Verificar se franqueada foi aprovada e tem user_id
```sql
-- No Supabase > SQL Editor
SELECT id, nome, email, status, user_id 
FROM franqueadas 
WHERE email = 'seu@email.com';

-- Se user_id for NULL, reprovar e aprovar novamente
```

---

## 📱 Acessos Mobile

Substitua `localhost` pelo IP da máquina na rede local:

```
http://192.168.0.XXX:3001/franqueada/login
```

Para descobrir seu IP:
```powershell
ipconfig
```
Procure por "IPv4 Address"

---

## 🎯 Links Favoritos (Bookmark)

**Para Admin**:
```
http://localhost:3001/admin/franqueadas
http://localhost:3001/admin/produtos
```

**Para Franqueada**:
```
http://localhost:3001/franqueada/login
http://localhost:3001/franqueada/produtos
```

**Para Cadastro**:
```
http://localhost:3001/cadastro/franqueada
```

---

## 📅 Última atualização
22 de outubro de 2025

## 🎉 Status
✅ Sistema funcionando
✅ Site da franqueada implementado (/loja/[dominio])
⚠️ Aplicar migration 010 antes de usar filtros "Ativas/Inativas"
⚠️ Aplicar migration 011 para fix de UUID em produtos_franqueadas
