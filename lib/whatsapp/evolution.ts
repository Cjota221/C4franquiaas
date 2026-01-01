import { NextResponse } from 'next/server';

/**
 * Evolution API - Cliente para envio de mensagens WhatsApp
 * 
 * Documentação: https://doc.evolution-api.com/
 * 
 * Para usar:
 * 1. Instale Evolution API em um servidor (Docker recomendado)
 * 2. Crie uma instância e conecte seu WhatsApp
 * 3. Configure as variáveis de ambiente:
 *    - EVOLUTION_API_URL (ex: https://sua-api.com)
 *    - EVOLUTION_API_KEY (sua chave de API)
 *    - EVOLUTION_INSTANCE (nome da instância conectada)
 */

interface SendMessageParams {
  phone: string;
  message: string;
}

interface SendMediaParams {
  phone: string;
  mediaUrl: string;
  caption?: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
}

interface SendButtonsParams {
  phone: string;
  title: string;
  description: string;
  footer?: string;
  buttons: Array<{ buttonId: string; buttonText: string }>;
}

// Formatar número de telefone para formato WhatsApp
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, '');
  
  // Se começar com 0, remove
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Se não tiver código do país, adiciona 55 (Brasil)
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

// Verificar se Evolution API está configurada
export function isEvolutionConfigured(): boolean {
  return !!(
    process.env.EVOLUTION_API_URL &&
    process.env.EVOLUTION_API_KEY &&
    process.env.EVOLUTION_INSTANCE
  );
}

// Enviar mensagem de texto simples
export async function sendWhatsAppMessage({ phone, message }: SendMessageParams): Promise<{ success: boolean; error?: string }> {
  if (!isEvolutionConfigured()) {
    console.log('[WhatsApp] Evolution API não configurada. Mensagem seria enviada para:', phone);
    console.log('[WhatsApp] Mensagem:', message);
    return { success: false, error: 'Evolution API não configurada' };
  }

  const API_URL = process.env.EVOLUTION_API_URL;
  const API_KEY = process.env.EVOLUTION_API_KEY;
  const INSTANCE = process.env.EVOLUTION_INSTANCE;

  try {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    
    const response = await fetch(`${API_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY!,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[WhatsApp] Erro ao enviar:', errorData);
      return { success: false, error: errorData.message || 'Erro ao enviar mensagem' };
    }

    console.log('[WhatsApp] ✅ Mensagem enviada para:', formattedPhone);
    return { success: true };

  } catch (error) {
    console.error('[WhatsApp] Exceção ao enviar mensagem:', error);
    return { success: false, error: 'Erro de conexão com Evolution API' };
  }
}

// Enviar imagem com legenda
export async function sendWhatsAppImage({ phone, mediaUrl, caption }: SendMediaParams): Promise<{ success: boolean; error?: string }> {
  if (!isEvolutionConfigured()) {
    console.log('[WhatsApp] Evolution API não configurada');
    return { success: false, error: 'Evolution API não configurada' };
  }

  const API_URL = process.env.EVOLUTION_API_URL;
  const API_KEY = process.env.EVOLUTION_API_KEY;
  const INSTANCE = process.env.EVOLUTION_INSTANCE;

  try {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    
    const response = await fetch(`${API_URL}/message/sendMedia/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY!,
      },
      body: JSON.stringify({
        number: formattedPhone,
        mediatype: 'image',
        media: mediaUrl,
        caption: caption || '',
      }),
    });

    if (!response.ok) {
      return { success: false, error: 'Erro ao enviar imagem' };
    }

    return { success: true };

  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar imagem:', error);
    return { success: false, error: 'Erro de conexão' };
  }
}

