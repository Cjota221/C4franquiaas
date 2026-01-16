"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Redirect de /catalogo/* para /site/*
 * Mantém compatibilidade com links antigos
 */
export default function CatalogoRedirect() {
  const router = useRouter();
  const params = useParams();
  
  useEffect(() => {
    // Pega o slug completo (pode ser array)
    const slugParts = params.slug;
    const fullPath = Array.isArray(slugParts) ? slugParts.join('/') : slugParts || '';
    
    // Redireciona para /site/...
    router.replace(`/site/${fullPath}`);
  }, [router, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}
