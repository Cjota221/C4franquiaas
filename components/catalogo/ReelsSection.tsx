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
    <section className="py-4">
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
