/**
 * Salvar token do Melhor Envio direto no Supabase
 */

import { createClient } from '@supabase/supabase-js';

// COLE AS SUAS CREDENCIAIS AQUI (temporário)
const SUPABASE_URL = 'https://ylmmxsdxmovlkpfqamvh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsbW14c2R4bW92bGtwZnFhbXZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzkyMDEwMSwiZXhwIjoyMDM5NDk2MTAxfQ.RM7IPQE-PgXW6xAZugFqJU1bCpcUb7xrOvPXOApOXuQ'; // Service role key

// TOKEN DO MELHOR ENVIO
const MELHOR_ENVIO_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiMjUwYmJmN2Q5NGJiOTJmYzYyZWM3NGJhMjIyYWQ4NTQxZmJhYmRhZDI1OTIzZThkY2U4ZWFjNWMzOWVlMzRhZjVhMjMzZDMzOWFiOWY2MjgiLCJpYXQiOjE3NjIwOTMzMTEuOTQwNDY0LCJuYmYiOjE3NjIwOTMzMTEuOTQwNDY2LCJleHAiOjE3OTM2MjkzMTEuOTI2MDUxLCJzdWIiOiIzNjBiM2Y1OC01NjQ2LTRiNzYtYjIwNi0zZDllNzE3YjcwOWYiLCJzY29wZXMiOlsiY2FydC1yZWFkIiwiY2FydC13cml0ZSIsImNvbXBhbmllcy1yZWFkIiwiY29tcGFuaWVzLXdyaXRlIiwiY291cG9ucy1yZWFkIiwiY291cG9ucy13cml0ZSIsIm5vdGlmaWNhdGlvbnMtcmVhZCIsIm9yZGVycy1yZWFkIiwicHJvZHVjdHMtcmVhZCIsInByb2R1Y3RzLWRlc3Ryb3kiLCJwcm9kdWN0cy13cml0ZSIsInB1cmNoYXNlcy1yZWFkIiwic2hpcHBpbmctY2FsY3VsYXRlIiwic2hpcHBpbmctY2FuY2VsIiwic2hpcHBpbmctY2hlY2tvdXQiLCJzaGlwcGluZy1jb21wYW5pZXMiLCJzaGlwcGluZy1nZW5lcmF0ZSIsInNoaXBwaW5nLXByZXZpZXciLCJzaGlwcGluZy1wcmludCIsInNoaXBwaW5nLXNoYXJlIiwic2hpcHBpbmctdHJhY2tpbmciLCJlY29tbWVyY2Utc2hpcHBpbmciLCJ0cmFuc2FjdGlvbnMtcmVhZCIsInVzZXJzLXJlYWQiLCJ1c2Vycy13cml0ZSIsIndlYmhvb2tzLXJlYWQiLCJ3ZWJob29rcy13cml0ZSIsIndlYmhvb2tzLWRlbGV0ZSIsInRkZWFsZXItd2ViaG9vayJdfQ.BzqAhv3Qq5XULUxV6sM0Iv8cabGI_s0XbNAypHekXnR1qQLxeEMHBA1vJLAbtwyzFxVk-zE0F4cBgYxMWhkOV8r0FihfIh1CTh42lhnUi1tQWLQrR3eo2IJ1TF6JdyKW41uNvj1uHrRFK_WYMKF6a7K3f1tWSpUYI8joD_MxQBda_VwcNjn6ZafebYx7Y_6w1CRHyUPtkRtzPDd6Nsc_NXx0aZbroJnY4jvrPKDAM9aty7X6sJQtSze5iaTJTrvYLjIj0DBHQ4aEG6ldF4yCTEIjCQosANFhJn48rIdgMytj00_ZRayVPx9y1tsxIHtbOtJbwiYqH2NlHjswFQGD_ATbrIqVhL7yM114-h0UIoyEwX9J6jmCsM8Ulz8MalMLeszsImTraC1QLQIgAFSRBvVeHoM-wJVx-semWb-AZ-L4A9jQq7ttkAYmi1NJVjk7ES2wkHVPjyyL-NDxJZx5gofhYqFDG7lqSfxdhJnwAI6vGbRbjssMVh6rL4Awjw38ax0dyn9KT7dLQYKM-w_-vowIwZco_Fo_LPecbVDyAPwaiMLseB6Rmmy9CvnVn3PJ519VXq4A63XBLwDG2_vUGZ5MPi6ZOMPSpLTViFxZ67Onwz25j3FVN5aaXiYyhlnaPzHnIM2gCYp4sOo6BtaInALIJig9_Aurkq5OOLEaCB0';

async function salvarToken() {
  console.log('🔄 Salvando token do Melhor Envio...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('config_melhorenvio')
      .select('*')
      .eq('id', 1)
      .single();

    let result;

    if (existing) {
      console.log('📝 Atualizando token existente...');
      result = await supabase
        .from('config_melhorenvio')
        .update({
          access_token: MELHOR_ENVIO_TOKEN,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
    } else {
      console.log('📝 Inserindo novo token...');
      result = await supabase
        .from('config_melhorenvio')
        .insert({
          id: 1,
          access_token: MELHOR_ENVIO_TOKEN,
        });
    }

    if (result.error) {
      console.error('❌ Erro:', result.error.message);
      process.exit(1);
    }

    console.log('✅ Token salvo com sucesso!');
    console.log('\n📅 Token expira em: 02/11/2026');
    console.log('\n📋 Próximos passos:');
    console.log('1. Acesse: https://c4franquiaas.netlify.app/admin/configuracoes/melhorenvio/testes');
    console.log('2. Clique em "Calcular Frete"');
    console.log('3. Agora deve funcionar! 🎉');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

salvarToken();
