"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook para buscar a contagem de produtos INATIVOS (sem margem) da revendedora logada
 * Mostra no badge do menu "Produtos" para alertar a revendedora
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

        // ✅ CORRIGIDO: Buscar produtos INATIVOS desta revendedora específica
        // (produtos que precisam de atenção - definir margem e ativar)
        const { count: newCount, error } = await supabase
          .from('reseller_products')
          .select('*', { count: 'exact', head: true })
          .eq('reseller_id', resellerData.id)
          .eq('is_active', false); // Apenas inativos

        if (error) {
          console.error('Erro ao buscar contagem de produtos inativos:', error);
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
