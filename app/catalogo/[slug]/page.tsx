"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useCatalogo } from './layout';

type ProductWithPrice = {
  id: string;
  nome: string;
  descricao?: string;
  preco_base: number;
  imagem?: string;
  finalPrice: number;
  estoque: number;
};

export default function CatalogoPrincipal() {
  const { reseller, primaryColor, themeSettings } = useCatalogo();
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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
            estoque
          )
        `)
        .eq('reseller_id', reseller.id)
        .eq('is_active', true);

      const productsWithPrice: ProductWithPrice[] =
        data?.map((p) => ({
          id: p.produtos.id,
          nome: p.produtos.nome,
          preco_base: p.produtos.preco_base,
          imagem: p.produtos.imagem,
          estoque: p.produtos.estoque || 0,
          finalPrice: p.produtos.preco_base * (1 + (p.margin_percent || 0) / 100),
        })) || [];

      setProducts(productsWithPrice);
      setLoading(false);
    }

    loadProducts();
  }, [reseller?.id, supabase]);

  // Filtrar produtos pela busca
  const filteredProducts = products.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* Info */}
        <p className="text-gray-600 mb-4">{filteredProducts.length} produtos encontrados</p>

      {/* Grid de Produtos - Formato 3:4 (960x1280) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
              </div>
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