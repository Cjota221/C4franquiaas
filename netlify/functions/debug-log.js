// netlify/functions/debug-log.js

/**
 * Netlify Function (stub) para receber logs de diagnóstico do frontend.
 * 
 * Esta função é um placeholder e não implementa a lógica de armazenamento real.
 * Em um cenário de produção, você conectaria isso a um serviço de logging
 * como LogDNA, Sentry, ou um banco de dados.
 * 
 * Para invocar do frontend:
 * fetch('/.netlify/functions/debug-log', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ level: 'info', message: 'Debug message', payload: { ... } })
 * });
 */

exports.handler = async function(event) {
  // 1. Validação básica do request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const body = JSON.parse(event.body);
    
    // 2. Log no console da função (visível nos logs da Netlify)
    console.log('Received debug log:', JSON.stringify(body, null, 2));

    // 3. [Placeholder] Lógica de armazenamento
    // Ex: await saveToDatabase(body);
    // Ex: await sendToLoggingService(body);

    // 4. Resposta de sucesso
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok', message: 'Log received' }),
    };

  } catch (error) {
    console.error('Error processing debug log:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ status: 'error', message: 'Invalid JSON body' }),
    };
  }
};
