import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente administrativo (ignora RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Pega o usuário autenticado a partir do header Authorization
 * A requisição do frontend deve incluir: Authorization: Bearer <token>
 */
export async function getAuthUser(authHeader?: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Token não fornecido' };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, error: 'Token inválido' };
    }

    return { user, error: null };
  } catch {
    return { user: null, error: 'Erro ao verificar autenticação' };
  }
}

/**
 * Pega a franqueada logada
 */
export async function getAuthFranqueada(authHeader?: string | null) {
  const { user, error } = await getAuthUser(authHeader);
  
  if (error || !user) {
    return { franqueada: null, error: error || 'Não autenticado' };
  }

  // Buscar franqueada pelo user_id
  const { data: franqueada, error: dbError } = await supabaseAdmin
    .from('franqueadas')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (dbError || !franqueada) {
    return { franqueada: null, error: 'Franqueada não encontrada' };
  }

  return { franqueada, error: null };
}
