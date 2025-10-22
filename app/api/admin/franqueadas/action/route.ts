import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    
    const body = await request.json();
    const { action, franqueada_id, observacoes, ativo } = body;

    if (!action || !franqueada_id) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    console.log(`[api/admin/franqueadas/action] Ação: ${action} | Franqueada: ${franqueada_id}`);

    if (action === 'aprovar') {
      // Atualizar status para aprovada
      const { error: updateError } = await supabase
        .from('franqueadas')
        .update({ 
          status: 'aprovada', 
          aprovado_em: new Date().toISOString() 
        })
        .eq('id', franqueada_id);

      if (updateError) {
        console.error('[api/admin/franqueadas/action] Erro ao aprovar:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Buscar produtos ativos para vincular automaticamente
      const { data: produtosAtivos, error: produtosError } = await supabase
        .from('produtos')
        .select('id')
        .eq('ativo', true);

      if (produtosError) {
        console.error('[api/admin/franqueadas/action] Erro ao buscar produtos:', produtosError);
        // Não retorna erro, apenas loga
      } else if (produtosAtivos && produtosAtivos.length > 0) {
        // Vincular todos os produtos ativos à franqueada recém-aprovada
        const vinculacoes = produtosAtivos.map(p => ({
          produto_id: p.id,
          franqueada_id: franqueada_id,
          ativo: true,
          vinculado_em: new Date().toISOString()
        }));

        const { error: vinculacaoError } = await supabase
          .from('produtos_franqueadas')
          .upsert(vinculacoes, { onConflict: 'produto_id,franqueada_id' });

        if (vinculacaoError) {
          console.error('[api/admin/franqueadas/action] Erro ao vincular produtos:', vinculacaoError);
        } else {
          console.log(`[api/admin/franqueadas/action] ${produtosAtivos.length} produtos vinculados à franqueada`);
        }
      }

      return NextResponse.json({ success: true, message: 'Franqueada aprovada' }, { status: 200 });
    } 
    
    else if (action === 'rejeitar') {
      // Atualizar status para rejeitada
      const { error } = await supabase
        .from('franqueadas')
        .update({ 
          status: 'rejeitada',
          observacoes: observacoes || null
        })
        .eq('id', franqueada_id);

      if (error) {
        console.error('[api/admin/franqueadas/action] Erro ao rejeitar:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Franqueada rejeitada' }, { status: 200 });
    }
    
    else if (action === 'toggle-loja') {
      // Ativar/desativar loja da franqueada
      if (ativo === undefined) {
        return NextResponse.json({ error: 'Parâmetro ativo é obrigatório' }, { status: 400 });
      }

      const { error } = await supabase
        .from('lojas')
        .update({ 
          ativo: ativo,
          atualizado_em: new Date().toISOString()
        })
        .eq('franqueada_id', franqueada_id);

      if (error) {
        console.error('[api/admin/franqueadas/action] Erro ao atualizar loja:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[api/admin/franqueadas/action] Loja ${ativo ? 'ativada' : 'desativada'}`);
      return NextResponse.json({ 
        success: true, 
        message: `Loja ${ativo ? 'ativada' : 'desativada'} com sucesso` 
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    console.error('[api/admin/franqueadas/action] Erro geral:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
