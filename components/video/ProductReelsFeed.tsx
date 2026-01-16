'use client';

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Play, Volume2, VolumeX, Heart, ShoppingBag, MessageCircle, Eye } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TIPOS
// ============================================================================
interface Reel {
  id: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  titulo?: string;
  descricao?: string;
  views: number;
  likes: number;
  produto?: {
    id: string;
    nome: string;
    preco_base: number;
    imagem?: string;
  };
  reseller?: {
    slug: string;
    store_name: string;
    phone?: string;
    primary_color?: string;
  };
}

interface ProductReelsFeedProps {
  reels?: Reel[];
  layout?: 'vertical' | 'horizontal';
  maxItems?: number;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  primaryColor?: string;
  onProductClick?: (produto: Reel['produto']) => void;
}

// ============================================================================
// HELPERS
// ============================================================================
function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

// ============================================================================
// COMPONENTE: Card de Produto (Glassmorphism)
// ============================================================================
const ProductCard = memo(function ProductCard({ 
  produto, 
  reseller,
  primaryColor = '#DB1472',
  onClick,
}: { 
  produto: Reel['produto']; 
  reseller?: Reel['reseller'];
  primaryColor?: string;
  onClick?: () => void;
}) {
  const handleWhatsApp = useCallback(() => {
    if (!produto) return;
    const phone = reseller?.phone?.replace(/\D/g, '') || '';
    const message = encodeURIComponent(
      `Olá! Vi o produto "${produto.nome}" no seu catálogo e quero saber mais! 🛍️`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  }, [produto, reseller?.phone]);
  
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      handleWhatsApp();
    }
  }, [onClick, handleWhatsApp]);
  
  if (!produto) return null;
  
  return (
    <div className="absolute bottom-20 left-4 right-4 z-20">
      <div 
        className="backdrop-blur-xl bg-white/10 rounded-2xl p-4 border border-white/20 shadow-2xl"
        style={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
        }}
      >
        <div className="flex items-center gap-3">
          {/* Thumbnail do produto */}
          {produto.imagem && (
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/30">
              <Image
                src={produto.imagem}
                alt={produto.nome}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm truncate drop-shadow-lg">
              {produto.nome}
            </h3>
            <p className="text-white/90 font-bold text-lg drop-shadow-lg">
              {formatPrice(produto.preco_base)}
            </p>
            {reseller?.store_name && (
              <p className="text-white/70 text-xs truncate">
                @{reseller.store_name}
              </p>
            )}
          </div>
          
          {/* Botão CTA */}
          <button
            onClick={handleClick}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: primaryColor }}
          >
            <MessageCircle className="w-4 h-4" />
            Eu Quero!
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// COMPONENTE: Video Card Individual
// ============================================================================
const ReelCard = memo(function ReelCard({
  reel,
  isVisible,
  isMuted,
  onToggleMute,
  primaryColor: propPrimaryColor,
  onProductClick,
}: {
  reel: Reel;
  isVisible: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  primaryColor?: string;
  onProductClick?: (produto: Reel['produto']) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [liked, setLiked] = useState(false);
  const [viewCounted, setViewCounted] = useState(false);
  
  // 🔥 REGRA DE OURO #1: IntersectionObserver - Play/Pause baseado em visibilidade
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isVisible && isLoaded) {
      video.play().catch(() => {}); // Ignora erro se autoplay bloqueado
      setIsPlaying(true);
      
      // Contar view apenas uma vez
      if (!viewCounted) {
        setViewCounted(true);
        // Incrementar views no backend (fire and forget)
        const supabase = createClient();
        void supabase.rpc('increment_reel_views', { reel_id: reel.id });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isVisible, isLoaded, reel.id, viewCounted]);
  
  // Atualizar muted quando mudar globalmente
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);
  
  const handleLike = useCallback(() => {
    setLiked(!liked);
    // TODO: Persistir like no backend
  }, [liked]);
  
  const primaryColor = propPrimaryColor || reel.reseller?.primary_color || '#DB1472';
  
  return (
    <div 
      className="relative w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden snap-center flex-shrink-0"
      style={{ maxWidth: '360px' }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* 🔥 REGRA DE OURO #2: Lazy Load - Poster até carregar */}
      {!isLoaded && reel.thumbnail_url && (
        <div className="absolute inset-0 z-10">
          <Image
            src={reel.thumbnail_url}
            alt={reel.titulo || 'Reel'}
            fill
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center animate-pulse">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        </div>
      )}
      
      {/* 🔥 REGRA DE OURO #3: Vídeo muted por padrão */}
      <video
        ref={videoRef}
        src={isVisible ? reel.video_url : undefined} // Só carrega se visível
        poster={reel.thumbnail_url}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        preload={isVisible ? 'auto' : 'none'}
        onLoadedData={() => setIsLoaded(true)}
        onClick={handleTogglePlay}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
      
      {/* Controles laterais (estilo TikTok) */}
      <div 
        className={`absolute right-3 bottom-32 flex flex-col items-center gap-5 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-70'}`}
      >
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${liked ? 'bg-red-500' : 'bg-black/30 backdrop-blur-sm'}`}>
            <Heart className={`w-6 h-6 ${liked ? 'text-white fill-white' : 'text-white'}`} />
          </div>
          <span className="text-white text-xs mt-1 drop-shadow-lg">
            {formatViews(reel.likes + (liked ? 1 : 0))}
          </span>
        </button>
        
        {/* Views */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1 drop-shadow-lg">
            {formatViews(reel.views)}
          </span>
        </div>
        
        {/* Som */}
        <button
          onClick={onToggleMute}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" />
          )}
        </button>
      </div>
      
      {/* Play/Pause central (aparece ao pausar) */}
      {!isPlaying && isLoaded && (
        <button
          onClick={handleTogglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </button>
      )}
      
      {/* Card de Produto (Glassmorphism) */}
      <ProductCard 
        produto={reel.produto} 
        reseller={reel.reseller}
        primaryColor={primaryColor}
        onClick={onProductClick ? () => onProductClick(reel.produto) : undefined}
      />
      
      {/* Título (se houver) */}
      {reel.titulo && (
        <div className="absolute top-4 left-4 right-16">
          <p className="text-white font-semibold text-sm drop-shadow-lg line-clamp-2">
            {reel.titulo}
          </p>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL: Feed de Reels
// ============================================================================
export default function ProductReelsFeed({
  reels: initialReels,
  layout = 'horizontal',
  maxItems = 10,
  className = '',
  onLoadMore,
  hasMore = false,
  primaryColor = '#DB1472',
  onProductClick,
}: ProductReelsFeedProps) {
  const [reels, setReels] = useState<Reel[]>(initialReels || []);
  const [loading, setLoading] = useState(!initialReels);
  const [isMuted, setIsMuted] = useState(true); // 🔥 REGRA #3: Muted por padrão
  const [visibleReelId, setVisibleReelId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Carregar reels do banco se não fornecidos
  useEffect(() => {
    if (initialReels) {
      setReels(initialReels);
      return;
    }
    
    const loadReels = async () => {
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('reels')
          .select(`
            *,
            produto:produtos(id, nome, preco_base, imagem),
            reseller:resellers(slug, store_name, phone, colors)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(maxItems);
        
        if (error) throw error;
        
        // Processar dados
        const processedReels: Reel[] = (data || []).map((r) => ({
          ...r,
          reseller: r.reseller ? {
            ...r.reseller,
            primary_color: r.reseller.colors?.primary || '#DB1472',
          } : undefined,
        }));
        
        setReels(processedReels);
      } catch (err) {
        console.error('Erro ao carregar reels:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadReels();
  }, [initialReels, maxItems]);
  
  // 🔥 REGRA DE OURO #1: IntersectionObserver para detectar qual vídeo está visível
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Cleanup observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const reelId = entry.target.getAttribute('data-reel-id');
          
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            // Vídeo está 70%+ visível - marcar como ativo
            setVisibleReelId(reelId);
          }
        });
      },
      {
        root: layout === 'horizontal' ? containerRef.current : null,
        threshold: [0.7], // Trigger quando 70% visível
      }
    );
    
    // Observar todos os cards
    const cards = containerRef.current.querySelectorAll('[data-reel-id]');
    cards.forEach((card) => observerRef.current?.observe(card));
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [reels, layout]);
  
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className={`flex gap-4 overflow-hidden ${className}`}>
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="w-[300px] aspect-[9/16] bg-gray-200 rounded-2xl animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }
  
  // Sem reels
  if (reels.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum reel disponível</p>
        </div>
      </div>
    );
  }
  
  // Layout Horizontal (scroll lateral)
  if (layout === 'horizontal') {
    return (
      <div className={className}>
        <div 
          ref={containerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {reels.map((reel) => (
            <div key={reel.id} data-reel-id={reel.id}>
              <ReelCard
                reel={reel}
                isVisible={visibleReelId === reel.id}
                isMuted={isMuted}
                onToggleMute={toggleMute}
                primaryColor={primaryColor}
                onProductClick={onProductClick}
              />
            </div>
          ))}
          
          {/* Load More */}
          {hasMore && onLoadMore && (
            <button
              onClick={onLoadMore}
              className="w-[300px] aspect-[9/16] bg-gray-100 rounded-2xl flex-shrink-0 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <span className="text-gray-600 font-medium">Ver mais</span>
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // Layout Vertical (scroll vertical, estilo TikTok)
  return (
    <div 
      ref={containerRef}
      className={`flex flex-col gap-4 overflow-y-auto snap-y snap-mandatory h-[calc(100vh-100px)] ${className}`}
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {reels.map((reel) => (
        <div 
          key={reel.id} 
          data-reel-id={reel.id}
          className="snap-center flex justify-center"
        >
          <ReelCard
            reel={reel}
            isVisible={visibleReelId === reel.id}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            primaryColor={primaryColor}
            onProductClick={onProductClick}
          />
        </div>
      ))}
    </div>
  );
}
