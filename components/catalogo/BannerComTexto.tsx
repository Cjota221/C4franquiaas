"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

type BannerData = {
  titulo: string;
  subtitulo: string;
  texto_adicional: string;
  font_family: string;
  font_style: 'classic' | 'modern' | 'elegant' | 'bold';
  desktop_position_x: number;
  desktop_position_y: number;
  mobile_position_x: number;
  mobile_position_y: number;
};

type Props = {
  userId: string;
  bannerUrl: string;
  bannerMobileUrl?: string;
};

const FONT_COMBINATIONS = {
  classic: {
    desktop: {
      titulo: { fontSize: '3.5rem', fontWeight: 700, fontFamily: 'Playfair Display, serif' },
      subtitulo: { fontSize: '1.5rem', fontWeight: 400, fontFamily: 'Lato, sans-serif' },
      textoAdicional: { fontSize: '1.125rem', fontWeight: 300, fontFamily: 'Lato, sans-serif' },
    },
    mobile: {
      titulo: { fontSize: '2rem', fontWeight: 700, fontFamily: 'Playfair Display, serif' },
      subtitulo: { fontSize: '1rem', fontWeight: 400, fontFamily: 'Lato, sans-serif' },
      textoAdicional: { fontSize: '0.875rem', fontWeight: 300, fontFamily: 'Lato, sans-serif' },
    }
  },
  modern: {
    desktop: {
      titulo: { fontSize: '3.5rem', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' },
      subtitulo: { fontSize: '1.5rem', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' },
      textoAdicional: { fontSize: '1.125rem', fontWeight: 400, fontFamily: 'Montserrat, sans-serif' },
    },
    mobile: {
      titulo: { fontSize: '2rem', fontWeight: 800, fontFamily: 'Montserrat, sans-serif' },
      subtitulo: { fontSize: '1rem', fontWeight: 500, fontFamily: 'Montserrat, sans-serif' },
      textoAdicional: { fontSize: '0.875rem', fontWeight: 400, fontFamily: 'Montserrat, sans-serif' },
    }
  },
  elegant: {
    desktop: {
      titulo: { fontSize: '3.5rem', fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' },
      subtitulo: { fontSize: '1.5rem', fontWeight: 400, fontFamily: 'Crimson Text, serif' },
      textoAdicional: { fontSize: '1.125rem', fontWeight: 300, fontFamily: 'Crimson Text, serif' },
    },
    mobile: {
      titulo: { fontSize: '2rem', fontWeight: 300, fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' },
      subtitulo: { fontSize: '1rem', fontWeight: 400, fontFamily: 'Crimson Text, serif' },
      textoAdicional: { fontSize: '0.875rem', fontWeight: 300, fontFamily: 'Crimson Text, serif' },
    }
  },
  bold: {
    desktop: {
      titulo: { fontSize: '3.5rem', fontWeight: 900, fontFamily: 'Bebas Neue, sans-serif', textTransform: 'uppercase' as const },
      subtitulo: { fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' as const },
      textoAdicional: { fontSize: '1.125rem', fontWeight: 400, fontFamily: 'Oswald, sans-serif' },
    },
    mobile: {
      titulo: { fontSize: '2rem', fontWeight: 900, fontFamily: 'Bebas Neue, sans-serif', textTransform: 'uppercase' as const },
      subtitulo: { fontSize: '1rem', fontWeight: 700, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' as const },
      textoAdicional: { fontSize: '0.875rem', fontWeight: 400, fontFamily: 'Oswald, sans-serif' },
    }
  }
};

export default function BannerComTexto({ userId, bannerUrl, bannerMobileUrl }: Props) {
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadBannerData() {
      const { data } = await supabase
        .from('banner_submissions')
        .select('titulo, subtitulo, texto_adicional, font_family, font_style, desktop_position_x, desktop_position_y, mobile_position_x, mobile_position_y')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single();

      if (data) {
        setBannerData(data);
      }
    }

    if (userId) {
      loadBannerData();
    }
  }, [userId, supabase]);

  // Se não tiver dados personalizados, mostra só a imagem
  if (!bannerData) {
    return (
      <div className="w-full">
        {bannerUrl && (
          <div className="hidden md:block relative w-full" style={{ aspectRatio: '1920/600' }}>
            <Image src={bannerUrl} alt="Banner" fill className="object-cover" priority />
          </div>
        )}
        {bannerMobileUrl && (
          <div className="md:hidden relative aspect-square w-full">
            <Image src={bannerMobileUrl} alt="Banner" fill className="object-cover" priority />
          </div>
        )}
      </div>
    );
  }

  const fontStyle = FONT_COMBINATIONS[bannerData.font_style] || FONT_COMBINATIONS.classic;

  return (
    <div className="w-full">
      {/* Banner Desktop */}
      {bannerUrl && (
        <div className="hidden md:block relative w-full" style={{ aspectRatio: '1920/600' }}>
          <Image src={bannerUrl} alt="Banner" fill className="object-cover" priority />
          
          {/* Overlay de textos - Desktop */}
          <div 
            className="absolute flex flex-col gap-2"
            style={{
              right: `${bannerData.desktop_position_x}%`,
              top: `${bannerData.desktop_position_y}%`,
              maxWidth: '40%',
            }}
          >
            <div className="backdrop-blur-sm bg-white/80 p-6 rounded-lg shadow-lg">
              {bannerData.titulo && (
                <h2 
                  className="leading-tight mb-2"
                  style={fontStyle.desktop.titulo}
                >
                  {bannerData.titulo}
                </h2>
              )}
              {bannerData.subtitulo && (
                <p 
                  className="leading-snug mb-2"
                  style={fontStyle.desktop.subtitulo}
                >
                  {bannerData.subtitulo}
                </p>
              )}
              {bannerData.texto_adicional && (
                <p 
                  className="leading-relaxed"
                  style={fontStyle.desktop.textoAdicional}
                >
                  {bannerData.texto_adicional}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Banner Mobile */}
      {bannerMobileUrl && (
        <div className="md:hidden relative aspect-square w-full">
          <Image src={bannerMobileUrl} alt="Banner" fill className="object-cover" priority />
          
          {/* Overlay de textos - Mobile */}
          <div 
            className="absolute flex flex-col gap-2 left-1/2 -translate-x-1/2"
            style={{
              top: `${bannerData.mobile_position_y}%`,
              maxWidth: '85%',
            }}
          >
            <div className="backdrop-blur-sm bg-white/80 p-4 rounded-lg shadow-lg text-center">
              {bannerData.titulo && (
                <h2 
                  className="leading-tight mb-2"
                  style={fontStyle.mobile.titulo}
                >
                  {bannerData.titulo}
                </h2>
              )}
              {bannerData.subtitulo && (
                <p 
                  className="leading-snug mb-1"
                  style={fontStyle.mobile.subtitulo}
                >
                  {bannerData.subtitulo}
                </p>
              )}
              {bannerData.texto_adicional && (
                <p 
                  className="leading-relaxed text-sm"
                  style={fontStyle.mobile.textoAdicional}
                >
                  {bannerData.texto_adicional}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
