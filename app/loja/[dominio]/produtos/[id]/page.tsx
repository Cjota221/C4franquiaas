"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { ArrowLeft, Minus, Plus, ShoppingCart, Package, Check } from 'lucide-react';
import SeletorVariacoes, { Variacao } from '@/components/SeletorVariacoes';

type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  preco_final: number;
  imagens: string[];
  estoque: number;
  categoria?: string;
  variacoes_meta?: Variacao[];
};

type LojaInfo = {
  nome: string;
  cor_primaria: string;
  cor_secundaria: string;
};

export default function ProdutoDetalhePage({ params }: { params: Promise<{ dominio: string; id: string }> }) {
  const [produto, setProduto] = useState<Produto | null>(null);
  const [lojaInfo, setLojaInfo] = useState<LojaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantidade, setQuantidade] = useState(1);
  const [imagemAtual, setImagemAtual] = useState(0);
  const [adicionado, setAdicionado] = useState(false);
  const [dominio, setDominio] = useState<string>('');
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<string | null>(null);

  const addItem = useCarrinhoStore(state => state.addItem);

  useEffect(() => {
    async function loadData() {
      try {
        const { dominio: dom, id: prodId } = await params;
        setDominio(dom);
        
        // Carregar informações da loja
        const infoRes = await fetch(`/api/loja/${dom}/info`);
        if (infoRes.ok) {
          const infoJson = await infoRes.json();
          setLojaInfo(infoJson.loja);
        }

        // Carregar produto específico
        const prodRes = await fetch(`/api/loja/${dom}/produtos/${prodId}`);
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          setProduto(prodJson.produto);
        }
      } catch (err) {
        console.error('Erro ao carregar produto:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [params]);

  const handleAddToCart = () => {
    if (!produto) return;
    
    // Se o produto tem variações, exigir seleção
    const temVariacoes = produto.variacoes_meta && produto.variacoes_meta.length > 0;
    if (temVariacoes && !variacaoSelecionada) {
      alert('Por favor, selecione um tamanho antes de adicionar ao carrinho');
      return;
    }
    
    // Encontrar a variação selecionada para pegar o SKU
    const variacao = temVariacoes 
      ? produto.variacoes_meta?.find(v => v.id === variacaoSelecionada)
      : null;
    
    addItem({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco_final,
      quantidade,
      imagem: produto.imagens[0] || null,
      estoque: produto.estoque,
      variacaoId: variacaoSelecionada,
      variacaoSku: variacao?.sku || undefined
    });

    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 2000);
  };

  const incrementar = () => {
    if (produto && quantidade < produto.estoque) {
      setQuantidade(q => q + 1);
    }
  };

  const decrementar = () => {
    if (quantidade > 1) {
      setQuantidade(q => q - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando produto...</p>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package size={64} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Produto não encontrado</h2>
        <p className="text-gray-600 mb-6">Este produto não está disponível</p>
        <Link 
          href={`/loja/${dominio}/produtos`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white transition hover:opacity-90"
          style={{ backgroundColor: lojaInfo?.cor_primaria || '#DB1472' }}
        >
          <ArrowLeft size={20} />
          Voltar para Produtos
        </Link>
      </div>
    );
  }

  const imagens = produto.imagens.filter(img => img);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Voltar */}
      <Link 
        href={`/loja/${dominio}/produtos`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft size={20} />
        Voltar para Produtos
      </Link>

      {/* Conteúdo do Produto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Galeria de Imagens */}
        <div>
          {/* Imagem Principal */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
            {imagens.length > 0 ? (
              <Image
                src={imagens[imagemAtual]}
                alt={produto.nome}
                fill
                className="object-cover"
                priority
                quality={90}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package size={64} className="text-gray-300" />
              </div>
            )}
          </div>

          {/* Miniaturas */}
          {imagens.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {imagens.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setImagemAtual(idx)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                    imagemAtual === idx 
                      ? 'border-pink-600' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${produto.nome} - imagem ${idx + 1}`}
                    fill
                    className="object-cover"
                    quality={70}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações do Produto */}
        <div>
          {produto.categoria && (
            <span 
              className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
              style={{ 
                backgroundColor: lojaInfo?.cor_secundaria || '#F8B81F',
                color: '#fff'
              }}
            >
              {produto.categoria}
            </span>
          )}

          <h1 className="text-3xl font-bold mb-4">{produto.nome}</h1>

          <div className="mb-6">
            <span className="text-4xl font-bold" style={{ color: lojaInfo?.cor_primaria || '#DB1472' }}>
              R$ {produto.preco_final.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {/* Descrição */}
          {produto.descricao && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">Descrição</h3>
              <p className="text-gray-700 whitespace-pre-line">{produto.descricao}</p>
            </div>
          )}

          {/* Seletor de Variações (Tamanhos) */}
          {produto.variacoes_meta && produto.variacoes_meta.length > 0 && (
            <SeletorVariacoes
              variacoes={produto.variacoes_meta}
              variacaoSelecionada={variacaoSelecionada}
              onSelecionar={setVariacaoSelecionada}
            />
          )}

          {/* Seletor de Quantidade */}
          <div className="mb-6">
            <label className="block font-bold mb-2">Quantidade</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 border-gray-300 rounded-lg">
                <button
                  onClick={decrementar}
                  disabled={quantidade <= 1}
                  className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Minus size={20} />
                </button>
                <span className="px-6 py-2 font-bold text-lg">{quantidade}</span>
                <button
                  onClick={incrementar}
                  disabled={produto.estoque === 0 || quantidade >= produto.estoque}
                  className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Plus size={20} />
                </button>
              </div>

              <span className="text-sm text-gray-600">
                Subtotal: <span className="font-bold">R$ {(produto.preco_final * quantidade).toFixed(2).replace('.', ',')}</span>
              </span>
            </div>
          </div>

          {/* Botão Adicionar ao Carrinho */}
          <button
            onClick={handleAddToCart}
            disabled={produto.estoque === 0 || adicionado}
            className="w-full py-4 rounded-lg font-bold text-white text-lg flex items-center justify-center gap-3 transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ 
              backgroundColor: adicionado 
                ? '#10B981' 
                : (lojaInfo?.cor_primaria || '#DB1472')
            }}
          >
            {adicionado ? (
              <>
                <Check size={24} />
                Adicionado ao Carrinho!
              </>
            ) : (
              <>
                <ShoppingCart size={24} />
                {produto.estoque === 0 ? 'Produto Indisponível' : 'Adicionar ao Carrinho'}
              </>
            )}
          </button>

          {/* Botão Ver Carrinho (após adicionar) */}
          {adicionado && (
            <Link
              href={`/loja/${dominio}/carrinho`}
              className="block w-full mt-4 py-3 rounded-lg font-bold text-center border-2 transition hover:bg-gray-50"
              style={{ 
                borderColor: lojaInfo?.cor_primaria || '#DB1472',
                color: lojaInfo?.cor_primaria || '#DB1472'
              }}
            >
              Ver Carrinho
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
