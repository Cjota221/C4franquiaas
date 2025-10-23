"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { ShoppingCart, Check } from 'lucide-react';

type Produto = {
  id: string;
  nome: string;
  preco_final: number;
  imagem: string | null;
  estoque: number;
};

export default function ProdutoCard({ 
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
    e.preventDefault(); // Prevenir navegação do Link pai
    
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
        <div className="relative w-full h-64 bg-gradient-to-br from-gray-50 to-gray-100">
          {produto.imagem ? (
            <Image
              src={produto.imagem}
              alt={produto.nome}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              quality={85}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Package size={64} />
            </div>
          )}
          {produto.estoque === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">
                Sem Estoque
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/loja/${dominio}/produtos/${produto.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:underline line-clamp-2 min-h-[56px]">
            {produto.nome}
          </h3>
        </Link>

        <div className="flex items-center justify-between mb-3">
          <p 
            className="text-2xl font-bold"
            style={{ color: corPrimaria }}
          >
            R$ {produto.preco_final.toFixed(2)}
          </p>
          {produto.estoque > 0 && (
            <p className="text-sm text-gray-600">
              {produto.estoque} {produto.estoque === 1 ? 'unidade' : 'unidades'}
            </p>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={produto.estoque === 0}
          className="w-full py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            backgroundColor: adicionado ? '#10B981' : corPrimaria,
            color: 'white'
          }}
        >
          {adicionado ? (
            <>
              <Check size={20} />
              <span>Adicionado!</span>
            </>
          ) : (
            <>
              <ShoppingCart size={20} />
              <span className="hidden sm:inline">{produto.estoque > 0 ? 'Adicionar ao Carrinho' : 'Sem Estoque'}</span>
              <span className="sm:hidden">{produto.estoque > 0 ? 'Comprar' : 'Sem Estoque'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Importar Package que faltava
import { Package } from 'lucide-react';
