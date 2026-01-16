/**
 * 🎨 GOOGLE FONTS LOADER
 * 
 * Carrega fontes do Google Fonts dinamicamente
 * Usado para permitir seleção de fontes nas personalizações
 */

"use client";

import { useEffect } from 'react';

interface GoogleFontsLoaderProps {
  fontePrincipal?: string;
  fonteSecundaria?: string;
}

// Lista de fontes disponíveis no Google Fonts
const GOOGLE_FONTS = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Nunito',
  'Quicksand',
  'Comfortaa',
  'Playfair Display',
  'Cormorant Garamond',
  'Libre Baskerville',
  'Raleway',
  'Josefin Sans',
  'DM Sans',
  'Space Grotesk',
];

export function GoogleFontsLoader({ fontePrincipal = 'Inter', fonteSecundaria }: GoogleFontsLoaderProps) {
  useEffect(() => {
    // Coletar fontes únicas para carregar
    const fontsToLoad = new Set<string>();
    
    if (fontePrincipal && GOOGLE_FONTS.includes(fontePrincipal)) {
      fontsToLoad.add(fontePrincipal);
    }
    
    if (fonteSecundaria && GOOGLE_FONTS.includes(fonteSecundaria)) {
      fontsToLoad.add(fonteSecundaria);
    }
    
    if (fontsToLoad.size === 0) return;
    
    // Verificar se já existe um link para essas fontes
    const existingLink = document.querySelector('link[data-google-fonts]');
    if (existingLink) {
      existingLink.remove();
    }
    
    // Criar URL do Google Fonts
    const fontFamilies = Array.from(fontsToLoad).map(font => {
      const formattedFont = font.replace(/ /g, '+');
      return `family=${formattedFont}:wght@300;400;500;600;700`;
    });
    
    const googleFontsUrl = `https://fonts.googleapis.com/css2?${fontFamilies.join('&')}&display=swap`;
    
    // Criar e adicionar link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = googleFontsUrl;
    link.setAttribute('data-google-fonts', 'true');
    document.head.appendChild(link);
    
    // Cleanup
    return () => {
      const linkToRemove = document.querySelector('link[data-google-fonts]');
      if (linkToRemove) {
        linkToRemove.remove();
      }
    };
  }, [fontePrincipal, fonteSecundaria]);
  
  return null;
}

export default GoogleFontsLoader;
