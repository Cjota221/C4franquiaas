import { createClient } from '@supabase/supabase-js';

// Pega a URL e a Chave do Supabase das variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cria e exporta o cliente Supabase para ser usado em todo o projeto
export const supabase = createClient(supabaseUrl, supabaseKey);
