/**
 * Script para aplicar a migração 006 - produto_categorias
 * Cria tabela de junção entre produtos e categorias
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migração 006_add_produto_categorias.sql...\n');

    const migrationPath = join(process.cwd(), 'migrations', '006_add_produto_categorias.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Conteúdo da migração:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('');

    // Executar cada statement separadamente
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n📌 Executando statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 60)}${statement.length > 60 ? '...' : ''}`);

      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

      if (error) {
        // Se o erro for "function exec_sql does not exist", usar approach alternativo
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('⚠️  Função exec_sql não disponível, aplicando via cliente...');
          
          // Para create table, usar from diretamente não funciona
          // Vamos apenas logar o SQL para execução manual
          console.log('\n⚠️  Por favor, execute o seguinte SQL manualmente no Supabase Dashboard:');
          console.log('─'.repeat(60));
          console.log(sql);
          console.log('─'.repeat(60));
          console.log('\n🔗 Dashboard: https://supabase.com/dashboard/project/_/editor');
          return;
        }
        
        throw error;
      }

      console.log('   ✅ Statement executado com sucesso');
    }

    console.log('\n✅ Migração aplicada com sucesso!\n');
    console.log('📋 Resumo:');
    console.log('   ✓ Tabela produto_categorias criada');
    console.log('   ✓ Foreign keys configuradas');
    console.log('   ✓ Índices criados');
    console.log('   ✓ RLS habilitado');
    console.log('');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migração:', error);
    console.error('\n💡 Soluções:');
    console.error('   1. Verifique se as variáveis de ambiente estão corretas');
    console.error('   2. Execute o SQL manualmente no Supabase Dashboard');
    console.error('   3. Verifique se a tabela já existe');
    process.exit(1);
  }
}

applyMigration();
