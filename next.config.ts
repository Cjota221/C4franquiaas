/** @type {import('next').NextConfig} */
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['cjotarasteirinhas.com.br', 'arquivos.facilzap.app.br', 'placehold.co', 'c4franquiaas.netlify.app'],
    remotePatterns: [
      { protocol: 'https', hostname: 'cjotarasteirinhas.com.br', pathname: '/**' },
      { protocol: 'https', hostname: 'arquivos.facilzap.app.br', pathname: '/**' },
      { protocol: 'https', hostname: 'c4franquiaas.netlify.app', pathname: '/.netlify/functions/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
    ],
  },
};

export default nextConfig;
