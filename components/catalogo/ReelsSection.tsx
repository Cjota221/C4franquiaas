'use client';

import ProductReelsFeed from '@/components/video/ProductReelsFeed';
import { useParams, useRouter } from 'next/navigation';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import Link from 'next/link';
import { ChevronRight, Film } from 'lucide-react';

interface ProdutoComVideo {
  id: string;
  nome: string;
  preco_final: number;
  imagem?: string;
  video_url: string;
  video_thumbnail?: string;
}

interface ReelsSectionProps {
  produtos: ProdutoComVideo[];
  primaryColor: string;
  resellerId: string;
}

export default function ReelsSection({ produtos, primaryColor, resellerId }: ReelsSectionProps) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  // Hook de favoritos
  const { toggleFavorite, isFavorite } = useFavorites({
    resellerId,
    slug,
  });
  
  if (produtos.length === 0) return null;
  
  // Pegar apenas os 4 primeiros para exibir na Home
  const displayProducts = produtos.slice(0, 4);
  const hasMore = produtos.length > 4;
  
  // Converter produtos para formato esperado pelo ProductReelsFeed
  const reels = displayProducts.map(p => ({
    id: p.id,
    video_url: p.video_url,
    thumbnail_url: p.video_thumbnail || p.imagem,
    views: 0,
    likes: 0,
    produto: {
      id: p.id,
      nome: p.nome,
      preco_base: p.preco_final,
      imagem: p.imagem,
    },
    reseller: {
      slug: slug,
      store_name: '',
      primary_color: primaryColor,
    },
  }));

  // Handler para ir para página do produto
  const handleProductClick = (produto: { id: string; nome: string; preco_base: number; imagem?: string } | undefined) => {
    if (produto?.id) {
      router.push(`/site/${slug}/produto/${produto.id}`);
    }
  };
  
  // Handler para favoritar
  const handleFavorite = (produto: { id: string; nome: string; preco_base: number; imagem?: string } | undefined) => {
    if (!produto) return;
    
    const isFav = toggleFavorite({
      id: produto.id,
      nome: produto.nome,
      imagem: produto.imagem,
      preco: produto.preco_base,
    });
    
    if (isFav) {
      toast.success('Produto salvo nos favoritos! 💖');
    } else {
      toast.info('Removido dos favoritos');
    }
    
    // Atualizar contagem no layout (disparar evento storage)
    window.dispatchEvent(new StorageEvent('storage', {
      key: `favorites_${slug}`,
      newValue: localStorage.getItem(`favorites_${slug}`),
    }));
  };
  
  return (
    <section className="py-4 -mx-4">
      {/* Header com botão Ver Reels Completo */}
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Film className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Reels</h2>
        </div>
        
        {/* Botão Ver Reels Completo */}
        {hasMore && (
          <Link
            href={`/site/${slug}/reels`}
            className="flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: primaryColor }}
          >
            Ver Completo
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      
      <ProductReelsFeed
        reels={reels}
        layout="horizontal"
        maxItems={4}
        primaryColor={primaryColor}
        onProductClick={handleProductClick}
        onFavorite={handleFavorite}
        isFavorite={isFavorite}
      />
    </section>
  );
}
