import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsbW14c2R4bW92bGtwZnFhbXZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzkyMDEwMSwiZXhwIjoyMDM5NDk2MTAxfQ.RM7IPQE-PgXW6xAZugFqJU1bCpcUb7xrOvPXOApOXuQ';

export async function GET() {
  try {
    console.log('[Test Auth] Iniciando teste de autenticação...');
    console.log('[Test Auth] Service Key presente:', !!SUPABASE_SERVICE_KEY);
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('[Test Auth] Buscando token do banco...');
    const { data: config, error: dbError } = await supabase
      .from('config_melhorenvio')
      .select('access_token')
      .eq('id', 1)
      .single();
    
    if (dbError) {
      console.error('[Test Auth] Erro ao buscar do banco:', dbError);
      return NextResponse.json({
        authenticated: false,
        error: 'Erro ao buscar configuração do banco',
        details: dbError.message
      }, { status: 500 });
    }
    
    const token = config?.access_token;
    
    if (!token) {
      console.log('[Test Auth] Token não encontrado no banco');
      return NextResponse.json({
        authenticated: false,
        error: 'Token não encontrado no banco de dados'
      }, { status: 401 });
    }

    console.log('[Test Auth] Token encontrado, testando com Melhor Envio...');
    const isSandbox = process.env.NEXT_PUBLIC_MELHORENVIO_SANDBOX === 'true';
    const baseUrl = isSandbox 
      ? 'https://sandbox.melhorenvio.com.br/api/v2'
      : 'https://melhorenvio.com.br/api/v2';

    console.log('[Test Auth] URL base:', baseUrl);
    console.log('[Test Auth] Token preview:', token.substring(0, 30) + '...');

    const response = await fetch(`${baseUrl}/me`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Test Auth] Falha na autenticação:', response.status, errorText);
      return NextResponse.json({
        authenticated: false,
        error: `Erro na autenticação (${response.status})`,
        details: errorText,
        baseUrl: baseUrl
      }, { status: response.status });
    }

    const userData = await response.json();
    console.log('[Test Auth] Autenticação OK!', userData.email);

    return NextResponse.json({
      authenticated: true,
      user: userData
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Test Auth] Erro catch:', error);
    return NextResponse.json({
      authenticated: false,
      error: errorMessage
    }, { status: 500 });
  }
}
