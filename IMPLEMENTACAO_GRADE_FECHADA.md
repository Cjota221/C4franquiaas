# 📦 Módulo "Painel de Encomendas por Grade Fechada"

## ✅ O QUE JÁ FOI IMPLEMENTADO

### 1. Estrutura de Banco de Dados ✅

**Arquivos criados:**

- `/migrations/100_create_grade_fechada_system.sql` - Tabelas principais
- `/migrations/101_create_storage_grade_fechada.sql` - Storage bucket para imagens

**Tabelas criadas:**

- `grade_fechada_produtos` - Produtos disponíveis para venda por grade
- `grade_fechada_pedidos` - Pedidos de encomenda
- `grade_fechada_carrinhos` - Carrinhos abandonados
- `grade_fechada_configuracoes` - Configurações do sistema

**Para aplicar:**

```bash
# Executar no Supabase SQL Editor:
1. Abrir migration 100 e executar
2. Abrir migration 101 e executar
```

### 2. Types TypeScript ✅

**Arquivo:** `/types/grade-fechada.ts`

- Interfaces completas para todos os tipos de dados
- Enums para status de pedidos e carrinhos
- Types auxiliares para grades e numerações

### 3. APIs Backend ✅

#### APIs Administrativas (requerem autenticação):

- `GET/POST /api/admin/grade-fechada/produtos` - Listar/criar produtos
- `GET/PUT/DELETE /api/admin/grade-fechada/produtos/[id]` - CRUD de produto específico
- `GET/POST /api/admin/grade-fechada/pedidos` - Listar/criar pedidos
- `GET/PUT/DELETE /api/admin/grade-fechada/pedidos/[id]` - CRUD de pedido
- `GET/POST /api/admin/grade-fechada/carrinhos` - Listar/salvar carrinhos
- `GET/PUT /api/admin/grade-fechada/configuracoes` - Obter/atualizar configs

#### APIs Públicas (sem autenticação):

- `GET /api/encomendas/produtos` - Listar produtos ativos
- `GET /api/encomendas/produtos/[id]` - Obter produto específico
- `GET /api/encomendas/configuracoes` - Obter configurações públicas
- `POST/PUT /api/encomendas/carrinho` - Salvar/atualizar carrinho
- `POST /api/encomendas/finalizar` - Criar pedido

### 4. Painel Administrativo ✅

#### Menu adicionado no Sidebar:

- Novo item "Encomendas (Grade)" com ícone PackageOpen

#### Páginas criadas:

- `/admin/encomendas` - Dashboard principal do módulo ✅
- `/admin/encomendas/produtos` - Lista de produtos com filtros ✅
- `/admin/encomendas/produtos/novo` - Formulário de cadastro completo ✅
- `/admin/encomendas/produtos/[id]` - Edição de produto ✅
- `/admin/encomendas/configuracoes` - Configurações do sistema ✅

**Funcionalidades implementadas:**

- Upload múltiplo de imagens
- Gestão de cores disponíveis
- Configuração de tipos de grade (meia/completa)
- Definição de preços por tipo de grade
- Dimensões e peso para cálculo de frete
- Ativação/desativação de produtos
- Ordenação de produtos

---

## 🚧 O QUE AINDA PRECISA SER IMPLEMENTADO

### 1. Completar Páginas Administrativas

#### Página de Pedidos (`/admin/encomendas/pedidos/page.tsx`)

Criar página similar à de produtos com:

- Listagem de pedidos com filtros por status
- Busca por número de pedido, nome ou telefone
- Cards com informações resumidas do pedido
- Visualização detalhada dos itens e numerações
- Mudança de status do pedido
- Botão para entrar em contato via WhatsApp

#### Página de Carrinhos Abandonados (`/admin/encomendas/carrinhos/page.tsx`)

Criar página com:

