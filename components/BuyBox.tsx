"use client";

import React, { useState } from 'react';
import { ShoppingCart, Heart, Truck, Shield, RefreshCw } from 'lucide-react';

interface Cor {
  nome: string;
  hex: string;
  imagem_url?: string;
}

interface Variacao {
  id: string;
  sku: string;
  tamanho: string;
  cor?: string;
  estoque: number;
}

interface BuyBoxProps {
  produtoId: string;
  nome: string;
  preco_final: number;
  preco_base?: number;
  cores?: Cor[];
  variacoes?: Variacao[];
  tamanhos?: string[];
  parcelamento?: string;
  estoque: number;
  onAddToCart: (data: {
    produtoId: string;
    cor?: string;
    tamanho?: string;
    variacaoId?: string;
    quantidade: number;
  }) => void;
  onChangeColor?: (cor: Cor) => void;
}

export default function BuyBox({
  produtoId,
  nome,
  preco_final,
  preco_base,
  cores = [],
  variacoes = [],
  tamanhos = [],
  parcelamento,
  estoque,
  onAddToCart,
  onChangeColor
}: BuyBoxProps) {
  const [selectedCor, setSelectedCor] = useState<string | null>(null);
  const [selectedTamanho, setSelectedTamanho] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const hasDiscount = preco_base && preco_base > preco_final;
  const discountPercentage = hasDiscount 
    ? Math.round(((preco_base - preco_final) / preco_base) * 100)
    : 0;

  const getTamanhosDisponiveis = () => {
    if (variacoes.length > 0) {
      if (selectedCor) {
        const variacoesDaCor = variacoes.filter(v => v.cor === selectedCor);
        return variacoesDaCor
          .filter(v => v.estoque > 0)
          .map(v => v.tamanho);
      }
      return [...new Set(variacoes.map(v => v.tamanho))];
    }
    return tamanhos;
  };

  const tamanhosDisponiveis = getTamanhosDisponiveis();

  const isTamanhoDisponivel = (tamanho: string): boolean => {
    if (variacoes.length === 0) return true;
    
    if (selectedCor) {
      const variacao = variacoes.find(
        v => v.tamanho === tamanho && v.cor === selectedCor
      );
      return variacao ? variacao.estoque > 0 : false;
    }
    
    return variacoes.some(v => v.tamanho === tamanho && v.estoque > 0);
  };

  const handleSelectCor = (cor: Cor) => {
    setSelectedCor(cor.nome);
    setSelectedTamanho(null);
    setSizeError(false);
    
    if (onChangeColor) {
      onChangeColor(cor);
    }
  };

  const handleSelectTamanho = (tamanho: string) => {
    if (!isTamanhoDisponivel(tamanho)) return;
    setSelectedTamanho(tamanho);
    setSizeError(false);
  };

  const handleAddToCart = async () => {
    if (tamanhosDisponiveis.length > 0 && !selectedTamanho) {
      setSizeError(true);
      document.getElementById('size-selector')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      return;
    }

    setIsAddingToCart(true);

    let variacaoId: string | undefined;
    if (variacoes.length > 0 && selectedTamanho) {
      const variacao = selectedCor
        ? variacoes.find(v => v.cor === selectedCor && v.tamanho === selectedTamanho)
        : variacoes.find(v => v.tamanho === selectedTamanho);
      
      variacaoId = variacao?.id;
    }

    onAddToCart({
      produtoId,
      cor: selectedCor || undefined,
      tamanho: selectedTamanho || undefined,
      variacaoId,
      quantidade
    });

    setTimeout(() => {
      setIsAddingToCart(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Título - GIGANTE */}
      <div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
          {nome}
        </h1>
      </div>

      {/* Preços - DESTAQUE MÁXIMO */}
      <div className="space-y-3">
        {hasDiscount && (
          <div className="flex items-center gap-3">
            <span className="text-xl text-gray-500 line-through font-medium">
              R$ {preco_base!.toFixed(2).replace('.', ',')}
            </span>
            <span className="bg-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md">
              -{discountPercentage}%
            </span>
          </div>
        )}
        
        <div className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-[#DB1472]">
          R$ {preco_final.toFixed(2).replace('.', ',')}
        </div>

        {parcelamento && (
          <div className="text-lg md:text-xl text-gray-600 font-medium">
            ou <span className="font-bold text-gray-900">{parcelamento}</span>
          </div>
        )}
      </div>

      {/* Seletor de Cores - MAIOR */}
      {cores.length > 0 && (
        <div>
          <label className="block text-base md:text-lg font-bold text-gray-900 mb-4">
            Cor: {selectedCor && <span className="text-[#DB1472]">{selectedCor}</span>}
          </label>
          <div className="flex flex-wrap gap-3">
            {cores.map((cor) => (
              <button
                key={cor.nome}
                onClick={() => handleSelectCor(cor)}
                className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full border-3 transition-all duration-300 ${
                  selectedCor === cor.nome
                    ? 'border-[#F8B81F] ring-4 ring-[#F8B81F] ring-offset-2 scale-110'
                    : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                }`}
                style={{ backgroundColor: cor.hex }}
                title={cor.nome}
              >
                {selectedCor === cor.nome && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full shadow-lg"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seletor de Tamanhos - MAIOR */}
      {tamanhosDisponiveis.length > 0 && (
        <div id="size-selector">
          <label className="block text-base md:text-lg font-bold text-gray-900 mb-4">
            Tamanho: {selectedTamanho && <span className="text-[#DB1472]">{selectedTamanho}</span>}
          </label>
          
          {sizeError && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm md:text-base animate-pulse">
              <span className="text-2xl"></span>
              <span className="font-bold">Por favor, selecione um tamanho antes de adicionar ao carrinho</span>
            </div>
          )}

          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {tamanhosDisponiveis.map((tamanho) => {
              const disponivel = isTamanhoDisponivel(tamanho);
              const selecionado = selectedTamanho === tamanho;

              return (
                <button
                  key={tamanho}
                  onClick={() => handleSelectTamanho(tamanho)}
                  disabled={!disponivel}
                  className={`py-4 px-4 rounded-xl font-bold text-lg text-center transition-all duration-300 ${
                    selecionado
                      ? 'bg-[#F8B81F] text-gray-900 ring-4 ring-[#F8B81F] ring-offset-2 scale-105 shadow-lg'
                      : disponivel
                        ? 'bg-white text-gray-900 border-2 border-gray-300 hover:border-[#F8B81F] hover:scale-105 shadow-sm'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  {tamanho}
                  {!disponivel && <div className="text-xs mt-1">Esgotado</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantidade - MAIOR */}
      <div>
        <label className="block text-base md:text-lg font-bold text-gray-900 mb-4">
          Quantidade
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
            className="w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-gray-300 hover:border-[#F8B81F] font-bold text-xl transition-all hover:scale-110"
          >
            -
          </button>
          <span className="text-2xl md:text-3xl font-black w-16 text-center">{quantidade}</span>
          <button
            onClick={() => setQuantidade(Math.min(estoque, quantidade + 1))}
            className="w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-gray-300 hover:border-[#F8B81F] font-bold text-xl transition-all hover:scale-110"
            disabled={quantidade >= estoque}
          >
            +
          </button>
        </div>
      </div>

      {/* Botões de Ação - GIGANTES */}
      <div className="space-y-4">
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || estoque === 0}
          className="w-full bg-[#F8B81F] hover:bg-[#F8B81F]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 font-black py-6 px-8 rounded-2xl transition-all flex items-center justify-center gap-4 text-xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isAddingToCart ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-3 border-gray-900 border-t-transparent"></div>
              Adicionando...
            </>
          ) : estoque === 0 ? (
            'Produto Esgotado'
          ) : (
            <>
              <ShoppingCart size={28} strokeWidth={3} />
              ADICIONAR AO CARRINHO
            </>
          )}
        </button>

        <button className="w-full border-2 border-gray-300 hover:border-[#DB1472] text-gray-900 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 text-base hover:scale-[1.02] active:scale-[0.98]">
          <Heart size={22} />
          Adicionar aos Favoritos
        </button>
      </div>

      {/* Trust Badges - MAIOR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t-2">
        <div className="flex items-center gap-3 text-base">
          <Truck className="text-green-600" size={24} strokeWidth={2.5} />
          <span className="font-bold">Frete Grátis</span>
        </div>
        <div className="flex items-center gap-3 text-base">
          <RefreshCw className="text-blue-600" size={24} strokeWidth={2.5} />
          <span className="font-bold">Troca Fácil</span>
        </div>
        <div className="flex items-center gap-3 text-base">
          <Shield className="text-purple-600" size={24} strokeWidth={2.5} />
          <span className="font-bold">Compra Segura</span>
        </div>
      </div>
    </div>
  );
}
