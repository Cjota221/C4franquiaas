/**
 * Mercado Pago Credentials Manager
 * 
 * Gerencia as credenciais do Mercado Pago de forma segura,
 * garantindo que Access Tokens nunca sejam expostos ao frontend.
 */

import { createClient } from '@supabase/supabase-js';

interface MercadoPagoCredentials {
  accessToken: string;
  publicKey: string;
  isProduction: boolean;
}

/**
 * Busca as configurações do Mercado Pago da loja
 * @param lojaId - ID da loja
 */
async function getLojaConfig(lojaId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('lojas')
    .select('mp_ativado, mp_modo_producao')
    .eq('id', lojaId)
    .single();

  if (error || !data) {
    throw new Error('Loja não encontrada ou configuração inválida');
  }

  return data;
}

/**
 * Retorna as credenciais corretas (Teste ou Produção) baseado na config da loja
 * @param lojaId - ID da loja (opcional, se não informado usa modo de ambiente)
 */
export async function getMercadoPagoCredentials(
  lojaId?: string
): Promise<MercadoPagoCredentials> {
  let isProduction = false;

  // Se lojaId fornecido, busca a config da loja
  if (lojaId) {
    try {
      const config = await getLojaConfig(lojaId);
      
      if (!config.mp_ativado) {
        throw new Error('Mercado Pago não está ativado para esta loja');
      }
      
      isProduction = config.mp_modo_producao;
    } catch (error) {
      console.error('❌ Erro ao buscar config da loja:', error);
      throw error;
    }
  }

  // Seleciona credenciais baseado no modo
  const accessToken = isProduction
    ? process.env.MERCADOPAGO_ACCESS_TOKEN_PROD
    : process.env.MERCADOPAGO_ACCESS_TOKEN_TEST;

  const publicKey = isProduction
    ? process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD
    : process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_TEST;

  if (!accessToken || !publicKey) {
    throw new Error(
      `Credenciais do Mercado Pago não configuradas para modo ${isProduction ? 'PRODUÇÃO' : 'TESTE'}`
    );
  }

  console.log(
    `🔑 [MP Credentials] Usando modo: ${isProduction ? 'PRODUÇÃO' : 'TESTE'}`
  );

  return {
    accessToken,
    publicKey,
    isProduction,
  };
}

/**
 * Retorna apenas a Public Key (seguro para frontend)
 * @param isProduction - Se true, retorna key de produção
 */
export function getPublicKey(isProduction: boolean = false): string {
  const publicKey = isProduction
    ? process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD
    : process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_TEST;

  if (!publicKey) {
    throw new Error('Public Key do Mercado Pago não configurada');
  }

  return publicKey;
}

/**
 * Valida se as credenciais estão configuradas
 */
export function validateCredentials(): {
  valid: boolean;
  missing: string[];
} {
  const required = [
    'MERCADOPAGO_ACCESS_TOKEN_PROD',
    'MERCADOPAGO_ACCESS_TOKEN_TEST',
    'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD',
    'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_TEST',
  ];

  const missing = required.filter((key) => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}
