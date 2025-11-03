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
      <div className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100">
        {/* Badge de Tag */}
        {produto.tag && (
          <div 
            className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-lg"
            style={{ backgroundColor: loja.cor_secundaria }}
          >
            {produto.tag}
          </div>
        )}

        {/* Botão Favoritar */}
        <button
          onClick={toggleFavorito}
          className="absolute top-3 right-3 z-10 p-2.5 bg-white rounded-full shadow-lg hover:scale-110 transition-all duration-300"
          aria-label="Favoritar"
        >
          <Heart 
            size={20} 
            fill={favoritado ? loja.cor_primaria : 'none'}
            stroke={favoritado ? loja.cor_primaria : '#666'}
            strokeWidth={2}
          />
        </button>

        {/* Imagem do Produto - Proporção 4:5 (MAIOR) */}
        <div 
          className="relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden"
          style={{ aspectRatio: '4 / 5' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {produto.imagens.length > 0 ? (
            <Image
              src={produto.imagens[imagemAtual]}
              alt={produto.nome}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 300px"
              quality={90}
              onError={(e) => {
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

          {/* Overlay sutil no hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500" />

          {/* Dots de Navegação (Mobile) */}
          {produto.imagens.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 md:hidden">
              {produto.imagens.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    setImagemAtual(idx);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    idx === imagemAtual ? 'bg-white w-6' : 'bg-white/60'
                  }`}
                  aria-label={`Imagem ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Informações do Produto - ESPAÇOSO */}
        <div className="p-5 md:p-6 space-y-3">
          {/* Nome - Maior e mais legível */}
          <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug line-clamp-2 min-h-[3rem] group-hover:text-gray-700 transition-colors">
            {produto.nome}
          </h3>

          {/* Preços - DESTAQUE MÁXIMO */}
          <div className="space-y-1">
            {temDesconto && (
              <p className="text-sm text-gray-400 line-through">
                R$ {produto.preco_base.toFixed(2).replace('.', ',')}
              </p>
            )}
            <div className="flex items-baseline gap-2">
              <p 
                className="text-2xl md:text-3xl font-black tracking-tight"
                style={{ color: loja.cor_primaria }}
              >
                R$ {precoFinal.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>

          {/* Parcelamento - Mais visível */}
          <p className="text-sm text-gray-600 font-medium">
            ou <span className="font-bold text-gray-900">{produto.parcelamento.parcelas}x</span> de <span className="font-bold">R$ {produto.parcelamento.valor.toFixed(2).replace('.', ',')}</span>
          </p>

          {/* Botão Adicionar ao Carrinho - MAIOR E MAIS CHAMATIVO */}
          {loja.permitir_carrinho && !loja.modo_catalogo && (
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('Adicionar ao carrinho:', produto.id);
              }}
              className="w-full mt-4 py-4 px-6 rounded-full text-white font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
              style={{ backgroundColor: loja.cor_botao }}
            >
              <ShoppingCart size={22} strokeWidth={2.5} />
              <span>Comprar Agora</span>
            </button>
          )}

          {/* Botão WhatsApp (Modo Catálogo) - MAIOR */}
          {loja.modo_catalogo && (
            <a
              href={`https://wa.me/${loja.whatsapp}?text=${encodeURIComponent(
                `${loja.mensagem_whatsapp}\n\n${produto.nome}\nPreço: R$ ${precoFinal.toFixed(2)}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full mt-4 py-4 px-6 rounded-full bg-green-600 text-white font-bold text-base hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-center block"
            >
              Consultar no WhatsApp
            </a>
          )}
        </div>
      </div>
    </Link>
  );
}
