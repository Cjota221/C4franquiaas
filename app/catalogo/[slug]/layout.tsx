"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ShoppingCart, Instagram, Facebook, MessageCircle, Menu, X, Search, Gift } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import LeadCaptureModal from '@/components/catalogo/LeadCaptureModal';
import CatalogoMetaTags from '@/components/catalogo/CatalogoMetaTags';
import CuponsModal from '@/components/catalogo/CuponsModal';

// Tipos
type Reseller = {
  id: string;
  store_name: string;
  slug: string;
  phone: string;
  logo_url?: string;
  banner_url?: string;
  banner_mobile_url?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
  theme_settings?: {
    button_style?: 'rounded' | 'square';
    card_style?: 'shadow' | 'flat' | 'bordered';
    header_style?: 'gradient' | 'solid' | 'transparent';
    logo_shape?: 'circle' | 'square' | 'rectangle';
    logo_position?: 'left' | 'center' | 'right';
    show_prices?: boolean;
    show_whatsapp_float?: boolean;
    // Novas opções
    border_radius?: 'none' | 'small' | 'medium' | 'large';
    card_image_style?: 'square' | 'rounded' | 'circle';
    announcement_bar?: {
      enabled: boolean;
      text: string;
      bg_color: string;
      text_color: string;
    };
    font_style?: 'modern' | 'classic' | 'elegant';
    product_name_size?: 'small' | 'medium' | 'large';
    button_color?: string; // Cor específica do botão
    header_color?: string; // Cor específica do cabeçalho
    // 🆕 Sob Encomenda
    delivery_notice?: {
      enabled: boolean;
      days: number;
      message?: string;
    };
    // 🆕 Produtos Relacionados
    show_related_products?: boolean;
    show_related_in_cart?: boolean;
  };
};

// Tipo para promoções
type ProgressiveDiscount = {
  min_items: number;
  discount_percent: number;
};

type Promotion = {
  id: string;
  name: string;
  description: string | null;
  type: 'frete_gratis' | 'cupom_desconto' | 'leve_pague' | 'desconto_percentual' | 'desconto_valor';
  discount_type: 'percentage' | 'fixed_value' | null;
  discount_value: number | null;
  buy_quantity: number | null;
  pay_quantity: number | null;
  progressive_discounts: ProgressiveDiscount[] | null;
  free_shipping: boolean;
  min_value_free_shipping: number | null;
  coupon_code: string | null;
  min_purchase_value: number | null;
  max_discount_value: number | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  applies_to: 'all' | 'categories' | 'products';
  product_ids: string[] | null;
  category_ids: string[] | null;
  starts_at: string | null;
  ends_at: string | null;
};

// Tipo para cupom aplicado
type AppliedCoupon = {
  code: string;
  promotion: Promotion;
  discountValue: number;
};

// Tipo para promoção aplicada automaticamente
type AppliedPromotion = {
  promotion: Promotion;
  discountValue: number;
  description: string;
  affectedItems?: string[]; // IDs dos produtos afetados
};

type CartItem = {
  id?: string;
  productId: string;
  nome: string;
  preco: number;
  imagem?: string;
  quantidade: number;
  tamanho?: string;
  sku?: string;
  estoque?: number;
  variacao?: {
    id: string;
    tamanho: string;
    cor?: string;
  };
};

// Tipo para dados do lead (visitante)
type LeadData = {
  name: string;
  phone: string;
  cartId?: string;
};

type CatalogoContextType = {
  reseller: Reseller | null;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variacaoId?: string) => void;
  updateQuantity: (productId: string, quantidade: number, variacaoId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalItems: () => number;
  primaryColor: string;
  secondaryColor: string;
  themeSettings: Reseller['theme_settings'];
  // Lead capture
  leadData: LeadData | null;
  requireLeadCapture: () => boolean;
  showLeadModal: boolean;
  setShowLeadModal: (show: boolean) => void;
  // Promoções
  promotions: Promotion[];
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  getDiscount: () => number;
  getTotalWithDiscount: () => number;
  hasFreeShipping: () => boolean;
  // Novas funções de promoções automáticas
  appliedPromotions: AppliedPromotion[];
  getPromotionDiscount: () => number;
  getTotalDiscount: () => number;
  getFinalTotal: () => number;
  getProductPromotion: (productId: string) => Promotion | null;
};

const CatalogoContext = createContext<CatalogoContextType | null>(null);

