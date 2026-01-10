// ============================================================================
// SERVIÇO DE ANÁLISE DE PERSONALIZAÇÃO
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import type {
  PersonalizacaoDetalhes,
  PersonalizacaoResumo,
} from '@/lib/types/personalizacao';
import {
  CRITERIOS_PONTUACAO,
  CORES_PADRAO,
  ESTILOS_PADRAO,
  determinarNivel,
} from '@/lib/types/personalizacao';

/**
 * Calcula o status de personalização de uma loja específica
 */
export async function calcularPersonalizacaoLoja(
  resellerId: string
): Promise<PersonalizacaoDetalhes | null> {
  const supabase = await createClient();

  // Buscar dados da revendedora
  const { data: reseller, error: resellerError } = await supabase
    .from('resellers')
    .select('*')
    .eq('id', resellerId)
    .single();

  if (resellerError || !reseller) {
    console.error('Erro ao buscar revendedora:', resellerError);
    return null;
  }

  // Buscar produtos vinculados com margens
  const { data: produtos, error: produtosError } = await supabase
    .from('reseller_products')
    .select('margin_percent, custom_price')
    .eq('reseller_id', resellerId)
    .eq('is_active', true);

  if (produtosError) {
    console.error('Erro ao buscar produtos:', produtosError);
  }

  // ============================================================================
  // 1. ANÁLISE DE LOGO
  // ============================================================================
  const hasLogo = !!(
    reseller.logo_url &&
    typeof reseller.logo_url === 'string' &&
    reseller.logo_url.trim() !== ''
  );

  // ============================================================================
  // 2. ANÁLISE DE CORES
  // ============================================================================
  let colors = { primary: null, secondary: null };
  try {
    colors =
      typeof reseller.colors === 'string'
        ? JSON.parse(reseller.colors)
        : reseller.colors || {};
  } catch (e) {
    console.error('Erro ao parsear cores:', e);
  }

  const hasCustomColors = !!(
    colors.primary &&
    colors.secondary &&
    (colors.primary !== CORES_PADRAO.primary ||
      colors.secondary !== CORES_PADRAO.secondary)
  );

  // ============================================================================
  // 3. ANÁLISE DE BANNERS
  // ============================================================================
  const temBannerDesktop = !!(
    reseller.banner_url &&
    typeof reseller.banner_url === 'string' &&
    reseller.banner_url.trim() !== ''
  );

  const temBannerMobile = !!(
    reseller.banner_mobile_url &&
    typeof reseller.banner_mobile_url === 'string' &&
    reseller.banner_mobile_url.trim() !== ''
  );

  const hasBanner = temBannerDesktop || temBannerMobile;

  // ============================================================================
  // 4. ANÁLISE DE ESTILOS
  // ============================================================================
  let themeSettings: Record<string, unknown> = {};
  try {
    themeSettings =
      typeof reseller.theme_settings === 'string'
        ? JSON.parse(reseller.theme_settings)
        : reseller.theme_settings || {};
  } catch (e) {
    console.error('Erro ao parsear theme_settings:', e);
  }

  const hasCustomStyles = !!(
    themeSettings &&
    Object.keys(themeSettings).length > 0 &&
    ((themeSettings.button_style as string) !== ESTILOS_PADRAO.button_style ||
      (themeSettings.card_style as string) !== ESTILOS_PADRAO.card_style ||
      (themeSettings.header_style as string) !== ESTILOS_PADRAO.header_style)
  );

  // ============================================================================
  // 5. ANÁLISE DE MARGENS
  // ============================================================================
  const totalProdutos = produtos?.length || 0;
  const MARGEM_PADRAO = 30.0;

  const produtosComMargemCustomizada =
    produtos?.filter(
      (p) =>
        p.custom_price !== null ||
        (p.margin_percent !== null &&
          Math.abs(p.margin_percent - MARGEM_PADRAO) > 0.01)
    ).length || 0;

  const percentualPersonalizado =
    totalProdutos > 0 ? (produtosComMargemCustomizada / totalProdutos) * 100 : 0;

  const margemMedia =
    produtos && produtos.length > 0
      ? produtos.reduce((acc, p) => acc + (p.margin_percent || 0), 0) /
        produtos.length
      : 0;

  const hasCustomMargins = produtosComMargemCustomizada > 0;

  // ============================================================================
  // 6. CÁLCULO DO SCORE (0-100)
  // ============================================================================
  let score = 0;

  // Logo (20 pontos)
  if (hasLogo) {
    score += CRITERIOS_PONTUACAO.logo.peso;
  }

  // Cores (15 pontos)
  if (hasCustomColors) {
    score += CRITERIOS_PONTUACAO.cores.peso;
  }

  // Banners (30 pontos - proporcional)
  if (temBannerDesktop && temBannerMobile) {
    score += CRITERIOS_PONTUACAO.banner.parcial.ambos;
  } else if (temBannerDesktop) {
    score += CRITERIOS_PONTUACAO.banner.parcial.apenas_desktop;
  } else if (temBannerMobile) {
    score += CRITERIOS_PONTUACAO.banner.parcial.apenas_mobile;
  }

  // Estilos (15 pontos)
  if (hasCustomStyles) {
    score += CRITERIOS_PONTUACAO.estilos.peso;
  }

  // Margens (20 pontos - proporcional)
  if (percentualPersonalizado > 75) {
    score += CRITERIOS_PONTUACAO.margens.parcial.mais_75;
  } else if (percentualPersonalizado > 50) {
    score += CRITERIOS_PONTUACAO.margens.parcial.ate_75;
  } else if (percentualPersonalizado > 25) {
    score += CRITERIOS_PONTUACAO.margens.parcial.ate_50;
  } else if (percentualPersonalizado > 0) {
    score += CRITERIOS_PONTUACAO.margens.parcial.ate_25;
  }

  // ============================================================================
  // 7. MONTAR OBJETO DE RESPOSTA
  // ============================================================================
  const nivel = determinarNivel(score);

  const detalhes: PersonalizacaoDetalhes = {
    reseller_id: reseller.id,
    store_name: reseller.store_name,
    slug: reseller.slug,

    // Status geral
    hasLogo,
    hasCustomColors,
    hasBanner,
    hasCustomStyles,
    hasCustomMargins,
    score,
    nivel,

    // Detalhes de logo
    logo: {
      presente: hasLogo,
      url: reseller.logo_url || null,
      atualizadoEm: reseller.updated_at || null,
    },

    // Detalhes de cores
    cores: {
      personalizadas: hasCustomColors,
      primaria: colors.primary || null,
      secundaria: colors.secondary || null,
      ehPadrao: !hasCustomColors,
      atualizadoEm: reseller.updated_at || null,
    },

    // Detalhes de banners
    banners: {
      desktop: reseller.banner_url || null,
      mobile: reseller.banner_mobile_url || null,
      temDesktop: temBannerDesktop,
      temMobile: temBannerMobile,
      temAmbos: temBannerDesktop && temBannerMobile,
      atualizadoEm: reseller.updated_at || null,
    },

    // Detalhes de estilos
    estilos: {
      personalizados: hasCustomStyles,
      buttonStyle: (themeSettings.button_style as string) || null,
      cardStyle: (themeSettings.card_style as string) || null,
      headerStyle: (themeSettings.header_style as string) || null,
      atualizadoEm: reseller.updated_at || null,
    },

    // Detalhes de margens
    margens: {
      totalProdutos,
      produtosComMargemCustomizada,
      percentualPersonalizado: Math.round(percentualPersonalizado),
      margemMedia: Math.round(margemMedia * 100) / 100,
      atualizadoEm: reseller.updated_at || null,
    },

    // Metadados
    ultimaAtualizacao: reseller.updated_at || reseller.created_at,
    created_at: reseller.created_at,
  };

  return detalhes;
}

