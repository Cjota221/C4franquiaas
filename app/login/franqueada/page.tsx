'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redireciona para a nova rota /login/revendedorapro
export default function LoginFranqueadaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login/revendedorapro');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#DB1472] via-pink-600 to-[#DB1472]">
      <div className="text-white text-center">
        <p className="text-lg">Redirecionando...</p>
      </div>
    </div>
  );
}
