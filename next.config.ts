/** @type {import('next').NextConfig} */
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['cjotarasteirinhas.com.br', 'arquivos.facilzap.app.br', 'placehold.co'],
    remotePatterns: [
      { protocol: 'https', hostname: 'cjotarasteirinhas.com.br', pathname: '/**' },
    ],
  },
};

export default nextConfig;
