"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { safeColor } from '@/lib/color-utils';

interface GradeFechadaProduto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  codigo: string | null;
  imagem: string | null;
  ativo: boolean;
  variacoes?: Array<{
    id: string;
    cor: string;
    imagem_url: string | null;
    preco: number;
  }>;
}

interface Config {
  id: string;
  titulo_site: string;
  descricao_site: string;
  cor_primaria: string;
  cor_secundaria: string;
  whatsapp_numero: string;
}

export default function LojaGradeFechadaPage() {
  const { slug } = useParams();
  const [produtos, setProdutos] = useState<GradeFechadaProduto[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetchConfig();
    fetchProdutos();
  }, [slug]);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/grade-fechada/config?slug=${slug}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Erro ao carregar config:', error);
    }
  };

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/grade-fechada/produtos?include_variacoes=true');
      if (response.ok) {
        const data = await response.json();
        setProdutos(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
    produto.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
    produto.codigo?.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" 
             style={{ borderColor: safeColor(config?.cor_primaria) }}></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
          {String(config?.titulo_site || 'Catálogo Grade Fechada')}
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          {String(config?.descricao_site || 'Compre por grades de 6 ou 12 pares com condições especiais')}
        </p>
      </div>

      {/* Cards de Informações - 2x2 no mobile, 3 colunas no desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Ped. Mínimo</p>
              <p className="text-lg md:text-xl font-bold" style={{ color: safeColor(config?.cor_primaria) }}>2 Grades</p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Produção</p>
              <p className="text-lg md:text-xl font-bold" style={{ color: safeColor(config?.cor_primaria) }}>15-20 dias</p>
            </div>
            <div className="text-2xl">⏰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 md:p-4 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">Produtos</p>
              <p className="text-lg md:text-xl font-bold" style={{ color: safeColor(config?.cor_primaria) }}>{produtos.length}</p>
            </div>
            <div className="text-2xl">👟</div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 md:mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produtos..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="px-3">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Lista de Produtos */}
      {produtosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {produtosFiltrados.map((produto) => {
            const primeiraVariacao = produto.variacoes?.[0];
            const imagemProduto = primeiraVariacao?.imagem_url || produto.imagem || '/placeholder-product.png';
            
            // Calcular preço mínimo
            let precoMinimo = produto.preco;
            if (produto.variacoes && produto.variacoes.length > 0) {
              const precos = produto.variacoes.map(v => v.preco).filter(p => p > 0);
              if (precos.length > 0) {
                precoMinimo = Math.min(...precos);
              }
            }

            return (
              <Link
                key={produto.id}
                href={`/loja-grade/${slug}/produto/${produto.id}`}
              >
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
                  {/* Imagem */}
                  <div className="relative aspect-square bg-gray-100 overflow-hidden rounded-t-lg">
                    <Image
                      src={imagemProduto}
                      alt={produto.nome}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {produto.codigo && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {produto.codigo}
                      </div>
                    )}
                    {produto.variacoes && produto.variacoes.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-white/90 text-gray-800 text-xs px-2 py-1 rounded font-medium">
                        {produto.variacoes.length} cores
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2">
                      {produto.nome}
                    </h3>
                    {produto.descricao && (
                      <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-1">
                        {produto.descricao}
                      </p>
                    )}
                    
                    <div className="space-y-1">
                      <div>
                        <p className="text-[10px] md:text-xs text-gray-500">A partir de</p>
                        <p className="text-lg md:text-xl font-bold" style={{ color: safeColor(config?.cor_primaria) }}>
                          R$ {precoMinimo.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-3 text-xs md:text-sm"
                      style={{ backgroundColor: safeColor(config?.cor_primaria) }}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Info Footer */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="text-lg md:text-xl font-bold mb-4">Como funciona?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-3xl mb-2">1️⃣</div>
              <p className="font-medium mb-1">Escolha o Produto</p>
              <p className="text-gray-600">Selecione modelo e cor</p>
            </div>
            <div>
              <div className="text-3xl mb-2">2️⃣</div>
              <p className="font-medium mb-1">Monte sua Grade</p>
              <p className="text-gray-600">6 ou 12 pares com tamanhos</p>
            </div>
            <div>
              <div className="text-3xl mb-2">3️⃣</div>
              <p className="font-medium mb-1">Finalize no WhatsApp</p>
              <p className="text-gray-600">Envie seu pedido direto</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}