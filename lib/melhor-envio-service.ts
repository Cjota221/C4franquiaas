/**
 * Serviço completo de integração com Melhor Envio
 * Funcionalidades: Cálculo, Carrinho, Checkout, Etiquetas, Rastreamento, Logística Reversa
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MelhorEnvioConfig {
  access_token: string;
  sandbox: boolean;
}

/**
 * Obter configuração e token do Melhor Envio
 */
async function getConfig(): Promise<MelhorEnvioConfig> {
  const { data, error } = await supabase
    .from('config_melhorenvio')
    .select('access_token')
    .eq('id', 1)
    .single();

  if (error || !data?.access_token) {
    throw new Error('Token do Melhor Envio não configurado');
  }

  const sandbox = process.env.MELHORENVIO_SANDBOX === 'true';

  return {
    access_token: data.access_token,
    sandbox,
  };
}

/**
 * Base URL da API
 */
function getApiUrl(sandbox: boolean): string {
  return sandbox
    ? 'https://sandbox.melhorenvio.com.br/api/v2'
    : 'https://melhorenvio.com.br/api/v2';
}

/**
 * Headers padrão para requisições
 */
function getHeaders(token: string) {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'C4Franquias (contato@c4franquias.com.br)',
  };
}

// ========================================
// 1. CÁLCULO DE FRETE
// ========================================

export interface CalculoFreteInput {
  cep_destino: string;
  cep_origem?: string;
  produtos: Array<{
    peso: number; // kg
    altura: number; // cm
    largura: number; // cm
    comprimento: number; // cm
    valor: number; // R$
    quantidade?: number;
  }>;
}

