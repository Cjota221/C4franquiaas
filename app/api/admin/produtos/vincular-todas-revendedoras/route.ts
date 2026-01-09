import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produto_ids } = body;

    console.log('\n[Vincular Revendedoras] Iniciando...\n');

    // 🆕 Buscar revendedoras COM suas configurações de margem padrão
    const { data: revendedoras, error: revendedorasError } = await supabase
      .from('resellers')
      .select(`
        id, 
        store_name,
        lojas!inner(margem_padrao)
      `)
      .eq('status', 'aprovada');

    if (revendedorasError || !revendedoras || revendedoras.length === 0) {
      console.error('Nenhuma revendedora aprovada');
      return NextResponse.json({
        error: 'Nenhuma revendedora aprovada encontrada',
        details: revendedorasError?.message,
      }, { status: 400 });
    }

    console.log(`${revendedoras.length} revendedoras encontradas`);

    let query = supabase
      .from('produtos')
      .select('id, nome, ativo, estoque')
      .eq('ativo', true)
      .gt('estoque', 0);

    if (produto_ids && Array.isArray(produto_ids) && produto_ids.length > 0) {
      query = query.in('id', produto_ids);
    }

    const { data: produtos, error: produtosError } = await query;

    if (produtosError || !produtos || produtos.length === 0) {
      return NextResponse.json({
        error: 'Nenhum produto ativo com estoque encontrado',
        details: produtosError?.message,
      }, { status: 400 });
    }

    console.log(`${produtos.length} produtos encontrados`);

    // Buscar vinculações existentes para preservar margem
    const { data: existingLinks } = await supabase
      .from('reseller_products')
      .select('reseller_id, product_id, margin_percent')
      .in('product_id', produtos.map(p => p.id));

    // Criar mapa de margens existentes
    const existingMargins = new Map<string, number>();
    existingLinks?.forEach(link => {
      const key = `${link.reseller_id}-${link.product_id}`;
      if (link.margin_percent !== null && link.margin_percent !== undefined) {
        existingMargins.set(key, link.margin_percent);
      }
    });

    const vinculacoes = [];
    for (const produto of produtos) {
      for (const revendedora of revendedoras) {
        const key = `${revendedora.id}-${produto.id}`;
        const existingMargin = existingMargins.get(key);
        
        // 🆕 Usar margem padrão da loja se configurada, senão usar 0 (revendedora precisa configurar)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const margemPadrao = (revendedora as any).lojas?.margem_padrao;
        const defaultMargin = existingMargin ?? (margemPadrao || 0); // Se não tem margem configurada, fica 0
        
        vinculacoes.push({
          reseller_id: revendedora.id,
          product_id: produto.id,
          margin_percent: defaultMargin,
          is_active: margemPadrao ? true : false, // Só ativa se tiver margem configurada
        });
      }
    }

    console.log(`Criando ${vinculacoes.length} vinculacoes...`);

    const { error: vinculacaoError } = await supabase
      .from('reseller_products')
      .upsert(vinculacoes, {
        onConflict: 'reseller_id,product_id',
        ignoreDuplicates: true,
      });

    if (vinculacaoError) {
      console.error('Erro ao criar vinculacoes:', vinculacaoError);
      return NextResponse.json({
        error: 'Erro ao criar vinculacoes',
        details: vinculacaoError.message,
      }, { status: 500 });
    }

    console.log(`\n${vinculacoes.length} vinculacoes criadas!\n`);

    return NextResponse.json({
      success: true,
      message: `${vinculacoes.length} vinculacoes criadas`,
      detalhes: {
        produtos: produtos.length,
        revendedoras: revendedoras.length,
        vinculacoes: vinculacoes.length,
      },
    });

  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json({
      error: 'Erro ao processar requisicao',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}