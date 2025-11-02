import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[Verificar Config Simple] Verificando token...');
    
    // Tentar buscar direto com fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        success: false,
        error: 'Variáveis de ambiente não configuradas',
        missing: {
          supabaseUrl: !supabaseUrl,
          serviceKey: !serviceKey
        }
      }, { status: 500 });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/config_melhorenvio?id=eq.1&select=*`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Verificar Config Simple] Erro Supabase:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar do Supabase',
        status: response.status,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    const config = Array.isArray(data) ? data[0] : data;

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Token não encontrado no banco de dados',
        hint: 'Execute o SQL SALVAR_TOKEN_SUPABASE.sql'
      }, { status: 404 });
    }

    console.log('[Verificar Config Simple] Token encontrado!');

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        token_type: config.token_type || 'Bearer',
        has_access_token: !!config.access_token,
        access_token: config.access_token?.substring(0, 30) + '...',
        refresh_token: config.refresh_token,
        expires_at: config.expires_at,
        scopes: config.scopes,
        created_at: config.created_at,
        updated_at: config.updated_at,
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Verificar Config Simple] Erro catch:', error);
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
