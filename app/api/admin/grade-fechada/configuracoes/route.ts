import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

/**
 * GET - Obter configurações do site
 */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('grade_fechada_configuracoes')
      .select('*');

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar configurações' },
        { status: 500 }
      );
    }

    // Transformar array em objeto chave-valor
    const config: Record<string, unknown> = {};
    data?.forEach((item) => {
      config[item.chave] = item.valor;
    });

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Atualizar configurações
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    // Atualizar cada configuração individualmente
    const updates = Object.entries(body).map(([chave, valor]) =>
      supabase
        .from('grade_fechada_configuracoes')
        .update({ valor, atualizado_em: new Date().toISOString() })
        .eq('chave', chave)
    );

    const results = await Promise.all(updates);

    // Verificar se alguma atualização falhou
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Erro ao atualizar configurações:', errors);
      return NextResponse.json(
        { error: 'Erro ao atualizar algumas configurações' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Atualizar configurações (alias para PUT)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    // Lista de campos a serem salvos
    const campos = [
      'slug_site',
      'logo_url',
      'cor_primaria',
      'cor_secundaria',
      'site_ativo',
      'titulo_site',
      'descricao_site',
      'whatsapp_numero',
      'pedido_minimo_grades',
      'prazo_producao_min',
      'prazo_producao_max',
      'permite_pagamento_online',
      'mensagem_whatsapp_template',
      'email_notificacao',
    ];

    // Atualizar ou inserir cada configuração usando upsert
    const promises = campos.map(async (chave) => {
      if (body[chave] !== undefined) {
        const { error } = await supabase
          .from('grade_fechada_configuracoes')
          .upsert(
            {
              chave,
              valor: body[chave],
              atualizado_em: new Date().toISOString(),
            },
            {
              onConflict: 'chave',
            }
          );

        if (error) {
          console.error(`Erro ao salvar ${chave}:`, error);
          throw error;
        }
      }
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}
