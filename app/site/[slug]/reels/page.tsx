/**
 * 🎬 PÁGINA DE REELS - Feed Imersivo estilo TikTok
 * 
 * Rota: /site/[slug]/reels
 * 
 * Busca produtos com vídeo vinculados à revendedora
 * e exibe em formato de feed vertical com scroll snap
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, Film } from 'lucide-react';
import { ReelsFeed, ReelItem } from '@/components/video/ReelsFeed';
import { useCatalogo } from '../layout';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';

export default function ReelsPage() {
  const params = useParams();
  const router = useRouter();
  const { reseller, primaryColor } = useCatalogo();
  const supabase = createClientComponentClient();
  
  const slug = params.slug as string;
  
  // Hook de favoritos integrado
  const { toggleFavorite, isFavorite } = useFavorites({
    resellerId: reseller?.id || '',
    slug,
  });
  
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialIndex, setInitialIndex] = useState(0);

  // Carregar produtos com vídeo - mesma lógica da home
  const loadReels = useCallback(async () => {
    if (!reseller?.id) return;
    
    try {
      setLoading(true);
      
      // Buscar produtos vinculados à revendedora COM vídeo
      const { data, error } = await supabase
        .from('reseller_products')
        .select(`
          *,
          produtos:product_id (
            id,
            nome,
            descricao,
            preco_base,
            imagem,
            estoque,
            ativo,
            video_url,
            video_thumbnail
          )
        `)
        .eq('reseller_id', reseller.id)
        .eq('is_active', true);

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        return;
      }

      // Filtrar apenas produtos ativos COM vídeo
      const reelItems: ReelItem[] = (data || [])
        .filter((p) => p.produtos?.ativo && p.produtos?.video_url)
        .map((p) => ({
          id: p.produtos.id,
          nome: p.produtos.nome,
          descricao: p.produtos.descricao,
          preco: p.produtos.preco_base * (1 + (p.margin_percent || 0) / 100),
          precoOriginal: p.produtos.preco_base,
          videoUrl: p.produtos.video_url,
          posterUrl: p.produtos.video_thumbnail || p.produtos.imagem,
          imagem: p.produtos.imagem,
          loja: {
            nome: reseller.store_name,
            logo: reseller.logo_url,
            slug: slug,
          },
        }));
      
      setReels(reelItems);
      
      // Verificar se há um produto específico na URL
      const urlParams = new URLSearchParams(window.location.search);
      const startProduct = urlParams.get('produto');
      if (startProduct) {
        const index = reelItems.findIndex((r) => r.id === startProduct);
        if (index >= 0) {
          setInitialIndex(index);
        }
      }
      
    } catch (err) {
      console.error('Erro ao carregar reels:', err);
    } finally {
      setLoading(false);
    }
  }, [reseller, supabase, slug]);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  // Handlers
  const handleClose = () => {
    router.back();
  };

  // Handler de favorito integrado com useFavorites
  const handleFavorite = (id: string) => {
    const reel = reels.find(r => r.id === id);
    if (!reel) return;
    
    const isFav = toggleFavorite({
      id: reel.id,
      nome: reel.nome,
      imagem: reel.posterUrl,
      preco: reel.preco,
    });
    
    if (isFav) {
      toast.success('Produto salvo nos favoritos! 💖');
    } else {
      toast.info('Removido dos favoritos');
    }
    
    // Disparar evento para atualizar contagem no layout
    window.dispatchEvent(new StorageEvent('storage', {
      key: `favorites_${slug}`,
      newValue: localStorage.getItem(`favorites_${slug}`),
    }));
  };

  const handleAddToCart = (id: string) => {
    // Redirecionar para página do produto
    router.push(`/site/${slug}/produto/${id}`);
  };

  const handleShare = async (reel: ReelItem) => {
    const url = `${window.location.origin}/site/${slug}/reels?produto=${reel.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: reel.nome,
          text: `Confira: ${reel.nome}`,
          url,
        });
      } catch {
        // Usuário cancelou
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
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

  // Empty state
  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[10000]">
        <div className="text-center p-8">
          <Film className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/70 mb-4">
            Nenhum vídeo disponível ainda
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ReelsFeed
      reels={reels}
      initialIndex={initialIndex}
      onClose={handleClose}
      onFavorite={handleFavorite}
      onAddToCart={handleAddToCart}
      onShare={handleShare}
      corPrimaria={primaryColor || '#DB1472'}
      dominio={slug}
      isFavorite={isFavorite}
    />
  );
}
