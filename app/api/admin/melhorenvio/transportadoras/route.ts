import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

// GET - Buscar configurações de SERVIÇOS (não transportadoras!)
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar configuração geral
    const { data: configGeral, error: errorGeral } = await supabase
      .from('config_frete_geral')
      .select('*')
      .eq('id', 1)
      .single();

    if (errorGeral) {
      console.error('[Config Serviços] Erro ao buscar config geral:', errorGeral);
    }

    // Buscar serviços configurados
    const { data: servicos, error: errorServicos } = await supabase
      .from('config_servicos_frete')
      .select('*')
      .order('company_name, servico_nome');

    if (errorServicos) {
      console.error('[Config Serviços] Erro ao buscar serviços:', errorServicos);
    }

    return NextResponse.json({
      success: true,
      configGeral: configGeral || {
        taxa_embalagem: 0,
        frete_gratis_acima: null,
        prazo_adicional: 0,
      },
      servicos: servicos || [],
    });

  } catch (error) {
    console.error('[Config Serviços] Erro:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao buscar configurações' 
      },
      { status: 500 }
    );
  }
}

// POST - Salvar configurações
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { configGeral, servicos } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Atualizar config geral
    if (configGeral) {
      const { error: errorGeral } = await supabase
        .from('config_frete_geral')
        .update({
          taxa_embalagem: configGeral.taxa_embalagem || 0,
          frete_gratis_acima: configGeral.frete_gratis_acima || null,
          prazo_adicional: configGeral.prazo_adicional || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);

      if (errorGeral) {
        throw new Error(`Erro ao salvar config geral: ${errorGeral.message}`);
      }
    }

    // Atualizar serviços
    if (servicos && Array.isArray(servicos)) {
      for (const servico of servicos) {
        const { error } = await supabase
          .from('config_servicos_frete')
          .upsert({
            servico_id: servico.servico_id,
            servico_nome: servico.servico_nome,
            company_id: servico.company_id,
            company_name: servico.company_name,
            ativo: servico.ativo !== undefined ? servico.ativo : true,
            taxa_adicional: servico.taxa_adicional || 0,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'servico_id'
          });

        if (error) {
          console.error(`[Config Serviços] Erro ao salvar ${servico.servico_nome}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso!',
    });

  } catch (error) {
    console.error('[Config Serviços] Erro ao salvar:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao salvar configurações' 
      },
      { status: 500 }
    );
  }
}
