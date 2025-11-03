"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFavoritosStore } from '@/lib/store/favoritosStore';
import { useLojaInfo } from '@/contexts/LojaContext';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';

export default function FavoritosPage() {
  const params = useParams();
  const dominio = params?.dominio as string;
  const loja = useLojaInfo();
  
  const favoritos = useFavoritosStore(state => state.items);
  const removeItem = useFavoritosStore(state => state.removeItem);
  const clearFavoritos = useFavoritosStore(state => state.clearFavoritos);

  if (favoritos.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <Heart 
              size={80} 
              className="mx-auto text-gray-300"
              strokeWidth={1.5}
            />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Nenhum favorito ainda
          </h1>
          
          <p className="text-gray-600 text-lg mb-8">
            Adicione produtos aos seus favoritos clicando no coração para salvá-los aqui!
          </p>
          
          <Link
            href={`/loja/${dominio}`}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: loja.cor_primaria }}
          >
            <ArrowLeft size={24} />
            <span>Continuar Comprando</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-2">
            Meus Favoritos
          </h1>
          <p className="text-gray-600 text-lg">
            {favoritos.length} {favoritos.length === 1 ? 'produto salvo' : 'produtos salvos'}
          </p>
        </div>
        
        {favoritos.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Deseja limpar todos os favoritos?')) {
                clearFavoritos();
              }
            }}
            className="flex items-center gap-2 px-6 py-3 border-2 border-red-500 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-all"
          >
            <Trash2 size={20} />
            <span>Limpar Tudo</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {favoritos.map((produto) => (
          <div 
            key={produto.id}
            className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100"
          >
            <button
              onClick={() => removeItem(produto.id)}
              className="absolute top-3 right-3 z-10 p-2.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 hover:bg-red-600 transition-all duration-300"
              aria-label="Remover dos favoritos"
            >
              <Trash2 size={18} strokeWidth={2.5} />
            </button>

            <Link href={`/loja/${dominio}/produto/${produto.id}`}>
              <div 
                className="relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden"
                style={{ aspectRatio: '4 / 5' }}
              >
                <Image
                  src={produto.imagem}
                  alt={produto.nome}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  quality={100}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/400x400/e5e7eb/9ca3af?text=Sem+Imagem';
                  }}
                />
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500" />
              </div>

              <div className="p-5 space-y-3">
                <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug line-clamp-2 min-h-[3rem] group-hover:text-gray-700 transition-colors">
                  {produto.nome}
                </h3>

                <p 
                  className="text-2xl md:text-3xl font-black tracking-tight"
                  style={{ color: loja.cor_primaria }}
                >
                  R$ {produto.preco.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </Link>

            <div className="px-5 pb-5">
              <Link
                href={`/loja/${dominio}/produto/${produto.id}`}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-full text-white font-bold text-base shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: loja.cor_botao || loja.cor_primaria }}
              >
                <ShoppingCart size={20} strokeWidth={2.5} />
                <span>Ver Produto</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href={`/loja/${dominio}`}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 text-gray-900 font-bold text-lg hover:bg-gray-50 transition-all"
          style={{ borderColor: loja.cor_primaria }}
        >
          <ArrowLeft size={24} />
          <span>Continuar Comprando</span>
        </Link>
      </div>
    </div>
  );
}