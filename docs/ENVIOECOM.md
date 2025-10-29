# 📦 Integração Envioecom - Documentação Completa

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração Inicial](#configuração-inicial)
- [Funcionalidades Implementadas](#funcionalidades-implementadas)
- [Arquitetura do Código](#arquitetura-do-código)
- [Uso Prático](#uso-prático)
- [Segurança e Boas Práticas](#segurança-e-boas-práticas)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A integração com a API Envioecom permite:

✅ **Cotação de Frete em Tempo Real** - Comparar preços e prazos de múltiplas transportadoras  
✅ **Geração Automática de Etiquetas** - Criar etiquetas de envio em PDF via API  
✅ **Rastreamento de Pedidos** - Acompanhar status e histórico de movimentações  

### 🔒 Modelo de Segurança

- **Exclusivo para Admin**: Funcionalidades **NÃO** são visíveis no frontend da loja
- **Proteção de Pagamento**: Etiquetas só podem ser geradas após confirmação de pagamento
- **Autenticação**: Todas as requisições usam credenciais seguras (SLUG + E_TOKEN)

---

## ⚙️ Configuração Inicial

### 1. Obter Credenciais Envioecom

1. Acesse: https://painel.envioecom.com.br/
2. Faça login na sua conta
3. Vá em: **Configurações → API**
4. Copie:
   - **SLUG** (identificador único da conta)
   - **E_TOKEN** (token de autenticação)

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` (crie se não existir):

```bash
# Envioecom - Integração de Frete
NEXT_PUBLIC_ENVIOECOM_SLUG=seu_slug_aqui
NEXT_PUBLIC_ENVIOECOM_ETOKEN=seu_token_aqui
```

### 3. Reiniciar Servidor

```bash
npm run dev
```

---

## 🚀 Funcionalidades Implementadas

### 1️⃣ Cotação de Frete

**Localização**: `components/admin/EnvioecomIntegrationPanel.tsx`

**Funcionalidade**:
- Formulário para inserir dados de origem/destino
- Dimensões e peso do pacote
- Retorna lista de serviços disponíveis com preços e prazos

**Como Usar**:

```tsx
import { EnvioecomIntegrationPanel } from '@/components/admin/EnvioecomIntegrationPanel';

<EnvioecomIntegrationPanel
  onSelectServico={(servico) => {
    console.log('Serviço selecionado:', servico);
  }}
  cepDestino="01310-100"
  valorDeclarado={150.00}
/>
```

---

### 2️⃣ Geração de Etiqueta

**Localização**: `app/admin/vendas/page.tsx`

**Funcionalidade**:
- Gera etiqueta automaticamente via API
- Retorna PDF para impressão
- Salva código de rastreio no banco
- **BLOQUEIO**: Só funciona para pedidos com status `pago` ou `separado`

**Fluxo**:

```
1. Cliente faz pedido
2. Pagamento confirmado → status = "pago"
3. Admin clica em "Gerar Etiqueta"
4. API Envioecom gera etiqueta + código de rastreio
5. PDF abre em nova aba
6. Código de rastreio salvo no banco
```

**Interface no Admin**:

```tsx
{/* Botão desabilitado se não estiver pago */}
<button 
  onClick={() => gerarEtiquetaAutomatica(pedido)} 
  disabled={pedido.status !== 'pago' && pedido.status !== 'separado'}
>
  Gerar Etiqueta
</button>
```

---

### 3️⃣ Rastreamento de Pedido

**Localização**: `components/admin/RastreamentoModal.tsx`

**Funcionalidade**:
- Modal com histórico completo de movimentações
- Timeline visual com eventos
- Status atual destacado
- Ícones e cores por status (Em trânsito, Entregue, etc.)

**Como Usar**:

```tsx
import { RastreamentoModal } from '@/components/admin/RastreamentoModal';

<RastreamentoModal
  codigoRastreio="ABC123456789BR"
  onClose={() => setModalAberto(false)}
/>
```

---

## 🏗️ Arquitetura do Código

### Estrutura de Arquivos

```
c4-franquias-admin/
├── types/
│   └── envioecom.ts                 # Tipos TypeScript (Request/Response)
├── hooks/
│   └── useEnvioecom.ts              # Hook customizado (lógica da API)
├── components/
│   └── admin/
│       ├── EnvioecomIntegrationPanel.tsx  # Interface de cotação
│       └── RastreamentoModal.tsx          # Modal de rastreamento
└── app/
    └── admin/
        └── vendas/
            └── page.tsx             # Integração na página de vendas
```

### Tipos TypeScript

Todos os tipos estão em `types/envioecom.ts`:

```typescript
// Exemplo: Request de cotação
interface CotacaoRequest {
  origem: { cep: string };
  destino: { cep: string };
  pacotes: PacoteCotacao[];
}

// Exemplo: Response de cotação
interface CotacaoResponse {
  sucesso: boolean;
  servicos: ServicoCotacao[];
  erro?: string;
}
```

### Hook Principal

`hooks/useEnvioecom.ts` encapsula toda a lógica:

```typescript
const { 
  cotarFrete,       // Função para cotar frete
  gerarEtiqueta,    // Função para gerar etiqueta
  rastrearPedido,   // Função para rastrear
  isLoading,        // Estado de carregamento
  isError,          // Estado de erro
  error             // Mensagem de erro
} = useEnvioecom();
```

**Benefícios**:
- ✅ Reutilizável em qualquer componente
- ✅ Tratamento de erros centralizado
- ✅ Estados de loading gerenciados
- ✅ Type-safe (TypeScript)

---

## 💼 Uso Prático

### Cenário 1: Cotar Frete no Checkout

```tsx
import { useCotacaoFrete } from '@/hooks/useEnvioecom';

function CheckoutPage() {
  const { cotar, cotacoes, isLoading } = useCotacaoFrete();

  const handleCotar = async () => {
    await cotar({
      origem: { cep: '01310-100' },
      destino: { cep: cepCliente },
      pacotes: [{
        peso: 500,
        altura: 10,
        largura: 15,
        comprimento: 20,
        valor_declarado: valorTotal,
      }],
    });
  };

  return (
    <div>
      <button onClick={handleCotar} disabled={isLoading}>
        {isLoading ? 'Cotando...' : 'Calcular Frete'}
      </button>

      {cotacoes?.servicos.map((servico) => (
        <div key={servico.servico_id}>
          <p>{servico.nome}: R$ {servico.preco}</p>
          <p>{servico.prazo_entrega} dias úteis</p>
        </div>
      ))}
    </div>
  );
}
```

### Cenário 2: Gerar Etiqueta Após Pagamento

```tsx
import { useEnvioecom } from '@/hooks/useEnvioecom';

function PedidoDetalhes({ pedido }) {
  const { gerarEtiqueta, isLoading } = useEnvioecom();

  const handleGerar = async () => {
    // Validação de pagamento
    if (pedido.status !== 'pago') {
      alert('Pedido ainda não foi pago!');
      return;
    }

    const response = await gerarEtiqueta({
      servico_id: 'sedex',
      remetente: { /* dados do remetente */ },
      destinatario: { /* dados do cliente */ },
      pacotes: [{ /* dimensões */ }],
      produtos: pedido.itens,
      numero_pedido: pedido.id,
    });

    // Abrir PDF
    window.open(response.url_etiqueta, '_blank');

    // Salvar código no banco
    await salvarCodigoRastreio(pedido.id, response.codigo_rastreio);
  };

  return (
    <button 
      onClick={handleGerar} 
      disabled={isLoading || pedido.status !== 'pago'}
    >
      {isLoading ? 'Gerando...' : 'Gerar Etiqueta'}
    </button>
  );
}
```

### Cenário 3: Rastreamento em Tempo Real

```tsx
import { useRastreamento } from '@/hooks/useEnvioecom';

function StatusPedido({ codigoRastreio }) {
  const { rastrear, rastreio, isLoading } = useRastreamento();

  useEffect(() => {
    rastrear(codigoRastreio);
  }, [codigoRastreio]);

  if (isLoading) return <p>Carregando...</p>;

  return (
    <div>
      <h3>Status: {rastreio?.status_atual}</h3>
      <p>Entregue: {rastreio?.entregue ? 'Sim' : 'Não'}</p>

      <h4>Histórico:</h4>
      {rastreio?.eventos.map((evento, i) => (
        <div key={i}>
          <p>{evento.status} - {evento.descricao}</p>
          <small>{evento.data} {evento.hora}</small>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔐 Segurança e Boas Práticas

### ✅ DO (Faça)

1. **Validar Pagamento SEMPRE** antes de gerar etiqueta
2. **Armazenar credenciais** apenas em variáveis de ambiente
3. **Usar HTTPS** em produção
4. **Tratar erros** com mensagens amigáveis
5. **Logar falhas** para análise posterior

```typescript
// ✅ BOM
if (pedido.status !== 'pago') {
  alert('Etiquetas só podem ser geradas após confirmação do pagamento');
  return;
}

// ✅ BOM
try {
  await gerarEtiqueta(request);
} catch (error) {
  console.error('Erro:', error);
  alert('Erro ao gerar etiqueta. Tente novamente.');
}
```

### ❌ DON'T (Não Faça)

1. **NUNCA** exponha credenciais no código-fonte
2. **NUNCA** permita gerar etiquetas sem validar pagamento
3. **NUNCA** ignore erros da API

```typescript
// ❌ RUIM - Credenciais expostas
const SLUG = 'meu-slug-secreto'; // NUNCA FAÇA ISSO!

// ❌ RUIM - Sem validação de pagamento
await gerarEtiqueta(request); // E se não estiver pago?

// ❌ RUIM - Ignorando erros
await fetch('/api/envioecom').catch(() => {}); // Erro silencioso!
```

---

## 🐛 Troubleshooting

### Problema: "Credenciais não configuradas"

**Causa**: Variáveis de ambiente não definidas

**Solução**:
```bash
# Verifique se .env.local existe e contém:
NEXT_PUBLIC_ENVIOECOM_SLUG=...
NEXT_PUBLIC_ENVIOECOM_ETOKEN=...

# Reinicie o servidor
npm run dev
```

### Problema: "Erro 401 - Unauthorized"

**Causa**: SLUG ou E_TOKEN inválidos

**Solução**:
1. Acesse o painel Envioecom
2. Verifique se as credenciais estão corretas
3. Regenere o token se necessário
4. Atualize `.env.local`

### Problema: "Botão Gerar Etiqueta desabilitado"

**Causa**: Pedido não está com status `pago` ou `separado`

**Solução**:
1. Confirme o pagamento do pedido
2. Atualize o status para `pago`
3. O botão será habilitado automaticamente

### Problema: "Nenhum serviço disponível"

**Causa**: CEP inválido ou região sem cobertura

**Solução**:
1. Valide o CEP de origem e destino
2. Verifique se a região tem cobertura de transportadoras
3. Tente outro CEP de teste

---

## 📚 Recursos Adicionais

- **Documentação Oficial**: https://docs.envioecom.com.br/
- **Painel Envioecom**: https://painel.envioecom.com.br/
- **Suporte Técnico**: suporte@envioecom.com.br

---

## 🎨 Componentes Visuais

### Padrão de Botões

```tsx
// Botão Primary (Ação principal)
<Button>Gerar Etiqueta</Button>

// Botão Secondary (Ação secundária)
<Button variant="outline">Cancelar</Button>

// Botão Destructive (Ação perigosa)
<Button variant="destructive">Excluir</Button>

// Botão Disabled (Bloqueado)
<Button disabled>Aguardando Pagamento</Button>
```

### Cores de Status

- 🟢 **Verde**: Entregue, Concluído
- 🔵 **Azul**: Em trânsito, Processando
- 🟡 **Amarelo**: Aguardando, Pendente
- ⚪ **Cinza**: Neutro, Padrão
- 🔴 **Vermelho**: Erro, Cancelado

---

**✅ Integração completa e funcional!**
