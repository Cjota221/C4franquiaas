"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import MercadoPagoConfigForm from './MercadoPagoConfigForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function MercadoPagoConfigWrapper() {
  const [lojaId, setLojaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarLoja() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Usuário não autenticado');
          setLoading(false);
          return;
        }

        // Buscar loja da franqueada
        const { data: franqueada } = await supabase
          .from('franqueadas')
          .select('loja_id')
          .eq('id', user.id)
          .single();

        if (!franqueada?.loja_id) {
          setError('Loja não encontrada');
          setLoading(false);
          return;
        }

        setLojaId(franqueada.loja_id);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar loja:', err);
        setError('Erro ao carregar dados da loja');
        setLoading(false);
      }
    }

    carregarLoja();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!lojaId) {
    return (
      <Alert>
        <AlertDescription>Loja não configurada</AlertDescription>
      </Alert>
    );
  }

  return <MercadoPagoConfigForm lojaId={lojaId} />;
}
