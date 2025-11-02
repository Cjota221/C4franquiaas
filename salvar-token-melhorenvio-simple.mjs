// Script para salvar token do Melhor Envio no Supabase
// Execute: node salvar-token-melhorenvio-simple.mjs

const TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiIwOTg4NDY4ZDM1ZGQ2Mzc1NTE2YzIzZDhlZWQwZDhhZjlkMjI0ODMwNDNmMGVhMjkwYzUxOTdhNmIzZDUzZDhlYTFhOWMxODQ5NDQ0YWZlYSIsImlhdCI6MTc2MjA0NjM0OC42ODY0ODYsIm5iZiI6MTc2MjA0NjM0OC42ODY0ODksImV4cCI6MTc5MzU4MjM0OC42NzY2ODUsInN1YiI6IjlmNzZhOWMzLWIwNzQtNDE0Mi04OWU2LTc0MjJjOTdjOTEwZSIsInNjb3BlcyI6WyJjYXJ0LXJlYWQiLCJjYXJ0LXdyaXRlIiwiY29tcGFuaWVzLXJlYWQiLCJjb21wYW5pZXMtd3JpdGUiLCJjb3Vwb25zLXJlYWQiLCJjb3Vwb25zLXdyaXRlIiwibm90aWZpY2F0aW9ucy1yZWFkIiwib3JkZXJzLXJlYWQiLCJwcm9kdWN0cy1yZWFkIiwicHJvZHVjdHMtZGVzdHJveSIsInByb2R1Y3RzLXdyaXRlIiwicHVyY2hhc2VzLXJlYWQiLCJzaGlwcGluZy1jYWxjdWxhdGUiLCJzaGlwcGluZy1jYW5jZWwiLCJzaGlwcGluZy1jaGVja291dCIsInNoaXBwaW5nLWNvbXBhbmllcyIsInNoaXBwaW5nLWdlbmVyYXRlIiwic2hpcHBpbmctcHJldmlldyIsInNoaXBwaW5nLXByaW50Iiwic2hpcHBpbmctc2hhcmUiLCJzaGlwcGluZy10cmFja2luZyIsImVjb21tZXJjZS1zaGlwcGluZyIsInRyYW5zYWN0aW9ucy1yZWFkIiwidXNlcnMtcmVhZCIsInVzZXJzLXdyaXRlIiwid2ViaG9va3MtcmVhZCIsIndlYmhvb2tzLXdyaXRlIiwid2ViaG9va3MtZGVsZXRlIiwidGRlYWxlci13ZWJob29rIl19.lis-IOulM3Tc_Y8p6QeM9M7dkxcoqf1vlOhDVKG44aMvRUmqt0DhzR5wgvNCgjVzs3EICEFWUz6VKV0g-B-n45PZgx963CZCtoUED2V9HN6Zo83tZjEIXRM3hgtvivL6thvJJdv25-HeIS_J3mob3woecFewjNVApgE5NHjMSRGe_MpjiMlV_DW0fCY3_lhqtI_y94-wJYZmcRbDJ0FXo5RanKplu5Xz4GDHrYVO3YOUYH1OjzJ3LlQf_DMDQJ53AT2Aa12cTuwR3anFHYyEY9btFyyVZVn6zbeDSYi1rFHMgQsN4B49win3p8lJYGtfqc8LVGoE8plAUxlpapJNGFudvVBpT8QhBAuNULhrLKD5PbJtXrE-R_s6RNvlHIwFj0_42gjyrOAsyRW3n1ApjCsPRQBdmInXGqFftc1rP4kiLd0_Cs9TY7cD3DdWODZYROO3TDy2lNc1JjFO6ZXCfUVS6J1kZUTlEa7hK77O8OuG1Ue5IabcTm2HWMNTDZDfJEnbNSx4eNpx5wFCPRDprmTnu6WoEGzOjlE91nZWNBgKreuRcmEXtQ6eKA-BE5QrBG-RW4V4F6TD0I7zLbgy8XqxwDnOfzT9EFZUG1m6PplFjldVhH0-QnB4HYmgkXZyqOj7yd7RZZDI4lCjDOZnD3J2UcPhQ9q6hwi78cf6ImQ';

const SUPABASE_URL = 'https://rprucmoavblepodvanga.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcnVjbW9hdmJsZXBvZHZhbmdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIxMzMyNywiZXhwIjoyMDc1Nzg5MzI3fQ.m2lfjTYPb4nHrge17kYmL1Gny8zrnOV5jzrZvn7Ib24';

async function salvarToken() {
  console.log('\n🔧 Processando token...\n');
  
  // Decodificar JWT para extrair informações
  const tokenParts = TOKEN.split('.');
  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
  
  console.log('📋 Informações do Token:');
  console.log('  - Expira em:', new Date(payload.exp * 1000).toLocaleString('pt-BR'));
  console.log('  - Emitido em:', new Date(payload.iat * 1000).toLocaleString('pt-BR'));
  console.log('  - Scopes:', payload.scopes.length, 'permissões');
  console.log('  - Válido por:', Math.floor((payload.exp - payload.iat) / 86400), 'dias');
  console.log('');

  const expiresAt = new Date(payload.exp * 1000).toISOString();
  const expiresIn = Math.floor(payload.exp - payload.iat); // em segundos (inteiro)

  console.log('💾 Salvando token no Supabase...\n');

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
      refresh_token: '', // Campo obrigatório mas pode ser vazio inicialmente
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
  
  console.log('✅ Token salvo com sucesso no Supabase!');
  console.log('');
  console.log('📊 Registro atualizado:');
  console.log('  - ID:', data[0]?.id);
  console.log('  - Token Type:', data[0]?.token_type);
  console.log('  - Expires At:', new Date(data[0]?.expires_at).toLocaleString('pt-BR'));
  console.log('');
  console.log('🎉 Pronto! Sua aplicação agora pode calcular fretes!');
  console.log('');
  console.log('⚠️  LEMBRETE:');
  console.log('  - Token expira em:', new Date(payload.exp * 1000).toLocaleDateString('pt-BR'));
  console.log('  - Você precisará renovar antes dessa data');
  console.log('');
  console.log('🧪 Teste agora:');
  console.log('  1. Acesse uma loja: https://c4franquiaas.netlify.app/loja/SEU_SLUG');
  console.log('  2. Adicione um produto ao carrinho');
  console.log('  3. Digite seu CEP na calculadora de frete');
  console.log('  4. As opções do Melhor Envio devem aparecer!');
  console.log('');
}

salvarToken().catch(console.error);
