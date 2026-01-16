"use client";
import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Truck, Tag } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCatalogo } from './layout';
import BannerComTexto from '@/components/site/BannerComTexto';

type Variacao = {
  id?: string;
  sku?: string;
  nome?: string;
  tamanho?: string;
  cor?: string;
  estoque: number;
};

type ProductWithPrice = {
  id: string;
  nome: string;
  descricao?: string;
  preco_base: number;
  imagem?: string;
  finalPrice: number;
  estoque: number;
  variacoes?: Variacao[];
  created_at?: string; // Data de criação do vínculo
};

export default function CatalogoPrincipal() {
  const { reseller, primaryColor, themeSettings, promotions, getProductPromotion } = useCatalogo();
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc' | 'stock' | 'newest'>('default');
  
  // Ler termo de busca da URL (vem do header)
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  const supabase = createClientComponentClient();

  // Função para carregar produtos (reutilizável e memoizada)
  const loadProducts = useCallback(async () => {
    if (!reseller?.id) return;

    const { data } = await supabase
      .from('reseller_products')
      .select(`
        *,
        produtos:product_id (
          id,
          nome,
          preco_base,
          imagem,
          estoque,
          ativo,
          variacoes_meta
        )
      `)
      .eq('reseller_id', reseller.id)
      .eq('is_active', true);

    // Filtrar apenas produtos ativos no admin e com estoque
    const productsWithPrice: ProductWithPrice[] =
      data
        ?.filter((p) => p.produtos?.ativo === true && (p.produtos?.estoque || 0) > 0)
        .map((p) => {
        // Parse variações do JSONB
        let variacoes: Variacao[] = [];
        if (p.produtos.variacoes_meta) {
          try {
            const meta = typeof p.produtos.variacoes_meta === 'string' 
              ? JSON.parse(p.produtos.variacoes_meta) 
              : p.produtos.variacoes_meta;
            
            if (Array.isArray(meta)) {
              variacoes = meta.map((v: { sku?: string; nome?: string; tamanho?: string; estoque?: number }) => {
                // Extrair tamanho: usa tamanho direto, ou nome, ou última parte do SKU
                const tamanho = v.tamanho || v.nome || v.sku?.split('-').pop() || '';
                const estoque = typeof v.estoque === 'number' ? v.estoque : 0;
                return {
                  ...v,
                  tamanho,
                  estoque,
                };
              });
            }
          } catch {
            variacoes = [];
          }
        }
        
        return {
          id: p.produtos.id,
          nome: p.produtos.nome,
          preco_base: p.produtos.preco_base,
          imagem: p.produtos.imagem,
          estoque: p.produtos.estoque || 0,
          finalPrice: p.produtos.preco_base * (1 + (p.margin_percent || 0) / 100),
          variacoes,
          created_at: p.created_at, // 🆕 Data de criação do vínculo
        };
      }) || [];

    setProducts(productsWithPrice);
    setLoading(false);
  }, [reseller?.id, supabase]);

  // Carregar produtos inicialmente
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 🔥 REALTIME: Atualizar automaticamente quando estoque mudar
  useEffect(() => {
    if (!reseller?.id) return;

    // Inscrever para mudanças na tabela produtos
    const channel = supabase
      .channel('produtos-catalog-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // UPDATE, INSERT, DELETE
          schema: 'public',
          table: 'produtos',
        },
        (payload) => {
          console.log('🔄 [Catálogo] Atualização detectada:', payload);
          loadProducts(); // Recarregar produtos
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reseller?.id, supabase, loadProducts]);

  // Extrair todos os tamanhos únicos disponíveis
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach(p => {
      p.variacoes?.forEach(v => {
        // Pegar tamanho de: tamanho, nome, ou última parte do SKU
        const tamanho = v.tamanho || v.nome || v.sku?.split('-').pop() || '';
        if (tamanho && v.estoque > 0) {
          sizes.add(tamanho);
        }
      });
    });
    // Ordenar tamanhos numericamente se possível, senão alfabeticamente
    return Array.from(sizes).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [products]);

  // Filtrar e ordenar produtos
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtrar por tamanho se selecionado
    if (selectedSize) {
      filtered = filtered.filter(p => 
        p.variacoes?.some(v => {
          const tamanho = v.tamanho || v.nome || v.sku?.split('-').pop() || '';
          return tamanho === selectedSize && v.estoque > 0;
        })
      );
    }

    // 🆕 ORDENAÇÃO INTELIGENTE
    if (sortOrder === 'default') {
      // PADRÃO: Priorizar produtos com MAIS ESTOQUE e MAIS NOVOS
      filtered = [...filtered].sort((a, b) => {
        // 1️⃣ Primeiro critério: ESTOQUE (maior estoque primeiro)
        const estoqueDiff = b.estoque - a.estoque;
        if (estoqueDiff !== 0) return estoqueDiff;
        
        // 2️⃣ Segundo critério: DATA (mais recente primeiro)
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        
        // 3️⃣ Terceiro critério: Nome (alfabético)
        return a.nome.localeCompare(b.nome);
      });
    } else if (sortOrder === 'stock') {
      // Ordenar APENAS por estoque (maior primeiro)
      filtered = [...filtered].sort((a, b) => b.estoque - a.estoque);
    } else if (sortOrder === 'newest') {
      // Ordenar APENAS por data (mais recente primeiro)
      filtered = [...filtered].sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });
    } else if (sortOrder === 'price_asc') {
      filtered = [...filtered].sort((a, b) => a.finalPrice - b.finalPrice);
    } else if (sortOrder === 'price_desc') {
      filtered = [...filtered].sort((a, b) => b.finalPrice - a.finalPrice);
    }

    return filtered;
  }, [products, searchTerm, selectedSize, sortOrder]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Banner FULL WIDTH com textos personalizados */}
      {(reseller?.banner_url || reseller?.banner_mobile_url) && reseller?.user_id && (
        <BannerComTexto 
          userId={reseller.user_id}
          bannerUrl={reseller.banner_url}
          bannerMobileUrl={reseller.banner_mobile_url || reseller.banner_url}
        />
      )}

      {/* Banner de Promoções Ativas - usando cor da loja */}
      {promotions.length > 0 && (
        <div 
          className="text-white py-2.5"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
              {promotions.map((promo) => (
                <div key={promo.id} className="flex items-center gap-2">
                  {promo.type === 'frete_gratis' && (
                    <>
                      <Truck size={16} />
                      <span>
                        Frete Grátis
                        {promo.min_value_free_shipping && ` acima de R$ ${promo.min_value_free_shipping.toFixed(0)}`}
                      </span>
                    </>
                  )}
                  {(promo.type === 'cupom_desconto' || promo.type === 'desconto_percentual') && promo.coupon_code && (
                    <>
                      <Tag size={16} />
                      <span>
                        Cupom {promo.coupon_code}: {promo.discount_type === 'percentage' 
                          ? `${promo.discount_value}% OFF` 
                          : `R$ ${promo.discount_value} OFF`
                        }
                      </span>
                    </>
                  )}
                  {promo.type === 'leve_pague' && (
                    <>
                      <Tag size={16} />
                      <span>
                        {promo.progressive_discounts && promo.progressive_discounts.length > 0 
                          ? `Leve Mais Pague Menos: até ${Math.max(...promo.progressive_discounts.map(d => d.discount_percent))}% OFF`
                          : promo.buy_quantity && promo.pay_quantity 
                            ? `Leve ${promo.buy_quantity} Pague ${promo.pay_quantity}`
                            : promo.name
                        }
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo com padding */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Bio da Loja */}
        {reseller?.bio && (
          <div className="mb-6 text-center">
            <p className="text-gray-600">{reseller.bio}</p>
          </div>
        )}

        {/* Encontre seu Tamanho - Scroll Horizontal */}
        {availableSizes.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* Botão "Todos" */}
              <button
                onClick={() => setSelectedSize('')}
                className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border-2 ${
                  selectedSize === ''
                    ? 'text-white shadow-md scale-105 border-transparent'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }`}
                style={selectedSize === '' ? { backgroundColor: primaryColor } : {}}
              >
                Todos
              </button>
              {/* Círculos de tamanhos */}
              {availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                  className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-base font-bold transition-all duration-200 border-2 ${
                    selectedSize === size
                      ? 'text-white shadow-md scale-105 border-transparent'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                  }`}
                  style={selectedSize === size ? { backgroundColor: primaryColor } : {}}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ordenação */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600 text-sm">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
            {selectedSize && <span className="font-medium" style={{ color: primaryColor }}> no tamanho {selectedSize}</span>}
          </p>
          
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'default' | 'price_asc' | 'price_desc' | 'stock' | 'newest')}
              className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:outline-none cursor-pointer"
            >
              <option value="default">✨ Mais relevantes (Estoque + Novos)</option>
              <option value="stock">📦 Maior estoque</option>
              <option value="newest">🆕 Mais recentes</option>
              <option value="price_asc">💰 Menor preço</option>
              <option value="price_desc">💎 Maior preço</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

      {/* Grid de Produtos - 2 cols mobile, 3 tablet, 5 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {filteredProducts.map((product) => {
          // Estilo do Card baseado em theme_settings
          const cardStyle = themeSettings?.card_style || 'shadow';
          const cardClass = cardStyle === 'shadow' 
            ? 'shadow-md hover:shadow-xl' 
            : cardStyle === 'bordered' 
              ? 'border-2 border-gray-200 hover:border-gray-400' 
              : 'hover:bg-gray-50';
          
          // Estilo do Botão baseado em theme_settings
          const buttonStyle = themeSettings?.button_style || 'rounded';
          const buttonClass = buttonStyle === 'rounded' ? 'rounded-full' : 'rounded-md';
          
          // Bordas arredondadas globais
          const borderRadius = themeSettings?.border_radius || 'medium';
          const getBorderRadius = () => {
            switch (borderRadius) {
              case 'none': return '0px';
              case 'small': return '4px';
              case 'medium': return '12px';
              case 'large': return '24px';
              default: return '12px';
            }
          };
          const cardRadius = getBorderRadius();
          
          // Estilo da imagem do produto
          const imageStyle = themeSettings?.card_image_style || 'rounded';
          const imageClass = imageStyle === 'circle' 
            ? 'rounded-full mx-auto w-[85%]' 
            : imageStyle === 'rounded' 
              ? '' 
              : '';
          const imageRadius = imageStyle === 'square' ? '0px' : imageStyle === 'circle' ? '50%' : cardRadius;
          
          // Tamanho do nome do produto
          const nameSize = themeSettings?.product_name_size || 'medium';
          const nameSizeClass = nameSize === 'small' ? 'text-xs' : nameSize === 'large' ? 'text-base' : 'text-sm';
          
          // Verificar se o produto tem promoção
          const productPromo = getProductPromotion(product.id);
          
          // Pegar o texto da promoção de forma simplificada
          const getPromoLabel = () => {
            if (!productPromo) return null;
            if (productPromo.type === 'leve_pague') {
              // Verificar se tem descontos progressivos
              let progressiveDiscounts = productPromo.progressive_discounts;
              
              // Parse se veio como string
              if (typeof progressiveDiscounts === 'string') {
                try {
                  progressiveDiscounts = JSON.parse(progressiveDiscounts);
                } catch {
                  progressiveDiscounts = null;
                }
              }
              
              if (progressiveDiscounts && Array.isArray(progressiveDiscounts) && progressiveDiscounts.length > 0) {
                // Pegar o primeiro desconto (menor quantidade) para mostrar
                const sorted = [...progressiveDiscounts].sort((a, b) => a.min_items - b.min_items);
                return `${sorted[0].min_items}+ peças = ${sorted[0].discount_percent}% OFF`;
              }
              if (productPromo.buy_quantity && productPromo.pay_quantity) {
                return `Leve ${productPromo.buy_quantity} Pague ${productPromo.pay_quantity}`;
              }
              // Se tem a promoção mas não tem dados configurados, mostrar nome
              return productPromo.name || 'Leve Mais Pague Menos';
            }
            if (productPromo.type === 'desconto_percentual') {
              return `${productPromo.discount_value}% OFF`;
            }
            if (productPromo.type === 'desconto_valor') {
              return `-R$ ${productPromo.discount_value}`;
            }
            return null;
          };
          
          const promoLabel = getPromoLabel();
          
          return (
            <Link
              key={product.id}
              href={`/site/${reseller?.slug}/produto/${product.id}`}
              className={`bg-white overflow-hidden transition-all duration-300 group ${cardClass}`}
              style={{ borderRadius: cardRadius }}
            >
              {/* Imagem formato 3:4 (960x1280) com alta qualidade */}
              <div 
                className={`relative bg-gray-50 overflow-hidden ${imageClass}`} 
                style={{ 
                  aspectRatio: imageStyle === 'circle' ? '1/1' : '3/4',
                  borderRadius: imageRadius
                }}
              >
                <Image
                  src={product.imagem || '/placeholder.png'}
                  alt={product.nome}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  quality={90}
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  style={{ borderRadius: imageRadius }}
                  priority={false}
                />
                
                {/* Tag de Promoção - Discreta no canto superior direito */}
                {promoLabel && (
                  <div className="absolute top-2 right-2">
                    <div 
                      className="text-white text-[10px] md:text-xs font-semibold px-2 py-1 shadow-sm backdrop-blur-sm"
                      style={{ 
                        backgroundColor: `${primaryColor}ee`,
                        borderRadius: cardRadius
                      }}
                    >
                      {promoLabel}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-3 md:p-4">
                <h3 className={`font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem] ${nameSizeClass}`}>
                  {product.nome}
                </h3>
                {themeSettings?.show_prices !== false && (
                  <p className="text-lg md:text-xl font-bold mb-3" style={{ color: primaryColor }}>
                    R$ {product.finalPrice.toFixed(2).replace('.', ',')}
                  </p>
                )}
                <div
                  className={`w-full py-2.5 text-white font-medium text-center text-sm transition-all ${buttonClass}`}
                  style={{ 
                    backgroundColor: themeSettings?.button_color || primaryColor,
                    borderRadius: buttonStyle === 'rounded' ? '9999px' : cardRadius
                  }}
                >
                  Ver Produto
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm ? 'Nenhum produto encontrado para sua busca.' : 'Nenhum produto disponível no momento.'}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
