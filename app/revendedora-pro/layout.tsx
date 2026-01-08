"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SidebarFranqueada from '@/components/SidebarFranqueada';
import { Toaster } from 'sonner';

// OTIMIZAÇÃO: Cache de autenticação (5 minutos)
const AUTH_CACHE_KEY = 'revendedora_pro_auth_cache';
const CACHE_DURATION = 5 * 60 * 1000;

type CachedAuth = {
  franqueadaId: string;
  franqueadaNome: string;
  timestamp: number;
};

export default function RevendedoraProLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [franqueadaNome, setFranqueadaNome] = useState('');

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login/revendedorapro'];
  const isPublicRoute = publicRoutes.includes(pathname || '');

  const checkAuth = useCallback(async () => {
    // Se for rota pública, não verifica autenticação
    if (isPublicRoute) {
      setLoading(false);
      return;
    }

    // OTIMIZAÇÃO: Verificar cache primeiro (evita 800ms de chamadas DB)
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(AUTH_CACHE_KEY);
      if (cached) {
        try {
          const parsedCache: CachedAuth = JSON.parse(cached);
          const isValid = Date.now() - parsedCache.timestamp < CACHE_DURATION;
          
          if (isValid) {
            console.log('[franqueada/layout]  Cache válido, usando dados salvos');
            setFranqueadaNome(parsedCache.franqueadaNome);
            setLoading(false);
            return; // Skip DB call!
          }
        } catch (e) {
          sessionStorage.removeItem(AUTH_CACHE_KEY);
        }
      }
    }

    try {
      const { data: { user } } = await createClient().auth.getUser();

      if (!user) {
        router.push('/login/revendedorapro');
        return;
      }

      // Verificar se usuário está vinculado a Revendedora Pro aprovada
      const { data: franqueada, error } = await createClient()
        .from('franqueadas')
        .select('id, nome, status')
        .eq('user_id', user.id)
        .single();

      if (error || !franqueada) {
        console.error('[revendedora-pro/layout] Usuário não vinculado');
        await createClient().auth.signOut();
        router.push('/login/revendedorapro');
        return;
      }

      if (franqueada.status !== 'aprovada') {
        console.error('[revendedora-pro/layout] Conta não aprovada');
        await createClient().auth.signOut();
        router.push('/login/revendedorapro');
        return;
      }

      setFranqueadaNome(franqueada.nome);
      
      // OTIMIZAÇÃO: Salvar no cache para próximas navegações
      if (typeof window !== 'undefined') {
        const cacheData: CachedAuth = {
          franqueadaId: franqueada.id,
          franqueadaNome: franqueada.nome,
          timestamp: Date.now()
        };
        sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cacheData));
        console.log('[franqueada/layout]  Dados salvos no cache');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('[franqueada/layout] Erro ao verificar autenticação:', err);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(AUTH_CACHE_KEY);
      }
      router.push('/franqueada/login');
    }
  }, [router, isPublicRoute]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se for rota pública, renderiza apenas o children
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <SidebarFranqueada franqueadaNome={franqueadaNome} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
