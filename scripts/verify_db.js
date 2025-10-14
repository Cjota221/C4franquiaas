const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function readEnvLocal() {
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return {};
  const txt = fs.readFileSync(p, 'utf8');
  const lines = txt.split(/\r?\n/);
  const env = {};
  for (const l of lines) {
    const s = l.trim();
    if (!s || s.startsWith('#')) continue;
    const idx = s.indexOf('=');
    if (idx === -1) continue;
    const k = s.slice(0, idx).trim();
    let v = s.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[k] = v;
  }
  return env;
}

async function run() {
  const env = readEnvLocal();
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('Querying Supabase... this will not print keys');

  // Get total count (head:true returns count)
  const headRes = await supabase.from('produtos').select('id_externo', { head: true, count: 'exact' });
  const total = headRes.count ?? null;

  // Fetch all (small dataset) to compute imagens counts and examples
  const { data, error } = await supabase.from('produtos').select('id_externo, nome, imagens').limit(10000);
  if (error) {
    console.error('Error fetching produtos:', error.message || error);
    process.exit(1);
  }

  const rows = data || [];
  const withImages = rows.filter(r => Array.isArray(r.imagens) && r.imagens.length > 0);

  console.log(`total_products (server count): ${total}`);
  console.log(`fetched_rows: ${rows.length}`);
  console.log(`products_with_images: ${withImages.length}`);

  console.log('Sample products with images (up to 10):');
  console.log(withImages.slice(0, 10).map(r => ({ id_externo: r.id_externo, nome: r.nome, imagens_count: Array.isArray(r.imagens) ? r.imagens.length : 0 })));
}

run().catch(err => { console.error('Fatal', err); process.exit(1); });
