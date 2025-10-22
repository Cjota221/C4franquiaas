"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SidebarFranqueada from '@/components/SidebarFranqueada';

export default function FranqueadaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [franqueadaNome, setFranqueadaNome] = useState('');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const checkAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/franqueada/login');
        return;
      }

      // Verificar se usuário está vinculado a franqueada aprovada
      const { data: franqueada, error } = await supabase
        .from('franqueadas')
        .select('id, nome, status')
        .eq('user_id', user.id)
        .single();

      if (error || !franqueada) {
        console.error('[franqueada/layout] Usuário não vinculado a franqueada');
        await supabase.auth.signOut();
        router.push('/franqueada/login');
        return;
      }

      if (franqueada.status !== 'aprovada') {
        console.error('[franqueada/layout] Franqueada não aprovada');
        await supabase.auth.signOut();
        router.push('/franqueada/login');
        return;
      }

      setFranqueadaNome(franqueada.nome);
      setLoading(false);
    } catch (err) {
      console.error('[franqueada/layout] Erro ao verificar autenticação:', err);
      router.push('/franqueada/login');
    }
  }, [router, supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarFranqueada franqueadaNome={franqueadaNome} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
