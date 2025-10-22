# 🎯 Sistema de Painel da Franqueada - C4 Franquias

## 📋 Visão Geral

Sistema completo para que franqueadas (revendedoras) possam:
- Fazer cadastro e login
- Gerenciar catálogo de produtos
- Ajustar preços personalizados
- Ativar/desativar produtos no site
- Visualizar estatísticas

---

## 🗂️ Estrutura de Arquivos

### Migrações
```
migrations/
├── 008_add_user_id_to_franqueadas.sql   # Auth integration
└── 009_add_franqueadas_precos.sql       # Custom pricing table
```

### Páginas Públicas
```
app/
├── cadastro/franqueada/page.tsx         # Formulário de cadastro
└── franqueada/
    ├── login/page.tsx                   # Login com Supabase Auth
    ├── layout.tsx                       # Protected layout
    ├── dashboard/page.tsx               # Dashboard com stats
    ├── produtos/page.tsx                # Gerenciamento de produtos
    └── perfil/page.tsx                  # Perfil da franqueada
```

### APIs
```
app/api/
└── cadastro/franqueada/route.ts         # POST - Criar cadastro
```

### Componentes
```
components/
└── SidebarFranqueada.tsx                # Sidebar do painel
```

---

## 🔄 Fluxo de Uso

### 1️⃣ Cadastro da Franqueada
1. Franqueada acessa `/cadastro/franqueada`
2. Preenche: nome, email, telefone, CPF, cidade, estado
3. Sistema cria registro com `status: 'pendente'`
4. Aguarda aprovação do admin

### 2️⃣ Aprovação pelo Admin
1. Admin acessa `/admin/franqueadas`
2. Visualiza cadastro pendente
3. Clica em "Aprovar"
4. Sistema:
   - Cria usuário no Supabase Auth
   - Envia email com senha inicial
   - Vincula `user_id` à franqueada
   - Atualiza status para `aprovada`
   - Vincula TODOS os produtos ativos

### 3️⃣ Primeiro Acesso
1. Franqueada recebe email com credenciais
2. Acessa `/franqueada/login`
3. Faz login com email e senha
4. Sistema valida:
   - Usuário existe no Supabase Auth
   - `user_id` está vinculado a franqueada
   - Status da franqueada é `aprovada`
5. Redireciona para `/franqueada/dashboard`

### 4️⃣ Usando o Painel

#### Dashboard (`/franqueada/dashboard`)
- **Estatísticas:**
  - Total de produtos disponíveis
  - Produtos ativos no site
  - Total de vendas (futuro)
  - Comissão acumulada (futuro)
- **Ações rápidas:**
  - Link para produtos
  - Nova venda (futuro)
  - Ver comissões (futuro)

#### Produtos (`/franqueada/produtos`)
- **Visualizar:** Todos os produtos vinculados
- **Buscar:** Por nome do produto
- **Selecionar:** Checkbox individual ou em massa
- **Ajustar preços:**
  - **Porcentagem:** Ex: +20% sobre preço base
  - **Fixo:** Ex: +R$ 10,00
  - Aplicar em massa para produtos selecionados
- **Ativar/Desativar:**
  - Individual: botão no card
  - Em massa: botões na toolbar
- **Ver informações:**
  - Preço base (do admin)
  - Ajuste aplicado
  - Preço final
  - Estoque disponível
  - Status no site

#### Perfil (`/franqueada/perfil`)
- Visualizar dados cadastrais
- Email, telefone, CPF, cidade, estado
- Data de cadastro e aprovação
- Último acesso
- Editar (futuro)

---

## 🎨 Componentes Visuais

### Paleta de Cores
- **Rosa primário:** `bg-pink-600` / `text-pink-600`
- **Verde (ativo):** `bg-green-600` / `text-green-600`
- **Vermelho (inativo):** `bg-red-600` / `text-red-600`
- **Índigo (preços):** `bg-indigo-600` / `text-indigo-600`
- **Amarelo (comissões):** `bg-yellow-500` / `text-yellow-600`

### Ícones (lucide-react)
- `LayoutDashboard` - Dashboard
- `Package` - Produtos
- `User` - Perfil
- `DollarSign` - Preços/Comissões
- `TrendingUp` - Vendas
- `LogOut` - Sair

---

## 💾 Estrutura do Banco

### Tabela: `franqueadas`
```sql
- id UUID PRIMARY KEY
- nome VARCHAR
- email VARCHAR UNIQUE
- telefone VARCHAR
- cpf VARCHAR
- cidade VARCHAR
- estado VARCHAR(2)
- status VARCHAR           -- 'pendente' | 'aprovada' | 'rejeitada'
- user_id UUID             -- REFERENCES auth.users(id)
- senha_definida BOOLEAN   -- Se já definiu senha
- ultimo_acesso TIMESTAMP  -- Último login
- criado_em TIMESTAMP
- aprovado_em TIMESTAMP
- aprovado_por UUID
```

### Tabela: `produtos_franqueadas_precos`
```sql
- id UUID PRIMARY KEY
- produto_franqueada_id UUID    -- REFERENCES produtos_franqueadas(id)
- preco_base DECIMAL(10,2)      -- Preço do admin
- ajuste_tipo VARCHAR(20)       -- 'fixo' | 'porcentagem'
- ajuste_valor DECIMAL(10,2)    -- Valor do ajuste
- preco_final DECIMAL(10,2)     -- Preço calculado
- ativo_no_site BOOLEAN         -- Se está ativo no site da franqueada
- atualizado_em TIMESTAMP
```

