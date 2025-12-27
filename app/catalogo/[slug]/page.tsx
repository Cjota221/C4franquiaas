"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Instagram, Facebook, MessageCircle } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Banner - Desktop e Mobile responsivo */}
      {(reseller?.banner_url || reseller?.banner_mobile_url) && (
        <div className="mb-6 rounded-xl overflow-hidden shadow-md">
          {/* Banner Desktop - visível em telas grandes */}
          {reseller?.banner_url && (
            <div className="hidden md:block relative aspect-[3/1] w-full">
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
            <div className="md:hidden relative aspect-[3/1] w-full">
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

      {/* Bio da Loja */}
      {reseller?.bio && (
        <div className="mb-6 text-center">
          <p className="text-gray-600">{reseller.bio}</p>
        </div>
      )}

      {/* Redes Sociais */}
      {(reseller?.instagram || reseller?.facebook) && (
        <div className="flex justify-center gap-4 mb-6">
          {reseller?.instagram && (
            <a
              href={`https://instagram.com/${reseller.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Instagram size={18} />
              @{reseller.instagram}
            </a>
          )}
          {reseller?.facebook && (
            <a
              href={reseller.facebook.startsWith('http') ? reseller.facebook : `https://facebook.com/${reseller.facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Facebook size={18} />
              Facebook
            </a>
          )}
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

      {/* Grid de Produtos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          // Classes baseadas no theme_settings
          const cardClasses = {
            shadow: 'shadow-md hover:shadow-lg',
            flat: 'hover:bg-gray-50',
            bordered: 'border-2 hover:border-gray-300',
          };
          const buttonClasses = {
            rounded: 'rounded-lg',
            square: 'rounded-none',
          };
          
          return (
            <Link
              key={product.id}
              href={`/catalogo/${reseller?.slug}/produto/${product.id}`}
              className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-all group ${cardClasses[themeSettings?.card_style || 'shadow']}`}
            >
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={product.imagem || '/placeholder.png'}
                  alt={product.nome}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem] text-sm">
                  {product.nome}
                </h3>
                {themeSettings?.show_prices !== false && (
                  <p className="text-xl font-bold mb-3" style={{ color: primaryColor }}>
                    R$ {product.finalPrice.toFixed(2).replace('.', ',')}
                  </p>
                )}
                <div
                  className={`w-full py-2.5 text-white font-medium text-center text-sm ${buttonClasses[themeSettings?.button_style || 'rounded']}`}
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

      {/* Botão Flutuante WhatsApp */}
      {themeSettings?.show_whatsapp_float && reseller?.phone && (
        <a
          href={`https://wa.me/55${reseller.phone.replace(/\D/g, '')}?text=Olá! Vi seu catálogo e gostaria de mais informações.`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 p-4 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors"
        >
          <MessageCircle size={28} />
        </a>
      )}
    </div>
  );
}