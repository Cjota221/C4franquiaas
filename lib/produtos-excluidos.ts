import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Verifica se um produto específico foi excluído pelo admin
 * @param supabase Cliente Supabase
 * @param id_externo ID externo do produto (FácilZap ID)
 * @returns true se produto foi excluído, false caso contrário
 */
export async function isProdutoExcluido(
  supabase: SupabaseClient,
  id_externo: string
): Promise<boolean> {
  if (!id_externo) return false;
  
  const { data, error } = await supabase
    .from('produtos_excluidos')
    .select('id_externo')
    .eq('id_externo', id_externo)
    .maybeSingle();
  
  if (error) {
    console.error('[Produtos Excluídos] Erro ao verificar:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Filtra lista de produtos removendo os que foram excluídos pelo admin
 * @param supabase Cliente Supabase
 * @param produtos Array de produtos com campo id_externo
 * @returns Array filtrado sem produtos excluídos
 */
export async function filtrarProdutosExcluidos<T extends { id_externo?: string | null }>(
  supabase: SupabaseClient,
  produtos: T[]
): Promise<T[]> {
  if (!produtos || produtos.length === 0) return produtos;
  
  // Extrair IDs externos válidos
  const idsExternos = produtos
    .map(p => p.id_externo)
    .filter((id): id is string => !!id && id.trim() !== '');
  
  if (idsExternos.length === 0) {
    console.log('[Produtos Excluídos] Nenhum id_externo válido para verificar');
    return produtos;
  }
  
  // Buscar produtos excluídos
  const { data: excluidos, error } = await supabase
    .from('produtos_excluidos')
    .select('id_externo')
    .in('id_externo', idsExternos);
  
  if (error) {
    console.error('[Produtos Excluídos] Erro ao buscar excluídos:', error);
    return produtos; // Em caso de erro, não filtrar (fail-safe)
  }
  
  // Criar Set para lookup rápido
  const idsExcluidos = new Set(
    (excluidos || []).map((e: { id_externo: string }) => e.id_externo)
  );
  
  // Filtrar produtos
  const filtrados = produtos.filter(
    p => !p.id_externo || !idsExcluidos.has(p.id_externo)
  );
  
  const totalIgnorados = produtos.length - filtrados.length;
  
  if (totalIgnorados > 0) {
    console.log(`🚫 [Produtos Excluídos] Ignorando ${totalIgnorados} produto(s) excluído(s) pelo admin`);
    if (process.env.DEBUG_SYNC === 'true') {
      console.log('   IDs ignorados:', Array.from(idsExcluidos));
    }
  }
  
  return filtrados;
}

/**
 * Marcar produto como excluído (usado pela função de exclusão)
 * @param supabase Cliente Supabase (deve ter permissões de service_role)
 * @param id_externo ID externo do produto
 * @param excluido_por Identificador de quem excluiu (ex: 'admin', 'sistema')
 */
export async function marcarProdutoExcluido(
  supabase: SupabaseClient,
  id_externo: string,
  excluido_por: string = 'admin'
): Promise<{ success: boolean; error?: string }> {
  if (!id_externo) {
    return { success: false, error: 'id_externo é obrigatório' };
  }
  
  const { error } = await supabase
    .from('produtos_excluidos')
    .upsert({
      id_externo,
      excluido_por,
      excluido_em: new Date().toISOString()
    }, { 
      onConflict: 'id_externo' 
    });
  
  if (error) {
    console.error('[Produtos Excluídos] Erro ao marcar como excluído:', error);
    return { success: false, error: error.message };
  }
  
  console.log(`✅ [Produtos Excluídos] Produto ${id_externo} marcado como excluído por ${excluido_por}`);
  return { success: true };
}

/**
 * Buscar todos os IDs externos de produtos excluídos
 * Útil para fazer verificações em batch
 */
export async function buscarTodosExcluidos(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('produtos_excluidos')
    .select('id_externo');
  
  if (error) {
    console.error('[Produtos Excluídos] Erro ao buscar todos excluídos:', error);
    return new Set();
  }
  
  return new Set((data || []).map((e: { id_externo: string }) => e.id_externo));
}

/**
 * Helper para criar cliente Supabase service_role
 * Usado internamente quando precisar de permissões elevadas
 */
export function createServiceClient(): SupabaseClient | null {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[Produtos Excluídos] Credenciais Supabase ausentes');
    return null;
  }
  
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

