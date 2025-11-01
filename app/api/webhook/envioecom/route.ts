import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Ler o payload
    const payload = await request.json();
    
    // 2. Ler o token de autenticação do header
    const authHeader = request.headers.get('authorization');
    const receivedToken = authHeader?.replace('Bearer ', '');

    // 3. Ler headers para log
    const headers = {
      authorization: authHeader,
      'content-type': request.headers.get('content-type'),
      'user-agent': request.headers.get('user-agent'),
    };

    // 4. Buscar configuração e validar token
    const { data: config, error: configError } = await supabase
      .from('config_envioecom')
      .select('*')
      .eq('ativo', true)
      .single();

    const tokenValido = !configError && config && receivedToken === config.webhook_token;

    // 5. Registrar log do webhook
    const { error: logError } = await supabase
      .from('envioecom_webhook_logs')
      .insert({
        evento: payload.evento || payload.event || 'unknown',
        payload: payload,
        headers: headers,
        token_valido: tokenValido,
        processado: false,
      });

    if (logError) {
      console.error('Erro ao salvar log:', logError);
    }

    // 6. Validar token
    if (!tokenValido) {
      console.error('Token inválido ou configuração não encontrada');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 7. Processar o webhook baseado no tipo de evento
    let processado = false;
    let erro = null;

    try {
      const evento = payload.evento || payload.event;
      
      switch (evento) {
        case 'rastreamento_atualizado':
        case 'tracking_updated':
          // Atualizar código de rastreio na venda
          if (payload.codigo_rastreio && payload.pedido_id) {
            const { error: updateError } = await supabase
              .from('vendas')
              .update({
                codigo_rastreio: payload.codigo_rastreio,
                transportadora: payload.transportadora,
                prazo_entrega_dias: payload.prazo_entrega_dias,
                status_envio: 'ENVIADO',
              })
              .eq('id', payload.pedido_id);

            if (updateError) {
              throw updateError;
            }
          }
          processado = true;
          break;

        case 'etiqueta_gerada':
        case 'label_generated':
          // Salvar URL da etiqueta
          if (payload.url_etiqueta && payload.pedido_id) {
            const { error: updateError } = await supabase
              .from('vendas')
              .update({
                url_etiqueta: payload.url_etiqueta,
                servico_envioecom_id: payload.servico_id,
              })
              .eq('id', payload.pedido_id);

            if (updateError) {
              throw updateError;
            }
          }
          processado = true;
          break;

        case 'entrega_realizada':
        case 'delivered':
          // Atualizar status para entregue
          if (payload.pedido_id) {
            const { error: updateError } = await supabase
              .from('vendas')
              .update({
                status_envio: 'ENTREGUE',
              })
              .eq('id', payload.pedido_id);

            if (updateError) {
              throw updateError;
            }
          }
          processado = true;
          break;

        default:
          console.log('Evento não tratado:', evento);
          processado = false;
      }
    } catch (processingError) {
      console.error('Erro ao processar webhook:', processingError);
      erro = processingError instanceof Error ? processingError.message : 'Erro desconhecido';
      processado = false;
    }

    // 8. Atualizar log com status de processamento
    await supabase
      .from('envioecom_webhook_logs')
      .update({
        processado,
        erro,
      })
      .eq('payload', payload);

    // 9. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Webhook recebido e processado',
      processado,
    });

  } catch (error) {
    console.error('Erro no webhook EnvioEcom:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Método GET para teste
export async function GET() {
  return NextResponse.json({
    service: 'EnvioEcom Webhook',
    status: 'active',
    endpoint: '/api/webhook/envioecom',
    method: 'POST',
    authentication: 'Bearer token in Authorization header',
  });
}