export function useCatalogo() {
  const context = useContext(CatalogoContext);
  if (!context) {
    throw new Error('useCatalogo must be used within CatalogoProvider');
  }
  return context;
}

export default function CatalogoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [slug, setSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [socialMenuOpen, setSocialMenuOpen] = useState(false);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<CartItem | null>(null);
  const [isCuponsModalOpen, setIsCuponsModalOpen] = useState(false);
  
  // Estados para promoções
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [appliedPromotions, setAppliedPromotions] = useState<AppliedPromotion[]>([]);
  
  // Estados para busca
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Estado para controlar scroll (logo encolhe)
  const [isScrolled, setIsScrolled] = useState(false);
  
  const supabase = createClientComponentClient();

  // Carregar slug
  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  // Detectar scroll para encolher logo
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Carregar dados do revendedor
  useEffect(() => {
    if (!slug) return;

    async function loadReseller() {
      // ⚠️ SEGURANÇA: Selecionar APENAS campos públicos necessários
      const { data } = await supabase
        .from('resellers')
        .select('id, store_name, slug, phone, logo_url, banner_url, banner_mobile_url, bio, instagram, facebook, colors, theme_settings, is_active, status')
        .eq('slug', slug)
        .single();

      // 🆕 VERIFICAR SE EXISTE MAS ESTÁ DESATIVADA (is_active=false)
      if (data && (!data.is_active || data.status !== 'aprovada')) {
        setReseller({ ...data, desativada: true } as Reseller & { desativada: boolean });
        setLoading(false);
        return;
      }

      if (data && data.is_active && data.status === 'aprovada') {
        setReseller(data);
        
        // Carregar promoções ativas da revendedora
        loadPromotions(data.id);
      }
      setLoading(false);
    }

    loadReseller();
  }, [slug, supabase]);

  // Função para carregar promoções ativas
  const loadPromotions = async (resellerId: string) => {
    try {
      const response = await fetch(`/api/promocoes?reseller_id=${resellerId}&active=true`);
      const data = await response.json();
      if (data.promotions) {
        setPromotions(data.promotions);
      }
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
    }
  };

  // Carregar carrinho do localStorage
  useEffect(() => {
    if (!slug) return;
    const saved = localStorage.getItem(`cart_${slug}`);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        setCart([]);
      }
    }
    
    // Carregar dados do lead do localStorage
    const savedLead = localStorage.getItem(`lead_${slug}`);
    if (savedLead) {
      try {
        setLeadData(JSON.parse(savedLead));
      } catch {
        setLeadData(null);
      }
    }
  }, [slug]);

  // Salvar carrinho no localStorage
  useEffect(() => {
    if (slug && cart.length >= 0) {
      localStorage.setItem(`cart_${slug}`, JSON.stringify(cart));
    }
  }, [cart, slug]);

  // Salvar/atualizar carrinho abandonado no banco quando carrinho muda
  const saveAbandonedCart = useCallback(async (lead: LeadData, cartItems: CartItem[]) => {
    if (!reseller?.id || cartItems.length === 0) return;
    
    try {
      const total = cartItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
      
      // Verificar se já existe um carrinho para esse lead
      const { data: existingCart } = await supabase
        .from('abandoned_carts')
        .select('id')
        .eq('reseller_id', reseller.id)
        .eq('customer_phone', lead.phone)
        .eq('status', 'abandoned')
        .single();

      let cartId = existingCart?.id;

      if (cartId) {
        // Atualizar carrinho existente
        await supabase
          .from('abandoned_carts')
          .update({
            customer_name: lead.name,
            total_value: total,
            items_count: cartItems.length,
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', cartId);

        // Deletar itens antigos
        await supabase
          .from('abandoned_cart_items')
          .delete()
          .eq('cart_id', cartId);
      } else {
        // Criar novo carrinho
        const { data: newCart } = await supabase
          .from('abandoned_carts')
          .insert({
            reseller_id: reseller.id,
            customer_name: lead.name,
            customer_phone: lead.phone,
            total_value: total,
            items_count: cartItems.length,
            status: 'abandoned',
          })
          .select('id')
          .single();

        cartId = newCart?.id;
      }

      if (cartId) {
        // Inserir itens do carrinho
        const items = cartItems.map(item => ({
          cart_id: cartId,
          product_id: item.productId,
          product_name: item.nome,
          product_image: item.imagem,
          product_price: item.preco,
          quantity: item.quantidade,
          variation_id: item.variacao?.id,
          variation_name: item.variacao?.tamanho,
        }));

        await supabase.from('abandoned_cart_items').insert(items);
        
        // Salvar cartId no lead local
        const updatedLead = { ...lead, cartId };
        setLeadData(updatedLead);
        localStorage.setItem(`lead_${slug}`, JSON.stringify(updatedLead));
      }
    } catch (error) {
      console.error('Erro ao salvar carrinho abandonado:', error);
    }
  }, [reseller?.id, slug, supabase]);

  // Salvar carrinho abandonado quando carrinho ou lead mudam
  useEffect(() => {
    if (leadData && cart.length > 0) {
      const timer = setTimeout(() => {
        saveAbandonedCart(leadData, cart);
      }, 2000); // Debounce de 2 segundos
      
      return () => clearTimeout(timer);
    }
  }, [cart, leadData, saveAbandonedCart]);

  const primaryColor = reseller?.colors?.primary || '#ec4899';
  const secondaryColor = reseller?.colors?.secondary || '#8b5cf6';
  const themeSettings = reseller?.theme_settings || {
    button_style: 'rounded',
    card_style: 'shadow',
    header_style: 'gradient',
    logo_shape: 'circle',
    logo_position: 'center',
    show_prices: true,
    show_stock: false,
    show_whatsapp_float: true,
    border_radius: 'medium',
    announcement_bar: {
      enabled: false,
      text: '',
      bg_color: '#000000',
      text_color: '#ffffff',
    },
    header_color: undefined, // Usa primaryColor por padrão
  };

  // Verificar se precisa capturar lead (primeira vez adicionando ao carrinho)
  const requireLeadCapture = useCallback(() => {
    return !leadData;
  }, [leadData]);

  // Handler para quando o lead é capturado
  const handleLeadSubmit = useCallback((name: string, phone: string) => {
    const newLead: LeadData = { name, phone };
    setLeadData(newLead);
    localStorage.setItem(`lead_${slug}`, JSON.stringify(newLead));
    setShowLeadModal(false);
    
    // Se tinha um item pendente, adicionar ao carrinho
    if (pendingCartItem) {
      actualAddToCart(pendingCartItem);
      setPendingCartItem(null);
    }
  }, [slug, pendingCartItem]);

  // Função real de adicionar ao carrinho
  const actualAddToCart = (item: CartItem) => {
    setCart(prev => {
      // Usar variacao.id se existir, senão sku, senão productId
      const key = item.variacao?.id 
        ? `${item.productId}-${item.variacao.id}` 
        : item.sku 
          ? `${item.productId}-${item.sku}` 
          : item.productId;
      
      const existing = prev.find(i => {
        const itemKey = i.variacao?.id 
          ? `${i.productId}-${i.variacao.id}` 
          : i.sku 
            ? `${i.productId}-${i.sku}` 
            : i.productId;
        return itemKey === key;
      });

      if (existing) {
        return prev.map(i => {
          const itemKey = i.variacao?.id 
            ? `${i.productId}-${i.variacao.id}` 
            : i.sku 
              ? `${i.productId}-${i.sku}` 
              : i.productId;
          return itemKey === key
            ? { ...i, quantidade: i.quantidade + item.quantidade }
            : i;
        });
      }

      return [...prev, { ...item, id: key }];
    });
  };

  // Função pública de adicionar ao carrinho (verifica lead primeiro)
  const addToCart = (item: CartItem) => {
    // Se não tem lead cadastrado, mostrar modal e guardar item pendente
    if (!leadData) {
      setPendingCartItem(item);
      setShowLeadModal(true);
      return;
    }
    
    // Se já tem lead, adicionar normalmente
    actualAddToCart(item);
  };

  const removeFromCart = (productId: string, variacaoId?: string) => {
    setCart(prev => {
      return prev.filter(item => {
        // Se tem variacaoId, comparar com variacao.id
        if (variacaoId) {
          return !(item.productId === productId && item.variacao?.id === variacaoId);
        }
        // Se não tem variacaoId, remover por productId (produto sem variações)
        return item.productId !== productId;
      });
    });
  };

  const updateQuantity = (productId: string, quantidade: number, variacaoId?: string) => {
    if (quantidade < 1) return; // Não permitir quantidade menor que 1
    
    setCart(prev =>
      prev.map(item => {
        // Verificar se é o item correto
        const isMatch = variacaoId 
          ? (item.productId === productId && item.variacao?.id === variacaoId)
          : item.productId === productId;
        
        if (!isMatch) return item;
        
        // Limitar pela estoque disponível (se tiver)
        const maxQtd = item.estoque || 99;
        const novaQuantidade = Math.max(1, Math.min(quantidade, maxQtd));
        
        return { ...item, quantidade: novaQuantidade };
      })
    );
  };

  const clearCart = () => setCart([]);

  const getTotal = useCallback(() => cart.reduce((sum, item) => sum + item.preco * item.quantidade, 0), [cart]);

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantidade, 0);

  // ==================== FUNÇÕES DE PROMOÇÕES E CUPONS ====================
  
  // Aplicar cupom de desconto
  const applyCoupon = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!reseller?.id || !code.trim()) {
      return { success: false, message: 'Digite um código de cupom válido' };
    }

    try {
      // Verificar se o cupom pertence a essa revendedora
      const response = await fetch(`/api/promocoes?coupon=${code.trim().toUpperCase()}`);
      const data = await response.json();

      if (data.error) {
        return { success: false, message: data.error };
      }

      const promotion = data.promotion;

      // Verificar se o cupom é dessa revendedora
      if (promotion.reseller_id !== reseller.id) {
        return { success: false, message: 'Cupom inválido para esta loja' };
      }

      // Verificar valor mínimo de compra
      const total = getTotal();
      if (promotion.min_purchase_value && total < promotion.min_purchase_value) {
        return { 
          success: false, 
          message: `Compra mínima de R$ ${promotion.min_purchase_value.toFixed(2)} para usar este cupom` 
        };
      }

      // Calcular desconto
      let discountValue = 0;
      
      if (promotion.type === 'cupom_desconto' || promotion.type === 'desconto_percentual') {
        if (promotion.discount_type === 'percentage') {
          discountValue = total * (promotion.discount_value / 100);
          // Aplicar limite máximo de desconto se existir
          if (promotion.max_discount_value && discountValue > promotion.max_discount_value) {
            discountValue = promotion.max_discount_value;
          }
        } else {
          discountValue = promotion.discount_value || 0;
        }
      } else if (promotion.type === 'desconto_valor') {
        discountValue = promotion.discount_value || 0;
      }

      // Salvar cupom aplicado
      const couponData: AppliedCoupon = {
        code: code.toUpperCase(),
        promotion,
        discountValue,
      };
      
      setAppliedCoupon(couponData);
      localStorage.setItem(`coupon_${slug}`, JSON.stringify(couponData));

      return { success: true, message: `Cupom aplicado! Desconto de R$ ${discountValue.toFixed(2)}` };
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      return { success: false, message: 'Erro ao validar cupom' };
    }
  }, [reseller?.id, slug, getTotal]);

  // Remover cupom
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    localStorage.removeItem(`coupon_${slug}`);
  }, [slug]);

  // Calcular desconto atual
  const getDiscount = useCallback(() => {
    if (!appliedCoupon) return 0;
    
    // Recalcular desconto baseado no total atual
    const total = getTotal();
    const promotion = appliedCoupon.promotion;
    
    let discountValue = 0;
    
    if (promotion.type === 'cupom_desconto' || promotion.type === 'desconto_percentual') {
      if (promotion.discount_type === 'percentage') {
        discountValue = total * ((promotion.discount_value || 0) / 100);
        if (promotion.max_discount_value && discountValue > promotion.max_discount_value) {
          discountValue = promotion.max_discount_value;
        }
      } else {
        discountValue = promotion.discount_value || 0;
      }
    } else if (promotion.type === 'desconto_valor') {
      discountValue = promotion.discount_value || 0;
    }
    
    return Math.min(discountValue, total); // Não permitir desconto maior que o total
  }, [appliedCoupon, getTotal]);

  // Total com desconto
  const getTotalWithDiscount = useCallback(() => {
    return Math.max(0, getTotal() - getDiscount());
  }, [getTotal, getDiscount]);

  // Verificar se tem frete grátis
  const hasFreeShipping = useCallback(() => {
    // Verificar se tem promoção de frete grátis ativa
    const freeShippingPromo = promotions.find(p => 
      p.type === 'frete_gratis' && 
      p.free_shipping === true
    );

    if (freeShippingPromo) {
      // Verificar valor mínimo se existir
      if (freeShippingPromo.min_value_free_shipping) {
        return getTotal() >= freeShippingPromo.min_value_free_shipping;
      }
      return true;
    }

    // Verificar se cupom aplicado tem frete grátis
    if (appliedCoupon?.promotion.free_shipping) {
      const minValue = appliedCoupon.promotion.min_value_free_shipping;
      if (minValue) {
        return getTotal() >= minValue;
      }
      return true;
    }

    return false;
  }, [promotions, appliedCoupon, getTotal]);

  // ==================== PROMOÇÕES AUTOMÁTICAS (Leve Mais Pague Menos, Descontos em Produtos) ====================

  // Calcular promoções automáticas baseadas no carrinho
  const calculateAutoPromotions = useCallback((): AppliedPromotion[] => {
    const applied: AppliedPromotion[] = [];
    
    // Filtrar promoções automáticas (não são cupom)
    const autoPromotions = promotions.filter(p => 
      p.type !== 'cupom_desconto' && p.type !== 'frete_gratis'
    );

    for (const promo of autoPromotions) {
      // LEVE MAIS PAGUE MENOS (Desconto Progressivo)
      if (promo.type === 'leve_pague') {
        // Verificar se a promoção se aplica a produtos específicos ou todos
        let eligibleItems = cart;
        
        if (promo.applies_to === 'products' && promo.product_ids?.length) {
          eligibleItems = cart.filter(item => promo.product_ids?.includes(item.productId));
        } else if (promo.applies_to === 'categories' && promo.category_ids?.length) {
          // TODO: Filtrar por categoria (precisa ter categoria no item)
          eligibleItems = cart;
        }

        // Calcular total de itens elegíveis
        const totalEligibleQty = eligibleItems.reduce((sum, item) => sum + item.quantidade, 0);
        
        // Fazer parse do progressive_discounts se necessário
        let progressiveDiscounts = promo.progressive_discounts;
        if (typeof progressiveDiscounts === 'string') {
          try {
            progressiveDiscounts = JSON.parse(progressiveDiscounts);
          } catch {
            progressiveDiscounts = null;
          }
        }
        
        // Verificar se tem descontos progressivos configurados
        if (progressiveDiscounts && Array.isArray(progressiveDiscounts) && progressiveDiscounts.length > 0) {
          // Ordenar faixas do maior para o menor min_items
          const sortedDiscounts = [...progressiveDiscounts].sort((a, b) => b.min_items - a.min_items);
          
          // Encontrar a faixa aplicável (maior faixa que a quantidade atende)
          const applicableDiscount = sortedDiscounts.find(d => totalEligibleQty >= d.min_items);
          
          if (applicableDiscount) {
            const totalEligibleValue = eligibleItems.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
            const discountValue = totalEligibleValue * (applicableDiscount.discount_percent / 100);
            
            if (discountValue > 0) {
              applied.push({
                promotion: promo,
                discountValue,
                description: `${totalEligibleQty} peças = ${applicableDiscount.discount_percent}% OFF`,
                affectedItems: eligibleItems.map(i => i.productId)
              });
            }
          }
        }
        // Fallback para o formato antigo (buy_quantity/pay_quantity)
        else if (promo.buy_quantity && promo.pay_quantity) {
          const buyQty = promo.buy_quantity;
          const payQty = promo.pay_quantity;
          
          if (totalEligibleQty >= buyQty) {
            // Quantas vezes a promoção se aplica
            const timesApplied = Math.floor(totalEligibleQty / buyQty);
            const freeItems = timesApplied * (buyQty - payQty);
            
            // Calcular o desconto (preço médio dos itens elegíveis * itens grátis)
            const totalEligibleValue = eligibleItems.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
            const avgPrice = totalEligibleValue / totalEligibleQty;
            const discountValue = avgPrice * freeItems;
            
            if (discountValue > 0) {
              applied.push({
                promotion: promo,
                discountValue,
                description: `Leve ${buyQty} Pague ${payQty}: ${timesApplied}x aplicado`,
                affectedItems: eligibleItems.map(i => i.productId)
              });
            }
          }
        }
      }
      
      // DESCONTO PERCENTUAL em produtos específicos
      else if (promo.type === 'desconto_percentual' && promo.discount_value && !promo.coupon_code) {
        let eligibleItems = cart;
        
        if (promo.applies_to === 'products' && promo.product_ids?.length) {
          eligibleItems = cart.filter(item => promo.product_ids?.includes(item.productId));
        }
        
        if (eligibleItems.length > 0) {
          const eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
          let discountValue = eligibleTotal * (promo.discount_value / 100);
          
          // Aplicar limite máximo
          if (promo.max_discount_value && discountValue > promo.max_discount_value) {
            discountValue = promo.max_discount_value;
          }
          
          if (discountValue > 0) {
            applied.push({
              promotion: promo,
              discountValue,
              description: `${promo.discount_value}% OFF: -R$ ${discountValue.toFixed(2)}`,
              affectedItems: eligibleItems.map(i => i.productId)
            });
          }
        }
      }
      
      // DESCONTO EM VALOR em produtos específicos
      else if (promo.type === 'desconto_valor' && promo.discount_value && !promo.coupon_code) {
        let eligibleItems = cart;
        
        if (promo.applies_to === 'products' && promo.product_ids?.length) {
          eligibleItems = cart.filter(item => promo.product_ids?.includes(item.productId));
        }
        
        if (eligibleItems.length > 0) {
          // Desconto fixo por item ou total
          const discountValue = promo.discount_value * eligibleItems.length;
          
          if (discountValue > 0) {
            applied.push({
              promotion: promo,
              discountValue,
              description: `Desconto: -R$ ${discountValue.toFixed(2)}`,
              affectedItems: eligibleItems.map(i => i.productId)
            });
          }
        }
      }
    }
    
    return applied;
  }, [cart, promotions]);

  // Atualizar promoções aplicadas quando carrinho ou promoções mudam
  useEffect(() => {
    const autoPromos = calculateAutoPromotions();
    setAppliedPromotions(autoPromos);
  }, [calculateAutoPromotions]);

  // Calcular desconto total das promoções automáticas
  const getPromotionDiscount = useCallback(() => {
    return appliedPromotions.reduce((sum, ap) => sum + ap.discountValue, 0);
  }, [appliedPromotions]);

  // Desconto total (cupom + promoções automáticas)
  const getTotalDiscount = useCallback(() => {
    return getDiscount() + getPromotionDiscount();
  }, [getDiscount, getPromotionDiscount]);

  // Total final com todos os descontos
  const getFinalTotal = useCallback(() => {
    return Math.max(0, getTotal() - getTotalDiscount());
  }, [getTotal, getTotalDiscount]);

  // Verificar se um produto tem promoção ativa
  const getProductPromotion = useCallback((productId: string): Promotion | null => {
    // Buscar promoção que se aplica a este produto
    const promo = promotions.find(p => {
      // Promoções para produtos específicos
      if (p.applies_to === 'products' && p.product_ids?.includes(productId)) {
        return true;
      }
      // Promoções para todos os produtos (leve mais pague menos, descontos)
      if (p.applies_to === 'all') {
        if (p.type === 'leve_pague' || p.type === 'desconto_percentual' || p.type === 'desconto_valor') {
          return true;
        }
      }
      return false;
    });
    
    // Se encontrou promoção, garantir que progressive_discounts é um array
    if (promo && promo.type === 'leve_pague' && promo.progressive_discounts) {
      // Se veio como string, fazer parse
      if (typeof promo.progressive_discounts === 'string') {
        try {
          return {
            ...promo,
            progressive_discounts: JSON.parse(promo.progressive_discounts as unknown as string)
          };
        } catch {
          return promo;
        }
      }
    }
    
    return promo || null;
  }, [promotions]);

  // Função de busca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalogo/${slug}?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Carregar cupom salvo do localStorage
  useEffect(() => {
    if (!slug) return;
    const savedCoupon = localStorage.getItem(`coupon_${slug}`);
    if (savedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(savedCoupon));
      } catch {
        setAppliedCoupon(null);
      }
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // 🆕 TELA DE SITE DESATIVADO (quando revendedora existe mas is_active=false)
  if (reseller && 'desativada' in reseller && (reseller as Reseller & { desativada: boolean }).desativada) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Ícone */}
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>

          {/* Mensagem */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Site Temporariamente Desativado
          </h1>
          
          <p className="text-gray-600 mb-6">
            Este site está temporariamente <strong>indisponível</strong>.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-700 mb-3">
              <strong>Informação:</strong>
            </p>
            <p className="text-sm text-gray-600">
              A revendedora está com o catálogo desativado no momento. 
              Por favor, tente novamente mais tarde ou entre em contato diretamente.
            </p>
          </div>

          {/* Link de Voltar */}
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            Voltar à Página Inicial
          </Link>
        </div>
      </div>
    );
  }

  if (!reseller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Catálogo não encontrado</h1>
          <p className="text-gray-600">O catálogo que você procura não existe.</p>
        </div>
      </div>
    );
  }

  const hasSocialLinks = reseller.instagram || reseller.facebook || reseller.phone;

  return (
    <CatalogoContext.Provider
      value={{
        reseller,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getTotalItems,
        primaryColor,
        secondaryColor,
        themeSettings,
        leadData,
        requireLeadCapture,
        showLeadModal,
        setShowLeadModal,
        // Promoções
        promotions,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        getDiscount,
        getTotalWithDiscount,
        hasFreeShipping,
        // Promoções automáticas
        appliedPromotions,
        getPromotionDiscount,
        getTotalDiscount,
        getFinalTotal,
        getProductPromotion,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Meta Tags para SEO */}
        {reseller && (
          <CatalogoMetaTags
            storeName={reseller.store_name}
            slug={reseller.slug}
            bio={reseller.bio}
            logoUrl={reseller.logo_url}
            bannerUrl={reseller.banner_url}
          />
        )}

        {/* Modal de Captura de Lead */}
        <LeadCaptureModal
          isOpen={showLeadModal}
          onClose={() => {
            setShowLeadModal(false);
            setPendingCartItem(null);
          }}
          onSubmit={handleLeadSubmit}
          primaryColor={primaryColor}
        />

        {/* Barra de Anúncio Deslizante - ANTES do Header */}
        {themeSettings?.announcement_bar?.enabled && themeSettings?.announcement_bar?.text && (
          <div 
            className="overflow-hidden whitespace-nowrap py-2"
            style={{ 
              backgroundColor: themeSettings.announcement_bar.bg_color || '#000000',
              color: themeSettings.announcement_bar.text_color || '#ffffff'
            }}
          >
            <div className="animate-marquee inline-block">
              <span className="mx-8 text-sm font-medium">{themeSettings.announcement_bar.text}</span>
              <span className="mx-8 text-sm font-medium">{themeSettings.announcement_bar.text}</span>
              <span className="mx-8 text-sm font-medium">{themeSettings.announcement_bar.text}</span>
              <span className="mx-8 text-sm font-medium">{themeSettings.announcement_bar.text}</span>
              <span className="mx-8 text-sm font-medium">{themeSettings.announcement_bar.text}</span>
              <span className="mx-8 text-sm font-medium">{themeSettings.announcement_bar.text}</span>
            </div>
          </div>
        )}

        <header
          className="sticky top-0 z-40 text-white shadow-lg"
          style={{ 
            background: themeSettings.header_style === 'solid' 
              ? (themeSettings.header_color || primaryColor)
              : `linear-gradient(135deg, ${themeSettings.header_color || primaryColor}, ${secondaryColor})` 
          }}
        >
          {/* Linha 1: Menu + Logo + Carrinho */}
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Esquerda: Menu Social */}
              {hasSocialLinks ? (
                <div className="relative">
                  <button
                    onClick={() => setSocialMenuOpen(!socialMenuOpen)}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
                  >
                    {socialMenuOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>

                  {/* Dropdown Menu */}
                  {socialMenuOpen && (
                    <div className="absolute left-0 top-12 bg-white rounded-xl shadow-xl py-2 min-w-[180px] z-50">
                      {reseller.phone && (
                        <a
                          href={`https://wa.me/55${reseller.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                          onClick={() => setSocialMenuOpen(false)}
                        >
                          <MessageCircle size={20} className="text-green-500" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      {reseller.instagram && (
                        <a
                          href={`https://instagram.com/${reseller.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                          onClick={() => setSocialMenuOpen(false)}
                        >
                          <Instagram size={20} className="text-pink-500" />
                          <span>@{reseller.instagram}</span>
                        </a>
                      )}
                      {reseller.facebook && (
                        <a
                          href={reseller.facebook.startsWith('http') ? reseller.facebook : `https://facebook.com/${reseller.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                          onClick={() => setSocialMenuOpen(false)}
                        >
                          <Facebook size={20} className="text-blue-600" />
                          <span>Facebook</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-10" /> /* Espaçador quando não tem redes sociais */
              )}

              {/* Centro: Logo */}
              <Link href={`/catalogo/${slug}`} className="flex items-center justify-center transition-all duration-300">
                {reseller.logo_url ? (
                  <div className={`relative transition-all duration-300 ${
                    isScrolled ? '' : 'scale-110'
                  }`}>
                    <Image
                      src={reseller.logo_url}
                      alt={reseller.store_name}
                      width={isScrolled ? 56 : 80}
                      height={isScrolled ? 56 : 80}
                      className={`object-cover transition-all duration-300 ${
                        // 🎯 SEMPRE FORÇAR REDONDO se não for retângulo (decisão de design)
                        // Logos quadradas geralmente têm fundo, então redondo fica melhor
                        themeSettings.logo_shape === 'rectangle' 
                          ? `${isScrolled ? 'h-12' : 'h-16'} w-auto object-contain` 
                          : `${isScrolled ? 'w-14 h-14' : 'w-20 h-20'} rounded-full border-2 border-white/50`
                      }`}
                      style={{
                        filter: themeSettings.logo_shape === 'rectangle' 
                          ? (isScrolled ? 'none' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))')
                          : 'none',
                        boxShadow: themeSettings.logo_shape !== 'rectangle'
                          ? isScrolled 
                            ? '0 3px 10px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)'
                            : '0 6px 16px rgba(0,0,0,0.2), 0 3px 8px rgba(0,0,0,0.15)'
                          : undefined
                      }}
                    />
                  </div>
                ) : (
                  <span className={`font-bold transition-all duration-300 ${
                    isScrolled ? 'text-lg' : 'text-2xl'
                  }`}>{reseller.store_name}</span>
                )}
              </Link>

              {/* Direita: Cupons + Carrinho */}
              <div className="flex items-center gap-2">
                {/* Botão de Cupons - Só aparece se houver cupons ativos */}
                {promotions.some(p => 
                  p.is_active && 
                  p.coupon_code && 
                  (!p.ends_at || new Date(p.ends_at) > new Date()) &&
                  (!p.max_uses || (p.uses_count || 0) < p.max_uses)
                ) && (
                  <button
                    onClick={() => setIsCuponsModalOpen(true)}
                    className="relative p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
                    title="Cupons disponíveis"
                  >
                    <Gift size={22} />
                    {/* Badge de notificação */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {promotions.filter(p => 
                        p.is_active && 
                        p.coupon_code && 
                        (!p.ends_at || new Date(p.ends_at) > new Date()) &&
                        (!p.max_uses || (p.uses_count || 0) < p.max_uses)
                      ).length}
                    </span>
                  </button>
                )}

                {/* Carrinho */}
                <Link
                  href={`/catalogo/${slug}/carrinho`}
                  className="relative p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
                >
                  <ShoppingCart size={22} />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-xs font-bold rounded-full flex items-center justify-center"
                      style={{ color: primaryColor }}
                    >
                      {getTotalItems()}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>

          {/* Linha 2: Barra de Busca - Integrada no header */}
          <div className="px-4 pb-3" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
              <div className="relative flex items-center">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar Produtos"
                  className={`w-full pl-4 pr-10 py-2.5 bg-white text-gray-800 border-0 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-colors placeholder-gray-400 text-sm ${
                    themeSettings?.button_style === 'rounded' || !themeSettings?.button_style ? 'rounded-full' : 'rounded-lg'
                  }`}
                />
                <button
                  type="submit"
                  className="absolute right-3 p-1"
                >
                  <Search size={18} style={{ color: primaryColor }} />
                </button>
              </div>
            </form>
          </div>
        </header>

        {/* Conteúdo */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} {reseller.store_name}. Todos os direitos reservados.</p>
          </div>
        </footer>

        {/* Botão WhatsApp Flutuante */}
        {themeSettings.show_whatsapp_float && reseller.phone && (
          <a
            href={`https://wa.me/55${reseller.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors z-50"
          >
            <MessageCircle size={28} className="text-white" />
          </a>
        )}

        {/* Modal de Cupons */}
        <CuponsModal
          isOpen={isCuponsModalOpen}
          onClose={() => setIsCuponsModalOpen(false)}
          resellerId={reseller.id}
          onCouponCopy={(code) => {
            // Opcional: Pode redirecionar para o carrinho com o cupom
            console.log('Cupom copiado:', code)
          }}
        />
      </div>
    </CatalogoContext.Provider>
  );
}
