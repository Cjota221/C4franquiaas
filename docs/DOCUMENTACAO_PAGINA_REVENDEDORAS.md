# 📋 Documentação Completa: Página de Revendedoras (Admin)

## 📍 Localização
**Arquivo:** `app/admin/revendedoras/page.tsx`  
**Rota:** `/admin/revendedoras`  
**Linhas de código:** 777 linhas

---

## 🏗️ Estrutura Atual

### 1. Interface de Dados (`RevendedoraCompleta`)

```typescript
interface RevendedoraCompleta {
  // Dados básicos
  id: string;
  name: string;
  email: string;
  phone: string;
  store_name: string;
  slug: string;
  created_at: string;
  
  // Status
  status: 'pendente' | 'aprovada' | 'rejeitada';
  is_active: boolean;
  rejection_reason?: string;
  
  // Métricas
  total_products: number;      // Produtos vinculados ativos
  catalog_views: number;       // Visualizações do catálogo
  
  // Indicadores de Personalização
  has_logo: boolean;
  has_banner: boolean;
  has_colors: boolean;
  has_margin: boolean;         // Se tem produtos com margem
  
  // URLs de mídia
  primary_color: string | null;
  logo_url: string | null;
  banner_url: string | null;
  banner_mobile_url: string | null;
}
```

---

### 2. Estados (useState)

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `revendedoras` | `RevendedoraCompleta[]` | Lista completa de revendedoras |
| `filtradas` | `RevendedoraCompleta[]` | Lista após aplicar filtros |
| `loading` | `boolean` | Status de carregamento |
| `filtroStatus` | `FiltroStatus` | Filtro por status do cadastro |
| `filtroAtivacao` | `FiltroAtivacao` | Filtro por ativação/personalização |
| `busca` | `string` | Termo de busca |
| `expandido` | `string \| null` | ID da revendedora com ações expandidas |

---

### 3. Filtros Disponíveis

#### Status do Cadastro (`FiltroStatus`)
- `todas` - Mostrar todas
- `pendente` - Aguardando aprovação
- `aprovada` - Já aprovadas
- `rejeitada` - Foram rejeitadas

#### Filtros Rápidos (`FiltroAtivacao`)
- `todos` - Sem filtro adicional
- `ativas` - Contas ativas (`is_active = true`)
- `inativas` - Contas desativadas
- `personalizadas` - Tem logo OU banner OU cores
- `sem_personalizacao` - Não tem nada personalizado
- `sem_margem` - Não configurou margens (0 produtos)
- `completas` - Tem tudo (logo + banner + cores + margem + produtos)

---

### 4. Funções Principais

#### `carregarRevendedoras()`
- Busca todas revendedoras da tabela `resellers`
- Para cada uma, conta produtos vinculados em `reseller_products`
- Processa campos de personalização (logo, banner, cores)
- Ordena por data de criação (mais recente primeiro)

#### `aplicarFiltros()`
- Filtra por status
- Filtra por ativação/personalização
- Aplica busca por texto (nome, email, loja)

#### `aprovar(id)`
- Chama API `/api/admin/revendedoras/aprovar`
- Envia email de aprovação
- Atualiza lista

#### `rejeitar(id)`
- Pede motivo via `prompt()`
- Chama API com ação de rejeição
- Atualiza lista

#### `toggleAtivo(id, ativoAtual)`
- Alterna `is_active` diretamente no Supabase

#### `enviarWhatsAppBoasVindas(revendedora)`
- Abre WhatsApp Web com mensagem pré-formatada
- Inclui link do grupo das franqueadas

#### `verCatalogo(slug)`
- Abre o catálogo da revendedora em nova aba

---

### 5. Layout da UI

