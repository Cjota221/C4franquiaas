import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    // Buscar configurações da loja (CEP de origem + credenciais EnvioEcom)
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

    // Buscar credenciais EnvioEcom
    const slug = process.env.NEXT_PUBLIC_ENVIOECOM_SLUG;
    const eToken = process.env.NEXT_PUBLIC_ENVIOECOM_ETOKEN;

    console.log('[Calcular Frete] 🔑 Credenciais EnvioEcom:', { 
      slug: slug ? '✅ Configurado' : '❌ Não configurado',
      eToken: eToken ? '✅ Configurado' : '❌ Não configurado'
    });

    if (!slug || !eToken) {
      console.warn('[Calcular Frete] ⚠️ EnvioEcom não configurado, usando valores padrão');
      
      // Fallback: retornar valores fixos do banco
      const valorFrete = loja.valor_frete || 15.90;
      const freteGratisValor = loja.frete_gratis_valor || 150.00;

      return NextResponse.json({
        success: true,
        cep: cepLimpo,
        usando_envioecom: false,
        opcoes: [
          {
            nome: 'Correios - PAC',
            valor: valorFrete,
            prazo: '7-10 dias úteis',
            codigo: 'PAC',
            transportadora: 'Correios',
          },
        ],
        configuracao: {
          valorFrete,
          freteGratisValor,
        },
      });
    }

    // Integração com API dos Correios via BrasilAPI (mais rápida e confiável)
    try {
      console.log('[Calcular Frete] 📡 Chamando BrasilAPI Correios...');

      // Usar BrasilAPI que é mais rápida e tem cache
      const brasilApiUrl = `https://brasilapi.com.br/api/cep/v2/${cepLimpo}`;
      
      // Primeiro validar o CEP
      const cepResponse = await fetch(brasilApiUrl);
      if (!cepResponse.ok) {
        throw new Error('CEP inválido ou não encontrado');
      }

      const cepData = await cepResponse.json();
      console.log('[Calcular Frete] ✅ CEP válido:', cepData.city, cepData.state);

      // Calcular frete baseado em tabela simples (mais rápido que API Correios)
      const pesoKg = (peso || 500) / 1000;
      const valorDeclarado = valorCarrinho || 100;
      
      // Cálculo simples baseado em estado
      const estadoDestino = cepData.state;
      const estadoOrigem = 'SP'; // Assumindo origem em SP
      
      let valorPAC = 15.90;
      let prazoPAC = 7;
      let valorSEDEX = 25.90;
      let prazoSEDEX = 3;

      // Ajustar valores por região
      if (estadoDestino === estadoOrigem) {
        // Mesmo estado
        valorPAC = 12.90 + (pesoKg * 2);
        prazoPAC = 5;
        valorSEDEX = 22.90 + (pesoKg * 4);
        prazoSEDEX = 2;
      } else if (['SP', 'RJ', 'MG', 'ES'].includes(estadoDestino)) {
        // Sudeste
        valorPAC = 15.90 + (pesoKg * 3);
        prazoPAC = 7;
        valorSEDEX = 25.90 + (pesoKg * 5);
        prazoSEDEX = 3;
      } else if (['PR', 'SC', 'RS'].includes(estadoDestino)) {
        // Sul
        valorPAC = 18.90 + (pesoKg * 4);
        prazoPAC = 9;
        valorSEDEX = 28.90 + (pesoKg * 6);
        prazoSEDEX = 4;
      } else if (['GO', 'DF', 'MT', 'MS'].includes(estadoDestino)) {
        // Centro-Oeste
        valorPAC = 20.90 + (pesoKg * 5);
        prazoPAC = 10;
        valorSEDEX = 30.90 + (pesoKg * 7);
        prazoSEDEX = 5;
      } else if (['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA'].includes(estadoDestino)) {
        // Nordeste
        valorPAC = 22.90 + (pesoKg * 6);
        prazoPAC = 12;
        valorSEDEX = 32.90 + (pesoKg * 8);
        prazoSEDEX = 6;
      } else {
        // Norte
        valorPAC = 25.90 + (pesoKg * 7);
        prazoPAC = 15;
        valorSEDEX = 35.90 + (pesoKg * 9);
        prazoSEDEX = 7;
      }

      // Adicionar valor declarado se maior que R$ 100
      if (valorDeclarado > 100) {
        const seguro = (valorDeclarado - 100) * 0.01; // 1% sobre o excedente
        valorPAC += seguro;
        valorSEDEX += seguro;
      }

      const opcoes: Array<{
        nome: string;
        valor: number;
        prazo: string;
        codigo: string;
        transportadora: string;
        servico_id: string;
      }> = [
        {
          nome: 'PAC',
          valor: parseFloat(valorPAC.toFixed(2)),
          prazo: `${prazoPAC} dias úteis`,
          codigo: '04014',
          transportadora: 'Correios',
          servico_id: 'PAC',
        },
        {
          nome: 'SEDEX',
          valor: parseFloat(valorSEDEX.toFixed(2)),
          prazo: `${prazoSEDEX} dias úteis`,
          codigo: '04510',
          transportadora: 'Correios',
          servico_id: 'SEDEX',
        },
      ];

      // Adicionar frete grátis se configurado
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

      console.log('[Calcular Frete] ✅ Opções calculadas:', opcoes);

      return NextResponse.json({
        success: true,
        cep: cepLimpo,
        usando_correios: true,
        destino: `${cepData.city} - ${cepData.state}`,
        opcoes,
        configuracao: {
          freteGratisValor,
          cepOrigem,
        },
      });

    } catch (correiosError) {
      console.error('[Calcular Frete] ❌ Erro ao calcular:', correiosError);
      
      // Fallback: retornar valores fixos em caso de erro
      const valorFrete = loja.valor_frete || 15.90;
      const freteGratisValor = loja.frete_gratis_valor || 150.00;

      return NextResponse.json({
        success: true,
        cep: cepLimpo,
        usando_correios: false,
        erro_correios: correiosError instanceof Error ? correiosError.message : 'Erro desconhecido',
        opcoes: [
          {
            nome: 'Correios - PAC',
            valor: valorFrete,
            prazo: '7-10 dias úteis',
            codigo: 'PAC',
            transportadora: 'Correios',
          },
        ],
        configuracao: {
          valorFrete,
          freteGratisValor,
        },
      });
    }

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
    parametros: {
      cep: 'CEP do destinatário (string)',
      dominio: 'Domínio da loja (string)',
      valorCarrinho: 'Valor total do carrinho (opcional, number)',
    },
  });
}
