"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { ShoppingCart, Check, Package as PackageIcon } from 'lucide-react';

type Produto = {
  id: string;
  nome: string;
  preco_final: number;
  imagem: string | null;
  estoque: number;
};

export default function ProdutoCardResponsive({ 
  produto, 
  dominio,
  corPrimaria
}: { 
  produto: Produto; 
  dominio: string;
  corPrimaria: string;
}) {
  const addItem = useCarrinhoStore((state) => state.addItem);
  const [adicionado, setAdicionado] = useState(false);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    
    if (produto.estoque === 0) return;
    
    addItem({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco_final,
      quantidade: 1,
      imagem: produto.imagem || '',
      estoque: produto.estoque
    });
    
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 2000);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
      <Link href={`/loja/${dominio}/produtos/${produto.id}`}>
        <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
          {produto.imagem ? (
            <Image
              src={produto.imagem}
              alt={produto.nome}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-2 sm:p-4 group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              quality={80}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <PackageIcon size={64} />
            </div>
          )}
          {produto.estoque === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span 
                className="bg-red-600 text-white rounded-lg font-bold"
                style={{
                  padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 16px)',
                  fontSize: 'clamp(12px, 3vw, 14px)',
                }}
              >
                Sem Estoque
              </span>
            </div>
          )}
        </div>
      </Link>

      <div 
        className="p-3 sm:p-4"
        style={{
          padding: 'clamp(12px, 3vw, 16px)',
        }}
      >
        <Link href={`/loja/${dominio}/produtos/${produto.id}`}>
          <h3 
            className="font-semibold mb-2 hover:underline line-clamp-2"
            style={{
              fontSize: 'clamp(14px, 3.5vw, 18px)',
              minHeight: 'clamp(40px, 10vw, 56px)',
            }}
          >
            {produto.nome}
          </h3>
        </Link>

        <div className="flex items-center justify-between mb-3 gap-2">
          <p 
            className="font-bold flex-shrink-0"
            style={{ 
              color: corPrimaria,
              fontSize: 'clamp(18px, 4.5vw, 24px)',
            }}
          >
            R$ {produto.preco_final.toFixed(2)}
          </p>
          {produto.estoque > 0 && (
            <p 
              className="text-gray-600 text-xs sm:text-sm truncate"
              style={{
                fontSize: 'clamp(11px, 2.5vw, 14px)',
              }}
            >
              {produto.estoque} {produto.estoque === 1 ? 'un' : 'uns'}
            </p>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={produto.estoque === 0}
          className="w-full rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
          style={{
            backgroundColor: adicionado ? '#10b981' : (produto.estoque === 0 ? '#d1d5db' : corPrimaria),
            color: 'white',
            padding: 'clamp(10px, 2.5vw, 12px)',
            fontSize: 'clamp(13px, 3vw, 15px)',
            minHeight: '44px', // Alvo de toque mínimo
          }}
        >
          {adicionado ? (
            <>
              <Check size={18} />
              <span>Adicionado!</span>
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              <span>{produto.estoque === 0 ? 'Indisponível' : 'Adicionar'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
