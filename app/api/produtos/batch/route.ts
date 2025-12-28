import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(req: NextRequest) {
  try {
    const parsed = await req.json().catch(() => ({} as unknown));
    const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : ({} as Record<string, unknown>);

    // basic payload validation
    if (!Array.isArray(body.ids)) return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
    
    // Aceitar tanto IDs numéricos quanto UUIDs (strings)
    const ids = (body.ids as unknown[]).filter((v) => {
      // Aceitar números válidos
      if (typeof v === 'number' && Number.isFinite(v)) return true;
      // Aceitar strings (UUIDs)
      if (typeof v === 'string' && v.length > 0) return true;
      return false;
    }) as (number | string)[];
    
    const ativo = typeof body.ativo === 'boolean' ? body.ativo : undefined;
    if (ids.length === 0) return NextResponse.json({ error: 'ids must contain at least one valid id (number or UUID string)' }, { status: 400 });
    if (typeof ativo === 'undefined') return NextResponse.json({ error: 'ativo (boolean) is required' }, { status: 400 });

    // env validation
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    if (!url || !serviceKey) {
      console.error('[produtos/batch] missing Supabase env vars', { urlPresent: !!url, serviceKeyPresent: !!serviceKey });
      return NextResponse.json({ error: 'Server misconfiguration: missing Supabase credentials' }, { status: 500 });
    }

    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'supabase_config_missing', message: 'Missing SUPABASE configuration.' }, { status: 500 });
    }
    const supabase = createClient(url, serviceKey);
    try {
      // 🆕 Quando desativar manualmente, marca desativado_manual = true
      // Quando ativar, remove a marca de desativado_manual
      const updateData = ativo 
        ? { ativo: true, desativado_manual: false }  // Ativar: remove flag manual
        : { ativo: false, desativado_manual: true }; // Desativar: marca como manual
      
      const { data, error } = await supabase.from('produtos').update(updateData).in('id', ids).select('id,ativo');
      if (error) {
        console.error('[produtos/batch] supabase update error', error);
        return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
      }

      // ============================================================================
      // VINCULAÇÃO AUTOMÁTICA: Sincronizar produtos com franqueadas aprovadas
      // ============================================================================
      console.log(`[produtos/batch] Iniciando vinculação automática para ${ids.length} produtos (ativo: ${ativo})`);

      // Buscar todas as franqueadas aprovadas
      const { data: franqueadas, error: franqueadasError } = await supabase
        .from('franqueadas')
        .select('id')
        .eq('status', 'aprovada');

      if (franqueadasError) {
        console.error('[produtos/batch] Erro ao buscar franqueadas:', franqueadasError);
        // Não retorna erro, apenas loga
      } else if (franqueadas && franqueadas.length > 0) {
        if (ativo === true) {
          // ATIVAR: Vincular produtos a todas as franqueadas aprovadas
          const vinculacoes = [];
          for (const produtoId of ids) {
            for (const franqueada of franqueadas) {
              vinculacoes.push({
                produto_id: produtoId,
                franqueada_id: franqueada.id,
                ativo: true,
                vinculado_em: new Date().toISOString()
              });
            }
          }

          if (vinculacoes.length > 0) {
            const { error: vinculacaoError } = await supabase
              .from('produtos_franqueadas')
              .upsert(vinculacoes, { onConflict: 'produto_id,franqueada_id' });

            if (vinculacaoError) {
              console.error('[produtos/batch] Erro ao vincular produtos:', vinculacaoError);
            } else {
              console.log(`[produtos/batch] ✓ ${vinculacoes.length} vinculações criadas (${ids.length} produtos × ${franqueadas.length} franqueadas)`);
            }
          }
        } else {
          // DESATIVAR: Desvincular produtos de todas as franqueadas
          const { error: desvinculacaoError } = await supabase
            .from('produtos_franqueadas')
            .update({ 
              ativo: false, 
              desvinculado_em: new Date().toISOString() 
            })
            .in('produto_id', ids);

          if (desvinculacaoError) {
            console.error('[produtos/batch] Erro ao desvincular produtos:', desvinculacaoError);
          } else {
            console.log(`[produtos/batch] ✓ Produtos ${ids.join(', ')} desvinculados de todas as franqueadas`);
          }
        }
      } else {
        console.log('[produtos/batch] Nenhuma franqueada aprovada encontrada para vinculação');
      }

      return NextResponse.json({ ok: true, updated: Array.isArray(data) ? data.length : ids.length, data: data ?? null });
    } catch (err: unknown) {
      console.error('[produtos/batch] supabase call failed', err);
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  } catch (err: unknown) {
    console.error('[produtos/batch] error parsing request', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
