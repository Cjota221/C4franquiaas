import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { fetchProdutoFacilZapById } from '@/lib/facilzapClient';
import { notifyProductChange } from '@/lib/webhookService';

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    console.log(`[api/produtos/:id] GET request for id: ${id}`);

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('[api/produtos/:id] Supabase config missing');
      return NextResponse.json({ error: 'supabase_config_missing', message: 'Missing SUPABASE configuration.' }, { status: 500 });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verificar se o ID é um UUID ou um ID externo (numérico)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // Busca o produto na nossa base de dados pelo ID interno ou externo
    console.log(`[api/produtos/:id] Querying database for id: ${id} (isUUID: ${isUUID})`);
    
    let query = supabase.from('produtos').select('*');
    
    if (isUUID) {
      // Se for UUID, buscar por id OU id_externo
      query = query.or(`id.eq.${id},id_externo.eq.${id}`);
    } else {
      // Se não for UUID, buscar apenas por id_externo
      query = query.eq('id_externo', id);
    }
    
    const { data, error } = await query.limit(1);

    if (error) {
      console.error('[api/produtos/:id] Erro no Supabase:', error);
      return NextResponse.json({ error: 'Erro ao buscar produto no banco de dados.', details: error.message }, { status: 500 });
    }

    const produtoDoBanco = Array.isArray(data) && data.length > 0 ? data[0] : null;
    console.log(`[api/produtos/:id] Produto encontrado no banco:`, produtoDoBanco ? 'SIM' : 'NÃO');

    // Se encontrarmos o produto, busca os detalhes mais recentes na FácilZap para comparação
    let detalhesDaFacilzap: unknown = null;
    const idExterno = produtoDoBanco?.id_externo ?? id;
    if (idExterno) {
      console.log(`[api/produtos/:id] Tentando buscar detalhes na FácilZap para id_externo: ${idExterno}`);
      try {
        detalhesDaFacilzap = await fetchProdutoFacilZapById(String(idExterno));
        console.log(`[api/produtos/:id] Detalhes da FácilZap:`, detalhesDaFacilzap ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      } catch (err) {
        console.error('[api/produtos/:id] falha ao buscar facilzap', err);
      }
    }

    return NextResponse.json({ produto: produtoDoBanco, facilzap: detalhesDaFacilzap }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[api/produtos/:id] Erro geral:', msg, err);
    return NextResponse.json({ error: msg, stack: err instanceof Error ? err.stack : undefined }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const parsed = await request.json().catch(() => ({} as unknown));
  const body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};

  const updates: Record<string, unknown> = {};
  if (Object.prototype.hasOwnProperty.call(body, 'estoque')) updates.estoque = body['estoque'];
  if (Object.prototype.hasOwnProperty.call(body, 'variacoes_meta')) updates.variacoes_meta = body['variacoes_meta'];

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'supabase_config_missing', message: 'Missing SUPABASE configuration.' }, { status: 500 });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verificar se o ID é um UUID ou um ID externo (numérico)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let query = supabase
      .from('produtos')
      .update({ ...updates, last_synced_at: new Date().toISOString() });
    
    if (isUUID) {
      // Se for UUID, buscar por id OU id_externo
      query = query.or(`id.eq.${id},id_externo.eq.${id}`);
    } else {
      // Se não for UUID, buscar apenas por id_externo
      query = query.eq('id_externo', id);
    }
    
    const { data, error } = await query.select().limit(1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const updated = data?.[0] ?? null;
    
    // ✅ SOLUÇÃO 1: WEBHOOK AUTOMÁTICO - Notificar franqueadas sobre mudança
    if (updated) {
      console.log(`[api/produtos/:id PATCH] 🔔 Enviando webhook de atualização...`);
      
      // Determinar tipo de evento baseado nos campos atualizados
      const eventType = Object.prototype.hasOwnProperty.call(updates, 'estoque') 
        ? 'STOCK_UPDATED' 
        : 'PRODUCT_UPDATED';
      
      // Enviar webhook de forma assíncrona (não bloqueia a resposta)
      notifyProductChange(eventType, updated.id).catch(err => {
        console.error('[api/produtos/:id PATCH] ⚠️ Erro ao enviar webhook (não fatal):', err);
      });
    }
    
    let facilzap = null;
    if (updated?.id_externo) {
      try {
        facilzap = await fetchProdutoFacilZapById(String(updated.id_externo));
      } catch (err) {
        console.error('[api/produtos/:id PATCH] falha ao buscar facilzap', err);
      }
    }

    return NextResponse.json({ produto: updated, facilzap }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[api/produtos/:id PATCH] Erro geral:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

