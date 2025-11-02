import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

// GET - Buscar configurações de transportadoras
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
      console.error('[Config Transportadoras] Erro ao buscar config geral:', errorGeral);
    }

    // Buscar transportadoras configuradas
    const { data: transportadoras, error: errorTrans } = await supabase
      .from('config_transportadoras')
      .select('*')
      .order('company_name');

    if (errorTrans) {
      console.error('[Config Transportadoras] Erro ao buscar transportadoras:', errorTrans);
    }

    return NextResponse.json({
      success: true,
      configGeral: configGeral || {
        taxa_embalagem: 0,
        frete_gratis_acima: null,
        prazo_adicional: 0,
      },
      transportadoras: transportadoras || [],
    });

  } catch (error) {
    console.error('[Config Transportadoras] Erro:', error);
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
    const { configGeral, transportadoras } = body;

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

    // Atualizar transportadoras
    if (transportadoras && Array.isArray(transportadoras)) {
      for (const trans of transportadoras) {
        const { error } = await supabase
          .from('config_transportadoras')
          .upsert({
            company_id: trans.company_id,
            company_name: trans.company_name,
            ativo: trans.ativo !== undefined ? trans.ativo : true,
            taxa_adicional: trans.taxa_adicional || 0,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'company_id'
          });

        if (error) {
          console.error(`[Config Transportadoras] Erro ao salvar ${trans.company_name}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso!',
    });

  } catch (error) {
    console.error('[Config Transportadoras] Erro ao salvar:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao salvar configurações' 
      },
      { status: 500 }
    );
  }
}