---

## 🔐 Autenticação

### Supabase Auth
- Login com email/senha
- Tokens JWT gerenciados pelo Supabase
- Sessions persistentes

### Verificações de Segurança
1. **Layout protegido:** Verifica auth em todas as páginas
2. **Validação de user_id:** Confirma vínculo com franqueada
3. **Status aprovada:** Apenas franqueadas aprovadas acessam
4. **RLS policies:** Proteção no nível do banco

---

## 📊 Lógica de Preços

### Preço Base
- Definido pelo admin no produto
- Não pode ser alterado pela franqueada

### Ajuste de Preços
**Porcentagem:**
```
preco_final = preco_base * (1 + ajuste_valor / 100)
Exemplo: R$ 100,00 com +20% = R$ 120,00
```

**Fixo:**
```
preco_final = preco_base + ajuste_valor
Exemplo: R$ 100,00 com +R$ 10,00 = R$ 110,00
```

### Ajuste em Massa
1. Franqueada seleciona múltiplos produtos
2. Define tipo de ajuste (porcentagem ou fixo)
3. Define valor do ajuste
4. Sistema aplica para todos os selecionados
5. Cada produto mantém registro individual

---

## 🚀 Como Testar

### Pré-requisitos
```bash
# 1. Aplicar migrações
npm run migrate  # ou manualmente via Supabase Dashboard
```

### Fluxo de Teste
```bash
# 1. Cadastro
- Acesse: http://localhost:3001/cadastro/franqueada
- Preencha o formulário
- Clique em "Cadastrar"

# 2. Aprovação (como admin)
- Acesse: http://localhost:3001/admin/franqueadas
- Encontre o cadastro pendente
- Clique em "Aprovar"
- Sistema criará usuário no Supabase Auth

# 3. Login (como franqueada)
- Acesse: http://localhost:3001/franqueada/login
- Use o email cadastrado
- Senha: a que foi enviada por email (ou configure manualmente)

# 4. Teste o Painel
- Dashboard: Veja estatísticas
- Produtos: Ajuste preços e ative/desative
- Perfil: Visualize informações
```

### Criar Usuário Manualmente no Supabase
Se não tiver email configurado:
```sql
-- 1. No Supabase Dashboard > Authentication > Users
-- Clique em "Add user" e crie com email da franqueada

-- 2. Vincule o user_id
UPDATE franqueadas 
SET user_id = 'uuid-do-usuario-criado',
    senha_definida = true
WHERE email = 'email@franqueada.com';
```

---

## ⚙️ Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Para operações admin
```

---

## 📈 Próximos Passos (Futuros)

### Sistema de Vendas
- [ ] Registrar vendas por franqueada
- [ ] Calcular comissões automaticamente
- [ ] Dashboards de vendas

### Sistema de Comissões
- [ ] Regras de comissão por produto
- [ ] Histórico de comissões
- [ ] Pagamentos e relatórios

### Melhorias de UX
- [ ] Upload de foto de perfil
- [ ] Edição de dados pessoais
- [ ] Notificações em tempo real
- [ ] Exportação de relatórios

### Site da Franqueada
- [ ] API pública para catálogo
- [ ] Filtrar produtos ativos da franqueada
- [ ] Exibir preços personalizados
- [ ] Carrinho e checkout

---

## 🐛 Troubleshooting

### Erro: "Usuário não vinculado a franqueada"
```sql
-- Verificar se user_id está correto
SELECT id, nome, email, user_id, status FROM franqueadas WHERE email = 'email@exemplo.com';

-- Se user_id estiver NULL, vincular manualmente
UPDATE franqueadas SET user_id = 'uuid-do-usuario' WHERE id = 'uuid-da-franqueada';
```

### Erro: "Cadastro não aprovado"
```sql
-- Verificar status
SELECT status FROM franqueadas WHERE email = 'email@exemplo.com';

-- Aprovar manualmente
UPDATE franqueadas SET status = 'aprovada', aprovado_em = NOW() WHERE email = 'email@exemplo.com';
```

### Produtos não aparecem
```sql
-- Verificar vinculações
SELECT COUNT(*) FROM produtos_franqueadas WHERE franqueada_id = 'uuid' AND ativo = true;

-- Se zero, vincular produtos ativos
INSERT INTO produtos_franqueadas (produto_id, franqueada_id, ativo, vinculado_em)
SELECT id, 'uuid-da-franqueada', true, NOW()
FROM produtos WHERE ativo = true;
```

---

## 📝 Notas Técnicas

- **Next.js 15:** App Router com Server/Client Components
- **Supabase Auth:** Gerenciamento de sessões
- **TypeScript:** Tipagem completa
- **Tailwind CSS:** Estilização com classes utilitárias
- **RLS:** Row Level Security para proteção de dados

---

## ✅ Checklist de Implementação

- [x] Migration 008 - Campos de autenticação
- [x] Migration 009 - Tabela de preços
- [x] Página de cadastro público
- [x] API de cadastro
- [x] Página de login
- [x] Layout protegido com sidebar
- [x] Dashboard com estatísticas
- [x] Página de produtos com ajuste de preços
- [x] Página de perfil
- [ ] Aplicar migrações no Supabase
- [ ] Configurar email (Supabase Auth)
- [ ] Testar fluxo completo
- [ ] Documentar APIs públicas para site

---

**Criado em:** 21 de outubro de 2025  
**Última atualização:** 21 de outubro de 2025  
**Status:** ✅ Implementação completa - Pronto para testes
