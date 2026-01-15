import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGrade() {
  console.log('Verificando grade com slug: cjotarasteirinhas');
  
  const { data: config, error: configError } = await supabase
    .from('grade_configs')
    .select('*')
    .eq('slug', 'cjotarasteirinhas')
    .single();
  
  console.log('Config:', config);
  console.log('Error:', configError);
  
  if (!configError && config) {
    console.log('Grade encontrada, verificando produtos...');
    
    const { data: produtos, error: produtosError } = await supabase
      .from('grade_produtos')
      .select('produtos!inner(id, nome, preco_base, tem_estoque, descricao, categorias(nome), imagens(url))')
      .eq('grade_config_id', config.id);
    
    console.log('Produtos:', produtos);
    console.log('Produtos Error:', produtosError);
  }
}

checkGrade().catch(console.error);