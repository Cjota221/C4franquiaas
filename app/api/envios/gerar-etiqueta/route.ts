import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MelhorEnvioService } from '@/lib/melhor-envio-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API para gerar etiqueta de envio
 * POST /api/envios/gerar-etiqueta
 * 
 * Body: {
 *   pedido_id: string,
 *   servico_id?: number (opcional, se não enviar, pega o mais barato)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { pedido_id, servico_id } = await request.json();

    if (!pedido_id) {
      return NextResponse.json(
        { error: 'pedido_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('[Gerar Etiqueta] Iniciando para pedido:', pedido_id);

    // 1. Buscar dados do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select(`
        *,
        franqueada:franqueadas(*)
      `)
      .eq('id', pedido_id)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // 2. Verificar se já existe envio para este pedido
    const { data: envioExistente } = await supabase
      .from('pedidos_envio')
      .select('*')
      .eq('pedido_id', pedido_id)
      .single();

    if (envioExistente && envioExistente.melhorenvio_order_id) {
      console.log('[Gerar Etiqueta] Envio já existe:', envioExistente.melhorenvio_order_id);
      return NextResponse.json({
        success: true,
        message: 'Etiqueta já foi gerada anteriormente',
        envio: envioExistente,
      });
    }

    // 3. Calcular frete (se servico_id não foi fornecido)
    let servicoEscolhido = servico_id;
    
    if (!servicoEscolhido) {
      console.log('[Gerar Etiqueta] Calculando melhor opção de frete...');
      
      const cotacao = await MelhorEnvioService.calcularFrete({
        cep_destino: pedido.cep.replace(/\D/g, ''),
        produtos: [{
          peso: 0.3, // Peso padrão (ajustar conforme produtos)
          altura: 10,
          largura: 15,
          comprimento: 20,
          valor: pedido.total,
        }],
      });

      // Pegar o mais barato
      servicoEscolhido = cotacao[0]?.id;
    }

    // 4. Adicionar ao carrinho do Melhor Envio
    console.log('[Gerar Etiqueta] Adicionando ao carrinho...');
    
    const carrinhoResult = await MelhorEnvioService.adicionarAoCarrinho({
      servico_id: servicoEscolhido,
      cep_destino: pedido.cep.replace(/\D/g, ''),
      produtos: [{
        nome: `Pedido #${pedido.numero_pedido}`,
        quantidade: 1,
        valor: pedido.total,
        peso: 0.3,
        altura: 10,
        largura: 15,
        comprimento: 20,
      }],
      destinatario: {
        nome: pedido.nome_cliente,
        telefone: pedido.telefone.replace(/\D/g, ''),
        email: pedido.email,
        documento: pedido.cpf?.replace(/\D/g, '') || '00000000000',
        endereco: pedido.endereco,
        numero: pedido.numero,
        complemento: pedido.complemento,
        bairro: pedido.bairro,
        cidade: pedido.cidade,
        estado: pedido.estado,
      },
    });

    const melhorenvio_order_id = carrinhoResult.id;

    console.log('[Gerar Etiqueta] Pedido adicionado ao carrinho:', melhorenvio_order_id);

    // 5. Fazer checkout
    console.log('[Gerar Etiqueta] Fazendo checkout...');
    const checkoutResult = await MelhorEnvioService.fazerCheckout([melhorenvio_order_id]);

    // 6. Gerar etiqueta
    console.log('[Gerar Etiqueta] Gerando etiqueta...');
    const etiquetaResult = await MelhorEnvioService.gerarEtiqueta([melhorenvio_order_id]);

    // 7. Salvar no banco de dados
    const envioData = {
      pedido_id,
      melhorenvio_order_id,
      melhorenvio_protocol: checkoutResult.purchase?.protocol || etiquetaResult[0]?.protocol,
      servico_id: servicoEscolhido,
      servico_nome: carrinhoResult.service_name,
      transportadora: carrinhoResult.company?.name,
      valor_frete: carrinhoResult.price,
      valor_declarado: pedido.total,
      peso: 0.3,
      altura: 10,
      largura: 15,
      comprimento: 20,
      codigo_rastreio: etiquetaResult[0]?.tracking,
      status_envio: 'generated', // Etiqueta gerada
      etiqueta_gerada_em: new Date().toISOString(),
      prazo_entrega: carrinhoResult.delivery_time,
      data_prevista_entrega: new Date(
        Date.now() + carrinhoResult.delivery_time * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    const { data: envio, error: envioError } = await supabase
      .from('pedidos_envio')
      .upsert(envioData)
      .select()
      .single();

    if (envioError) {
      console.error('[Gerar Etiqueta] Erro ao salvar envio:', envioError);
      throw envioError;
    }

    // 8. Registrar evento de rastreamento
    await supabase.from('envio_rastreamento').insert({
      envio_id: envio.id,
      status: 'generated',
      mensagem: 'Etiqueta de envio gerada',
      data_evento: new Date().toISOString(),
      origem: 'sistema',
    });

    // 9. Atualizar status do pedido
    await supabase
      .from('pedidos')
      .update({
        status_pagamento: 'enviado',
        data_envio: new Date().toISOString(),
      })
      .eq('id', pedido_id);

    console.log('[Gerar Etiqueta] ✅ Etiqueta gerada com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Etiqueta gerada com sucesso!',
      envio,
      codigo_rastreio: envio.codigo_rastreio,
    });

  } catch (error: unknown) {
    console.error('[Gerar Etiqueta] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar etiqueta';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
