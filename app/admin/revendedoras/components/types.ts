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
  
  // Indicadores de personalização
  has_logo: boolean;
  has_banner: boolean;
  has_colors: boolean;
  has_margin: boolean;
  primary_color: string | null;
  logo_url: string | null;
  banner_url: string | null;
  banner_mobile_url: string | null;
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
