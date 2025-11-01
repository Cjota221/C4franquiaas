import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ENVIOECOM_BASE_URL = 'https://api.envioecom.com.br/v1';

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

    // Integração REAL com EnvioEcom
    try {
      const cotacaoRequest = {
        origem: {
          cep: cepOrigem,
        },
        destino: {
          cep: cepLimpo,
        },
        pacotes: [
          {
            peso: peso || 500, // 500g padrão
            altura: altura || 10, // 10cm padrão
            largura: largura || 15, // 15cm padrão
            comprimento: comprimento || 20, // 20cm padrão
            valor_declarado: valorCarrinho || 100, // R$ 100 padrão
          },
        ],
      };

      console.log('[Calcular Frete] 📡 Chamando EnvioEcom API:', cotacaoRequest);

      const envioecomResponse = await fetch(`${ENVIOECOM_BASE_URL}/cotacao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${eToken}`,
          'X-User-Slug': slug,
        },
        body: JSON.stringify(cotacaoRequest),
      });

      console.log('[Calcular Frete] 📥 Response status:', envioecomResponse.status);

      if (!envioecomResponse.ok) {
        const errorText = await envioecomResponse.text();
        console.error('[Calcular Frete] ❌ EnvioEcom erro:', errorText);
        throw new Error(`EnvioEcom retornou erro: ${envioecomResponse.status} - ${errorText}`);
      }

      const envioecomData = await envioecomResponse.json();
      console.log('[Calcular Frete] ✅ EnvioEcom resposta:', envioecomData);

      if (!envioecomData.sucesso || !envioecomData.servicos) {
        console.error('[Calcular Frete] ❌ EnvioEcom não retornou serviços válidos');
        throw new Error('EnvioEcom não retornou serviços válidos');
      }

      // Formatar opções de frete
      const opcoes = envioecomData.servicos.map((servico: { nome?: string; transportadora?: string; preco?: number; prazo_entrega?: number; servico_id?: string }) => ({
        nome: servico.nome || servico.transportadora,
        valor: servico.preco || 0,
        prazo: `${servico.prazo_entrega || 0} dias úteis`,
        codigo: servico.servico_id || servico.nome,
        transportadora: servico.transportadora,
        servico_id: servico.servico_id, // Necessário para gerar etiqueta depois
      }));

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
        usando_envioecom: true,
        opcoes,
        configuracao: {
          freteGratisValor,
          cepOrigem,
        },
      });

    } catch (envioecomError) {
      console.error('[Calcular Frete] Erro na EnvioEcom:', envioecomError);
      
      // Fallback: retornar valores fixos em caso de erro na EnvioEcom
      const valorFrete = loja.valor_frete || 15.90;
      const freteGratisValor = loja.frete_gratis_valor || 150.00;

      return NextResponse.json({
        success: true,
        cep: cepLimpo,
        usando_envioecom: false,
        erro_envioecom: envioecomError instanceof Error ? envioecomError.message : 'Erro desconhecido',
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
