"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook para buscar a contagem de produtos novos pendentes de ativação
 * pela franqueada logada
 */
export function useNewProductsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const supabase = createClient();

        // Verificar autenticação
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCount(0);
          setLoading(false);
          return;
        }

        // Buscar reseller_id do usuário logado
        const { data: resellerData, error: resellerError } = await supabase
          .from('resellers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (resellerError || !resellerData) {
          setCount(0);
          setLoading(false);
          return;
        }

        // Buscar contagem de produtos novos pendentes
        const { count: newCount, error } = await supabase
          .from('produtos_novos_franqueada')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('Erro ao buscar contagem de produtos novos:', error);
          setCount(0);
        } else {
          setCount(newCount || 0);
        }
      } catch (error) {
        console.error('Erro no hook useNewProductsCount:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    // Revalidar a cada 30 segundos
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return { count, loading };
}
