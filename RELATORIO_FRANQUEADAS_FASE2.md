# 📊 RELATÓRIO COMPLETO: Sistema de Franqueadas - Fase 2

**Data:** 08/01/2026  
**Objetivo:** Análise detalhada da estrutura atual do módulo de Franqueadas

---

## 📋 ÍNDICE

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Estrutura do Banco de Dados](#2-estrutura-do-banco-de-dados)
3. [Fluxo de Funcionamento](#3-fluxo-de-funcionamento)
4. [Páginas e Funcionalidades](#4-páginas-e-funcionalidades)
5. [APIs Disponíveis](#5-apis-disponíveis)
6. [Componentes Criados](#6-componentes-criados)
7. [O Que Já Foi Feito](#7-o-que-já-foi-feito)
8. [O Que Falta Fazer](#8-o-que-falta-fazer)
9. [Comparação: Revendedoras vs Franqueadas](#9-comparação-revendedoras-vs-franqueadas)
10. [Próximos Passos Sugeridos](#10-próximos-passos-sugeridos)

---

## 1. VISÃO GERAL DO SISTEMA

### Conceito

O sistema de **Franqueadas** foi projetado para permitir que parceiras (franqueadas) tenham sua própria loja online vinculada ao catálogo central da C4 Franquias. Diferente das **Revendedoras** (que usam links de afiliados), as Franqueadas têm:

- **Loja própria** com domínio personalizado (`dominio.c4franquias.com.br`)
- **Controle de preços** (ajuste de margem por produto)
- **Customização visual** completa (cores, logo, banner, etc.)
- **Sistema de comissões** com PIX
- **Gestão de estoque** sincronizada com admin

### Status Atual

| Item                 | Status              |
| -------------------- | ------------------- |
| Tabelas no Banco     | ✅ Criadas          |
| Sistema de Login     | ✅ Funcionando      |
| Painel Dashboard     | ✅ Funcionando      |
| Gestão de Produtos   | ✅ Funcionando      |
| Customização Loja    | ✅ Funcionando      |
| Sistema de Vendas    | ⚠️ Parcial          |
| Sistema de Comissões | ⚠️ Parcial          |
| Loja Pública         | ❌ Não implementada |
| Checkout/Pagamento   | ❌ Não implementado |

---

## 2. ESTRUTURA DO BANCO DE DADOS

### 2.1 Tabela Principal: `franqueadas`

```sql
CREATE TABLE franqueadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  cpf VARCHAR(14),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'aprovada', 'rejeitada'
  user_id UUID,                          -- Vínculo com auth.users
  criado_em TIMESTAMP DEFAULT NOW(),
  aprovado_em TIMESTAMP,
  aprovado_por UUID,
  observacoes TEXT,
  vendas_total DECIMAL(10,2) DEFAULT 0,
  comissao_acumulada DECIMAL(10,2) DEFAULT 0,
  ultimo_acesso TIMESTAMP,
  senha_definida BOOLEAN DEFAULT false
);
```

### 2.2 Tabela: `lojas` (Loja da Franqueada)

```sql
CREATE TABLE lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franqueada_id UUID REFERENCES franqueadas(id),
  nome VARCHAR(255) NOT NULL,
  dominio VARCHAR(255) UNIQUE NOT NULL,  -- Ex: "mariacosmeticos"
  logo TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#DB1472',
  cor_secundaria VARCHAR(7) DEFAULT '#F8B81F',
  ativo BOOLEAN DEFAULT true,
  produtos_ativos INTEGER DEFAULT 0,

  -- Campos de personalização (migration 013)
  descricao TEXT,
  slogan TEXT,
  banner_hero TEXT,
  texto_hero TEXT,
  subtexto_hero TEXT,
  favicon TEXT,
  whatsapp VARCHAR(20),
  instagram VARCHAR(255),
  facebook VARCHAR(255),
  email_contato VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  meta_title TEXT,
  meta_description TEXT,
  google_analytics TEXT,
  facebook_pixel TEXT,
  fonte_principal VARCHAR(50),
  fonte_secundaria VARCHAR(50),
  cor_texto VARCHAR(7),
  cor_fundo VARCHAR(7),
  cor_botao VARCHAR(7),
  cor_botao_hover VARCHAR(7),
  cor_link VARCHAR(7),
  mostrar_estoque BOOLEAN DEFAULT true,
  mostrar_codigo_barras BOOLEAN DEFAULT false,
  permitir_carrinho BOOLEAN DEFAULT true,
  modo_catalogo BOOLEAN DEFAULT false,
  mensagem_whatsapp TEXT
);
```

### 2.3 Tabela: `produtos_franqueadas` (Vinculação de Produtos)

```sql
CREATE TABLE produtos_franqueadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id INTEGER REFERENCES produtos(id),
  franqueada_id UUID REFERENCES franqueadas(id),
  ativo BOOLEAN DEFAULT true,
  vinculado_em TIMESTAMP DEFAULT NOW(),
  desvinculado_em TIMESTAMP,
  UNIQUE(produto_id, franqueada_id)
);
```

### 2.4 Tabela: `produtos_franqueadas_precos` (Preços Personalizados)

```sql
CREATE TABLE produtos_franqueadas_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_franqueada_id UUID REFERENCES produtos_franqueadas(id),
  preco_base DECIMAL(10,2) NOT NULL,
  ajuste_tipo VARCHAR(20),        -- 'fixo' ou 'porcentagem'
  ajuste_valor DECIMAL(10,2),     -- Valor do ajuste
  preco_final DECIMAL(10,2) NOT NULL,
  ativo_no_site BOOLEAN DEFAULT false,  -- Controle de visibilidade
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(produto_franqueada_id)
);
```

### 2.5 Tabela: `franqueadas_dados_pagamento` (PIX)

```sql
CREATE TABLE franqueadas_dados_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franqueada_id UUID REFERENCES auth.users(id) UNIQUE,
  tipo_chave_pix VARCHAR(20),  -- 'CPF', 'CNPJ', 'EMAIL', 'CELULAR', 'ALEATORIA'
  chave_pix VARCHAR(255) NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  cidade VARCHAR(100) DEFAULT 'Sao Paulo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.6 Tabela: `vendas` (Vendas da Franqueada)

```sql
-- Campos relevantes para franqueadas:
ALTER TABLE vendas ADD COLUMN franqueada_id UUID;
ALTER TABLE vendas ADD COLUMN comissao_franqueada DECIMAL(10,2);
ALTER TABLE vendas ADD COLUMN status_comissao VARCHAR(20) DEFAULT 'pendente';
ALTER TABLE vendas ADD COLUMN data_pagamento_comissao TIMESTAMP;
ALTER TABLE vendas ADD COLUMN pago_por UUID;
```

### 2.7 Tabela: `pagamentos_comissao` (Histórico de Pagamentos)

```sql
CREATE TABLE pagamentos_comissao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franqueada_id UUID NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  quantidade_vendas INTEGER NOT NULL,
  vendas_ids UUID[] NOT NULL,
  chave_pix_usada VARCHAR(255) NOT NULL,
  tipo_chave_pix VARCHAR(20) NOT NULL,
  payload_pix TEXT NOT NULL,
  pago_por UUID NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Diagrama de Relacionamentos

```
┌─────────────────┐
│   auth.users    │
│   (Supabase)    │
└────────┬────────┘
         │ user_id
         ▼
┌─────────────────┐      ┌─────────────────┐
│   franqueadas   │──1:1─│     lojas       │
└────────┬────────┘      └─────────────────┘
         │ franqueada_id
         ▼
┌─────────────────┐      ┌─────────────────┐
│ produtos_franq  │──1:1─│ prods_franq_    │
│    ueadas       │      │    precos       │
└────────┬────────┘      └─────────────────┘
         │ produto_id
         ▼
┌─────────────────┐
│    produtos     │
│   (catálogo)    │
└─────────────────┘
```

---

## 3. FLUXO DE FUNCIONAMENTO

### 3.1 Cadastro de Nova Franqueada

```
1. Acessa: /cadastro/franqueada
2. Preenche formulário (nome, email, CPF, cidade, estado, senha)
3. API cria usuário no Supabase Auth
4. API insere registro em `franqueadas` com status='pendente'
5. Admin recebe notificação (a implementar)
```

### 3.2 Aprovação pelo Admin

```
1. Admin acessa: /admin/franqueadas
2. Vê lista de franqueadas pendentes
3. Clica em "Aprovar"
4. Sistema:
   - Atualiza status para 'aprovada'
   - Cria registro na tabela `lojas` com domínio baseado no nome
   - Vincula TODOS os produtos ativos à franqueada
   - Cria registros em produtos_franqueadas e produtos_franqueadas_precos
```

### 3.3 Acesso da Franqueada

```
1. Acessa: /franqueada/login
2. Autentica com email/senha
3. Sistema verifica:
   - Se user_id está vinculado a franqueada
   - Se status = 'aprovada'
4. Redireciona para: /franqueada/dashboard
```

### 3.4 Gestão de Produtos

```
1. Franqueada acessa: /franqueada/produtos
2. Vê TODOS os produtos vinculados
3. Pode:
   - Ativar/desativar no site (ativo_no_site)
   - Definir margem de lucro (ajuste_tipo + ajuste_valor)
   - Ver estoque em tempo real
```

### 3.5 Customização da Loja

```
1. Franqueada acessa: /franqueada/loja ou /franqueada/customizacoes
2. Pode personalizar:
   - Nome e logo
   - Cores (primária, secundária, botões, links)
   - Banner hero
   - Redes sociais
   - SEO (meta tags)
   - Google Analytics / Facebook Pixel
   - Configurações (mostrar estoque, modo catálogo, etc.)
```

### 3.6 Fluxo de Venda (A IMPLEMENTAR)

```
1. Cliente acessa: dominio.c4franquias.com.br
2. Navega no catálogo da franqueada
3. Adiciona produtos ao carrinho
4. Faz checkout (Mercado Pago)
5. Sistema registra venda em `vendas`
6. Calcula comissão da franqueada
7. Admin paga comissão via PIX
```

---

## 4. PÁGINAS E FUNCIONALIDADES

### 4.1 Painel da Franqueada (`/franqueada/*`)

| Página        | Caminho                     | Status | Descrição                        |
| ------------- | --------------------------- | ------ | -------------------------------- |
| Layout        | `/franqueada/layout.tsx`    | ✅     | Layout com sidebar, autenticação |
| Login         | `/franqueada/login`         | ✅     | Tela de login                    |
| Dashboard     | `/franqueada/dashboard`     | ✅     | Estatísticas gerais              |
| Produtos      | `/franqueada/produtos`      | ✅     | Gestão de produtos/preços        |
| Minha Loja    | `/franqueada/loja`          | ✅     | Personalização básica            |
| Customizações | `/franqueada/customizacoes` | ✅     | Personalização avançada          |
| Comissões     | `/franqueada/comissoes`     | ⚠️     | Visualização de comissões        |
| Vendas        | `/franqueada/vendas`        | ⚠️     | Lista de vendas                  |
| Perfil        | `/franqueada/perfil`        | ✅     | Dados pessoais + PIX             |

### 4.2 Admin - Gestão de Franqueadas (`/admin/franqueadas/*`)

| Página       | Caminho                                | Status | Descrição                 |
| ------------ | -------------------------------------- | ------ | ------------------------- |
| Lista        | `/admin/franqueadas`                   | ✅     | Lista com filtros         |
| Customização | `/admin/franqueadas/[id]/customizacao` | ✅     | Editar loja da franqueada |

### 4.3 Loja Pública da Franqueada (A IMPLEMENTAR)

| Página   | Caminho                   | Status | Descrição              |
| -------- | ------------------------- | ------ | ---------------------- |
| Home     | `/[dominio]`              | ❌     | Página inicial da loja |
| Catálogo | `/[dominio]/catalogo`     | ❌     | Lista de produtos      |
| Produto  | `/[dominio]/produto/[id]` | ❌     | Detalhes do produto    |
| Carrinho | `/[dominio]/carrinho`     | ❌     | Carrinho de compras    |
| Checkout | `/[dominio]/checkout`     | ❌     | Pagamento              |
| Sucesso  | `/[dominio]/sucesso`      | ❌     | Confirmação            |

---

## 5. APIS DISPONÍVEIS

### 5.1 APIs de Cadastro

```
POST /api/cadastro/franqueada
- Cadastra nova franqueada
- Cria usuário no Supabase Auth
- Status: ✅ Funcionando
```

### 5.2 APIs Admin

```
GET  /api/admin/franqueadas/list?status=todos|pendente|aprovada|rejeitada
- Lista todas franqueadas com suas lojas
- Status: ✅ Funcionando

POST /api/admin/franqueadas/action
- Actions: aprovar, rejeitar, toggle-loja
- Vincula produtos automaticamente na aprovação
- Status: ✅ Funcionando

GET/POST /api/admin/franqueadas/customizacao
- Edita customização da loja pelo admin
- Status: ✅ Funcionando
```

### 5.3 APIs da Franqueada

```
GET  /api/franqueada/loja
- Retorna dados da loja da franqueada logada
- Status: ✅ Funcionando

POST /api/franqueada/loja/update
- Atualiza dados da loja
- Status: ✅ Funcionando

POST /api/franqueada/loja/upload-logo
- Upload de logo para Supabase Storage
- Status: ✅ Funcionando
```

### 5.4 APIs da Loja Pública (A IMPLEMENTAR)

```
GET  /api/loja/[dominio]/produtos
- Lista produtos da loja pública
- Status: ❌ Não implementado

GET  /api/loja/[dominio]/produto/[id]
- Detalhes de um produto
- Status: ❌ Não implementado

POST /api/loja/[dominio]/carrinho
- Adiciona ao carrinho
- Status: ❌ Não implementado

POST /api/loja/[dominio]/checkout
- Processa pagamento
- Status: ❌ Não implementado
```

---

## 6. COMPONENTES CRIADOS

### 6.1 Componentes do Painel (`/components/franqueada/`)

```
├── TabelaProdutosFranqueada.tsx    ✅ Tabela de produtos com ações
├── FiltrosProdutosFranqueada.tsx   ✅ Filtros da lista de produtos
├── FormDadosPagamento.tsx          ✅ Formulário de dados PIX
├── ResumoComissoes.tsx             ✅ Cards de resumo de comissões
├── TabelaMinhasVendas.tsx          ✅ Lista de vendas
├── MercadoPagoConfigForm.tsx       ✅ Config do Mercado Pago
├── MercadoPagoConfigWrapper.tsx    ✅ Wrapper do MP
└── customizacoes/
    ├── CustomizacoesHeader.tsx     ✅ Header e menu
    ├── CustomizacoesPaginaInicial.tsx ✅ Hero e banners
    ├── CustomizacoesProdutos.tsx   ✅ Listagem de produtos
    ├── CustomizacoesCarrinho.tsx   ✅ Carrinho
    ├── CustomizacoesComunicacao.tsx ✅ WhatsApp, redes sociais
    ├── CustomizacoesPromocoes.tsx  ✅ Promoções
    ├── CustomizacoesLogo.tsx       ✅ Logo customizado
    └── CustomizacoesAvancado.tsx   ✅ SEO, analytics
```

### 6.2 Componente de Sidebar

```
├── SidebarFranqueada.tsx           ✅ Menu lateral do painel
```

### 6.3 Types

```
└── types/
    └── financeiro.ts               ✅ Tipos do módulo financeiro
```

---

## 7. O QUE JÁ FOI FEITO ✅

### Banco de Dados

- [x] Tabela `franqueadas` criada
- [x] Tabela `lojas` criada
- [x] Tabela `produtos_franqueadas` criada
- [x] Tabela `produtos_franqueadas_precos` criada
- [x] Tabela `franqueadas_dados_pagamento` criada
- [x] Tabela `pagamentos_comissao` criada
- [x] Campos de comissão na tabela `vendas`
- [x] Índices de performance
- [x] Políticas RLS

### Autenticação

- [x] Login de franqueada com Supabase Auth
- [x] Vinculação user_id ↔ franqueada
- [x] Layout com verificação de autenticação
- [x] Cache de autenticação para performance
- [x] Logout

### Painel Administrativo

- [x] Lista de franqueadas com filtros
- [x] Aprovação/Rejeição de franqueadas
- [x] Vinculação automática de produtos na aprovação
- [x] Toggle ativar/desativar loja
- [x] Edição de customização pelo admin

### Painel da Franqueada

- [x] Dashboard com estatísticas
- [x] Lista de produtos vinculados
- [x] Ativar/desativar produtos no site
- [x] Definir margem de lucro por produto
- [x] Filtros avançados de produtos
- [x] Ações em massa (ativar/desativar vários)
- [x] Personalização completa da loja
- [x] Upload de logo
- [x] Cadastro de chave PIX
- [x] Visualização de vendas
- [x] Visualização de comissões

### Sincronização

- [x] Trigger para desativar produto quando estoque = 0
- [x] Trigger para reativar quando estoque > 0
- [x] Sincronização de preço base

---

## 8. O QUE FALTA FAZER ❌

### 🔴 Alta Prioridade

#### 8.1 Loja Pública (Front-end)

```
❌ Rota dinâmica: /[dominio]
❌ Página inicial com hero banner
❌ Catálogo de produtos
❌ Página de detalhes do produto
❌ Carrinho de compras
❌ Checkout com Mercado Pago
❌ Página de sucesso/erro
❌ Responsividade mobile
```

#### 8.2 Sistema de Vendas

```
❌ Integração Mercado Pago (split payment ou checkout padrão)
❌ Webhook de confirmação de pagamento
❌ Criação automática de registro em vendas
❌ Cálculo automático de comissão
❌ Atualização de estoque pós-venda
```

#### 8.3 Sistema de Comissões

```
❌ Página admin para pagar comissões
❌ Geração de QR Code PIX
❌ Marcar vendas como "paga"
❌ Histórico de pagamentos
❌ Relatórios de comissões
```

### 🟡 Média Prioridade

#### 8.4 Melhorias no Painel

```
❌ Notificações em tempo real
❌ Dashboard mais completo (gráficos)
❌ Relatórios de vendas
❌ Exportar dados (CSV/PDF)
```

#### 8.5 Funcionalidades Extras

```
❌ Sistema de cupons por franqueada
❌ Promoções por franqueada
❌ Categorias customizadas
❌ Ordenação de produtos
```

### 🟢 Baixa Prioridade

#### 8.6 Otimizações

```
❌ Cache de catálogo
❌ ISR (Incremental Static Regeneration)
❌ Otimização de imagens
❌ PWA para mobile
```

---

## 9. COMPARAÇÃO: REVENDEDORAS vs FRANQUEADAS

| Característica        | Revendedoras     | Franqueadas             |
| --------------------- | ---------------- | ----------------------- |
| **Modelo**            | Link de afiliado | Loja própria            |
| **Domínio**           | Mesmo site       | `dominio.c4.com.br`     |
| **Catálogo**          | Compartilhado    | Personalizado           |
| **Preços**            | Fixos            | Margem ajustável        |
| **Visual**            | Padrão           | Totalmente customizável |
| **Checkout**          | Centralizado     | Na loja da franqueada   |
| **Comissão**          | % sobre link     | % sobre vendas da loja  |
| **Complexidade**      | Baixa            | Alta                    |
| **Status no Sistema** | ✅ Completo      | ⚠️ Parcial              |

---

## 10. PRÓXIMOS PASSOS SUGERIDOS

### Fase 2.1 - Loja Pública (2-3 semanas)

1. Criar rota dinâmica `/[dominio]`
2. Implementar layout da loja pública
3. Criar páginas de catálogo e produto
4. Implementar carrinho (localStorage)
5. Testar em ambiente de staging

### Fase 2.2 - Checkout e Pagamentos (1-2 semanas)

1. Configurar Mercado Pago SDK
2. Implementar checkout transparente
3. Criar webhook de notificação
4. Registrar vendas no banco
5. Testar fluxo completo

### Fase 2.3 - Sistema de Comissões (1 semana)

1. Criar painel admin de comissões
2. Implementar geração de PIX
3. Fluxo de pagamento de comissões
4. Relatórios

### Fase 2.4 - Refinamentos (Contínuo)

1. Melhorar UX
2. Adicionar funcionalidades extras
3. Otimizar performance
4. Monitoramento e logs

---

## 📁 ESTRUTURA DE ARQUIVOS

```
app/
├── franqueada/
│   ├── layout.tsx              ✅
│   ├── login/page.tsx          ✅
│   ├── dashboard/page.tsx      ✅
│   ├── produtos/page.tsx       ✅
│   ├── loja/page.tsx           ✅
│   ├── customizacoes/page.tsx  ✅
│   ├── comissoes/page.tsx      ✅
│   ├── vendas/page.tsx         ✅
│   └── perfil/page.tsx         ✅
├── admin/
│   └── franqueadas/
│       ├── page.tsx            ✅
│       └── [id]/customizacao/page.tsx ✅
├── cadastro/
│   └── franqueada/page.tsx     ✅
├── api/
│   ├── cadastro/franqueada/route.ts    ✅
│   ├── franqueada/loja/
│   │   ├── route.ts            ✅
│   │   ├── update/route.ts     ✅
│   │   └── upload-logo/route.ts ✅
│   └── admin/franqueadas/
│       ├── list/route.ts       ✅
│       ├── action/route.ts     ✅
│       └── customizacao/route.ts ✅
├── [dominio]/                  ❌ A CRIAR
│   ├── page.tsx                ❌
│   ├── catalogo/page.tsx       ❌
│   ├── produto/[id]/page.tsx   ❌
│   ├── carrinho/page.tsx       ❌
│   └── checkout/page.tsx       ❌

components/
├── SidebarFranqueada.tsx       ✅
└── franqueada/
    ├── TabelaProdutosFranqueada.tsx    ✅
    ├── FiltrosProdutosFranqueada.tsx   ✅
    ├── FormDadosPagamento.tsx          ✅
    ├── ResumoComissoes.tsx             ✅
    ├── TabelaMinhasVendas.tsx          ✅
    └── customizacoes/                  ✅ (7 arquivos)

migrations/
├── 007_add_franqueadas_system.sql      ✅
├── 008_add_user_id_to_franqueadas.sql  ✅
├── 009_add_franqueadas_precos.sql      ✅
├── 010_unify_franqueadas_structure.sql ✅
├── 013_add_personalizacao_loja.sql     ✅
├── 023_modulo_financeiro.sql           ✅
└── 035_add_sync_triggers.sql           ✅
```

---

## 📝 CONCLUSÃO

O sistema de Franqueadas está **60% completo**. A estrutura de banco de dados está sólida, o painel administrativo e o painel da franqueada estão funcionais.

**O que falta é a "ponta" do sistema**: a loja pública onde os clientes podem comprar, o checkout com pagamento, e o sistema de comissões. Essas são as próximas etapas para completar a Fase 2.

---

_Relatório gerado em 08/01/2026 por GitHub Copilot_
