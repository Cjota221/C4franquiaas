import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug não fornecido' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Buscar todas as configurações
    const { data: configs, error } = await supabase
      .from('grade_fechada_configuracoes')
      .select('chave, valor');

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 404 });
    }

    // Montar objeto de configuração
    const config: Record<string, unknown> = {};
    
    configs.forEach((c: { chave: string; valor: unknown }) => {
      config[c.chave] = c.valor;
    });

    // Verificar se o slug corresponde
    if (config.slug_site !== slug) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar se o site está ativo
    if (!config.site_ativo) {
      return NextResponse.json({ error: 'Site em manutenção' }, { status: 503 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
