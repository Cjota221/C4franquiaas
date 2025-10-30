/**
 * Mercado Pago Credentials Manager
 * 
 * Gerencia as credenciais do Mercado Pago de forma segura,
 * garantindo que Access Tokens nunca sejam expostos ao frontend.
 * 
 * CONFIGURAÇÃO GLOBAL: As configurações do MP são globais para toda a plataforma.
 */

import { createClient } from '@supabase/supabase-js';

interface MercadoPagoCredentials {
  accessToken: string;
  publicKey: string;
  isProduction: boolean;
}

/**
 * Busca as configurações GLOBAIS do Mercado Pago
 */
async function getConfiguracoesGlobais() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('configuracoes_globais')
    .select('mp_ativado, mp_modo_producao')
    .eq('id', 1)
    .single();

  if (error || !data) {
    // Valores padrão se não existir configuração
    return {
      mp_ativado: true,
      mp_modo_producao: false,
    };
  }

  return data;
}

/**
 * Retorna as credenciais corretas (Teste ou Produção) baseado na config GLOBAL
 */
export async function getMercadoPagoCredentials(): Promise<MercadoPagoCredentials> {
  try {
    const config = await getConfiguracoesGlobais();
    
    if (!config.mp_ativado) {
      throw new Error('Mercado Pago não está ativado globalmente');
    }
    
    const isProduction = config.mp_modo_producao;

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
  } catch (error) {
    console.error('❌ Erro ao buscar credenciais MP:', error);
    throw error;
  }
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
