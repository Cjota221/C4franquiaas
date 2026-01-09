'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomizacoesRedirect() {
  const router = useRouter();

  useEffect(() => {
    toast.info('Redirecionando para a nova página de Configurações...', {
      duration: 2000,
    });

    // Aguarda um pouco para o usuário ver a mensagem
    setTimeout(() => {
      router.replace('/revendedora-pro/loja');
    }, 500);
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Página Atualizada!
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            As páginas de <strong>Personalização</strong> e{' '}
            <strong>Configurações</strong> foram unificadas em uma única
            página mais simples e eficiente.
          </p>
        </div>
      </div>
    </div>
  );
}
