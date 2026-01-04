"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

type BannerData = {
  titulo: string;
  subtitulo: string | null;
  texto_adicional: string | null;
  font_family: string;
  text_color: string;
  desktop_position_x: number;
  desktop_position_y: number;
  desktop_alignment: string;
  desktop_font_size: number;
  mobile_position_x: number;
  mobile_position_y: number;
  mobile_alignment: string;
  mobile_font_size: number;
  line_spacing: number;
  letter_spacing: number;
};

type Props = {
  userId: string;
  bannerUrl: string;
  bannerMobileUrl?: string;
};

// Mesmas combinações de fontes do editor
const FONT_COMBINATIONS = [
  { 
    name: "Elegante Clássica", 
    title: "Playfair Display", 
    body: "Lato",
    titleWeight: "700",
    bodyWeight: "400",
  },
  { 
    name: "Moderna Limpa", 
    title: "Montserrat", 
    body: "Open Sans",
    titleWeight: "600",
    bodyWeight: "400",
  },
  { 
    name: "Impacto Total", 
    title: "Bebas Neue", 
    body: "Roboto",
    titleWeight: "400",
    bodyWeight: "400",
  },
  { 
    name: "Manuscrita Elegante", 
    title: "Dancing Script", 
    body: "Raleway",
    titleWeight: "700",
    bodyWeight: "400",
  },
  { 
    name: "Retrô Divertida", 
    title: "Lobster", 
    body: "Lato",
    titleWeight: "400",
    bodyWeight: "400",
  },
  { 
    name: "Ultra Moderna", 
    title: "Oswald", 
    body: "Poppins",
    titleWeight: "600",
    bodyWeight: "400",
  },
  { 
    name: "Clássica Séria", 
    title: "Merriweather", 
    body: "Open Sans",
    titleWeight: "700",
    bodyWeight: "400",
  },
  { 
    name: "Super Forte", 
    title: "Anton", 
    body: "Roboto",
    titleWeight: "400",
    bodyWeight: "400",
  },
];

export default function BannerComTexto({ userId, bannerUrl, bannerMobileUrl }: Props) {
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadBannerData() {
      const { data } = await supabase
        .from('banner_submissions')
        .select(`
          titulo,
          subtitulo,
          texto_adicional,
          font_family,
          text_color,
          desktop_position_x,
          desktop_position_y,
          desktop_alignment,
          desktop_font_size,
          mobile_position_x,
          mobile_position_y,
          mobile_alignment,
          mobile_font_size,
          line_spacing,
          letter_spacing
        `)
        .eq('user_id', userId)
        .eq('status', 'approved')
        .order('approved_at', { ascending: false })
        .limit(1)
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

  // Encontrar a combinação de fontes
  const fontCombo = FONT_COMBINATIONS.find(f => f.name === bannerData.font_family) || FONT_COMBINATIONS[0];

  return (
    <div className="w-full">
      {/* Banner Desktop */}
      {bannerUrl && (
        <div className="hidden md:block relative w-full" style={{ aspectRatio: '1920/600' }}>
          <Image src={bannerUrl} alt="Banner" fill className="object-cover" priority />
          
          {/* Texto Sobreposto - Desktop */}
          <div 
            className="absolute"
            style={{
              left: `${bannerData.desktop_position_x}%`,
              top: `${bannerData.desktop_position_y}%`,
              transform: 'translate(-50%, 0)',
              textAlign: bannerData.desktop_alignment as 'left' | 'center' | 'right',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
              gap: `${bannerData.line_spacing}px`,
            }}
          >
            {bannerData.titulo && (
              <h2 
                className="font-bold drop-shadow-2xl"
                style={{
                  fontFamily: fontCombo.title,
                  fontWeight: fontCombo.titleWeight,
                  letterSpacing: `${bannerData.letter_spacing}px`,
                  fontSize: `calc(3rem * ${bannerData.desktop_font_size / 100})`,
                  color: bannerData.text_color,
                }}
              >
                {bannerData.titulo}
              </h2>
            )}
            {bannerData.subtitulo && (
              <p 
                className="drop-shadow-xl"
                style={{
                  fontFamily: fontCombo.body,
                  fontWeight: fontCombo.bodyWeight,
                  letterSpacing: `${bannerData.letter_spacing}px`,
                  fontSize: `calc(1.125rem * ${bannerData.desktop_font_size / 100})`,
                  color: bannerData.text_color,
                  opacity: 0.95,
                }}
              >
                {bannerData.subtitulo}
              </p>
            )}
            {bannerData.texto_adicional && (
              <p 
                className="drop-shadow-xl"
                style={{
                  fontFamily: fontCombo.body,
                  fontWeight: fontCombo.bodyWeight,
                  letterSpacing: `${bannerData.letter_spacing}px`,
                  fontSize: `calc(0.875rem * ${bannerData.desktop_font_size / 100})`,
                  color: bannerData.text_color,
                  opacity: 0.9,
                }}
              >
                {bannerData.texto_adicional}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Banner Mobile */}
      {bannerMobileUrl && (
        <div className="md:hidden relative aspect-square w-full">
          <Image src={bannerMobileUrl} alt="Banner" fill className="object-cover" priority />
          
          {/* Texto Sobreposto - Mobile */}
          <div 
            className="absolute"
            style={{
              left: `${bannerData.mobile_position_x}%`,
              top: `${bannerData.mobile_position_y}%`,
              transform: 'translate(-50%, 0)',
              textAlign: bannerData.mobile_alignment as 'left' | 'center' | 'right',
              maxWidth: '85%',
              display: 'flex',
              flexDirection: 'column',
              gap: `${bannerData.line_spacing}px`,
            }}
          >
            {bannerData.titulo && (
              <h2 
                className="font-bold drop-shadow-2xl"
                style={{
                  fontFamily: fontCombo.title,
                  fontWeight: fontCombo.titleWeight,
                  letterSpacing: `${bannerData.letter_spacing}px`,
                  fontSize: `calc(2rem * ${bannerData.mobile_font_size / 100})`,
                  color: bannerData.text_color,
                }}
              >
                {bannerData.titulo}
              </h2>
            )}
            {bannerData.subtitulo && (
              <p 
                className="drop-shadow-xl"
                style={{
                  fontFamily: fontCombo.body,
                  fontWeight: fontCombo.bodyWeight,
                  letterSpacing: `${bannerData.letter_spacing}px`,
                  fontSize: `calc(1rem * ${bannerData.mobile_font_size / 100})`,
                  color: bannerData.text_color,
                  opacity: 0.95,
                }}
              >
                {bannerData.subtitulo}
              </p>
            )}
            {bannerData.texto_adicional && (
              <p 
                className="drop-shadow-xl"
                style={{
                  fontFamily: fontCombo.body,
                  fontWeight: fontCombo.bodyWeight,
                  letterSpacing: `${bannerData.letter_spacing}px`,
                  fontSize: `calc(0.75rem * ${bannerData.mobile_font_size / 100})`,
                  color: bannerData.text_color,
                  opacity: 0.9,
                }}
              >
                {bannerData.texto_adicional}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