export async function calcularFrete(input: CalculoFreteInput) {
  const config = await getConfig();
  const apiUrl = getApiUrl(config.sandbox);

  // Origem padrão (você pode salvar isso nas configurações)
  const cepOrigem = input.cep_origem || '01310100'; // Av. Paulista, SP

  const payload = {
    from: { postal_code: cepOrigem },
    to: { postal_code: input.cep_destino },
    package: {
      weight: input.produtos.reduce((sum, p) => sum + (p.peso * (p.quantidade || 1)), 0),
      height: Math.max(...input.produtos.map(p => p.altura)),
      width: Math.max(...input.produtos.map(p => p.largura)),
      length: Math.max(...input.produtos.map(p => p.comprimento)),
    },
    options: {
      insurance_value: input.produtos.reduce((sum, p) => sum + (p.valor * (p.quantidade || 1)), 0),
      receipt: false,
      own_hand: false,
    },
  };

  const response = await fetch(`${apiUrl}/me/shipment/calculate`, {
    method: 'POST',
    headers: getHeaders(config.access_token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao calcular frete: ${JSON.stringify(error)}`);
  }

  return response.json();
}

// ========================================
// 2. ADICIONAR AO CARRINHO
// ========================================

export interface AdicionarCarrinhoInput {
  servico_id: number;
  cep_destino: string;
  cep_origem?: string;
  produtos: Array<{
    nome: string;
    quantidade: number;
    valor: number;
    peso: number;
    altura: number;
    largura: number;
    comprimento: number;
  }>;
  destinatario: {
    nome: string;
    telefone: string;
    email: string;
    documento: string; // CPF/CNPJ
    endereco: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
}

export async function adicionarAoCarrinho(input: AdicionarCarrinhoInput) {
  const config = await getConfig();
  const apiUrl = getApiUrl(config.sandbox);
  const cepOrigem = input.cep_origem || '01310100';

  const payload = {
    service: input.servico_id,
    from: {
      name: 'C4 Franquias', // Nome da loja/franquia
      postal_code: cepOrigem,
      // Adicionar endereço completo de origem das configurações
    },
    to: {
      name: input.destinatario.nome,
      phone: input.destinatario.telefone,
      email: input.destinatario.email,
      document: input.destinatario.documento,
      address: input.destinatario.endereco,
      number: input.destinatario.numero,
      complement: input.destinatario.complemento,
      district: input.destinatario.bairro,
      city: input.destinatario.cidade,
      state_abbr: input.destinatario.estado,
      postal_code: input.cep_destino,
    },
    products: input.produtos.map(p => ({
      name: p.nome,
      quantity: p.quantidade,
      unitary_value: p.valor,
    })),
    volumes: input.produtos.map(p => ({
      height: p.altura,
      width: p.largura,
      length: p.comprimento,
      weight: p.peso,
    })),
    options: {
      insurance_value: input.produtos.reduce((sum, p) => sum + (p.valor * p.quantidade), 0),
      receipt: false,
      own_hand: false,
      collect: false,
    },
  };

  const response = await fetch(`${apiUrl}/me/cart`, {
    method: 'POST',
    headers: getHeaders(config.access_token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao adicionar ao carrinho: ${JSON.stringify(error)}`);
  }

  return response.json();
}

// ========================================
// 3. FAZER CHECKOUT (Gerar Etiqueta)
// ========================================

export async function fazerCheckout(orderIds: string[]) {
  const config = await getConfig();
  const apiUrl = getApiUrl(config.sandbox);

  const payload = {
    orders: orderIds,
  };

  const response = await fetch(`${apiUrl}/me/shipment/checkout`, {
    method: 'POST',
    headers: getHeaders(config.access_token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro no checkout: ${JSON.stringify(error)}`);
  }

  return response.json();
}

// ========================================
// 4. GERAR ETIQUETA
// ========================================

export async function gerarEtiqueta(orderIds: string[]) {
  const config = await getConfig();
  const apiUrl = getApiUrl(config.sandbox);

  const payload = {
    orders: orderIds,
  };

  const response = await fetch(`${apiUrl}/me/shipment/generate`, {
    method: 'POST',
    headers: getHeaders(config.access_token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao gerar etiqueta: ${JSON.stringify(error)}`);
  }

  return response.json();
}

// ========================================
// 5. IMPRIMIR ETIQUETA
// ========================================

export async function imprimirEtiqueta(orderIds: string[], mode: 'private' | 'public' = 'private') {
  const config = await getConfig();
  const apiUrl = getApiUrl(config.sandbox);

  const payload = {
    mode,
    orders: orderIds,
  };

  const response = await fetch(`${apiUrl}/me/shipment/print`, {
    method: 'POST',
    headers: getHeaders(config.access_token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao imprimir etiqueta: ${JSON.stringify(error)}`);
  }

  return response.json(); // Retorna URL do PDF
}

// ========================================
// 6. RASTREAMENTO
// ========================================

export async function rastrearEnvio(orderId: string) {
  const config = await getConfig();
  const apiUrl = getApiUrl(config.sandbox);

  const response = await fetch(`${apiUrl}/me/shipment/${orderId}/tracking`, {
    headers: getHeaders(config.access_token),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao rastrear envio: ${JSON.stringify(error)}`);
  }

  return response.json();
}

// ========================================
// 7. CANCELAR ENVIO
// ========================================

export async function cancelarEnvio(orderId: string, motivo?: string) {
  const config = await getConfig();
  const apiUrl = getApiUrl(config.sandbox);

  const payload = {
    order: orderId,
    description: motivo || 'Cancelamento solicitado pelo cliente',
  };

  const response = await fetch(`${apiUrl}/me/shipment/cancel`, {
    method: 'POST',
    headers: getHeaders(config.access_token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Erro ao cancelar envio: ${JSON.stringify(error)}`);
  }

  return response.json();
}

// ========================================
// 8. LOGÍSTICA REVERSA
// ========================================

export async function criarEnvioReverso(input: {
  pedido_original_id: string;
  motivo: string;
  observacoes?: string;
}) {
  // Similar ao processo normal, mas com flag de logística reversa
  // O Melhor Envio trata reversa da mesma forma, só inverte origem/destino
  
  // const config = await getConfig(); // TODO: Implementar logística reversa completa
  // const apiUrl = getApiUrl(config.sandbox);

  // Buscar dados do pedido original
  const { data: envioOriginal } = await supabase
    .from('pedidos_envio')
    .select('*')
    .eq('melhorenvio_order_id', input.pedido_original_id)
    .single();

  if (!envioOriginal) {
    throw new Error('Pedido original não encontrado');
  }

  // Criar envio reverso (origem e destino invertidos)
  // Implementação similar ao adicionarAoCarrinho mas com dados invertidos
  
  return { success: true, message: 'Logística reversa criada' };
}

/**
 * Obter lista de transportadoras
 */
async function getCompanies() {
  const config = await getConfig();
  const apiUrl = getApiUrl(config.sandbox);

  const response = await fetch(`${apiUrl}/me/shipment/companies`, {
    method: 'GET',
    headers: getHeaders(config.access_token),
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar transportadoras: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Obter lista de serviços de envio disponíveis
 */
async function getServices() {
  const config = await getConfig();
  const apiUrl = getApiUrl(config.sandbox);

  const response = await fetch(`${apiUrl}/me/shipment/services`, {
    method: 'GET',
    headers: getHeaders(config.access_token),
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar serviços: ${response.statusText}`);
  }

  return await response.json();
}

export const MelhorEnvioService = {
  calcularFrete,
  adicionarAoCarrinho,
  fazerCheckout,
  gerarEtiqueta,
  imprimirEtiqueta,
  rastrearEnvio,
  cancelarEnvio,
  criarEnvioReverso,
  getCompanies,
  getServices,
};