/**
 * Analisa TODAS as revendedoras e retorna lista completa
 */
export async function analisarTodasRevendedoras(): Promise<PersonalizacaoDetalhes[]> {
  const supabase = await createClient();

  // Buscar todas revendedoras ativas
  const { data: resellers, error } = await supabase
    .from('resellers')
    .select('id')
    .order('store_name');

  if (error || !resellers) {
    console.error('Erro ao buscar revendedoras:', error);
    return [];
  }

  // Analisar cada uma
  const analises = await Promise.all(
    resellers.map((r) => calcularPersonalizacaoLoja(r.id))
  );

  // Filtrar nulls
  return analises.filter(
    (a): a is PersonalizacaoDetalhes => a !== null
  );
}

/**
 * Gera resumo agregado para dashboard
 */
export async function gerarResumoPersonalizacao(): Promise<PersonalizacaoResumo> {
  const analises = await analisarTodasRevendedoras();

  const total = analises.length;

  // Contar por nível
  const por_nivel = {
    ZERADA: analises.filter((a) => a.nivel === 'ZERADA').length,
    BAIXA: analises.filter((a) => a.nivel === 'BAIXA').length,
    MÉDIA: analises.filter((a) => a.nivel === 'MÉDIA').length,
    ALTA: analises.filter((a) => a.nivel === 'ALTA').length,
    COMPLETA: analises.filter((a) => a.nivel === 'COMPLETA').length,
  };

  // Contar por elemento
  const por_elemento = {
    com_logo: analises.filter((a) => a.hasLogo).length,
    com_cores: analises.filter((a) => a.hasCustomColors).length,
    com_banner: analises.filter((a) => a.hasBanner).length,
    com_estilos: analises.filter((a) => a.hasCustomStyles).length,
    com_margens: analises.filter((a) => a.hasCustomMargins).length,
  };

  // Calcular percentuais
  const percentuais = {
    com_logo: total > 0 ? Math.round((por_elemento.com_logo / total) * 100) : 0,
    com_cores: total > 0 ? Math.round((por_elemento.com_cores / total) * 100) : 0,
    com_banner: total > 0 ? Math.round((por_elemento.com_banner / total) * 100) : 0,
    com_estilos:
      total > 0 ? Math.round((por_elemento.com_estilos / total) * 100) : 0,
    com_margens:
      total > 0 ? Math.round((por_elemento.com_margens / total) * 100) : 0,
  };

  // Calcular médias
  const score_medio =
    total > 0
      ? Math.round(
          analises.reduce((acc, a) => acc + a.score, 0) / total
        )
      : 0;

  const produtos_por_revendedora =
    total > 0
      ? Math.round(
          analises.reduce((acc, a) => acc + a.margens.totalProdutos, 0) / total
        )
      : 0;

  const margem_media =
    total > 0
      ? Math.round(
          (analises.reduce((acc, a) => acc + a.margens.margemMedia, 0) / total) *
            100
        ) / 100
      : 0;

  return {
    total_revendedoras: total,
    por_nivel,
    por_elemento,
    percentuais,
    medias: {
      score_medio,
      produtos_por_revendedora,
      margem_media,
    },
  };
}
