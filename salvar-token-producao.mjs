// Script para salvar token PRODUÇÃO do Melhor Envio no Supabase
// Execute: node salvar-token-producao.mjs

const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjFmZTUxYzk1ZDE4YWZiZGM1YzI1MzQyMmUzZjIwZThjNDI5YjA5OTk5ZDVjYThhMzRiOTI4NmQ1MTE5NTk5OWNmY2YzZmY1N2FmMDM5MTIiLCJpYXQiOjE3NjIwNDcxNDMuODA5NTQ3LCJuYmYiOjE3NjIwNDcxNDMuODA5NTQ4LCJleHAiOjE3OTM1ODMxNDMuNzk3OTQ2LCJzdWIiOiIzNjBiM2Y1OC01NjQ2LTRiNzYtYjIwNi0zZDllNzE3YjcwOWYiLCJzY29wZXMiOlsiY2FydC1yZWFkIiwiY2FydC13cml0ZSIsImNvbXBhbmllcy1yZWFkIiwiY29tcGFuaWVzLXdyaXRlIiwiY291cG9ucy1yZWFkIiwiY291cG9ucy13cml0ZSIsIm5vdGlmaWNhdGlvbnMtcmVhZCIsIm9yZGVycy1yZWFkIiwicHJvZHVjdHMtcmVhZCIsInByb2R1Y3RzLWRlc3Ryb3kiLCJwcm9kdWN0cy13cml0ZSIsInB1cmNoYXNlcy1yZWFkIiwic2hpcHBpbmctY2FsY3VsYXRlIiwic2hpcHBpbmctY2FuY2VsIiwic2hpcHBpbmctY2hlY2tvdXQiLCJzaGlwcGluZy1jb21wYW5pZXMiLCJzaGlwcGluZy1nZW5lcmF0ZSIsInNoaXBwaW5nLXByZXZpZXciLCJzaGlwcGluZy1wcmludCIsInNoaXBwaW5nLXNoYXJlIiwic2hpcHBpbmctdHJhY2tpbmciLCJlY29tbWVyY2Utc2hpcHBpbmciLCJ0cmFuc2FjdGlvbnMtcmVhZCIsInVzZXJzLXJlYWQiLCJ1c2Vycy13cml0ZSIsIndlYmhvb2tzLXJlYWQiLCJ3ZWJob29rcy13cml0ZSIsIndlYmhvb2tzLWRlbGV0ZSIsInRkZWFsZXItd2ViaG9vayJdfQ.adjPHuu47Y6qlI-GJnV5LO5d9Gd0iW5D4BT4Dkj7Btxi6qNEfVbKKOd99c1PosnzWpTn2BaJh-8_ypVyoKCnflwXv3qWEWd1ATlcEEs3RRYkpKjkiGP6xVxw4uTUqh3wyTxSVmidV1rUoKPasYQRU4pQ7ylqnbvYi1LknguspqYooMa-0yTMV0ts86WKAhMdlECi0N_mVcJpLHX9okmbBCqa5zlnAeOtO9qz3oo2rL9fTRmNaja4yb3mwaYfhWvJsEfuJGCiGz_z8HkCLFzJAjBt0YRK2mPSY_thPl6zisBsktRwYBliJCYU7uslSOVWdxNDmMwMsACPGpW6uqe6m68XIRbE8ckueodMgZB-i75W46t7yFA5CqARuCvg7Gs-1c2OICa2zjNRqSCQThKcA3LkrsetYrXhU5iJ3cErsgcXjfOCXoh7jsxYrsPGJr1iiw0cGwf3gBn5RGjHXeLMX_ddOqokBrLi9b2W8ngh3sXhC0fK5Q2K2usv7J7NYoxCnkb0Q3OAp0JP6Cy7zXQthL0QCwAHv1sOgEzCYQzYWIVLeHh5oMcxxADg87O6Sv28YoQpHf-atV4mNV7wQmXdn0AioVt9aX-idbucWtJH1MnHt2_TocveOMdUVdsl_d4YpbsDG87upt8rpTjcz4r98FPBa4lHfgQgaj0yaBbsEVo';

const SUPABASE_URL = 'https://rprucmoavblepodvanga.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcnVjbW9hdmJsZXBvZHZhbmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIxMzMyNywiZXhwIjoyMDc1Nzg5MzI3fQ.m2lfjTYPb4nHrge17kYmL1Gny8zrnOV5jzrZvn7Ib24';

async function salvarToken() {
  console.log('\n🔧 Processando token de PRODUÇÃO...\n');
  
  // Decodificar JWT para extrair informações
  const tokenParts = TOKEN.split('.');
  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
  
  console.log('📋 Informações do Token PRODUÇÃO:');
  console.log('  - Audience (aud):', payload.aud); // "1" = produção
  console.log('  - Expira em:', new Date(payload.exp * 1000).toLocaleString('pt-BR'));
  console.log('  - Emitido em:', new Date(payload.iat * 1000).toLocaleString('pt-BR'));
  console.log('  - Scopes:', payload.scopes.length, 'permissões');
  console.log('  - Válido por:', Math.floor((payload.exp - payload.iat) / 86400), 'dias');
  console.log('');

  const expiresAt = new Date(payload.exp * 1000).toISOString();
  const expiresIn = Math.floor(payload.exp - payload.iat);

  console.log('💾 Salvando token de PRODUÇÃO no Supabase...\n');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/config_melhorenvio?id=eq.1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      id: 1,
      access_token: TOKEN,
      refresh_token: '',
      token_type: 'Bearer',
      expires_in: expiresIn,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Erro ao salvar token:', error);
    process.exit(1);
  }

  const data = await response.json();
  
  console.log('✅ Token de PRODUÇÃO salvo com sucesso!');
  console.log('');
  console.log('📊 Registro atualizado:');
  console.log('  - ID:', data[0]?.id);
  console.log('  - Token Type:', data[0]?.token_type);
  console.log('  - Expires At:', new Date(data[0]?.expires_at).toLocaleString('pt-BR'));
  console.log('');
  console.log('🎉 PRONTO! Agora você está usando o Melhor Envio REAL (PRODUÇÃO)!');
  console.log('');
  console.log('⚠️  IMPORTANTE:');
  console.log('  - Token expira em:', new Date(payload.exp * 1000).toLocaleDateString('pt-BR'));
  console.log('  - Este é um token de PRODUÇÃO (fretes serão REAIS e COBRADOS!)');
  console.log('  - Você precisa mudar MELHORENVIO_SANDBOX=false no Netlify');
  console.log('');
  console.log('🧪 Próximos passos:');
  console.log('  1. Atualizar MELHORENVIO_SANDBOX=false no Netlify');
  console.log('  2. Fazer redeploy');
  console.log('  3. Testar em uma loja real');
  console.log('');
}

salvarToken().catch(console.error);
