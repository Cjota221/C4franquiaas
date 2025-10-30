"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MercadoPagoConfigForm from '@/components/franqueada/MercadoPagoConfigForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PagamentosLojaPage() {
  const params = useParams();
  const router = useRouter();
  const lojaId = params.id as string;
  const [lojaNome, setLojaNome] = useState<string>('');

  useEffect(() => {
    async function carregarLoja() {
      try {
        const res = await fetch(`/api/admin/lojas/${lojaId}`);
        if (res.ok) {
          const data = await res.json();
          setLojaNome(data.nome || 'Loja');
        }
      } catch (err) {
        console.error('Erro ao carregar loja:', err);
      }
    }
    carregarLoja();
  }, [lojaId]);

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Configurações de Pagamento
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          {lojaNome ? `Loja: ${lojaNome}` : 'Gerenciar integrações de pagamento'}
        </p>
      </div>

      <MercadoPagoConfigForm lojaId={lojaId} />
    </div>
  );
}
