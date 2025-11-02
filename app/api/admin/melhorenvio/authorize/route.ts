import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código de autorização não fornecido' },
        { status: 400 }
      );
    }

    const clientId = process.env.MELHORENVIO_CLIENT_ID;
    const clientSecret = process.env.MELHORENVIO_CLIENT_SECRET;
    const isSandbox = process.env.MELHORENVIO_SANDBOX === 'true';
    const baseUrl = isSandbox ? 'https://sandbox.melhorenvio.com.br' : 'https://melhorenvio.com.br';
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/configuracoes/melhorenvio/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: 'Credenciais Melhor Envio não configuradas' },
        { status: 500 }
      );
    }

    console.log('[Melhor Envio] Trocando code por token...');
    console.log('[Melhor Envio] Ambiente:', isSandbox ? 'SANDBOX' : 'PRODUÇÃO');

    // Trocar code por access_token
    // Muitos provedores OAuth2 (incluindo implementações que exigem conformidade estrita)
    // esperam application/x-www-form-urlencoded no endpoint /oauth/token.
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId || '',
      client_secret: clientSecret || '',
      redirect_uri: redirectUri,
      code: code,
    });

    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('[Melhor Envio] Erro ao obter token:', errorData);
      console.error('[Melhor Envio] Status:', tokenResponse.status);
      // Não logar client_secret em texto claro. Mostramos apenas client_id e o resto da payload.
      console.error('[Melhor Envio] Payload enviado (sem client_secret):', {
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code: code,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao obter token do Melhor Envio',
          details: errorData,
          status: tokenResponse.status
        },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('[Melhor Envio] Token obtido com sucesso!');

    // Salvar token no banco de dados
    const { error: dbError } = await supabase
      .from('config_melhorenvio')
      .upsert({
        id: 1,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('[Melhor Envio] Erro ao salvar token:', dbError);
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar token no banco' },
        { status: 500 }
      );
    }

    console.log('[Melhor Envio] Token salvo no banco com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Autorização concluída com sucesso!',
    });

  } catch (error) {
    console.error('[Melhor Envio] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
