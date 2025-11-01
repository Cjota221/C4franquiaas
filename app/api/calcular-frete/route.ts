import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Função para usar Melhor Envio (se autorizado)
async function usarMelhorEnvio(
  cepOrigem: string,
  cepDestino: string,
  peso: number,
  altura: number,
  largura: number,
  comprimento: number,
  valorDeclarado: number
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar token do Melhor Envio
    const { data: config, error } = await supabase
      .from('config_melhorenvio')
      .select('access_token, expires_at')
      .eq('id', 1)
      .single();

    if (error || !config || !config.access_token) {
      console.log('[Melhor Envio] Token não encontrado, usando fallback');
      return null;
    }

    // Verificar se o token expirou
    if (config.expires_at && new Date(config.expires_at) < new Date()) {
      console.log('[Melhor Envio] Token expirado, usando fallback');
      return null;
    }

    const isSandbox = process.env.MELHORENVIO_SANDBOX === 'true';
    const baseUrl = isSandbox 
      ? 'https://sandbox.melhorenvio.com.br'
      : 'https://melhorenvio.com.br';

    console.log('[Melhor Envio] 📦 Cotando frete...');

    // Chamar API de cotação
    const response = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.access_token}`,
        'User-Agent': 'C4Franquias (carolina@c4franquias.com.br)',
      },
      body: JSON.stringify({
        from: {
          postal_code: cepOrigem,
        },
        to: {
          postal_code: cepDestino,
        },
        package: {
          height: altura || 10,
          width: largura || 15,
          length: comprimento || 20,
          weight: peso / 1000, // Converter gramas para kg
        },
        options: {
          insurance_value: valorDeclarado,
          receipt: false,
          own_hand: false,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Melhor Envio] ❌ Erro na API:', errorText);
      return null;
    }

    const cotacoes = await response.json();
    console.log('[Melhor Envio] ✅ Cotações recebidas:', cotacoes.length);

    // Formatar resposta
    interface MelhorEnvioCotacao {
      id: string;
      name: string;
      price: string;
      delivery_range: { min: number; max: number };
      company: {
        id: number;
        name: string;
        picture: string;
      };
    }

    const opcoes = (cotacoes as MelhorEnvioCotacao[]).map((cotacao) => ({
      nome: cotacao.name,
      valor: parseFloat(cotacao.price),
      prazo: `${cotacao.delivery_range.min}-${cotacao.delivery_range.max} dias úteis`,
      codigo: cotacao.company.name,
      transportadora: cotacao.company.name,
      servico_id: cotacao.id,
      company: {
        id: cotacao.company.id,
        name: cotacao.company.name,
        picture: cotacao.company.picture,
      },
    }));

    return {
      success: true,
      usando_melhorenvio: true,
      opcoes,
    };

  } catch (error) {
    console.error('[Melhor Envio] ❌ Erro:', error);
    return null;
  }
}

interface Loja {
  id: number;
  nome: string;
  frete_gratis_valor?: number;
  valor_frete?: number;
  cep_origem?: string;
  franqueada_id?: number;
}

// Função de fallback: cálculo por tabela quando Melhor Envio não está disponível
async function usarCalculoPorTabela(
  cepLimpo: string,
  cepOrigem: string,
  loja: Loja,
  peso?: number,
  valorCarrinho?: number
) {
  try {
    // Validar CEP com BrasilAPI
    const cepResponse = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`);
    if (!cepResponse.ok) {
      throw new Error('CEP inválido');
    }

    const cepData = await cepResponse.json();
    const estadoDestino = cepData.state;
    const pesoKg = (peso || 500) / 1000;

    // Cálculo por região
    let valorPAC = 15.90;
    let prazoPAC = 7;
    let valorSEDEX = 25.90;
    let prazoSEDEX = 3;

    if (estadoDestino === 'SP') {
      valorPAC = 12.90 + (pesoKg * 2);
      prazoPAC = 5;
      valorSEDEX = 22.90 + (pesoKg * 4);
      prazoSEDEX = 2;
    } else if (['RJ', 'MG', 'ES'].includes(estadoDestino)) {
      valorPAC = 15.90 + (pesoKg * 3);
      prazoPAC = 7;
      valorSEDEX = 25.90 + (pesoKg * 5);
      prazoSEDEX = 3;
    } else if (['PR', 'SC', 'RS'].includes(estadoDestino)) {
      valorPAC = 18.90 + (pesoKg * 4);
      prazoPAC = 9;
      valorSEDEX = 28.90 + (pesoKg * 6);
      prazoSEDEX = 4;
    } else if (['GO', 'DF', 'MT', 'MS'].includes(estadoDestino)) {
      valorPAC = 20.90 + (pesoKg * 5);
      prazoPAC = 10;
      valorSEDEX = 30.90 + (pesoKg * 7);
      prazoSEDEX = 5;
    } else if (['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA'].includes(estadoDestino)) {
      valorPAC = 22.90 + (pesoKg * 6);
      prazoPAC = 12;
      valorSEDEX = 32.90 + (pesoKg * 8);
      prazoSEDEX = 6;
    } else {
      valorPAC = 25.90 + (pesoKg * 7);
      prazoPAC = 15;
      valorSEDEX = 35.90 + (pesoKg * 9);
      prazoSEDEX = 7;
    }

    const opcoes = [
      {
        nome: 'PAC',
        valor: parseFloat(valorPAC.toFixed(2)),
        prazo: `${prazoPAC} dias úteis`,
        codigo: 'PAC',
        transportadora: 'Correios',
        servico_id: 'PAC',
      },
      {
        nome: 'SEDEX',
        valor: parseFloat(valorSEDEX.toFixed(2)),
        prazo: `${prazoSEDEX} dias úteis`,
        codigo: 'SEDEX',
        transportadora: 'Correios',
        servico_id: 'SEDEX',
      },
    ];

    const freteGratisValor = loja.frete_gratis_valor;
    if (freteGratisValor && valorCarrinho && valorCarrinho >= freteGratisValor) {
      opcoes.push({
        nome: 'Frete Grátis',
        valor: 0,
        prazo: '10-15 dias úteis',
        codigo: 'GRATIS',
        transportadora: 'Loja',
        servico_id: 'GRATIS',
      });
    }

    return NextResponse.json({
      success: true,
      cep: cepLimpo,
      usando_tabela: true,
      destino: `${cepData.city} - ${estadoDestino}`,
      opcoes,
      configuracao: {
        freteGratisValor,
        cepOrigem,
      },
    });
  } catch (error) {
    const valorFrete = loja.valor_frete || 15.90;
    const freteGratisValor = loja.frete_gratis_valor || 150.00;

    return NextResponse.json({
      success: true,
      cep: cepLimpo,
      usando_tabela: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
      opcoes: [
        {
          nome: 'Correios - PAC',
          valor: valorFrete,
          prazo: '7-10 dias úteis',
          codigo: 'PAC',
          transportadora: 'Correios',
          servico_id: 'PAC',
        },
      ],
      configuracao: {
        valorFrete,
        freteGratisValor,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await request.json();
    const { cep, dominio, valorCarrinho, peso, altura, largura, comprimento } = body;

    console.log('[Calcular Frete] 🚀 Request recebido:', { cep, dominio, valorCarrinho });

    if (!cep) {
      return NextResponse.json(
        { error: 'CEP é obrigatório' },
        { status: 400 }
      );
    }

    if (!dominio) {
      return NextResponse.json(
        { error: 'Domínio da loja é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar configurações da loja (CEP de origem para cálculo de frete)
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('id, nome, frete_gratis_valor, valor_frete, cep_origem, franqueada_id')
      .eq('dominio', dominio)
      .eq('ativo', true)
      .single();

    console.log('[Calcular Frete] 📦 Dados da loja:', { loja, lojaError });

    if (lojaError || !loja) {
      console.error('[Calcular Frete] ❌ Loja não encontrada:', lojaError);
      return NextResponse.json(
        { error: 'Loja não encontrada', details: lojaError },
        { status: 404 }
      );
    }

    // Limpar CEP (remover caracteres não numéricos)
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      return NextResponse.json(
        { error: 'CEP inválido' },
        { status: 400 }
      );
    }

    // CEP de origem - buscar da tabela ou usar padrão
    const cepOrigem = loja.cep_origem || '01310100'; // CEP padrão SP

    // PRIORIDADE 1: Tentar usar Melhor Envio (se autorizado)
    console.log('[Calcular Frete] 🔍 Tentando usar Melhor Envio...');
    const resultadoMelhorEnvio = await usarMelhorEnvio(
      cepOrigem,
      cepLimpo,
      peso || 500,
      altura || 10,
      largura || 15,
      comprimento || 20,
      valorCarrinho || 100
    );

    if (resultadoMelhorEnvio && resultadoMelhorEnvio.success) {
      console.log('[Calcular Frete] ✅ Usando cotação do Melhor Envio');
      return NextResponse.json({
        ...resultadoMelhorEnvio,
        cep: cepLimpo,
        configuracao: {
          freteGratisValor: loja.frete_gratis_valor || 150.00,
          cepOrigem,
        },
      });
    }

    // FALLBACK: Se Melhor Envio não estiver disponível, usar cálculo por tabela
    console.warn('[Calcular Frete] ⚠️ Melhor Envio não disponível, usando cálculo por tabela');
    return usarCalculoPorTabela(cepLimpo, cepOrigem, loja, peso, valorCarrinho);


  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    return NextResponse.json(
      {
        error: 'Erro ao calcular frete',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// Método GET para teste
export async function GET() {
  return NextResponse.json({
    service: 'Calculadora de Frete',
    status: 'active',
    method: 'POST',
    integracao: 'Melhor Envio + Fallback Tabela',
    parametros: {
      cep: 'CEP do destinatário (string)',
      dominio: 'Domínio da loja (string)',
      valorCarrinho: 'Valor total do carrinho (opcional, number)',
      peso: 'Peso em gramas (opcional, number)',
      altura: 'Altura em cm (opcional, number)',
      largura: 'Largura em cm (opcional, number)',
      comprimento: 'Comprimento em cm (opcional, number)',
    },
  });
}
