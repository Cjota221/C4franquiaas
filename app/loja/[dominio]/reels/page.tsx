/**
 * 🎬 PÁGINA DE REELS - Modo Imersivo TikTok/Instagram
 * 
 * Rota: /loja/[dominio]/reels
 * 
 * Carrega todos os produtos com vídeo e exibe no feed vertical
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLojaInfo } from '@/contexts/LojaContext';
import { Loader2 } from 'lucide-react';
import { ImmersiveReelsFeed, ReelProduct } from '@/components/video/ImmersiveReelsFeed';
import { useCarrinhoStore } from '@/lib/store/carrinhoStore';
import { toast } from 'sonner';

export default function ReelsPage() {
  const params = useParams();
  const router = useRouter();
  const loja = useLojaInfo();
  const addItem = useCarrinhoStore(state => state.addItem);
  
  const dominio = params.dominio as string;
  
  const [products, setProducts] = useState<ReelProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialIndex, setInitialIndex] = useState(0);

  // Carregar produtos com vídeo
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/loja/${dominio}/produtos?has_video=true&limit=100`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar produtos');
        }
        
        const data = await response.json();
        
        // Filtrar apenas produtos com vídeo e mapear para formato ReelProduct
        interface ProdutoAPI {
          id: string;
          nome: string;
          preco_final?: number;
          preco_venda?: number;
          preco_base?: number;
          video_url?: string;
          video_thumbnail?: string;
          imagem?: string;
          imagens?: string[];
        }
        const reelProducts: ReelProduct[] = (data.produtos || data)
          .filter((p: ProdutoAPI) => p.video_url)
          .map((p: ProdutoAPI) => ({
            id: p.id,
            nome: p.nome,
            preco: p.preco_final || p.preco_venda || p.preco_base,
            precoOriginal: p.preco_base,
            videoUrl: p.video_url,
            posterUrl: p.video_thumbnail || p.imagem || p.imagens?.[0],
            loja: loja ? {
              nome: loja.nome,
              logo: loja.logo,
              slug: dominio,
            } : undefined,
          }));
        
        setProducts(reelProducts);
        
        // Verificar se há um produto específico na URL
        const urlParams = new URLSearchParams(window.location.search);
        const startProduct = urlParams.get('produto');
        if (startProduct) {
          const index = reelProducts.findIndex(p => p.id === startProduct);
          if (index >= 0) {
            setInitialIndex(index);
          }
        }
        
      } catch (err) {
        console.error('Erro ao carregar reels:', err);
        setError('Não foi possível carregar os vídeos');
      } finally {
        setLoading(false);
      }
    }
    
    if (dominio) {
      loadProducts();
    }
  }, [dominio, loja]);

  // Handlers
  const handleClose = () => {
    router.back();
  };

  const handleFavorite = (_productId: string) => {
    // TODO: Implementar favoritos
    toast.success('Produto salvo nos favoritos!');
  };

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    addItem({
      id: product.id,
      nome: product.nome,
      preco: product.preco,
      quantidade: 1,
      imagem: product.posterUrl || '',
    });
    
    toast.success('Produto adicionado ao carrinho!', {
      action: {
        label: 'Ver carrinho',
        onClick: () => router.push(`/loja/${dominio}/carrinho`),
      },
    });
    
    // Vibração de feedback (se disponível)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleShare = (_product: ReelProduct) => {
    toast.success('Link copiado!');
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[10000]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">Carregando reels...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || products.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[10000]">
        <div className="text-center p-8">
          <p className="text-white/70 mb-4">
            {error || 'Nenhum vídeo disponível'}
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-white text-black rounded-full font-semibold"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ImmersiveReelsFeed
      products={products}
      initialIndex={initialIndex}
      onClose={handleClose}
      onFavorite={handleFavorite}
      onAddToCart={handleAddToCart}
      onShare={handleShare}
      corPrimaria={loja?.cor_primaria || '#DB1472'}
      dominio={dominio}
    />
  );
}
