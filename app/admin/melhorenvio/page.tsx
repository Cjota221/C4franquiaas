"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MelhorEnvioRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a rota correta
    router.replace('/admin/configuracoes/melhorenvio');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecionando para configurações...</p>
      </div>
    </div>
  );
}
