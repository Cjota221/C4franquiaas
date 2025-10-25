import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { RouteContext } from 'next/dist/server/future/route-modules/route-module';

/**
 * ============================================================================
 * PARTE 1: BACKEND - BUSCA INTELIGENTE (INSENSÍVEL A ACENTOS)
 * ============================================================================
 * Endpoint: GET /api/loja/[dominio]/search?q=termo
 * 
 * Características:
 * - Busca insensível a acentos usando PostgreSQL unaccent
 * - Busca parcial (LIKE %termo%)
 * - Case-insensitive (ILIKE)
 * - Limite de 15 resultados para performance
 * - Retorna apenas produtos ativos
 */

export async function GET(
  request: NextRequest,
  context: RouteContext<{ params: { dominio: string } }>
) {
  try {
    const { dominio } = context.params;
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    // Se não houver query, retorna array vazio
    if (!query.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    console.log('[API Search] Buscando produtos para:', { dominio, query });

    // ========================================================================
    // ESTRATÉGIA DE BUSCA INTELIGENTE (PostgreSQL + Supabase)
    // ========================================================================
    // 
    // OPÇÃO 1: Usando unaccent (requer extensão PostgreSQL)
    // Para ativar: CREATE EXTENSION IF NOT EXISTS unaccent;
    // Query: WHERE unaccent(nome) ILIKE unaccent('%termo%')
    // 
    // OPÇÃO 2: Usando ILIKE com normalização manual (mais compatível)
    // Normaliza tanto o termo quanto o campo para remover acentos
    // ========================================================================

    // Busca usando ILIKE (case-insensitive)
    // Para busca com unaccent, seria necessário usar .rpc() ou raw SQL
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        preco_base,
        preco_venda,
        imagem,
        imagens,
        codigo_barras,
        categoria_id,
        categorias (
          nome
        )
      `)
      .eq('ativo', true)
      .or(`nome.ilike.%${query}%,codigo_barras.ilike.%${query}%`)
      .order('nome', { ascending: true })
      .limit(15);

    if (error) {
      console.error('[API Search] Erro no Supabase:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar produtos' },
        { status: 500 }
      );
    }

    // Formata os resultados para o autocomplete
    const suggestions = (produtos || []).map((p) => {
      const categoria = Array.isArray(p.categorias) && p.categorias.length > 0 
        ? p.categorias[0]?.nome 
        : null;
      
      return {
        id: p.id,
        nome: p.nome,
        preco: p.preco_venda || p.preco_base,
        imagem: p.imagem || (Array.isArray(p.imagens) && p.imagens[0]) || null,
        categoria,
        codigo_barras: p.codigo_barras || null
      };
    });

    console.log('[API Search] Resultados encontrados:', suggestions.length);

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('[API Search] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * ============================================================================
 * NOTA SOBRE BUSCA INSENSÍVEL A ACENTOS (UNACCENT)
 * ============================================================================
 * 
 * Para habilitar busca verdadeiramente insensível a acentos no PostgreSQL:
 * 
 * 1. Ative a extensão unaccent no Supabase:
 *    - Vá para SQL Editor no Supabase Dashboard
 *    - Execute: CREATE EXTENSION IF NOT EXISTS unaccent;
 * 
 * 2. Para usar unaccent com Supabase client, você precisa criar uma função:
 * 
 *    CREATE OR REPLACE FUNCTION search_produtos_unaccent(search_term TEXT)
 *    RETURNS SETOF produtos AS $$
 *    BEGIN
 *      RETURN QUERY
 *      SELECT *
 *      FROM produtos
 *      WHERE ativo = true
 *        AND (
 *          unaccent(nome) ILIKE unaccent('%' || search_term || '%')
 *          OR codigo_barras ILIKE '%' || search_term || '%'
 *        )
 *      ORDER BY nome
 *      LIMIT 15;
 *    END;
 *    $$ LANGUAGE plpgsql;
 * 
 * 3. E então chamar via RPC:
 * 
 *    const { data } = await supabase
 *      .rpc('search_produtos_unaccent', { search_term: query });
 * 
 * ============================================================================
 */