```
┌─────────────────────────────────────────────────────────────────┐
│  🏪 Gerenciar Revendedoras                                      │
│  Visão completa e eficiente para gerenciar suas franqueadas     │
├─────────────────────────────────────────────────────────────────┤
│  ESTATÍSTICAS (6 cards)                                         │
│  ┌────┐ ┌────────┐ ┌─────────┐ ┌──────┐ ┌───────────┐ ┌───────┐ │
│  │Total│ │Pendentes│ │Aprovadas│ │Ativas│ │Sem Person.│ │S/Marg.│ │
│  │ 50  │ │   5    │ │   40    │ │  35  │ │    10     │ │   8   │ │
│  └────┘ └────────┘ └─────────┘ └──────┘ └───────────┘ └───────┘ │
├─────────────────────────────────────────────────────────────────┤
│  FILTROS                                                        │
│  Status: [Todas] [Pendentes] [Aprovadas] [Rejeitadas]           │
│  Rápido: [Todos] [Ativas] [Inativas] [Completas] [Sem Person.]  │
│  🔍 [____________________busca___________________]              │
├─────────────────────────────────────────────────────────────────┤
│  TABELA                                                         │
│  ┌──────────────┬────────┬──────────────┬────┬─────┬──────────┐ │
│  │ Nome/Loja    │ Status │ Personalização│Prod│Views│  Ações   │ │
│  ├──────────────┼────────┼──────────────┼────┼─────┼──────────┤ │
│  │ Maria Silva  │PENDENTE│ ✓ ✕ ✕ ✕     │ 0  │  0  │ ▼ ℹ 🔗 💬│ │
│  │ Loja da Maria│        │Logo Ban Cor M│    │     │          │ │
│  ├──────────────┼────────┼──────────────┼────┼─────┼──────────┤ │
│  │ (expandido)  │ [Aprovar] [Rejeitar] 📧email 📱phone        │ │
│  │              │ 📸 Preview: Logo | Banner | Banner Mobile   │ │
│  └──────────────┴────────┴──────────────┴────┴─────┴──────────┘ │
│  Mostrando 10 de 50 revendedoras                                │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6. Colunas da Tabela

| Coluna | Descrição |
|--------|-----------|
| **Nome/Loja** | Nome da pessoa + nome da loja + data cadastro |
| **Status** | Badge de status (pendente/aprovada/rejeitada) + ativa/inativa |
| **Personalização** | 4 ícones: Logo, Banner, Cores, Margem (✓ ou ✕) |
| **Produtos** | Quantidade de produtos vinculados ativos |
| **Views** | Visualizações do catálogo |
| **Ações** | Botões: Expandir, Detalhes, Ver Catálogo, WhatsApp |

---

### 7. Ações Disponíveis

| Ação | Quando Aparece | O que Faz |
|------|----------------|-----------|
| **Aprovar** | Status = pendente | Aprova + envia email |
| **Rejeitar** | Status = pendente | Rejeita com motivo + email |
| **WhatsApp Boas-Vindas** | Status = aprovada | Abre WhatsApp com mensagem |
| **Ativar/Desativar** | Status = aprovada | Alterna is_active |
| **Ver Catálogo** | Tem slug | Abre catálogo em nova aba |
| **Ver Detalhes** | Sempre | Vai para `/admin/revendedoras/[id]` |

---

### 8. API Relacionada

**Endpoint:** `POST /api/admin/revendedoras/aprovar`

```typescript
// Body
{
  resellerId: string;
  action: 'aprovar' | 'rejeitar';
  motivo?: string;  // Obrigatório se rejeitar
}

