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

    // Integração com API dos Correios (REAL - grátis)
    try {
      console.log('[Calcular Frete] 📡 Chamando API dos Correios...');

      const correiosResponse = await fetch(
        `https://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx/CalcPrecoPrazo?` +
        `nCdEmpresa=&sDsSenha=&nCdServico=04014,04510&` + // PAC e SEDEX
        `sCepOrigem=${cepOrigem}&sCepDestino=${cepLimpo}&` +
        `nVlPeso=${(peso || 500) / 1000}&` + // converter gramas para kg
        `nCdFormato=1&` + // caixa/pacote
        `nVlComprimento=${comprimento || 20}&` +
        `nVlAltura=${altura || 10}&` +
        `nVlLargura=${largura || 15}&` +
        `nVlDiametro=0&` +
        `sCdMaoPropria=N&` +
        `nVlValorDeclarado=${valorCarrinho || 0}&` +
        `sCdAvisoRecebimento=N`,
        {
          method: 'GET',
        }
      );

      if (!correiosResponse.ok) {
        throw new Error(`Correios retornou erro: ${correiosResponse.status}`);
      }

      const correiosText = await correiosResponse.text();
      console.log('[Calcular Frete] 📥 Correios resposta:', correiosText.substring(0, 500));

      // Parse XML dos Correios
      const opcoes: Array<{
        nome: string;
        valor: number;
        prazo: string;
        codigo: string;
        transportadora: string;
        servico_id: string;
      }> = [];
      
      // Regex para extrair PAC
      const pacMatch = correiosText.match(/<Codigo>04014<\/Codigo>[\s\S]*?<Valor>([\d,]+)<\/Valor>[\s\S]*?<PrazoEntrega>(\d+)<\/PrazoEntrega>/);
      if (pacMatch) {
        opcoes.push({
          nome: 'PAC',
          valor: parseFloat(pacMatch[1].replace(',', '.')),
          prazo: `${pacMatch[2]} dias úteis`,
          codigo: '04014',
          transportadora: 'Correios',
          servico_id: 'PAC',
        });
      }

      // Regex para extrair SEDEX
      const sedexMatch = correiosText.match(/<Codigo>04510<\/Codigo>[\s\S]*?<Valor>([\d,]+)<\/Valor>[\s\S]*?<PrazoEntrega>(\d+)<\/PrazoEntrega>/);
      if (sedexMatch) {
        opcoes.push({
          nome: 'SEDEX',
          valor: parseFloat(sedexMatch[1].replace(',', '.')),
          prazo: `${sedexMatch[2]} dias úteis`,
          codigo: '04510',
          transportadora: 'Correios',
          servico_id: 'SEDEX',
        });
      }

      // Se não conseguiu extrair, usar fallback
      if (opcoes.length === 0) {
        throw new Error('Não foi possível extrair dados dos Correios');
      }

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

      return NextResponse.json({
        success: true,
        cep: cepLimpo,
        usando_correios: true,
        opcoes,
        configuracao: {
          freteGratisValor,
          cepOrigem,
        },
      });

    } catch (correiosError) {
      console.error('[Calcular Frete] ❌ Erro nos Correios:', correiosError);
      
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
