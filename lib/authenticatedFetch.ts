import { supabase } from './supabaseClient';

/**
 * Faz uma requisição autenticada para a API
 * Inclui automaticamente o token de autenticação no header
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  // Pegar o token da sessão atual
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Não autenticado');
  }

  // Adicionar o token no header Authorization
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${session.access_token}`);

  // Fazer a requisição
  return fetch(url, {
    ...options,
    headers
  });
}
