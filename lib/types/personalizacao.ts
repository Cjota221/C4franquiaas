// ============================================================================
// TIPOS E INTERFACES PARA ANÁLISE DE PERSONALIZAÇÃO
// ============================================================================

/**
 * Status de personalização de cada elemento da loja
 */
export interface PersonalizacaoStatus {
  hasLogo: boolean;
  hasCustomColors: boolean;
  hasBanner: boolean;
  hasCustomStyles: boolean;
  hasCustomMargins: boolean;
  score: number; // 0 a 100
}

/**
 * Detalhes completos da personalização de uma loja
 */
export interface PersonalizacaoDetalhes extends PersonalizacaoStatus {
  reseller_id: string;
  store_name: string;
  slug: string;
  
  // Detalhes de cada elemento
  logo: {
    presente: boolean;
    url: string | null;
    atualizadoEm: string | null;
  };
  
  cores: {
    personalizadas: boolean;
    primaria: string | null;
    secundaria: string | null;
    ehPadrao: boolean;
    atualizadoEm: string | null;
  };
  
  banners: {
    desktop: string | null;
    mobile: string | null;
    temDesktop: boolean;
    temMobile: boolean;
    temAmbos: boolean;
    atualizadoEm: string | null;
  };
  
  estilos: {
    personalizados: boolean;
    buttonStyle: string | null;
    cardStyle: string | null;
    headerStyle: string | null;
    atualizadoEm: string | null;
  };
  
  margens: {
    totalProdutos: number;
    produtosComMargemCustomizada: number;
    percentualPersonalizado: number;
    margemMedia: number;
    atualizadoEm: string | null;
  };
  
  // Metadados
  nivel: 'ZERADA' | 'BAIXA' | 'MÉDIA' | 'ALTA' | 'COMPLETA';
  ultimaAtualizacao: string;
  created_at: string;
}

/**
 * Resumo agregado para dashboard
 */
export interface PersonalizacaoResumo {
  total_revendedoras: number;
  
  por_nivel: {
    ZERADA: number;      // 0 pontos
    BAIXA: number;       // 1-30 pontos
    MÉDIA: number;       // 31-60 pontos
    ALTA: number;        // 61-90 pontos
    COMPLETA: number;    // 91-100 pontos
  };
  
  por_elemento: {
    com_logo: number;
    com_cores: number;
    com_banner: number;
    com_estilos: number;
    com_margens: number;
  };
  
  percentuais: {
    com_logo: number;
    com_cores: number;
    com_banner: number;
    com_estilos: number;
    com_margens: number;
  };
  
  medias: {
    score_medio: number;
    produtos_por_revendedora: number;
    margem_media: number;
  };
}

/**
 * Entrada do histórico de personalização (audit log)
 */
export interface PersonalizacaoHistorico {
  id: string;
  reseller_id: string;
  elemento: 'logo' | 'cores' | 'banner_desktop' | 'banner_mobile' | 'estilos' | 'margem_produto';
  acao: 'criado' | 'atualizado' | 'removido';
  valor_anterior: string | null;
  valor_novo: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Critérios de pontuação para cálculo do score
 */
export const CRITERIOS_PONTUACAO = {
  logo: {
    peso: 20,
    descricao: 'Logo personalizada da loja',
  },
  cores: {
    peso: 15,
    descricao: 'Paleta de cores customizada (não padrão)',
  },
  banner: {
    peso: 30,
    descricao: 'Banner desktop e mobile configurados',
    parcial: {
      apenas_desktop: 15,
      apenas_mobile: 15,
      ambos: 30,
    },
  },
  estilos: {
    peso: 15,
    descricao: 'Estilos personalizados (botões, cards, header)',
  },
  margens: {
    peso: 20,
    descricao: 'Margens customizadas em produtos',
    parcial: {
      ate_25: 5,      // 1-25% dos produtos
      ate_50: 10,     // 26-50% dos produtos
      ate_75: 15,     // 51-75% dos produtos
      mais_75: 20,    // 76-100% dos produtos
    },
  },
} as const;

/**
 * Cores padrão do sistema (para comparação)
 */
export const CORES_PADRAO = {
  primary: '#ec4899',
  secondary: '#8b5cf6',
} as const;

/**
 * Estilos padrão do sistema (para comparação)
 */
export const ESTILOS_PADRAO = {
  button_style: 'rounded',
  card_style: 'shadow',
  header_style: 'gradient',
  show_prices: true,
  show_stock: false,
  show_whatsapp_float: true,
} as const;

/**
 * Helper para determinar nível baseado no score
 */
export function determinarNivel(score: number): PersonalizacaoDetalhes['nivel'] {
  if (score === 0) return 'ZERADA';
  if (score <= 30) return 'BAIXA';
  if (score <= 60) return 'MÉDIA';
  if (score <= 90) return 'ALTA';
  return 'COMPLETA';
}

/**
 * Helper para obter cor do nível (para UI)
 */
export function getCorNivel(nivel: PersonalizacaoDetalhes['nivel']): string {
  const cores = {
    ZERADA: 'text-red-600 bg-red-50 border-red-200',
    BAIXA: 'text-orange-600 bg-orange-50 border-orange-200',
    MÉDIA: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    ALTA: 'text-blue-600 bg-blue-50 border-blue-200',
    COMPLETA: 'text-green-600 bg-green-50 border-green-200',
  };
  return cores[nivel];
}

/**
 * Helper para obter emoji do nível
 */
export function getEmojiNivel(nivel: PersonalizacaoDetalhes['nivel']): string {
  const emojis = {
    ZERADA: '🚫',
    BAIXA: '⚠️',
    MÉDIA: '📊',
    ALTA: '⭐',
    COMPLETA: '🏆',
  };
  return emojis[nivel];
}