- Listagem de carrinhos não convertidos
- Informações de contato (quando disponíveis)
- Valor total do carrinho
- Data de criação e expiração
- Botão para converter em pedido manualmente
- Botão para contato via WhatsApp

### 2. Site Público de Encomendas

Criar nova rota `/encomendas` (site público sem autenticação):

#### Estrutura de pastas sugerida:

```
app/
  encomendas/
    layout.tsx          # Layout do site público
    page.tsx            # Catálogo de produtos
    produto/
      [id]/
        page.tsx        # Página de detalhes e montagem
    carrinho/
      page.tsx          # Carrinho de compras
    components/
      Header.tsx        # Cabeçalho com logo e carrinho
      ProdutoCard.tsx   # Card de produto
      MontadorGrade.tsx # Componente de montagem de grade
      CarrinhoItem.tsx  # Item do carrinho
```

#### 2.1. Layout e Header (`/encomendas/layout.tsx`)

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function EncomendasLayout({ children }) {
  const [config, setConfig] = useState(null);
  const [itemsCarrinho, setItemsCarrinho] = useState(0);

  useEffect(() => {
    // Buscar configurações
    fetch('/api/encomendas/configuracoes')
      .then((res) => res.json())
      .then((data) => setConfig(data.data));

    // Buscar itens do carrinho do localStorage
    const carrinho = JSON.parse(localStorage.getItem('carrinho_encomendas') || '[]');
    setItemsCarrinho(carrinho.length);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Mensagem do topo */}
          {config?.mensagem_topo && (
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-center py-2 text-sm">
              {config.mensagem_topo}
            </div>
          )}

          {/* Navegação */}
          <div className="flex items-center justify-between py-4">
            <Link href="/encomendas" className="text-2xl font-bold text-pink-600">
              Encomendas Grade Fechada
            </Link>

            <Link href="/encomendas/carrinho" className="relative">
              <ShoppingCart className="w-8 h-8 text-gray-700" />
              {itemsCarrinho > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {itemsCarrinho}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>© 2026 Sistema de Encomendas por Grade Fechada</p>
        </div>
      </footer>
    </div>
  );
}
```

#### 2.2. Catálogo de Produtos (`/encomendas/page.tsx`)

- Grid de produtos ativos
- Imagem principal de cada produto
- Nome, código e preços
- Botão "Ver detalhes e montar grade"
- Filtros por cor (opcional)

#### 2.3. Página do Produto (`/encomendas/produto/[id]/page.tsx`)

**Componentes principais:**

1. **Galeria de Imagens**

   - Imagem principal grande
   - Miniaturas clicáveis

2. **Informações do Produto**

   - Nome, código, descrição
   - Observações (ex: aceita personalização)

3. **Montador de Grade** (componente mais importante)
   - Seleção de tipo de grade (meia/completa)
   - Input de quantidade de grades
   - Seleção de cor (dropdown)
   - **Tabela de numerações** com inputs para quantidade de cada número
   - Validação em tempo real:
     - Soma das numerações deve bater com o tipo de grade escolhido
     - Mínimo de 2 grades do mesmo modelo
   - Cálculo automático do valor total
   - Botão "Adicionar ao Carrinho"

**Exemplo do Montador:**

```tsx
interface MontadorGradeProps {
  produto: GradeFechadaProduto;
}

export function MontadorGrade({ produto }: MontadorGradeProps) {
  const [tipoGrade, setTipoGrade] = useState<'meia' | 'completa'>('completa');
  const [quantidadeGrades, setQuantidadeGrades] = useState(2);
  const [cor, setCor] = useState('');
  const [numeracoes, setNumeracoes] = useState<Record<string, number>>({});

  // Calcular total de pares na grade
  const totalPares = Object.values(numeracoes).reduce((sum, n) => sum + n, 0);
  const paresPorGrade = tipoGrade === 'meia' ? 6 : 12; // Ajustar conforme regra de negócio
  const paresEsperados = quantidadeGrades * paresPorGrade;
  const isValid = totalPares === paresEsperados;

  return (
    <div className="bg-white rounded-lg p-6 border">
      <h3 className="font-bold text-xl mb-4">Monte sua Encomenda</h3>

      {/* Tipo de Grade */}
      <div className="mb-4">
        <label className="font-medium mb-2 block">Tipo de Grade:</label>
        <div className="flex gap-4">
          {produto.permite_meia_grade && (
            <button
              onClick={() => setTipoGrade('meia')}
              className={`px-4 py-2 rounded ${
                tipoGrade === 'meia' ? 'bg-pink-500 text-white' : 'bg-gray-200'
              }`}
            >
              Meia Grade - R$ {produto.preco_meia_grade}
            </button>
          )}
          {produto.permite_grade_completa && (
            <button
              onClick={() => setTipoGrade('completa')}
              className={`px-4 py-2 rounded ${
                tipoGrade === 'completa' ? 'bg-pink-500 text-white' : 'bg-gray-200'
              }`}
            >
              Grade Completa - R$ {produto.preco_grade_completa}
            </button>
          )}
        </div>
      </div>

      {/* Quantidade de Grades */}
      <div className="mb-4">
        <label className="font-medium mb-2 block">Quantidade de Grades:</label>
        <input
          type="number"
          min="2"
          value={quantidadeGrades}
          onChange={(e) => setQuantidadeGrades(parseInt(e.target.value))}
          className="border rounded px-4 py-2 w-32"
        />
        <p className="text-sm text-gray-600 mt-1">Mínimo: 2 grades</p>
      </div>

      {/* Cor */}
      <div className="mb-4">
        <label className="font-medium mb-2 block">Cor:</label>
        <select
          value={cor}
          onChange={(e) => setCor(e.target.value)}
          className="border rounded px-4 py-2 w-full"
        >
          <option value="">Selecione uma cor</option>
          {produto.cores_disponiveis.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Montagem de Numerações */}
      <div className="mb-4">
        <label className="font-medium mb-2 block">
          Montagem da Grade (total esperado: {paresEsperados} pares):
        </label>
        <div className="grid grid-cols-5 gap-2">
          {['33', '34', '35', '36', '37', '38', '39', '40', '41', '42'].map((num) => (
            <div key={num}>
              <label className="text-sm text-gray-600 block mb-1">Nº {num}</label>
              <input
                type="number"
                min="0"
                value={numeracoes[num] || 0}
                onChange={(e) =>
                  setNumeracoes((prev) => ({
                    ...prev,
                    [num]: parseInt(e.target.value) || 0,
                  }))
                }
                className="border rounded px-2 py-1 w-full text-center"
              />
            </div>
          ))}
        </div>
        <p className={`text-sm mt-2 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
          Total de pares: {totalPares} / {paresEsperados}
          {!isValid && ' - A soma deve ser exatamente ' + paresEsperados}
        </p>
      </div>

      {/* Valor Total */}
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p className="text-lg font-bold">Valor Total: R$ {calcularTotal()}</p>
      </div>

      {/* Botão Adicionar */}
      <button
        onClick={handleAdicionarCarrinho}
        disabled={!isValid || !cor}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
      >
        Adicionar ao Carrinho
      </button>
    </div>
  );
}
```

#### 2.4. Carrinho (`/encomendas/carrinho/page.tsx`)

- Listagem de itens adicionados
- Exibição detalhada de cada item (produto, tipo de grade, cor, numerações)
- Valor total do pedido
- Botão "Remover item"
- Formulário simples de dados (nome, telefone, email - opcional)
- Botão "Finalizar Pedido pelo WhatsApp"

#### 2.5. Integração WhatsApp

Ao clicar em "Finalizar pelo WhatsApp":

1. Salvar carrinho no banco (se tiver dados de contato)
2. Criar pedido com status "orcamento"
3. Gerar mensagem formatada
4. Abrir WhatsApp com link `wa.me`

**Exemplo de mensagem:**

```
🛒 *PEDIDO DE ENCOMENDA - GRADE FECHADA*

*Produto:* Sandália Confort Premium
*Código:* SAND-001

*Tipo:* Grade Completa
*Quantidade:* 3 grades
*Cor:* Rosa

*Numerações:*
• Nº 33: 2 pares
• Nº 34: 4 pares
• Nº 35: 6 pares
• Nº 36: 8 pares
• Nº 37: 6 pares
• Nº 38: 4 pares
• Nº 39: 2 pares
• Nº 40: 2 pares
• Nº 41: 1 par
• Nº 42: 1 par

*Valor Total:* R$ 450,00

---

📦 *Prazo de produção:* 15-20 dias úteis
💰 *Pedido mínimo:* 2 grades

*Número do Pedido:* GF20260114-0001
```

**Implementação:**

```tsx
function gerarMensagemWhatsApp(pedido: GradeFechadaPedido) {
  let mensagem = '🛒 *PEDIDO DE ENCOMENDA - GRADE FECHADA*\n\n';

  pedido.itens.forEach((item, index) => {
    mensagem += `*Produto ${index + 1}:* ${item.produto_nome}\n`;
    mensagem += `*Tipo:* ${item.tipo_grade === 'meia' ? 'Meia Grade' : 'Grade Completa'}\n`;
    mensagem += `*Quantidade:* ${item.quantidade_grades} grades\n`;
    mensagem += `*Cor:* ${item.cor}\n\n`;
    mensagem += `*Numerações:*\n`;

    Object.entries(item.numeracoes).forEach(([num, qtd]) => {
      if (qtd > 0) {
        mensagem += `• Nº ${num}: ${qtd} ${qtd === 1 ? 'par' : 'pares'}\n`;
      }
    });

    mensagem += `\n*Subtotal:* R$ ${item.valor_total.toFixed(2)}\n\n`;
    mensagem += '---\n\n';
  });

  mensagem += `💰 *Valor Total:* R$ ${pedido.valor_total.toFixed(2)}\n\n`;
  mensagem += `📦 *Prazo de produção:* 15-20 dias úteis\n`;
  mensagem += `*Número do Pedido:* ${pedido.numero_pedido}`;

  return encodeURIComponent(mensagem);
}

function abrirWhatsApp(pedido: GradeFechadaPedido, whatsappNumero: string) {
  const mensagem = gerarMensagemWhatsApp(pedido);
  const url = `https://wa.me/${whatsappNumero}?text=${mensagem}`;
  window.open(url, '_blank');

  // Marcar pedido como finalizado via WhatsApp
  fetch(`/api/admin/grade-fechada/pedidos/${pedido.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      finalizado_whatsapp: true,
      data_finalizacao_whatsapp: new Date().toISOString(),
    }),
  });
}
```

### 3. Sistema de Carrinhos Abandonados

#### Implementar salvamento automático:

```tsx
// No componente do carrinho
useEffect(() => {
  // Salvar no localStorage em tempo real
  localStorage.setItem('carrinho_encomendas', JSON.stringify(itensCarrinho));

  // Debounce para salvar no banco
  const timer = setTimeout(() => {
    if (itensCarrinho.length > 0) {
      salvarCarrinhoNoBanco();
    }
  }, 3000); // Salva após 3 segundos de inatividade

  return () => clearTimeout(timer);
}, [itensCarrinho]);

async function salvarCarrinhoNoBanco() {
  const sessionId = getOrCreateSessionId(); // Gerar ID único por sessão

  await fetch('/api/encomendas/carrinho', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      itens: itensCarrinho,
      valor_total: calcularTotal(),
      cliente_nome: localStorage.getItem('cliente_nome'),
      cliente_telefone: localStorage.getItem('cliente_telefone'),
      cliente_email: localStorage.getItem('cliente_email'),
    }),
  });
}
```

### 4. Melhorias e Funcionalidades Extras

#### 4.1. Upload de Imagens para Supabase

Substituir o placeholder no formulário de produtos:

```tsx
async function uploadToSupabase(file: File): Promise<string> {
  const supabase = createClient(/* ... */);
  const fileName = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('grade-fechada-produtos')
    .upload(fileName, file);

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('grade-fechada-produtos').getPublicUrl(fileName);

  return publicUrl;
}
```

#### 4.2. Notificações de Carrinho Abandonado

Implementar cron job ou função serverless para:

- Verificar carrinhos com mais de 24h não convertidos
- Enviar notificação para o admin
- (Opcional) Enviar email/SMS para o cliente

#### 4.3. Dashboard de Métricas

Adicionar cards no `/admin/encomendas` com:

- Total de produtos cadastrados
- Pedidos do mês
- Taxa de conversão de carrinhos
- Ticket médio

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Banco de Dados

- [x] Criar migrations
- [ ] Aplicar migrations no Supabase
- [ ] Verificar RLS policies
- [ ] Testar inserção de dados

### Backend/APIs

- [x] APIs administrativas
- [x] APIs públicas
- [ ] Testar todas as rotas
- [ ] Adicionar validações extras

### Painel Admin

- [x] Adicionar menu no Sidebar
- [x] Página principal
- [x] Gestão de produtos (CRUD completo)
- [x] Configurações
- [ ] Página de pedidos
- [ ] Página de carrinhos abandonados

### Site Público

- [ ] Layout e header
- [ ] Catálogo de produtos
- [ ] Página do produto com montador
- [ ] Página do carrinho
- [ ] Integração WhatsApp
- [ ] Salvamento automático de carrinho

### Extras

- [ ] Upload real de imagens para Supabase
- [ ] Validação de numerações por tipo de grade
- [ ] Sistema de notificações
- [ ] Dashboard de métricas
- [ ] Testes end-to-end

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. **Aplicar migrations no Supabase**

   - Abrir SQL Editor
   - Executar migration 100
   - Executar migration 101
   - Verificar se tabelas foram criadas

2. **Testar painel administrativo**

   - Acessar `/admin/encomendas`
   - Cadastrar um produto de teste
   - Verificar upload de imagens
   - Testar edição e exclusão

3. **Implementar site público**

   - Começar pelo layout (`/encomendas/layout.tsx`)
   - Criar catálogo (`/encomendas/page.tsx`)
   - Implementar montador de grade (componente mais crítico)
   - Criar carrinho e integração WhatsApp

4. **Testes finais**
   - Fazer um pedido completo do início ao fim
   - Verificar mensagem do WhatsApp
   - Testar carrinho abandonado
   - Verificar salvamento no banco

---

## 💡 DICAS E CONSIDERAÇÕES

### Regras de Negócio Importantes

- **Meia Grade:** Geralmente 6 pares (ajustar conforme sua regra)
- **Grade Completa:** Geralmente 12 pares (ajustar conforme sua regra)
- **Pedido Mínimo:** 2 grades do mesmo modelo
- **Validação:** Soma das numerações DEVE ser exata

### Performance

- Implementar paginação nas listagens
- Lazy loading de imagens
- Debounce em salvamento de carrinho

### UX/UI

- Feedback visual durante validação de numerações
- Loading states em todas as ações assíncronas
- Toasts para sucesso/erro
- Confirmações antes de excluir

### Segurança

- RLS já configurado nas migrations
- Validar dados no backend
- Sanitizar inputs

---

## 📞 SUPORTE

Se precisar de ajuda com alguma parte específica da implementação, especialmente:

- Montador de grades (lógica de validação)
- Integração WhatsApp
- Upload de imagens
- Qualquer outra funcionalidade

Estou disponível para auxiliar!
