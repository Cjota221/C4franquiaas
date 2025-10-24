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
      'rprucmoavblepodvanga.supabase.co' // Supabase Storage
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [64, 80, 96, 128, 256, 384],
    imageSizes: [16, 32, 48, 64, 85, 96, 128, 256],
    quality: 85,
    remotePatterns: [
      { protocol: 'https', hostname: 'cjotarasteirinhas.com.br', pathname: '/**' },
      { protocol: 'https', hostname: 'arquivos.facilzap.app.br', pathname: '/**' },
      { protocol: 'https', hostname: 'c4franquiaas.netlify.app', pathname: '/.netlify/functions/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'rprucmoavblepodvanga.supabase.co', pathname: '/storage/v1/object/public/logos/**' },
    ],
  },
};

export default nextConfig;
