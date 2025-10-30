/**
 * SCRIPT DE TESTE DO WEBHOOK DO MERCADO PAGO
 * 
 * Como usar:
 * 1. Substitua SEU_DOMINIO pela URL do Netlify
 * 2. Substitua PAYMENT_ID_TESTE por um payment ID real
 * 3. Execute: node scripts/test-webhook.js
 */

const WEBHOOK_URL = 'https://SEU_DOMINIO.netlify.app/api/webhook/mercadopago';
const PAYMENT_ID_TESTE = '1234567890'; // Substitua por um payment ID real

async function testarWebhook() {
  console.log('🧪 Testando webhook do Mercado Pago...\n');
  
  // 1️⃣ Testar GET (validação)
  console.log('1️⃣ Testando endpoint GET (validação)...');
  try {
    const getResponse = await fetch(WEBHOOK_URL, {
      method: 'GET'
    });
    const getData = await getResponse.json();
    console.log('✅ GET Response:', getData);
    console.log('Status:', getResponse.status, '\n');
  } catch (error) {
    console.error('❌ Erro no GET:', error.message, '\n');
  }

  // 2️⃣ Testar POST (simulação de webhook)
  console.log('2️⃣ Testando POST (simulação de notificação)...');
  try {
    const postResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'payment',
        data: {
          id: PAYMENT_ID_TESTE
        }
      })
    });
    const postData = await postResponse.json();
    console.log('✅ POST Response:', postData);
    console.log('Status:', postResponse.status, '\n');
  } catch (error) {
    console.error('❌ Erro no POST:', error.message, '\n');
  }

  console.log('🎉 Teste concluído!\n');
  console.log('📋 Próximos passos:');
  console.log('   1. Se GET retornou 200 OK → Webhook está acessível ✅');
  console.log('   2. Se POST retornou erro 401 → Falta configurar MP_ACCESS_TOKEN ⚠️');
  console.log('   3. Se POST retornou "Venda não encontrada" → Normal (payment ID de teste) ℹ️');
  console.log('   4. Vá no Mercado Pago e configure a URL do webhook');
  console.log('   5. Faça um pagamento teste real e veja os logs no Netlify');
}

testarWebhook();
