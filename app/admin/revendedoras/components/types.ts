// Tipos compartilhados para a página de revendedoras

export interface RevendedoraCompleta {
  id: string;
  name: string;
  email: string;
  phone: string;
  store_name: string;
  slug: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  is_active: boolean;
  total_products: number;
  catalog_views: number;
  created_at: string;
  rejection_reason?: string;
  
  // Indicadores de personalização (todos comparados com valores padrão)
  has_logo: boolean;          // logo_url preenchido
  has_banner: boolean;        // banner_url OU banner_mobile_url preenchido
  has_colors: boolean;        // cores DIFERENTES do padrão (#ec4899, #8b5cf6)
  has_styles: boolean;        // estilos DIFERENTES do padrão
  has_margin: boolean;        // pelo menos 1 produto ATIVO com margem configurada
  is_personalizada: boolean;  // has_logo OR has_colors OR has_styles OR has_banner
  primary_color: string | null;
  logo_url: string | null;
  banner_url: string | null;
  banner_mobile_url: string | null;
  
  // Redes sociais
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
}

export type FiltroStatus = 'todas' | 'pendente' | 'aprovada' | 'rejeitada';
export type FiltroAtivacao = 'todos' | 'ativas' | 'inativas' | 'personalizadas' | 'sem_personalizacao' | 'sem_margem' | 'completas';

export interface PaginacaoInfo {
  pagina: number;
  totalPaginas: number;
  totalItens: number;
  itensPorPagina: number;
}

// Template de mensagem de boas-vindas para WhatsApp
export function getMensagemBoasVindas(revendedora: RevendedoraCompleta, baseUrl: string): string {
  const loginUrl = `${baseUrl}/login/revendedora`;
  
  return `*PARABÉNS ${revendedora.name.toUpperCase()}!*

Seu cadastro foi *APROVADO*!

Sua loja *"${revendedora.store_name}"* está pronta!

*ACESSE:*
${loginUrl}

Email: ${revendedora.email}

*GRUPO DAS FRANQUEADAS:*
https://chat.whatsapp.com/HXxGCfGyj6y8R6Cev785os

Bem-vinda à equipe C4!`;
}
