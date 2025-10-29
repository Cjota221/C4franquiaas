"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/loja/ProductCard';
import CategoriesStories from '@/components/loja/CategoriesStories';
import TrustIcons from '@/components/loja/TrustIcons';
import { ArrowRight } from 'lucide-react';
import { useLojaInfo } from '@/contexts/LojaContext';

type Produto = {
  id: string;
  nome: string;
  preco_base: number;
  preco_venda?: number;
  preco_final: number;
  imagens: string[];
  tag?: string;
  parcelamento: {
    parcelas: number;
    valor: number;
  };
};

export default function LojaHomePage({ params }: { params: Promise<{ dominio: string }> }) {
  const loja = useLojaInfo();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dominio, setDominio] = useState<string>('');

  const corPrimaria = loja?.cor_primaria || '#DB1472';

  useEffect(() => {
    async function loadData() {
      try {
        const { dominio: dom } = await params;
        setDominio(dom);
        
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
      {/* Banner Hero Grande (60vh) */}
      <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
        <Image
          src="https://placehold.co/1920x1080/DB1472/FFFFFF/png?text=COLE%C3%87%C3%83O+2025"
          alt="Banner Principal"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-center text-white px-fluid-md">
            <h1 className="heading-hero mb-4 drop-shadow-lg">
              Coleção 2025
            </h1>
            <p className="text-fluid-xl mb-8 drop-shadow-md">
              Os melhores cosméticos com preços especiais
            </p>
            <Link 
              href={`/loja/${dominio}/produtos`}
              className="btn-responsive bg-white text-pink-600 hover:bg-pink-50 rounded-full"
            >
              Comprar Agora
              <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categorias em Stories */}
      <section className="bg-white" style={{ paddingTop: '1.6rem', paddingBottom: '1.6rem' }}>
        <div className="container-fluid">
          <CategoriesStories />
        </div>
      </section>

      {/* Banner de Confiança - Logo após Categorias */}
      <TrustIcons />

      {/* Produtos em Destaque */}
      <section className="bg-gray-50" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="container-fluid">
          <div className="flex items-center justify-between mb-fluid-lg">
            <h2 className="heading-section" style={{ color: corPrimaria }}>
              Produtos em Destaque
            </h2>
            <Link 
              href={`/loja/${dominio}/produtos`}
              className="font-medium hover:opacity-80 transition text-fluid-base"
              style={{ color: corPrimaria }}
            >
              Ver todos →
            </Link>
          </div>

          {produtos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Nenhum produto disponível no momento</p>
            </div>
          ) : (
            <div className="grid-responsive">
              {produtos.slice(0, 8).map((produto) => (
                <ProductCard 
                  key={produto.id} 
                  produto={produto} 
                  dominio={dominio}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Banner Secundário */}
      <section className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
        <Image
          src="https://placehold.co/1920x720/F8B81F/000000/png?text=FRETE+GRÁTIS+ACIMA+DE+R$+99"
          alt="Banner Secundário"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="text-center text-white px-fluid-md">
            <h2 className="heading-section drop-shadow-lg">
              Frete Grátis acima de R$ 99
            </h2>
            <p className="text-fluid-lg mt-4 drop-shadow-md">
              Em todo o Brasil
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
