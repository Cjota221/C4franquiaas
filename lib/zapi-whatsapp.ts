/**
 * 📱 Cliente Z-API para WhatsApp
 * 
 * Documentação: https://developer.z-api.io/
 */

const ZAPI_URL = 'https://api.z-api.io';
const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE_ID;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;

interface SendMessageParams {
  phone: string; // Ex: 5511999999999 (com DDI + DDD, sem +)
  message: string;
}

interface SendImageParams extends SendMessageParams {
  imageUrl: string;
  caption?: string;
}

/**
 * Envia mensagem de texto via WhatsApp
 */
export async function sendWhatsAppMessage({ phone, message }: SendMessageParams) {
  try {
    // Z-API usa o formato completo da URL com instance e token
    const response = await fetch(
      `${ZAPI_URL}/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': ZAPI_TOKEN, // Tentando header também
        },
        body: JSON.stringify({
          phone,
          message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao enviar mensagem Z-API:', data);
      throw new Error(data.message || data.error || 'Erro ao enviar mensagem');
    }

    console.log('✅ Mensagem enviada com sucesso:', phone);
    return data;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem WhatsApp:', error);
    throw error;
  }
}

/**
 * Envia imagem com legenda via WhatsApp
 */
export async function sendWhatsAppImage({ phone, imageUrl, caption }: SendImageParams) {
  try {
    const response = await fetch(
      `${ZAPI_URL}/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          image: imageUrl,
          caption: caption || '',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao enviar imagem Z-API:', data);
      throw new Error(data.message || 'Erro ao enviar imagem');
    }

    console.log('✅ Imagem enviada com sucesso:', phone);
    return data;
  } catch (error) {
    console.error('❌ Erro ao enviar imagem WhatsApp:', error);
    throw error;
  }
}

/**
 * Verifica se a instância está conectada
 */
export async function checkWhatsAppConnection() {
  try {
    const response = await fetch(
      `${ZAPI_URL}/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/status`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();
    return data.connected || false;
  } catch (error) {
    console.error('❌ Erro ao verificar conexão WhatsApp:', error);
    return false;
  }
}

/**
 * Templates de mensagens prontas
 */
export const WhatsAppTemplates = {
  /**
   * Mensagem de aprovação de cadastro
   */
  aprovacaoCadastro: (nome: string, linkLoja: string) => `
🎉 *Parabéns, ${nome}!*

Seu cadastro como revendedora foi *APROVADO!* ✅

Agora você já pode:
✨ Acessar sua loja personalizada
🎨 Personalizar cores e logo
📦 Ativar produtos do catálogo
💰 Definir suas margens de lucro

🔗 *Sua loja:*
${linkLoja}

📱 *Login:* Use o mesmo email e senha do cadastro

Qualquer dúvida, estamos aqui para ajudar! 💙

_Equipe C4 Franquias_
  `.trim(),

  /**
   * Mensagem de rejeição de cadastro
   */
  rejeicaoCadastro: (nome: string, motivo?: string) => `
Olá, ${nome}.

Infelizmente não foi possível aprovar seu cadastro no momento. ❌

${motivo ? `*Motivo:* ${motivo}\n` : ''}
Se tiver alguma dúvida ou quiser revisar sua solicitação, entre em contato conosco.

Estamos à disposição! 📱

_Equipe C4 Franquias_
  `.trim(),

  /**
   * Mensagem de novo pedido recebido
   */
  novoPedido: (numeropedido: string, valor: number, nomeCliente: string) => `
🛍️ *Novo Pedido Recebido!*

*Pedido:* #${numeropedido}
*Cliente:* ${nomeCliente}
*Valor:* R$ ${valor.toFixed(2)}

Acesse o painel para ver os detalhes e processar o pedido!

_Equipe C4 Franquias_
  `.trim(),

  /**
   * Mensagem de boas-vindas
   */
  boasVindas: (nome: string) => `
Olá, ${nome}! 👋

Seja bem-vinda ao programa de revendedoras C4 Franquias!

Seu cadastro está em análise e você receberá uma resposta em breve. ⏳

Fique de olho no WhatsApp! 📱

_Equipe C4 Franquias_
  `.trim(),
};
