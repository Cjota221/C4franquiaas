import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in environment (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
    return { ok: res.ok, status: res.status, statusText: res.statusText, contentType: ct, length: text.length, bodySnippet: text.slice(0, 500) };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

(async () => {
  console.log('Fetching sample produtos...');
  const { data, error } = await supabase.from('produtos').select('id,nome,imagem,imagens').limit(20);
  if (error) {
    console.error('Supabase error', error);
    process.exit(1);
  }

  for (const p of data ?? []) {
    console.log('\n==== Produto id=' + p.id + ' nome=' + (p.nome || '') + ' ====');
    const imgs = [];
    if (p.imagem) imgs.push(p.imagem);
    if (Array.isArray(p.imagens)) imgs.push(...p.imagens.slice(0, 3));
    if (imgs.length === 0) console.log('  (sem imagens)');

    for (const img of imgs) {
      console.log('  Testing image URL:', img);
      // If looks like a proxy URL without proper encoding, try both raw and encoded forms
      try {
        const result = await checkUrl(img);
        console.log('    ->', result);
      } catch (err) {
        console.log('    -> fetch error', String(err));
      }
    }
  }
  process.exit(0);
})();
