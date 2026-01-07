// Script para corrigir promoções com problemas
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente
const envPath = join(process.cwd(), '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function corrigirPromocoes() {
  console.log('🔧 Iniciando correções...\n');
  
  // CORREÇÃO 1: Desativar cupom expirado
  console.log('📝 1. Desativando cupom "primeira compra" (expirado)...');
  const { error: erro1 } = await supabase
    .from('promotions')
    .update({ is_active: false })
    .eq('id', '973ccae2-8862-4fc4-b7ba-423df338d71c');
  
  if (erro1) {
    console.error('❌ Erro:', erro1);
  } else {
    console.log('✅ Cupom expirado desativado com sucesso!\n');
  }
  
  // CORREÇÃO 2: Configurar "Promo de Janeiro" com desconto progressivo
  console.log('📝 2. Configurando desconto progressivo na "Promo de Janeiro"...');
  
  const descontosProgressivos = [
    { min_items: 2, discount_percent: 10 },
    { min_items: 3, discount_percent: 15 },
    { min_items: 5, discount_percent: 20 }
  ];
  
  const { error: erro2 } = await supabase
    .from('promotions')
    .update({ 
      progressive_discounts: descontosProgressivos
    })
    .eq('id', '267469ce-44da-4d14-8bc8-0dc9e0b56304');
  
  if (erro2) {
    console.error('❌ Erro:', erro2);
  } else {
    console.log('✅ Desconto progressivo configurado:');
    console.log('   - 2+ peças = 10% OFF');
    console.log('   - 3+ peças = 15% OFF');
    console.log('   - 5+ peças = 20% OFF\n');
  }
  
  // Verificar resultados
  console.log('🔍 Verificando correções...\n');
  
  const { data: promoCorrigida1 } = await supabase
    .from('promotions')
    .select('name, is_active')
    .eq('id', '973ccae2-8862-4fc4-b7ba-423df338d71c')
    .single();
  
  const { data: promoCorrigida2 } = await supabase
    .from('promotions')
    .select('name, progressive_discounts')
    .eq('id', '267469ce-44da-4d14-8bc8-0dc9e0b56304')
    .single();
  
  console.log('📊 RESULTADOS:\n');
  
  if (promoCorrigida1) {
    console.log(`✅ "${promoCorrigida1.name}"`);
    console.log(`   Status: ${promoCorrigida1.is_active ? 'ATIVA' : 'INATIVA'} ← ${!promoCorrigida1.is_active ? '✓ Desativada!' : '✗ Ainda ativa'}\n`);
  }
  
  if (promoCorrigida2) {
    console.log(`✅ "${promoCorrigida2.name}"`);
    if (promoCorrigida2.progressive_discounts) {
      console.log('   Desconto progressivo: ✓ CONFIGURADO');
      const pd = typeof promoCorrigida2.progressive_discounts === 'string' 
        ? JSON.parse(promoCorrigida2.progressive_discounts)
        : promoCorrigida2.progressive_discounts;
      
      if (Array.isArray(pd)) {
        pd.forEach((tier: { min_items: number; discount_percent: number }) => {
          console.log(`     ${tier.min_items}+ peças = ${tier.discount_percent}% OFF`);
        });
      }
    } else {
      console.log('   Desconto progressivo: ✗ NÃO CONFIGURADO');
    }
  }
  
  console.log('\n🎉 Correções concluídas com sucesso!');
  console.log('\n📱 Próximo passo: Testar no catálogo das revendedoras');
}

corrigirPromocoes().catch(console.error);
