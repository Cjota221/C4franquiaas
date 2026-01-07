// Teste de envio REAL de mensagem Z-API
const ZAPI_URL = 'https://api.z-api.io';
const ZAPI_INSTANCE = '3ECCD8713101A309AEF772442EF70706';
const ZAPI_TOKEN = '1B66E9CCF35754A13C39368A';

async function testarEnvioMensagem() {
  console.log('🧪 Testando ENVIO de mensagem Z-API...\n');
  
  // IMPORTANTE: Coloque SEU número aqui (DDI + DDD + número)
  // Exemplo: 5511999999999
  const meuNumero = '5562982237075'; // ✅ Número da Carol
  
  console.log('📱 Enviando para:', meuNumero);
  console.log('💬 Mensagem: "Teste Z-API funcionando!"\n');
  
  const url = `${ZAPI_URL}/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: meuNumero,
        message: '🎉 Teste Z-API funcionando! Se você recebeu esta mensagem, está tudo OK!'
      })
    });
    
    const data = await response.json();
    
    console.log('📡 Status:', response.status);
    console.log('\n✅ Resposta da API:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n🎉 SUCESSO! Verifique seu WhatsApp!');
    } else {
      console.log('\n❌ Erro ao enviar. Detalhes acima.');
    }
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

console.log('⚠️  ANTES DE RODAR: Edite o arquivo e coloque SEU número na linha 9!');
console.log('    Formato: DDI + DDD + número (ex: 5511999999999)\n');

testarEnvioMensagem();
