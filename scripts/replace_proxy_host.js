#!/usr/bin/env node
/**
 * scripts/replace_proxy_host.js
 *
 * Replace occurrences of the old proxy host in produtos.imagem and produtos.imagens
 * with the new Netlify host. Safe to run with --dry-run first.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/replace_proxy_host.js --dry-run
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/replace_proxy_host.js
 */

const { createClient } = require('@supabase/supabase-js');

const OLD_HOST = 'https://cjotarasteirinhas.com.br';
const NEW_HOST = 'https://c4franquiaas.netlify.app';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  console.log('Fetching produtos (this may take a while if you have many rows)...');
  const { data: produtos, error } = await supabase.from('produtos').select('id,imagem,imagens');
  if (error) {
    console.error('Failed to fetch produtos', error);
    process.exit(1);
  }

  let updated = 0;
  for (const p of produtos) {
    let changed = false;
    let newImagem = p.imagem;
    let newImagens = p.imagens;

    if (typeof p.imagem === 'string' && p.imagem.includes(OLD_HOST)) {
      newImagem = p.imagem.replace(OLD_HOST, NEW_HOST);
      changed = true;
    }

    if (Array.isArray(p.imagens)) {
      const mapped = p.imagens.map((it) => (typeof it === 'string' ? it.replace(OLD_HOST, NEW_HOST) : it));
      // simple compare
      if (JSON.stringify(mapped) !== JSON.stringify(p.imagens)) {
        newImagens = mapped;
        changed = true;
      }
    }

    if (changed) {
      updated++;
      console.log(`Will update product id=${p.id}`);
      if (dryRun) continue;
      const { error: upErr } = await supabase
        .from('produtos')
        .update({ imagem: newImagem, imagens: newImagens })
        .eq('id', p.id);
      if (upErr) {
        console.error('Update failed for id', p.id, upErr);
      }
    }
  }

  console.log(`Done. Rows that needed update: ${updated}` + (dryRun ? ' (dry-run, no changes made)' : ''));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
