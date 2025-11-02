import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MelhorEnvioService } from '@/lib/melhor-envio-service';

interface TrackingEvent {
  date: string;
  status: string;
  message?: string;
  description?: string;
  location?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API para buscar rastreamento atualizado
 * GET /api/envios/rastreamento/[orderId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    console.log('[Rastreamento] Buscando para order ID:', orderId);

    // 1. Buscar envio no banco
    const { data: envio, error: envioError } = await supabase
      .from('pedidos_envio')
      .select(`
        *,
        pedido:pedidos(
          numero_pedido,
          nome_cliente,
          email,
          telefone
        )
      `)
      .eq('melhorenvio_order_id', orderId)
      .single();

    if (envioError || !envio) {
      return NextResponse.json(
        { error: 'Envio não encontrado' },
        { status: 404 }
      );
    }

    // 2. Buscar rastreamento atualizado do Melhor Envio
    let rastreamentoMelhorEnvio;
    try {
      rastreamentoMelhorEnvio = await MelhorEnvioService.rastrearEnvio(orderId);
    } catch (error) {
      console.warn('[Rastreamento] Erro ao buscar no Melhor Envio:', error);
      rastreamentoMelhorEnvio = null;
    }

    // 3. Se houver novos eventos, salvar no banco
    if (rastreamentoMelhorEnvio?.tracking) {
      const novosEventos = rastreamentoMelhorEnvio.tracking as TrackingEvent[];
      
      const { data: eventosExistentes } = await supabase
        .from('envio_rastreamento')
        .select('data_evento, status')
        .eq('envio_id', envio.id);

      // Filtrar novos eventos
      const eventosParaSalvar = novosEventos.filter((novoEvento: TrackingEvent) => {
        return !eventosExistentes?.some(
          (existe) =>
            existe.data_evento === novoEvento.date &&
            existe.status === novoEvento.status
        );
      });

      // Salvar novos eventos
      if (eventosParaSalvar.length > 0) {
        const eventosFormatados = eventosParaSalvar.map((evento: TrackingEvent) => ({
          envio_id: envio.id,
          status: evento.status,
          mensagem: evento.message || evento.description,
          localizacao: evento.location || '',
          data_evento: evento.date,
          origem: 'melhorenvio',
        }));

        await supabase.from('envio_rastreamento').insert(eventosFormatados);

        // Atualizar status do envio se mudou
        const ultimoEvento = novosEventos[novosEventos.length - 1];
        if (ultimoEvento.status !== envio.status_envio) {
          await supabase
            .from('pedidos_envio')
            .update({
              status_envio: ultimoEvento.status,
              ...(ultimoEvento.status === 'delivered' && {
                data_entrega: ultimoEvento.date,
              }),
            })
            .eq('id', envio.id);
        }
      }
    }

    // 4. Buscar histórico completo do banco
    const { data: historicoCompleto } = await supabase
      .from('envio_rastreamento')
      .select('*')
      .eq('envio_id', envio.id)
      .order('data_evento', { ascending: false });

    return NextResponse.json({
      success: true,
      envio: {
        ...envio,
        historico: historicoCompleto,
      },
      rastreamento_melhorenvio: rastreamentoMelhorEnvio,
    });
  } catch (error: unknown) {
    console.error('[Rastreamento] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar rastreamento' },
      { status: 500 }
    );
  }
}
