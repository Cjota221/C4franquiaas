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
      <div className="text-center py-16">
        <div className="text-gray-400 text-lg">
          Nenhum produto disponível no momento
        </div>
      </div>
    );
  }

  return (
    <section className="py-8 md:py-12">
      {/* Cabeçalho da Seção */}
      {(titulo || subtitulo) && (
        <div className="text-center mb-8 md:mb-12">
          {titulo && (
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {titulo}
            </h2>
          )}
          {subtitulo && (
            <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
              {subtitulo}
            </p>
          )}
        </div>
      )}

      {/* Grid Responsivo: 2 cols mobile → 3 cols tablet → 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
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
