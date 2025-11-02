/** @type {import('next').NextConfig} */
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Habilita source maps em produção para melhor debugging
  productionBrowserSourceMaps: true,
  
  images: {
    domains: [
      'cjotarasteirinhas.com.br', 
      'arquivos.facilzap.app.br', 
      'placehold.co', 
      'c4franquiaas.netlify.app',
      'rprucmoavblepodvanga.supabase.co', // Supabase Storage
      'www.melhorenvio.com.br', // Melhor Envio
      'melhorenvio.com.br' // Melhor Envio
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    // Tamanhos otimizados para produto em alta resolução
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080],
    remotePatterns: [
      { protocol: 'https', hostname: 'cjotarasteirinhas.com.br', pathname: '/**' },
      { protocol: 'https', hostname: 'arquivos.facilzap.app.br', pathname: '/**' },
      { protocol: 'https', hostname: 'c4franquiaas.netlify.app', pathname: '/.netlify/functions/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'rprucmoavblepodvanga.supabase.co', pathname: '/storage/v1/object/public/logos/**' },
      { protocol: 'https', hostname: 'www.melhorenvio.com.br', pathname: '/**' },
      { protocol: 'https', hostname: 'melhorenvio.com.br', pathname: '/**' },
    ],
  },
};

export default nextConfig;
