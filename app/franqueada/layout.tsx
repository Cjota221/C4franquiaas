"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import SidebarFranqueada from '@/components/SidebarFranqueada';
import { Toaster } from 'sonner';

export default function FranqueadaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [franqueadaNome, setFranqueadaNome] = useState('');

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/franqueada/login'];
  const isPublicRoute = publicRoutes.includes(pathname || '');

  const checkAuth = useCallback(async () => {
    // Se for rota pública, não verifica autenticação
    if (isPublicRoute) {
      setLoading(false);
      return;
    }

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
  }, [router, isPublicRoute]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Se for rota pública, renderiza sem sidebar
  if (isPublicRoute) {
    return <>{children}</>;
  }

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
      <Toaster position="top-right" richColors />
    </div>
  );
}
