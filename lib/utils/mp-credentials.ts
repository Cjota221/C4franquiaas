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
  console.log('🔍 [MP Config] Buscando configurações globais...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('configuracoes_globais')
    .select('mp_ativado, mp_modo_producao')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('❌ [MP Config] Erro ao buscar do banco:', error);
    console.log('⚠️ [MP Config] Usando valores padrão (mp_ativado=true, mp_modo_producao=false)');
    // Valores padrão se não existir configuração
    return {
      mp_ativado: true,
      mp_modo_producao: false,
    };
  }

  if (!data) {
    console.log('⚠️ [MP Config] Nenhum dado encontrado, usando padrão');
    return {
      mp_ativado: true,
      mp_modo_producao: false,
    };
  }

  console.log('✅ [MP Config] Configurações carregadas:', data);
  return data;
}

/**
 * Retorna as credenciais corretas (Teste ou Produção) baseado na config GLOBAL
 */
export async function getMercadoPagoCredentials(): Promise<MercadoPagoCredentials> {
  try {
    console.log('🔑 [MP Credentials] Iniciando busca de credenciais...');
    
    const config = await getConfiguracoesGlobais();
    console.log('📋 [MP Credentials] Config obtida:', config);
    
    if (!config.mp_ativado) {
      console.error('❌ [MP Credentials] Mercado Pago está DESATIVADO globalmente');
      throw new Error('Mercado Pago não está ativado globalmente');
    }
    
    const isProduction = config.mp_modo_producao;
    console.log(`🎯 [MP Credentials] Modo selecionado: ${isProduction ? 'PRODUÇÃO' : 'TESTE'}`);

    // Seleciona credenciais baseado no modo
    const accessToken = isProduction
      ? process.env.MERCADOPAGO_ACCESS_TOKEN_PROD
      : process.env.MERCADOPAGO_ACCESS_TOKEN_TEST;

    const publicKey = isProduction
      ? process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_PROD
      : process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_TEST;

    console.log('🔐 [MP Credentials] Verificando variáveis de ambiente...');
    console.log(`  - Access Token (${isProduction ? 'PROD' : 'TEST'}): ${accessToken ? '✅ Presente' : '❌ AUSENTE'}`);
    console.log(`  - Public Key (${isProduction ? 'PROD' : 'TEST'}): ${publicKey ? '✅ Presente' : '❌ AUSENTE'}`);

    if (!accessToken || !publicKey) {
      const missing = [];
      if (!accessToken) missing.push(`MERCADOPAGO_ACCESS_TOKEN_${isProduction ? 'PROD' : 'TEST'}`);
      if (!publicKey) missing.push(`NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_${isProduction ? 'PROD' : 'TEST'}`);
      
      const errorMsg = `Credenciais ausentes para modo ${isProduction ? 'PRODUÇÃO' : 'TESTE'}: ${missing.join(', ')}`;
      console.error(`❌ [MP Credentials] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    console.log(`✅ [MP Credentials] Credenciais OK - Modo: ${isProduction ? 'PRODUÇÃO' : 'TESTE'}`);

    return {
      accessToken,
      publicKey,
      isProduction,
    };
  } catch (error) {
    console.error('❌ [MP Credentials] ERRO FATAL:', error);
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
