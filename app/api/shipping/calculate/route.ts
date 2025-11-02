import { NextRequest, NextResponse } from 'next/server';
import { MelhorEnvioService } from '@/lib/melhor-envio-service';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface Quote {
  id: number;
  name: string;
  price: number | string;
  custom_price?: number | string;
  delivery_time: number;
  company: {
    id: number;
    name: string;
    picture: string;
  };
}

/**
 * POST /api/shipping/calculate
 * Calcula frete para um pedido
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Shipping Calculate] Body recebido:', JSON.stringify(body, null, 2));
    
    const { to, from, package: pkg, valorCarrinho } = body;

    // Validações
    if (!to?.postal_code) {
      console.error('[Shipping Calculate] CEP de destino não fornecido');
      return NextResponse.json(
        { success: false, error: 'CEP de destino obrigatório' },
        { status: 400 }
      );
    }

    // Limpar e validar CEPs
    const toCep = to.postal_code.toString().replace(/\D/g, '');
    const fromCep = (from?.postal_code || '13560340').toString().replace(/\D/g, '');
    
    console.log('[Shipping Calculate] CEPs limpos:', {
      to_original: to.postal_code,
      to_clean: toCep,
      from_original: from?.postal_code,
      from_clean: fromCep
    });
    
    // Validar tamanho dos CEPs
    if (toCep.length !== 8) {
      console.error('[Shipping Calculate] CEP de destino inválido:', toCep, 'length:', toCep.length);
      return NextResponse.json(
        { success: false, error: `CEP de destino inválido: "${to.postal_code}". Deve ter 8 dígitos.` },
        { status: 400 }
      );
    }
    
    if (fromCep.length !== 8) {
      console.error('[Shipping Calculate] CEP de origem inválido:', fromCep, 'length:', fromCep.length);
      return NextResponse.json(
        { success: false, error: `CEP de origem inválido: "${from?.postal_code}". Deve ter 8 dígitos.` },
        { status: 400 }
      );
    }

    // BUSCAR CONFIGURAÇÕES DO ADMIN
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Config geral
    const { data: configGeral } = await supabase
      .from('config_frete_geral')
      .select('*')
      .eq('id', 1)
      .single();
    
    // Serviços ativos
    const { data: servicosAtivos } = await supabase
      .from('config_servicos_frete')
      .select('*')
      .eq('ativo', true);
    
    console.log('[Shipping Calculate] Config carregada:', {
      taxa_embalagem: configGeral?.taxa_embalagem || 0,
      frete_gratis_acima: configGeral?.frete_gratis_acima,
      servicos_ativos: servicosAtivos?.length || 0
    });

    // Verificar frete grátis
    const valorCarrinhoNum = valorCarrinho || 0;
    const freteGratisAtivo = configGeral?.frete_gratis_acima && valorCarrinhoNum >= configGeral.frete_gratis_acima;
    
    if (freteGratisAtivo) {
      console.log('[Shipping Calculate] 🎁 FRETE GRÁTIS ativado!');
      return NextResponse.json({
        success: true,
        frete_gratis: true,
        quotes: [{
          id: 0,
          name: 'Frete Grátis',
          price: 0,
          custom_price: 0,
          delivery_time: configGeral?.prazo_adicional || 0,
          company: {
            id: 0,
            name: 'Frete Grátis',
            picture: ''
          }
        }],
        total: 1,
      });
    }

    // Preparar dados para o Melhor Envio usando dimensões configuradas
    const input = {
      from: {
        postal_code: fromCep,
      },
      to: {
        postal_code: toCep,
      },
      package: {
        weight: pkg?.weight || configGeral?.peso_padrao || 0.3,
        width: pkg?.width || configGeral?.largura_padrao || 12,
        height: pkg?.height || configGeral?.altura_padrao || 5,
        length: pkg?.length || configGeral?.comprimento_padrao || 25,
      },
    };

    console.log('[Shipping Calculate] Input preparado:', JSON.stringify(input, null, 2));

    // Chamar Melhor Envio
    let quotes;
    try {
      quotes = await MelhorEnvioService.calcularFrete(input);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Shipping Calculate] Erro do Melhor Envio:', errorMessage);
      
      // Se for erro 422 (CEP inválido), retornar mensagem amigável
      if (errorMessage?.includes('422')) {
        return NextResponse.json({
          success: false,
          error: 'CEP não encontrado ou sem cobertura de entrega. Verifique se o CEP está correto.',
          quotes: [],
        }, { status: 400 });
      }
      
      // Outros erros
      return NextResponse.json({
        success: false,
        error: 'Erro ao calcular frete. Tente novamente.',
        details: errorMessage,
        quotes: [],
      }, { status: 500 });
    }

    console.log('[Shipping Calculate] Quotes recebidas:', quotes?.length || 0);

    // Se não houver cotações, retornar erro amigável
    if (!quotes || quotes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma opção de envio disponível para este CEP',
        quotes: [],
      });
    }

    // FILTRAR APENAS SERVIÇOS ATIVOS
    let quotesFiltered = quotes;
    if (servicosAtivos && servicosAtivos.length > 0) {
      const idsAtivos = servicosAtivos.map(s => s.servico_id);
      quotesFiltered = quotes.filter((q: Quote) => idsAtivos.includes(q.id));
      console.log('[Shipping Calculate] Filtradas:', quotesFiltered.length, 'de', quotes.length);
    }

    // APLICAR TAXAS
    const taxaEmbalagemGlobal = configGeral?.taxa_embalagem || 0;
    const prazoAdicional = configGeral?.prazo_adicional || 0;
    
    const quotesComTaxas = quotesFiltered.map((quote: Quote) => {
      const servicoConfig = servicosAtivos?.find(s => s.servico_id === quote.id);
      const taxaAdicional = servicoConfig?.taxa_adicional || 0;
      
      const precoOriginal = parseFloat(quote.price?.toString() || quote.custom_price?.toString() || '0');
      const precoFinal = precoOriginal + taxaEmbalagemGlobal + taxaAdicional;
      const prazoFinal = (quote.delivery_time || 0) + prazoAdicional;
      
      console.log('[Shipping Calculate] Taxas aplicadas:', {
        servico: quote.name,
        preco_original: precoOriginal,
        taxa_global: taxaEmbalagemGlobal,
        taxa_servico: taxaAdicional,
        preco_final: precoFinal,
        prazo_original: quote.delivery_time,
        prazo_adicional: prazoAdicional,
        prazo_final: prazoFinal
      });
      
      return {
        ...quote,
        price: precoFinal,
        custom_price: precoFinal,
        delivery_time: prazoFinal,
        preco_original: precoOriginal,
        taxa_embalagem: taxaEmbalagemGlobal,
        taxa_adicional: taxaAdicional,
      };
    });

    // Ordenar por preço (mais barato primeiro)
    const sortedQuotes = quotesComTaxas.sort((a, b) => {
      const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price);
      const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price);
      return priceA - priceB;
    });

    return NextResponse.json({
      success: true,
      quotes: sortedQuotes,
      total: sortedQuotes.length,
      config_aplicada: {
        taxa_embalagem: taxaEmbalagemGlobal,
        prazo_adicional: prazoAdicional,
        servicos_filtrados: servicosAtivos?.length || 0
      }
    });

  } catch (error) {
    console.error('[Shipping Calculate] Erro:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao calcular frete',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
