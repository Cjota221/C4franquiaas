"use client";
import { useEffect, useState, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ChevronDown, Truck, Tag } from 'lucide-react';
import { useCatalogo } from './layout';
import CountdownTimer from '@/components/catalogo/CountdownTimer';

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
};

export default function CatalogoPrincipal() {
  const { reseller, primaryColor, themeSettings, promotions, getProductPromotion } = useCatalogo();
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!reseller?.id) return;

    async function loadProducts() {
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
          };
        }) || [];

      setProducts(productsWithPrice);
      setLoading(false);
    }

    loadProducts();
  }, [reseller?.id, supabase]);

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

    // Ordenar
    if (sortOrder === 'price_asc') {
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
      {/* Banner FULL WIDTH - Desktop e Mobile responsivo */}
      {(reseller?.banner_url || reseller?.banner_mobile_url) && (
        <div className="w-full">
          {/* Banner Desktop - visível em telas grandes */}
          {reseller?.banner_url && (
            <div className="hidden md:block relative w-full" style={{ aspectRatio: '1920/600' }}>
              <Image
                src={reseller.banner_url}
                alt="Banner"
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          {/* Banner Mobile - visível em telas pequenas */}
          {reseller?.banner_mobile_url ? (
            <div className="md:hidden relative aspect-square w-full">
              <Image
                src={reseller.banner_mobile_url}
                alt="Banner"
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : reseller?.banner_url && (
            <div className="md:hidden relative w-full" style={{ aspectRatio: '1920/600' }}>
              <Image
                src={reseller.banner_url}
                alt="Banner"
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
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

        {/* Barra de Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        {/* Encontre sua Numeração - Círculos de Tamanhos */}
        {availableSizes.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-center text-gray-700 font-medium mb-4">
              ✨ Encontre seu tamanho
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {/* Botão "Todos" */}
              <button
                onClick={() => setSelectedSize('')}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                  selectedSize === ''
                    ? 'text-white shadow-lg scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                    selectedSize === size
                      ? 'text-white shadow-lg scale-110'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              onChange={(e) => setSortOrder(e.target.value as 'default' | 'price_asc' | 'price_desc')}
              className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:outline-none cursor-pointer"
            >
              <option value="default">Mais relevantes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
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
          const buttonClass = buttonStyle === 'rounded' ? 'rounded-full' : 'rounded-none';
          
          // Verificar se o produto tem promoção
          const productPromo = getProductPromotion(product.id);
          
          // Pegar o texto da promoção de forma simplificada
          const getPromoLabel = () => {
            if (!productPromo) return null;
            if (productPromo.type === 'leve_pague') {
              // Verificar se tem descontos progressivos
              const progressiveDiscounts = productPromo.progressive_discounts;
              if (progressiveDiscounts && progressiveDiscounts.length > 0) {
                // Pegar o primeiro desconto (menor quantidade) para mostrar
                const sorted = [...progressiveDiscounts].sort((a, b) => a.min_items - b.min_items);
                return `${sorted[0].min_items}+ peças = ${sorted[0].discount_percent}% OFF`;
              }
              if (productPromo.buy_quantity && productPromo.pay_quantity) {
                return `Leve ${productPromo.buy_quantity} Pague ${productPromo.pay_quantity}`;
              }
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
              href={`/catalogo/${reseller?.slug}/produto/${product.id}`}
              className={`bg-white rounded-xl overflow-hidden transition-all duration-300 group ${cardClass}`}
            >
              {/* Imagem formato 3:4 (960x1280) com alta qualidade */}
              <div className="relative bg-gray-50 overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <Image
                  src={product.imagem || '/placeholder.png'}
                  alt={product.nome}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  quality={90}
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  priority={false}
                />
                
                {/* Tag de Promoção - Discreta no canto superior direito */}
                {promoLabel && (
                  <div className="absolute top-2 right-2">
                    <div 
                      className="text-white text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full shadow-sm backdrop-blur-sm"
                      style={{ backgroundColor: `${primaryColor}ee` }}
                    >
                      {promoLabel}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Cronômetro com contagem regressiva em tempo real */}
              {productPromo?.ends_at && (
                <CountdownTimer endDate={productPromo.ends_at} primaryColor={primaryColor} />
              )}
              
              <div className="p-3 md:p-4">
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem] text-sm">
                  {product.nome}
                </h3>
                {themeSettings?.show_prices !== false && (
                  <p className="text-lg md:text-xl font-bold mb-3" style={{ color: primaryColor }}>
                    R$ {product.finalPrice.toFixed(2).replace('.', ',')}
                  </p>
                )}
                <div
                  className={`w-full py-2.5 text-white font-medium text-center text-sm transition-all ${buttonClass}`}
                  style={{ backgroundColor: primaryColor }}
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