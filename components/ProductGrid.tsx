"use client";

import React from 'react';
import ProductCard from './ProductCard';

interface Produto {
  id: string;
  nome: string;
  preco_final: number;
  preco_base?: number;
  imagens: string[];
  slug?: string;
  tag?: string;
  parcelamento?: string;
}

interface ProductGridProps {
  produtos: Produto[];
  dominio: string;
  titulo?: string;
  subtitulo?: string;
}

export default function ProductGrid({ 
  produtos, 
  dominio,
  titulo,
  subtitulo 
}: ProductGridProps) {
  if (!produtos || produtos.length === 0) {
    return (
      <div className="text-center py-20 md:py-24">
        <div className="text-gray-400 text-lg md:text-xl font-medium">
          Nenhum produto disponível no momento
        </div>
      </div>
    );
  }

  return (
    <section className="py-10 md:py-16 lg:py-20">
      {/* Cabeçalho da Seção - MAIOR */}
      {(titulo || subtitulo) && (
        <div className="text-center mb-10 md:mb-14 lg:mb-16">
          {titulo && (
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              {titulo}
            </h2>
          )}
          {subtitulo && (
            <p className="text-gray-600 text-base md:text-lg lg:text-xl font-medium max-w-3xl mx-auto leading-relaxed">
              {subtitulo}
            </p>
          )}
        </div>
      )}

      {/* Grid Responsivo ESPAÇOSO: 2 cols mobile  3 cols tablet  4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
        {produtos.map((produto) => (
          <ProductCard
            key={produto.id}
            id={produto.id}
            nome={produto.nome}
            preco_final={produto.preco_final}
            preco_base={produto.preco_base}
            imagens={produto.imagens}
            slug={produto.slug}
            tag={produto.tag}
            parcelamento={produto.parcelamento}
            dominio={dominio}
          />
        ))}
      </div>
    </section>
  );
}
