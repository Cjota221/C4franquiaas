import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await request.json();
    const { cep, dominio } = body;

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

    // Buscar configurações de frete da loja
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('id, nome, frete_gratis_valor, valor_frete')
      .eq('dominio', dominio)
      .eq('ativo', true)
      .single();

    if (lojaError || !loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
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

    // Valores padrão se não configurados
    const valorFrete = loja.valor_frete || 15.90;
    const freteGratisValor = loja.frete_gratis_valor || 150.00;

    // Retornar simulação de frete
    return NextResponse.json({
      success: true,
      cep: cepLimpo,
      opcoes: [
        {
          nome: 'Correios - PAC',
          valor: valorFrete,
          prazo: '7-10 dias úteis',
          codigo: 'PAC',
        },
        {
          nome: 'Frete Grátis',
          valor: 0,
          prazo: '10-15 dias úteis',
          codigo: 'GRATIS',
          disponivel: false, // Será true se o valor do carrinho for >= freteGratisValor
          valorMinimo: freteGratisValor,
          mensagem: `Frete grátis para compras acima de R$ ${freteGratisValor.toFixed(2)}`,
        },
      ],
      configuracao: {
        valorFrete,
        freteGratisValor,
      },
    });

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
