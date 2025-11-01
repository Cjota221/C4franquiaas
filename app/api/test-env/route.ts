import { NextResponse } from 'next/server';

export async function GET() {
  const slug = process.env.NEXT_PUBLIC_ENVIOECOM_SLUG;
  const eToken = process.env.NEXT_PUBLIC_ENVIOECOM_ETOKEN;

  return NextResponse.json({
    message: 'Teste de Variáveis de Ambiente',
    envioecom: {
      slug: slug || 'NÃO CONFIGURADO',
      eToken: eToken ? `${eToken.substring(0, 10)}...` : 'NÃO CONFIGURADO',
      slugExists: !!slug,
      eTokenExists: !!eToken,
    },
    allEnvVars: Object.keys(process.env)
      .filter(key => key.includes('ENVIOECOM'))
      .reduce((obj: Record<string, string>, key) => {
        obj[key] = process.env[key]?.substring(0, 20) + '...' || 'undefined';
        return obj;
      }, {})
  });
}
