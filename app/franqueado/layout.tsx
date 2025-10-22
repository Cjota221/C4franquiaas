"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SidebarFranqueado from '@/components/SidebarFranqueado';

export default function FranqueadoLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [franqueadaNome, setFranqueadaNome] = useState('Franqueado');
  const router = useRouter();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const checkAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/franqueado/login');
        return;
      }

      // Buscar dados da franqueada
      const { data: franqueada, error } = await supabase
        .from('franqueadas')
        .select('id, nome, status')
        .eq('user_id', user.id)
        .single();

      if (error || !franqueada) {
        console.error('Franqueada não encontrada:', error);
        router.push('/franqueado/login');
        return;
      }

      if (franqueada.status !== 'aprovada') {
        alert('Sua franqueada ainda não foi aprovada');
        await supabase.auth.signOut();
        router.push('/franqueado/login');
        return;
      }

      setFranqueadaNome(franqueada.nome);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      router.push('/franqueado/login');
    }
  }, [router, supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/franqueado/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarFranqueado onLogout={handleLogout} franqueadaNome={franqueadaNome} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
