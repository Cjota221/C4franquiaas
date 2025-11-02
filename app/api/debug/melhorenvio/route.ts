import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.MELHORENVIO_CLIENT_ID;
  const clientSecret = process.env.MELHORENVIO_CLIENT_SECRET;
  const sandbox = process.env.MELHORENVIO_SANDBOX;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return NextResponse.json({
    message: 'Debug Melhor Envio',
    config: {
      clientId: clientId || 'NÃO CONFIGURADO',
      clientSecret: clientSecret ? `${clientSecret.substring(0, 10)}...` : 'NÃO CONFIGURADO',
      sandbox: sandbox || 'NÃO CONFIGURADO',
      baseUrl: baseUrl || 'NÃO CONFIGURADO',
      redirectUri: `${baseUrl}/admin/configuracoes/melhorenvio/callback`,
      clientIdExists: !!clientId,
      clientSecretExists: !!clientSecret,
      sandboxMode: sandbox === 'true',
    },
    expectedConfig: {
      clientId: '7341',
      redirectUri: 'https://c4franquiaas.netlify.app/admin/melhorenvio/callback',
      sandbox: true,
    },
    note: 'Verifique se o Client ID e Redirect URI batem com o cadastrado no Melhor Envio'
  });
}
