import { NextResponse } from 'next/server';

export async function GET() {
  const melhorEnvioClientId = process.env.MELHORENVIO_CLIENT_ID;
  const melhorEnvioSecret = process.env.MELHORENVIO_CLIENT_SECRET;
  const melhorEnvioSandbox = process.env.MELHORENVIO_SANDBOX;

  return NextResponse.json({
    message: 'Teste de Variáveis de Ambiente',
    melhorenvio: {
      clientId: melhorEnvioClientId || 'NÃO CONFIGURADO',
      secret: melhorEnvioSecret ? `${melhorEnvioSecret.substring(0, 10)}...` : 'NÃO CONFIGURADO',
      sandbox: melhorEnvioSandbox || 'NÃO CONFIGURADO',
      clientIdExists: !!melhorEnvioClientId,
      secretExists: !!melhorEnvioSecret,
    },
    allEnvVars: Object.keys(process.env)
      .filter(key => key.includes('MELHORENVIO'))
      .reduce((obj: Record<string, string>, key) => {
        obj[key] = process.env[key]?.substring(0, 20) + '...' || 'undefined';
        return obj;
      }, {})
  });
}
