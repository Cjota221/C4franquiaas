"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LojaHeader from '@/components/loja/LojaHeader';
import LojaFooter from '@/components/loja/LojaFooter';

type Loja = {
  nome: string;
  logo: string | null;
  cor_primaria: string;
  cor_secundaria: string;
};

export default function LojaLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ dominio: string }>;
}) {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dominio, setDominio] = useState<string>('');

  useEffect(() => {
    async function loadLoja() {
      try {
        const { dominio: dom } = await params;
        setDominio(dom);
        console.log(`[Loja Layout] Carregando loja: ${dom}`);
        
        const res = await fetch(`/api/loja/${dom}/info`);
        
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Loja não encontrada');
        }
        
        const json = await res.json();
        console.log('[Loja Layout] Loja carregada:', json.loja);
        setLoja(json.loja);
      } catch (err) {
        console.error('[Loja Layout] Erro ao carregar loja:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar loja');
      } finally {
        setLoading(false);
      }
    }
    
    loadLoja();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando loja...</p>
        </div>
      </div>
    );
  }

  if (error || !loja) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Loja não encontrada</h1>
          <p className="text-gray-600 mb-6">
            {error || 'A loja que você está procurando não existe ou não está ativa.'}
          </p>
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <style jsx global>{`
        :root {
          --cor-primaria: ${loja.cor_primaria};
          --cor-secundaria: ${loja.cor_secundaria};
        }
      `}</style>

      <LojaHeader loja={loja} dominio={dominio} />
      
      <main className="flex-1">
        {children}
      </main>
      
      <LojaFooter loja={loja} />
    </div>
  );
}