// Enviar mensagem com botões (interativa)
export async function sendWhatsAppButtons({ phone, title, description, footer, buttons }: SendButtonsParams): Promise<{ success: boolean; error?: string }> {
  if (!isEvolutionConfigured()) {
    return { success: false, error: 'Evolution API não configurada' };
  }

  const API_URL = process.env.EVOLUTION_API_URL;
  const API_KEY = process.env.EVOLUTION_API_KEY;
  const INSTANCE = process.env.EVOLUTION_INSTANCE;

  try {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    
    const response = await fetch(`${API_URL}/message/sendButtons/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY!,
      },
      body: JSON.stringify({
        number: formattedPhone,
        title,
        description,
        footer: footer || '',
        buttons: buttons.map(b => ({
          type: 'reply',
          reply: {
            id: b.buttonId,
            title: b.buttonText,
          }
        })),
      }),
    });

    if (!response.ok) {
      return { success: false, error: 'Erro ao enviar botões' };
    }

    return { success: true };

  } catch (error) {
    console.error('[WhatsApp] Erro ao enviar botões:', error);
    return { success: false, error: 'Erro de conexão' };
  }
}

// ============================================================================
// TEMPLATES DE MENSAGENS
// ============================================================================

export const WhatsAppTemplates = {
  // Aprovação de revendedora
  resellerApproved: (nome: string, nomeLoja: string, loginUrl: string) => `
🎉 *Parabéns, ${nome}!*

Sua conta de revendedora foi *APROVADA*! 

🏪 *Sua Loja:* ${nomeLoja}

Agora você pode acessar o painel e começar a vender!

👉 *Acesse:* ${loginUrl}

*Próximos passos:*
1️⃣ Faça login com seu email e senha
2️⃣ Personalize sua loja
3️⃣ Selecione os produtos
4️⃣ Compartilhe seu link!

---

💬 *JUNTE-SE À NOSSA COMUNIDADE!*

Entre no *Grupo das Franqueadas C4* para trocar experiências, tirar dúvidas e receber dicas exclusivas!

📱 *Link do Grupo:* https://chat.whatsapp.com/HXxGCfGyj6y8R6Cev785os

⚠️ *REGRAS DO GRUPO:*
• Falar apenas sobre o projeto C4 Franquias
• Proibido venda de outros produtos ou spam
• Imagens/conversas inadequadas = remoção imediata
• Violação das regras = desativação da conta

_Ao entrar no grupo, você concorda com as regras._

---

Bem-vinda à equipe! 💜
  `.trim(),

  // Rejeição de revendedora
  resellerRejected: (nome: string, motivo?: string) => `
Olá, ${nome}!

Infelizmente não foi possível aprovar sua solicitação de cadastro no momento.

${motivo ? `*Motivo:* ${motivo}` : ''}

Se tiver dúvidas, entre em contato conosco.

Agradecemos seu interesse! 🙏
  `.trim(),

  // Carrinho abandonado
  abandonedCart: (nome: string, itens: string, total: string, linkCarrinho: string) => `
Oi, ${nome}! 👋

Notamos que você deixou alguns produtos no carrinho:

${itens}

💰 *Total:* ${total}

Seus itens ainda estão disponíveis! Não perca essa oportunidade 😊

👉 Finalizar compra: ${linkCarrinho}

Precisa de ajuda? Estamos aqui! 💬
  `.trim(),

  // Pedido confirmado
  orderConfirmed: (nome: string, numeroPedido: string, itens: string, total: string) => `
✅ *Pedido Confirmado!*

Olá, ${nome}!

Seu pedido *#${numeroPedido}* foi confirmado com sucesso!

📦 *Itens:*
${itens}

💰 *Total:* ${total}

Você receberá atualizações sobre o envio em breve.

Obrigado pela compra! 💜
  `.trim(),

  // Pedido enviado
  orderShipped: (nome: string, numeroPedido: string, codigoRastreio: string, transportadora: string) => `
🚚 *Pedido Enviado!*

Olá, ${nome}!

Seu pedido *#${numeroPedido}* está a caminho!

📦 *Transportadora:* ${transportadora}
🔍 *Código de rastreio:* ${codigoRastreio}

Acompanhe pelo site da transportadora.

Boas compras! 💜
  `.trim(),

  // Boas-vindas novo cadastro
  welcomeNewReseller: (nome: string) => `
Olá, ${nome}! 👋

Recebemos sua solicitação de cadastro como revendedora!

Nosso time está analisando seus dados e em breve você receberá uma resposta.

Enquanto isso, siga-nos nas redes sociais para novidades! 📱

Obrigado pelo interesse! 💜
  `.trim(),
};

// ============================================================================
// API ROUTE HELPER
// ============================================================================

export async function handleWhatsAppNotification(
  type: keyof typeof WhatsAppTemplates,
  phone: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any
): Promise<NextResponse> {
  try {
    let message: string;

    switch (type) {
      case 'resellerApproved':
        message = WhatsAppTemplates.resellerApproved(params.nome, params.nomeLoja, params.loginUrl);
        break;
      case 'resellerRejected':
        message = WhatsAppTemplates.resellerRejected(params.nome, params.motivo);
        break;
      case 'abandonedCart':
        message = WhatsAppTemplates.abandonedCart(params.nome, params.itens, params.total, params.linkCarrinho);
        break;
      case 'orderConfirmed':
        message = WhatsAppTemplates.orderConfirmed(params.nome, params.numeroPedido, params.itens, params.total);
        break;
      case 'orderShipped':
        message = WhatsAppTemplates.orderShipped(params.nome, params.numeroPedido, params.codigoRastreio, params.transportadora);
        break;
      case 'welcomeNewReseller':
        message = WhatsAppTemplates.welcomeNewReseller(params.nome);
        break;
      default:
        return NextResponse.json({ error: 'Tipo de mensagem inválido' }, { status: 400 });
    }

    const result = await sendWhatsAppMessage({ phone, message });

    if (result.success) {
      return NextResponse.json({ success: true, message: 'WhatsApp enviado' });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

  } catch (error) {
    console.error('[WhatsApp] Erro:', error);
    return NextResponse.json({ error: 'Erro ao enviar WhatsApp' }, { status: 500 });
  }
}