// Response
{
  success: boolean;
  emailSent?: boolean;
  whatsappSent?: boolean;
  error?: string;
}
```

**O que a API faz:**
1. Atualiza status no banco
2. Envia email (aprovação ou rejeição)
3. Tenta enviar WhatsApp (se Z-API configurado)
4. Vincula produtos automaticamente (se aprovação)

---

## 🔴 Problemas/Limitações Atuais

### Performance
1. **N+1 Queries** - Para cada revendedora, faz query separada para contar produtos
2. **Sem paginação** - Carrega TODAS as revendedoras de uma vez
3. **Recarrega tudo** - Após qualquer ação, recarrega a lista inteira

### UX
1. **Prompt nativo** - Usa `prompt()` para motivo de rejeição (feio)
2. **Alert nativo** - Usa `alert()` para feedbacks (não profissional)
3. **Sem loading por item** - Ao aprovar/rejeitar, não mostra loading no botão
4. **Tabela não responsiva** - Em mobile fica apertada

### Funcionalidades Faltantes
1. ❌ Edição de dados da revendedora
2. ❌ Exportar lista (CSV/Excel)
3. ❌ Ordenação por colunas
4. ❌ Paginação
5. ❌ Bulk actions (aprovar várias de uma vez)
6. ❌ Histórico de ações
7. ❌ Filtro por data
8. ❌ Métricas de vendas por revendedora
9. ❌ Notificações em tempo real

---

## 🟢 Sugestões de Melhoria

### 1. **Otimização de Performance**

```typescript
// Usar uma única query com JOIN/COUNT
const { data } = await supabase
  .from('resellers')
  .select(`
    *,
    reseller_products(count)
  `)
  .order('created_at', { ascending: false })
  .range(0, 49);  // Paginação
```

### 2. **Paginação**

```typescript
const [pagina, setPagina] = useState(1);
const POR_PAGINA = 20;

// Na query
.range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1)
```

### 3. **Modal de Rejeição** (ao invés de prompt)

```tsx
<ModalRejeicao
  isOpen={showRejectModal}
  onClose={() => setShowRejectModal(false)}
  onConfirm={(motivo) => rejeitar(selectedId, motivo)}
/>
```

### 4. **Toast Notifications** (ao invés de alert)

```tsx
import { toast } from 'react-hot-toast';

toast.success('Revendedora aprovada com sucesso!');
toast.error('Erro ao processar');
```

### 5. **Ordenação por Colunas**

```typescript
const [ordenacao, setOrdenacao] = useState<{
  campo: string;
  direcao: 'asc' | 'desc';
}>({ campo: 'created_at', direcao: 'desc' });
```

### 6. **Bulk Actions**

```tsx
const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

async function aprovarSelecionadas() {
  for (const id of selecionadas) {
    await aprovar(id);
  }
}
```

### 7. **Exportar para CSV**

```typescript
function exportarCSV() {
  const csv = filtradas.map(r => 
    `${r.name},${r.email},${r.phone},${r.store_name},${r.status}`
  ).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  // Download...
}
```

### 8. **Filtro por Data**

```tsx
<input 
  type="date" 
  onChange={(e) => setDataInicio(e.target.value)} 
/>
<input 
  type="date" 
  onChange={(e) => setDataFim(e.target.value)} 
/>
```

### 9. **Métricas de Vendas**

```typescript
// Adicionar na interface
total_vendas: number;
valor_total_vendas: number;
ultimo_pedido: string | null;
```

---

## 📁 Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `app/admin/revendedoras/page.tsx` | Página principal (esta) |
| `app/admin/revendedoras/[id]/page.tsx` | Detalhes de uma revendedora |
| `app/api/admin/revendedoras/aprovar/route.ts` | API de aprovação/rejeição |
| `lib/zapi-whatsapp.ts` | Cliente WhatsApp Z-API |

---

## 🎯 Prioridade de Melhorias

### Alta Prioridade (Impacto imediato)
1. ⭐ Paginação (performance)
2. ⭐ Toast notifications (UX)
3. ⭐ Modal de rejeição (UX)
4. ⭐ Loading nos botões (UX)

### Média Prioridade (Nice to have)
5. Ordenação por colunas
6. Exportar CSV
7. Bulk actions
8. Filtro por data

### Baixa Prioridade (Futuro)
9. Métricas de vendas
10. Histórico de ações
11. Notificações em tempo real

---

## 💡 Proposta de Nova Estrutura

Se você quiser, posso criar uma versão otimizada da página com:

1. **Componentes separados** (melhor organização)
2. **Custom hooks** (lógica reutilizável)
3. **Paginação** (performance)
4. **Modais** (UX melhor)
5. **Toast notifications** (feedback profissional)
6. **Skeleton loading** (melhor percepção de velocidade)

Me avise se quiser que eu implemente alguma dessas melhorias! 🚀
