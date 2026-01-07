// Script de teste rápido Z-API
const ZAPI_URL = 'https://api.z-api.io';
const ZAPI_INSTANCE = '3ECCD8713101A309AEF772442EF70706';
const ZAPI_TOKEN = '1B66E9CCF35754A13C39368A';

async function testarZAPI() {
  console.log('🧪 Testando conexão Z-API...\n');
  
  // Tentar MÉTODO 1: Token na URL
  const url1 = `${ZAPI_URL}/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/status`;
  console.log('📡 Método 1 - Token na URL:', url1);
  
  try {
    const response1 = await fetch(url1);
    const data1 = await response1.json();
    
    console.log('\n✅ Resposta Método 1:');
    console.log(JSON.stringify(data1, null, 2));
    
    if (data1.connected) {
      console.log('\n🎉 WhatsApp está CONECTADO (Método 1)!');
      return;
    }
  } catch (error) {
    console.error('\n❌ Erro Método 1:', error.message);
  }
  
  // Tentar MÉTODO 2: Token no Header
  console.log('\n\n📡 Método 2 - Token no Header');
  const url2 = `${ZAPI_URL}/instances/${ZAPI_INSTANCE}/status`;
  console.log('URL:', url2);
  
  try {
    const response2 = await fetch(url2, {
      headers: {
        'Client-Token': ZAPI_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    const data2 = await response2.json();
    
    console.log('\n✅ Resposta Método 2:');
    console.log(JSON.stringify(data2, null, 2));
    
    if (data2.connected) {
      console.log('\n🎉 WhatsApp está CONECTADO (Método 2)!');
    } else {
      console.log('\n❌ WhatsApp NÃO está conectado');
      console.log('💡 Verifique no painel: https://app.z-api.io/');
    }
  } catch (error) {
    console.error('\n❌ Erro Método 2:', error.message);
  }
}

testarZAPI();
