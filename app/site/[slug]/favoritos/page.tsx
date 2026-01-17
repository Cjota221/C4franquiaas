/**
 * 💖 PÁGINA DE FAVORITOS
 * 
 * Mostra todos os produtos que o visitante favoritou
 * 
 * Rota: /site/[slug]/favoritos
 */

"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Heart, ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { useCatalogo } from '../layout';
import { useFavorites } from '@/hooks/useFavorites';

export default function FavoritosPage() {
  const params = useParams();
  const router = useRouter();
  const { reseller, primaryColor } = useCatalogo();
  const slug = params.slug as string;
  
  const { favoriteItems, loading, removeFavorite, count } = useFavorites({
    resellerId: reseller?.id || '',
    slug,
  });

  // Formatar preço
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
          <p className="text-gray-600">Carregando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-6 h-6" style={{ color: primaryColor }} fill={primaryColor} />
              Meus Favoritos
            </h1>
            <p className="text-sm text-gray-500">
              {count} {count === 1 ? 'produto salvo' : 'produtos salvos'}
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {favoriteItems.length === 0 ? (
          // Estado vazio
          <div className="text-center py-16">
            <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhum favorito ainda
            </h2>
            <p className="text-gray-500 mb-6">
              Curta os produtos que você gostou para salvá-los aqui
            </p>
            <Link
              href={`/site/${slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingBag className="w-5 h-5" />
              Ver Produtos
            </Link>
          </div>
        ) : (
          // Grid de favoritos
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favoriteItems.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Imagem */}
                <Link href={`/site/${slug}/produto/${item.productId}`}>
                  <div className="relative aspect-square bg-gray-100">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Botão remover */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFavorite(item.productId);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white/90 shadow-sm hover:bg-red-50 transition-colors group"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                    </button>
                  </div>
                </Link>

                {/* Info */}
                <div className="p-3">
                  <Link href={`/site/${slug}/produto/${item.productId}`}>
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 hover:underline">
                      {item.productName}
                    </h3>
                  </Link>
                  <p className="font-bold text-base" style={{ color: primaryColor }}>
                    {formatPrice(item.productPrice)}
                  </p>
                </div>

                {/* Botão Comprar */}
                <div className="px-3 pb-3">
                  <Link
                    href={`/site/${slug}/produto/${item.productId}`}
                    className="block w-full py-2.5 rounded-lg text-white font-semibold text-sm text-center transition-all hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Ver Produto
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
