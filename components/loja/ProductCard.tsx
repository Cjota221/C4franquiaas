"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLojaInfo } from '@/contexts/LojaContext';
import { ShoppingCart, Heart } from 'lucide-react';

type Produto = {
  id: string;
  nome: string;
  imagens: string[];
  preco_base: number;
  preco_venda?: number;
  tag?: string;
  parcelamento: {
    parcelas: number;
    valor: number;
  };
};

type ProductCardProps = {
  produto: Produto;
  dominio: string;
};

export default function ProductCard({ produto, dominio }: ProductCardProps) {
  const loja = useLojaInfo();
  const [imagemAtual, setImagemAtual] = useState(0);
  const [favoritado, setFavoritado] = useState(false);

  const precoFinal = produto.preco_venda || produto.preco_base;
  const temDesconto = produto.preco_venda && produto.preco_venda < produto.preco_base;

  const handleMouseEnter = () => {
    // Desktop: trocar para segunda imagem no hover
    if (produto.imagens.length > 1) {
      setImagemAtual(1);
    }
  };

  const handleMouseLeave = () => {
    setImagemAtual(0);
  };

  const toggleFavorito = (e: React.MouseEvent) => {
    e.preventDefault();
    setFavoritado(!favoritado);
  };

  return (
    <Link href={`/loja/${dominio}/produto/${produto.id}`}>
      <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
        {/* Badge de Tag */}
        {produto.tag && (
          <div 
            className="absolute top-2 left-2 z-10 px-2 py-1 rounded text-white text-xs font-bold"
            style={{ backgroundColor: loja.cor_secundaria }}
          >
            {produto.tag}
          </div>
        )}

        {/* Botão Favoritar */}
        <button
          onClick={toggleFavorito}
          className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md hover:scale-110 transition"
          aria-label="Favoritar"
        >
          <Heart 
            size={18} 
            fill={favoritado ? loja.cor_primaria : 'none'}
            stroke={favoritado ? loja.cor_primaria : '#666'}
          />
        </button>

        {/* Imagem do Produto */}
        <div 
          className="relative aspect-square bg-gray-100 overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {produto.imagens.length > 0 ? (
            <Image
              src={produto.imagens[imagemAtual]}
              alt={produto.nome}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              unoptimized
              onError={(e) => {
                // Se a imagem falhar ao carregar, usar placeholder
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/400x400/e5e7eb/9ca3af?text=Sem+Imagem';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Image
                src="https://placehold.co/400x400/e5e7eb/9ca3af?text=Sem+Imagem"
                alt="Produto sem imagem"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Dots de Navegação (Mobile) */}
          {produto.imagens.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 md:hidden">
              {produto.imagens.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    setImagemAtual(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition ${
                    idx === imagemAtual ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Imagem ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Informações do Produto */}
        <div className="p-3 md:p-4">
          {/* Nome */}
          <h3 className="font-semibold text-sm md:text-base text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem]">
            {produto.nome}
          </h3>

          {/* Preços */}
          <div className="mb-2">
            {temDesconto && (
              <p className="text-xs text-gray-400 line-through">
                R$ {produto.preco_base.toFixed(2)}
              </p>
            )}
            <p 
              className="text-xl md:text-2xl font-bold"
              style={{ color: loja.cor_primaria }}
            >
              R$ {precoFinal.toFixed(2)}
            </p>
          </div>

          {/* Parcelamento */}
          <p className="text-xs text-gray-600 mb-3">
            ou {produto.parcelamento.parcelas}x de R$ {produto.parcelamento.valor.toFixed(2)}
          </p>

          {/* Botão Adicionar ao Carrinho */}
          {loja.permitir_carrinho && !loja.modo_catalogo && (
            <button
              onClick={(e) => {
                e.preventDefault();
                // TODO: Abrir modal de variações ou adicionar direto
                console.log('Adicionar ao carrinho:', produto.id);
              }}
              className="w-full py-2 px-4 rounded-lg text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
              style={{ backgroundColor: loja.cor_botao }}
            >
              <ShoppingCart size={18} />
              <span className="text-sm">Adicionar</span>
            </button>
          )}

          {/* Botão WhatsApp (Modo Catálogo) */}
          {loja.modo_catalogo && (
            <a
              href={`https://wa.me/${loja.whatsapp}?text=${encodeURIComponent(
                `${loja.mensagem_whatsapp}\n\n${produto.nome}\nPreço: R$ ${precoFinal.toFixed(2)}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full py-2 px-4 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition text-center block"
            >
              Consultar no WhatsApp
            </a>
          )}
        </div>
      </div>
    </Link>
  );
}
