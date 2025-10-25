"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Package as PackageIcon } from 'lucide-react';

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
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
      <Link href={`/loja/${dominio}/produto/${produto.id}`}>
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
        <Link href={`/loja/${dominio}/produto/${produto.id}`}>
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
          {/* ❌ REMOVIDO: Exibição de estoque (ex: "15 uns")
              ⭐ RAZÃO: Cliente não deve ver contagem exata de estoque
              ✅ A disponibilidade é indicada pelo botão (Comprar vs Indisponível)
          */}
        </div>

        {/* ⭐ BOTÃO REDIRECIONA PARA A PÁGINA DO PRODUTO ⭐ */}
        <Link
          href={`/loja/${dominio}/produto/${produto.id}`}
          className="w-full rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 block text-center"
          style={{
            backgroundColor: produto.estoque === 0 ? '#d1d5db' : corPrimaria,
            color: 'white',
            padding: 'clamp(10px, 2.5vw, 12px)',
            fontSize: 'clamp(13px, 3vw, 15px)',
            minHeight: '44px',
            pointerEvents: produto.estoque === 0 ? 'none' : 'auto',
            opacity: produto.estoque === 0 ? 0.5 : 1,
          }}
        >
          <ShoppingCart size={18} />
          <span>{produto.estoque === 0 ? 'Indisponível' : 'Comprar'}</span>
        </Link>
      </div>
    </div>
  );
}
