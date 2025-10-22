"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProdutoCard from '@/components/loja/ProdutoCard';
import { Package, TrendingUp, Star, ArrowRight } from 'lucide-react';

type Produto = {
  id: string;
  nome: string;
  preco_final: number;
  imagem: string | null;
  estoque: number;
};

type LojaInfo = {
  nome: string;
  cor_primaria: string;
  cor_secundaria: string;
  produtos_ativos: number;
};

export default function LojaHomePage({ params }: { params: Promise<{ dominio: string }> }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lojaInfo, setLojaInfo] = useState<LojaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dominio, setDominio] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const { dominio: dom } = await params;
        setDominio(dom);
        
        // Carregar informações da loja
        const infoRes = await fetch(`/api/loja/${dom}/info`);
        if (infoRes.ok) {
          const infoJson = await infoRes.json();
          setLojaInfo(infoJson.loja);
        }

        // Carregar produtos em destaque (primeiros 6)
        const prodRes = await fetch(`/api/loja/${dom}/produtos`);
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          setProdutos(prodJson.produtos.slice(0, 6));
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [params]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="py-20"
        style={{ backgroundColor: lojaInfo?.cor_primaria || '#DB1472' }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bem-vindo à {lojaInfo?.nome || 'Nossa Loja'}!
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Os melhores cosméticos com preços especiais para você
          </p>
          <Link 
            href={`/loja/${dominio}/produtos`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition hover:opacity-90"
            style={{ backgroundColor: lojaInfo?.cor_secundaria || '#F8B81F' }}
          >
            Ver Todos os Produtos
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: lojaInfo?.cor_secundaria || '#F8B81F' }}
              >
                <Package size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Produtos de Qualidade</h3>
              <p className="text-gray-600">
                Selecionamos os melhores cosméticos para você
              </p>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: lojaInfo?.cor_secundaria || '#F8B81F' }}
              >
                <TrendingUp size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Melhores Preços</h3>
              <p className="text-gray-600">
                Preços especiais e promoções exclusivas
              </p>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: lojaInfo?.cor_secundaria || '#F8B81F' }}
              >
                <Star size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Atendimento Especial</h3>
              <p className="text-gray-600">
                Atendimento personalizado e cuidadoso
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Produtos em Destaque */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Produtos em Destaque</h2>
            <p className="text-gray-600">Confira alguns dos nossos produtos mais procurados</p>
          </div>

          {produtos.length === 0 ? (
            <div className="text-center py-12">
              <Package size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">Nenhum produto disponível no momento</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {produtos.map((produto) => (
                  <ProdutoCard 
                    key={produto.id} 
                    produto={produto} 
                    dominio={dominio}
                    corPrimaria={lojaInfo?.cor_primaria || '#DB1472'}
                  />
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  href={`/loja/${dominio}/produtos`}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-white transition hover:opacity-90"
                  style={{ backgroundColor: lojaInfo?.cor_primaria || '#DB1472' }}
                >
                  Ver Todos os {lojaInfo?.produtos_ativos || 0} Produtos
                  <ArrowRight size={20} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
