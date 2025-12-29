import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { sendWhatsAppMessage, WhatsAppTemplates, isEvolutionConfigured } from '@/lib/whatsapp/evolution';

// Template de email de aprovação
function getApprovalEmailHTML(nome: string, nomeLoja: string, loginUrl: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conta Aprovada!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Parabéns!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Sua conta foi aprovada</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #374151; margin: 0 0 20px;">
            Olá, <strong>${nome}</strong>!
          </p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Temos uma ótima notícia! Sua solicitação de cadastro como revendedora foi 
            <strong style="color: #059669;">aprovada</strong>! 🎊
          </p>
          
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>🏪 Sua Loja:</strong> ${nomeLoja}
            </p>
          </div>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Agora você pode acessar o painel de revendedora e começar a vender!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Acessar Minha Conta
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px;">
              <strong>Próximos passos:</strong>
            </p>
            <ol style="font-size: 14px; color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Acesse sua conta com o email e senha cadastrados</li>
              <li>Personalize sua loja (cores, logo, banner)</li>
              <li>Selecione os produtos que deseja vender</li>
              <li>Compartilhe o link da sua loja com seus clientes!</li>
            </ol>
          </div>
          
          <p style="font-size: 14px; color: #9ca3af; margin: 30px 0 0; text-align: center;">
            Dúvidas? Entre em contato conosco.
          </p>
        </div>
        
        <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
          Este email foi enviado automaticamente. Por favor, não responda.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// Template de email de rejeição
function getRejectionEmailHTML(nome: string, motivo?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atualização do Cadastro</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <div style="background: #6b7280; padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Atualização do Cadastro</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #374151; margin: 0 0 20px;">
            Olá, <strong>${nome}</strong>!
          </p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Infelizmente, não foi possível aprovar sua solicitação de cadastro como revendedora neste momento.
          </p>
          
          ${motivo ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              <strong>Motivo:</strong> ${motivo}
            </p>
          </div>
          ` : ''}
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Se você acredita que houve algum engano ou gostaria de mais informações, 
            entre em contato conosco para esclarecimentos.
          </p>
          
          <p style="font-size: 14px; color: #9ca3af; margin: 30px 0 0; text-align: center;">
            Agradecemos seu interesse!
          </p>
        </div>
        
        <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
          Este email foi enviado automaticamente. Por favor, não responda.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resellerId, action, motivo } = body;

    if (!resellerId || !action) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    if (!['aprovar', 'rejeitar'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Buscar dados da revendedora (incluindo telefone para WhatsApp)
    const { data: reseller, error: fetchError } = await supabase
      .from('resellers')
      .select('id, name, email, phone, store_name, user_id')
      .eq('id', resellerId)
      .single();

    if (fetchError || !reseller) {
      return NextResponse.json({ error: 'Revendedora não encontrada' }, { status: 404 });
    }

    // Atualizar status
    const updateData = action === 'aprovar' 
      ? { status: 'aprovada', is_active: true, approved_at: new Date().toISOString() }
      : { status: 'rejeitada', is_active: false, rejection_reason: motivo || null };

    const { error: updateError } = await supabase
      .from('resellers')
      .update(updateData)
      .eq('id', resellerId);

    if (updateError) {
      console.error('[aprovar-revendedora] Erro ao atualizar:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
    }

    // Enviar email de notificação
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://c4franquiaas.netlify.app';
    const loginUrl = `${baseUrl}/login/revendedora`;

    try {
      if (action === 'aprovar') {
        // Usar Supabase Auth para enviar email personalizado
        // Como alternativa, podemos usar uma edge function ou serviço externo
        
        // Por enquanto, vamos registrar que precisamos enviar o email
        console.log('[aprovar-revendedora] ✅ Revendedora aprovada:', reseller.email);
        console.log('[aprovar-revendedora] 📧 Email de aprovação seria enviado para:', reseller.email);
        
        // Se tiver Resend configurado, podemos usar:
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        
        if (RESEND_API_KEY) {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'C4 Franquias <noreply@c4franquias.com.br>',
              to: reseller.email,
              subject: '🎉 Sua conta foi aprovada! Bem-vinda à equipe!',
              html: getApprovalEmailHTML(reseller.name, reseller.store_name, loginUrl),
            }),
          });

          if (!emailResponse.ok) {
            console.error('[aprovar-revendedora] Erro ao enviar email via Resend');
          } else {
            console.log('[aprovar-revendedora] ✅ Email enviado via Resend');
          }
        }
        
      } else {
        console.log('[aprovar-revendedora] ❌ Revendedora rejeitada:', reseller.email);
        console.log('[aprovar-revendedora] 📧 Email de rejeição seria enviado para:', reseller.email);
        
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        
        if (RESEND_API_KEY) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'C4 Franquias <noreply@c4franquias.com.br>',
              to: reseller.email,
              subject: 'Atualização sobre seu cadastro',
              html: getRejectionEmailHTML(reseller.name, motivo),
            }),
          });
        }
      }
    } catch (emailErr) {
      // Não falhar a operação se o email não for enviado
      console.error('[aprovar-revendedora] Erro ao enviar email:', emailErr);
    }

    // ========================================
    // ENVIAR WHATSAPP (Evolution API)
    // ========================================
    let whatsappSent = false;
    
    if (isEvolutionConfigured() && reseller.phone) {
      try {
        if (action === 'aprovar') {
          const whatsappMessage = WhatsAppTemplates.resellerApproved(
            reseller.name,
            reseller.store_name,
            loginUrl
          );
          const result = await sendWhatsAppMessage({ phone: reseller.phone, message: whatsappMessage });
          whatsappSent = result.success;
          
          if (result.success) {
            console.log('[aprovar-revendedora] ✅ WhatsApp de aprovação enviado');
          }
        } else {
          const whatsappMessage = WhatsAppTemplates.resellerRejected(reseller.name, motivo);
          const result = await sendWhatsAppMessage({ phone: reseller.phone, message: whatsappMessage });
          whatsappSent = result.success;
        }
      } catch (whatsappErr) {
        console.error('[aprovar-revendedora] Erro ao enviar WhatsApp:', whatsappErr);
      }
    } else {
      console.log('[aprovar-revendedora] WhatsApp não configurado ou telefone ausente');
    }

    return NextResponse.json({ 
      success: true, 
      message: action === 'aprovar' 
        ? 'Revendedora aprovada com sucesso!' 
        : 'Revendedora rejeitada',
      emailSent: !!process.env.RESEND_API_KEY,
      whatsappSent
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    console.error('[aprovar-revendedora] Erro:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
