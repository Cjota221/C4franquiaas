import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variaveis nao configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\nVerificando Franqueadas\n');

async function verificar() {
  const { data: todas, error } = await supabase
    .from('franqueadas')
    .select('id, nome, email, ativo');

  if (error) {
    console.error('Erro:', error.message);
    return;
  }

  console.log(`Total: ${todas?.length || 0} franqueadas\n`);
  
  if (todas) {
    todas.forEach((f, i) => {
      console.log(`${i + 1}. ${f.nome}`);
      console.log(`   Email: ${f.email}`);
      console.log(`   Ativo: ${f.ativo} (tipo: ${typeof f.ativo})`);
      console.log('');
    });
  }

  const { data: ativas } = await supabase
    .from('franqueadas')
    .select('id, nome')
    .eq('ativo', true);

  console.log(`Franqueadas com ativo=true: ${ativas?.length || 0}`);
}

verificar();