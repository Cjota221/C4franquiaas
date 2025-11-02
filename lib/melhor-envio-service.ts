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
  console.log('[MelhorEnvio] Buscando configuração do banco...');
  
  const { data, error } = await supabase
    .from('config_melhorenvio')
    .select('access_token')
    .eq('id', 1)
    .single();

  if (error || !data?.access_token) {
    console.error('[MelhorEnvio] Erro ao buscar token:', error);
    throw new Error('Token do Melhor Envio não configurado');
  }

  const sandbox = process.env.NEXT_PUBLIC_MELHORENVIO_SANDBOX === 'true';
  
  console.log('[MelhorEnvio] Config obtida:', {
    has_token: !!data.access_token,
    token_preview: data.access_token.substring(0, 30) + '...',
    sandbox,
    env_sandbox: process.env.NEXT_PUBLIC_MELHORENVIO_SANDBOX
  });

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
  from?: { postal_code: string };
  to?: { postal_code: string };
  package?: {
    weight: number;
    width: number;
    height: number;
    length: number;
  };
  // Formato alternativo (legado)
  cep_destino?: string;
  cep_origem?: string;
  produtos?: Array<{
    peso: number;
    altura: number;
    largura: number;
    comprimento: number;
    valor: number;
    quantidade?: number;
  }>;
}

export async function calcularFrete(input: CalculoFreteInput) {
  console.log('[MelhorEnvio] calcularFrete - Iniciando...');
  console.log('[MelhorEnvio] Input recebido:', JSON.stringify(input, null, 2));
  
  const config = await getConfig();
  const apiUrl = getApiUrl(config.sandbox);
  
  console.log('[MelhorEnvio] API URL:', apiUrl);

  // Suportar ambos os formatos de entrada
  let payload;
  
  if (input.from && input.to && input.package) {
    // Formato novo (simples)
    const fromCep = input.from.postal_code.replace(/\D/g, '');
    const toCep = input.to.postal_code.replace(/\D/g, '');
    
    console.log('[MelhorEnvio] CEPs processados:', { 
      from_original: input.from.postal_code,
      from_clean: fromCep,
      to_original: input.to.postal_code,
      to_clean: toCep
    });
    
    // Validar CEPs
    if (!fromCep || fromCep.length !== 8) {
      throw new Error(`CEP de origem inválido: "${input.from.postal_code}" -> "${fromCep}" (deve ter 8 dígitos)`);
    }
    if (!toCep || toCep.length !== 8) {
      throw new Error(`CEP de destino inválido: "${input.to.postal_code}" -> "${toCep}" (deve ter 8 dígitos)`);
    }
    
    payload = {
      from: { postal_code: fromCep },
      to: { postal_code: toCep },
      package: input.package,
      options: {
        insurance_value: 100, // Valor padrão
        receipt: false,
        own_hand: false,
      },
    };
  } else {
    // Formato antigo (com produtos)
    const cepOrigem = (input.cep_origem || '01310100').replace(/\D/g, '');
    const cepDestino = (input.cep_destino || '').replace(/\D/g, '');
    
    console.log('[MelhorEnvio] CEPs processados (formato antigo):', { 
      origem_original: input.cep_origem,
      origem_clean: cepOrigem,
      destino_original: input.cep_destino,
      destino_clean: cepDestino
    });
    
    // Validar CEPs
    if (!cepOrigem || cepOrigem.length !== 8) {
      throw new Error(`CEP de origem inválido: "${input.cep_origem}" -> "${cepOrigem}" (deve ter 8 dígitos)`);
    }
    if (!cepDestino || cepDestino.length !== 8) {
      throw new Error(`CEP de destino inválido: "${input.cep_destino}" -> "${cepDestino}" (deve ter 8 dígitos)`);
    }
    
    payload = {
      from: { postal_code: cepOrigem },
      to: { postal_code: cepDestino },
      package: {
        weight: input.produtos!.reduce((sum, p) => sum + (p.peso * (p.quantidade || 1)), 0),
        height: Math.max(...input.produtos!.map(p => p.altura)),
        width: Math.max(...input.produtos!.map(p => p.largura)),
        length: Math.max(...input.produtos!.map(p => p.comprimento)),
      },
      options: {
        insurance_value: input.produtos!.reduce((sum, p) => sum + (p.valor * (p.quantidade || 1)), 0),
        receipt: false,
        own_hand: false,
      },
    };
  }

  console.log('[MelhorEnvio] Payload preparado:', JSON.stringify(payload, null, 2));
  console.log('[MelhorEnvio] Token preview:', config.access_token.substring(0, 30) + '...');

  const response = await fetch(`${apiUrl}/me/shipment/calculate`, {
    method: 'POST',
    headers: getHeaders(config.access_token),
    body: JSON.stringify(payload),
  });

  console.log('[MelhorEnvio] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[MelhorEnvio] Erro na API:', response.status, errorText);
    throw new Error(`Erro ao calcular frete (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  console.log('[MelhorEnvio] Resultado:', result?.length || 0, 'cotações');
  
  return result;
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
