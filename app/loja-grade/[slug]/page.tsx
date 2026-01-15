"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Variacao {
  id: string;
  cor: string;
  imagem_url: string;
  estoque_disponivel: number;
}

interface Produto {
  id: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  preco_base: number;
  usa_variacoes: boolean;
  ativo: boolean;
  variacoes?: Variacao[];
}

export default function LojaGradeFechadaPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchProdutos();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/grade-fechada/config?slug=' + slug);
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
      const response = await fetch('/api/grade-fechada/produtos?ativo=true&include_variacoes=true');
      
      if (response.ok) {
        const data = await response.json();
        setProdutos(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" 
             style={{ borderColor: config?.cor_primaria || '#8B5CF6' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner Hero */}
      <div className="rounded-2xl p-8 text-white text-center"
           style={{ background: `linear-gradient(135deg, ${config?.cor_primaria || '#8B5CF6'}, ${config?.cor_secundaria || '#EC4899'})` }}>
        <h1 className="text-4xl font-bold mb-3">
          {config?.titulo_site || 'Catálogo Grade Fechada'}
        </h1>
        <p className="text-lg opacity-90 max-w-2xl mx-auto">
          {config?.descricao_site || 'Compre por grades de 6 ou 12 pares com condições especiais'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            📦 Pedido Mínimo: 2 Grades
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            ⏰ Produção: 15-20 dias
          </div>
        </div>
      </div>

      {/* Busca */}
      <Card className="p-4">
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
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Grade de Produtos */}
      {produtosFiltrados.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">Nenhum produto encontrado</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produtosFiltrados.map((produto) => {
            const primeiraVariacao = produto.variacoes?.[0];
            const imagemProduto = primeiraVariacao?.imagem_url || '/placeholder-product.png';

            return (
              <Link
                key={produto.id}
                href={`/loja-grade/${slug}/produto/${produto.id}`}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group h-full">
                  {/* Imagem */}
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <Image
                      src={imagemProduto}
                      alt={produto.nome}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
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
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {produto.nome}
                    </h3>
                    {produto.descricao && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                        {produto.descricao}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">A partir de</p>
                        <p className="text-xl font-bold" style={{ color: config?.cor_primaria || '#8B5CF6' }}>
                          R$ {produto.preco_base.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">por par</p>
                      </div>
                      <Button 
                        size="sm"
                        className="rounded-full"
                        style={{ backgroundColor: config?.cor_primaria || '#8B5CF6' }}
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Info Footer */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-3">Como funciona?</h3>
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
      </Card>
    </div>
  );
}
