// Script para verificar promoções no banco
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente do .env.local
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

async function verificarPromocoes() {
  console.log('🔍 Verificando promoções no banco de dados...\n');
  
  // Buscar todas as promoções
  const { data: promocoes, error } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Erro ao buscar promoções:', error);
    return;
  }
  
  if (!promocoes || promocoes.length === 0) {
    console.log('📭 Nenhuma promoção encontrada no banco.');
    return;
  }
  
  console.log(`📊 Total de promoções: ${promocoes.length}\n`);
  
  // Agrupar por tipo
  const porTipo = promocoes.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📈 Promoções por tipo:');
  Object.entries(porTipo).forEach(([tipo, count]) => {
    console.log(`  - ${tipo}: ${count}`);
  });
  
  // Ativas vs Inativas
  const ativas = promocoes.filter(p => p.is_active);
  const inativas = promocoes.filter(p => !p.is_active);
  
  console.log(`\n✅ Ativas: ${ativas.length}`);
  console.log(`❌ Inativas: ${inativas.length}`);
  
  // Expiradas
  const agora = new Date();
  const expiradas = promocoes.filter(p => p.ends_at && new Date(p.ends_at) < agora);
  
  if (expiradas.length > 0) {
    console.log(`\n⏰ Expiradas: ${expiradas.length}`);
  }
  
  // Detalhes das promoções ativas
  if (ativas.length > 0) {
    console.log('\n\n📋 PROMOÇÕES ATIVAS:\n');
    
    ativas.forEach((promo, index) => {
      console.log(`${index + 1}. ${promo.name}`);
      console.log(`   Tipo: ${promo.type}`);
      console.log(`   ID: ${promo.id}`);
      console.log(`   Revendedora: ${promo.reseller_id}`);
      
      if (promo.type === 'cupom_desconto' && promo.coupon_code) {
        console.log(`   📜 Cupom: ${promo.coupon_code}`);
      }
      
      if (promo.discount_value) {
        const simbolo = promo.discount_type === 'percentage' ? '%' : 'R$';
        console.log(`   💰 Desconto: ${promo.discount_value}${simbolo}`);
      }
      
      if (promo.type === 'leve_pague') {
        if (promo.progressive_discounts) {
          console.log(`   🎁 Desconto Progressivo:`);
          let pd = promo.progressive_discounts;
          if (typeof pd === 'string') {
            try { pd = JSON.parse(pd); } catch {}
          }
          if (Array.isArray(pd)) {
            pd.forEach((tier: { min_items?: number; discount_percent?: number }) => {
              console.log(`      ${tier.min_items}+ peças = ${tier.discount_percent}% OFF`);
            });
          }
        } else if (promo.buy_quantity && promo.pay_quantity) {
          console.log(`   🎁 Leve ${promo.buy_quantity} Pague ${promo.pay_quantity}`);
        }
      }
      
      if (promo.applies_to === 'products' && promo.product_ids) {
        const ids = Array.isArray(promo.product_ids) ? promo.product_ids : [];
        console.log(`   🎯 Produtos específicos: ${ids.length} produto(s)`);
      } else {
        console.log(`   🎯 Aplicar: Todos os produtos`);
      }
      
      if (promo.free_shipping) {
        if (promo.min_value_free_shipping) {
          console.log(`   🚚 Frete grátis acima de R$ ${promo.min_value_free_shipping}`);
        } else {
          console.log(`   🚚 Frete grátis sempre`);
        }
      }
      
      if (promo.ends_at) {
        const dataFim = new Date(promo.ends_at);
        const expired = dataFim < agora;
        console.log(`   ⏰ Expira: ${dataFim.toLocaleDateString('pt-BR')} ${expired ? '(EXPIRADA!)' : ''}`);
      }
      
      if (promo.uses_count > 0) {
        console.log(`   📊 Usos: ${promo.uses_count}x`);
      }
      
      console.log('');
    });
  }
  
  // Alertas
  console.log('\n⚠️  ALERTAS:\n');
  
  if (expiradas.length > 0) {
    console.log(`❗ ${expiradas.length} promoção(ões) expirada(s) ainda ativa(s)`);
    expiradas.forEach(p => {
      if (p.is_active) {
        console.log(`   - "${p.name}" (${p.id})`);
      }
    });
  }
  
  // Promoções sem configuração completa
  const incompletas = promocoes.filter(p => {
    if (p.type === 'cupom_desconto' && !p.coupon_code) return true;
    if ((p.type === 'desconto_percentual' || p.type === 'desconto_valor') && !p.discount_value) return true;
    if (p.type === 'leve_pague' && !p.progressive_discounts && !p.buy_quantity) return true;
    return false;
  });
  
  if (incompletas.length > 0) {
    console.log(`\n❗ ${incompletas.length} promoção(ões) com configuração incompleta:`);
    incompletas.forEach(p => {
      console.log(`   - "${p.name}" (${p.type})`);
    });
  }
  
  console.log('\n✅ Verificação concluída!');
}

verificarPromocoes().catch(console.error);
