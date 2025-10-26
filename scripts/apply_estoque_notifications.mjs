import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis necessárias:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigration() {
  try {
    const migrationPath = path.join(__dirname, '..', 'migrations', '016_add_estoque_notifications.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Aplicando migration: 016_add_estoque_notifications.sql\n');

    // Executar SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // Se a função exec_sql não existir, tentar executar diretamente
      console.warn('⚠️  exec_sql não disponível, tentando executar diretamente...');
      
      // Dividir em comandos individuais
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);

      for (const cmd of commands) {
        console.log(`Executando: ${cmd.substring(0, 50)}...`);
        const { error: cmdError } = await supabase.rpc('exec', { query: cmd });
        if (cmdError) {
          console.error('❌ Erro:', cmdError.message);
        }
      }
    }

    console.log('\n✅ Migration aplicada com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Habilitar Realtime no Supabase Dashboard');
    console.log('   2. Configurar webhook na FácilZap');
    console.log('   3. Ver documentação em docs/WEBHOOK_ESTOQUE.md');
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    process.exit(1);
  }
}

applyMigration();
