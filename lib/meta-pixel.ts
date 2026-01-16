/**
 * 🎯 META PIXEL EVENTS - Rastreamento de Conversões
 * 
 * Eventos padrão do Meta Ads para otimização de campanhas:
 * - PageView (automático no layout)
 * - ViewContent (visualização de produto)
 * - AddToCart (adicionar ao carrinho)
 * - InitiateCheckout (iniciar checkout)
 * - Purchase (compra finalizada)
 * - Search (busca de produtos)
 * - Lead (cadastro/contato)
 */

// Tipos para TypeScript
declare global {
  interface Window {
    fbq: (
      action: string,
      event: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

// ============================================================================
// HELPER: Verificar se o Pixel está disponível
// ============================================================================
const isPixelAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
};

// ============================================================================
// EVENTO: ViewContent - Visualização de Produto
// ============================================================================
export interface ViewContentParams {
  content_ids: string[];      // IDs dos produtos
  content_name: string;       // Nome do produto
  content_type: string;       // 'product' ou 'product_group'
  value: number;              // Valor do produto
  currency: string;           // 'BRL'
}

export const trackViewContent = (params: ViewContentParams): void => {
  if (!isPixelAvailable()) return;
  
  window.fbq('track', 'ViewContent', {
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_type: params.content_type || 'product',
    value: params.value,
    currency: params.currency || 'BRL',
  });
  
  console.log('[Meta Pixel] ViewContent:', params.content_name);
};

// ============================================================================
// EVENTO: AddToCart - Adicionar ao Carrinho
// ============================================================================
export interface AddToCartParams {
  content_ids: string[];
  content_name: string;
  content_type: string;
  value: number;
  currency: string;
  num_items?: number;
}

export const trackAddToCart = (params: AddToCartParams): void => {
  if (!isPixelAvailable()) return;
  
  window.fbq('track', 'AddToCart', {
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_type: params.content_type || 'product',
    value: params.value,
    currency: params.currency || 'BRL',
    num_items: params.num_items || 1,
  });
  
  console.log('[Meta Pixel] AddToCart:', params.content_name, '- R$', params.value);
};

// ============================================================================
// EVENTO: InitiateCheckout - Iniciar Checkout
// ============================================================================
export interface InitiateCheckoutParams {
  content_ids: string[];
  content_type: string;
  value: number;
  currency: string;
  num_items: number;
}

export const trackInitiateCheckout = (params: InitiateCheckoutParams): void => {
  if (!isPixelAvailable()) return;
  
  window.fbq('track', 'InitiateCheckout', {
    content_ids: params.content_ids,
    content_type: params.content_type || 'product',
    value: params.value,
    currency: params.currency || 'BRL',
    num_items: params.num_items,
  });
  
  console.log('[Meta Pixel] InitiateCheckout - R$', params.value, '-', params.num_items, 'itens');
};

// ============================================================================
// EVENTO: Purchase - Compra Finalizada
// ============================================================================
export interface PurchaseParams {
  content_ids: string[];
  content_type: string;
  value: number;
  currency: string;
  num_items: number;
  order_id?: string;
}

export const trackPurchase = (params: PurchaseParams): void => {
  if (!isPixelAvailable()) return;
  
  window.fbq('track', 'Purchase', {
    content_ids: params.content_ids,
    content_type: params.content_type || 'product',
    value: params.value,
    currency: params.currency || 'BRL',
    num_items: params.num_items,
    order_id: params.order_id,
  });
  
  console.log('[Meta Pixel] 🎉 Purchase - R$', params.value, '- Pedido:', params.order_id);
};

// ============================================================================
// EVENTO: Search - Busca de Produtos
// ============================================================================
export interface SearchParams {
  search_string: string;
  content_category?: string;
}

export const trackSearch = (params: SearchParams): void => {
  if (!isPixelAvailable()) return;
  
  window.fbq('track', 'Search', {
    search_string: params.search_string,
    content_category: params.content_category,
  });
  
  console.log('[Meta Pixel] Search:', params.search_string);
};

// ============================================================================
// EVENTO: Lead - Cadastro/Contato WhatsApp
// ============================================================================
export interface LeadParams {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}

export const trackLead = (params: LeadParams = {}): void => {
  if (!isPixelAvailable()) return;
  
  window.fbq('track', 'Lead', {
    content_name: params.content_name || 'WhatsApp Contact',
    content_category: params.content_category || 'Contact',
    value: params.value,
    currency: params.currency || 'BRL',
  });
  
  console.log('[Meta Pixel] Lead:', params.content_name);
};

// ============================================================================
// EVENTO: Contact - Clique em WhatsApp/Telefone
// ============================================================================
export const trackContact = (method: 'whatsapp' | 'phone' | 'email'): void => {
  if (!isPixelAvailable()) return;
  
  window.fbq('track', 'Contact', {
    content_name: method,
  });
  
  console.log('[Meta Pixel] Contact via:', method);
};

// ============================================================================
// EVENTO: AddToWishlist - Adicionar aos Favoritos
// ============================================================================
export interface AddToWishlistParams {
  content_ids: string[];
  content_name: string;
  value: number;
  currency: string;
}

export const trackAddToWishlist = (params: AddToWishlistParams): void => {
  if (!isPixelAvailable()) return;
  
  window.fbq('track', 'AddToWishlist', {
    content_ids: params.content_ids,
    content_name: params.content_name,
    value: params.value,
    currency: params.currency || 'BRL',
  });
  
  console.log('[Meta Pixel] AddToWishlist:', params.content_name);
};

// ============================================================================
// EVENTO CUSTOMIZADO: Share - Compartilhamento
// ============================================================================
export const trackShare = (contentName: string, method: string): void => {
  if (!isPixelAvailable()) return;
  
  window.fbq('trackCustom', 'Share', {
    content_name: contentName,
    method: method,
  });
  
  console.log('[Meta Pixel] Share:', contentName, 'via', method);
};

// ============================================================================
// EVENTO CUSTOMIZADO: ViewReels - Visualização de Reels
// ============================================================================
export const trackViewReels = (productId: string, productName: string): void => {
  if (!isPixelAvailable()) return;
  
  window.fbq('trackCustom', 'ViewReels', {
    content_ids: [productId],
    content_name: productName,
  });
  
  console.log('[Meta Pixel] ViewReels:', productName);
};

// ============================================================================
// EXPORT: Hook para usar em componentes
// ============================================================================
export const useMetaPixel = () => {
  return {
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackSearch,
    trackLead,
    trackContact,
    trackAddToWishlist,
    trackShare,
    trackViewReels,
    isAvailable: isPixelAvailable,
  };
};

export default useMetaPixel;
