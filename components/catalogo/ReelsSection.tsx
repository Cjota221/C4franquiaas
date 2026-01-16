'use client';

import { ProductReelsFeed } from '@/components/video';
import { useRouter, useParams } from 'next/navigation';

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
}

export default function ReelsSection({ produtos, primaryColor }: ReelsSectionProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  if (produtos.length === 0) return null;
  
  return (
    <section className="py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-4">
        <span className="text-2xl">🎬</span>
        <h2 className="text-xl font-bold text-gray-900">C4 Reels</h2>
        <span className="text-sm text-gray-500 ml-auto">
          {produtos.length} {produtos.length === 1 ? 'vídeo' : 'vídeos'}
        </span>
      </div>
      
      {/* Feed de Reels */}
      <ProductReelsFeed
        reels={produtos.map(p => ({
          id: p.id,
          video_url: p.video_url,
          thumbnail_url: p.video_thumbnail,
          produto: {
            id: p.id,
            nome: p.nome,
            preco_base: p.preco_final,
            imagem: p.imagem
          },
          views: 0,
          likes: 0
        }))}
        primaryColor={primaryColor}
        layout="horizontal"
        onProductClick={(produto) => {
          router.push(`/site/${slug}/produto/${produto.id}`);
        }}
      />
    </section>
  );
}
