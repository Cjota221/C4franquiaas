import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { fetchAllProdutosFacilZap, ProdutoDB } from '@/lib/facilzapClient';

export async function POST() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { produtos, pages } = await fetchAllProdutosFacilZap();

    if (!produtos || produtos.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto encontrado para sincronizar.', processed: 0, pages }, { status: 200 });
    }

    const payload = produtos.map((p: ProdutoDB) => ({
      id_externo: p.id_externo,
      nome: p.nome,
      preco_base: p.preco_base,
      estoque: p.estoque,
      imagem: p.imagem,
      imagens: p.imagens,
      ativo: p.ativo,
    }));

    const { error } = await supabase.from('produtos').upsert(payload, { onConflict: 'id_externo' });
    if (error) {
      console.error('[sync-produtos] upsert error', error);
      return NextResponse.json({ error: error.message || 'Erro ao salvar produtos.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Sincronização concluída.', processed: payload.length, pages }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[sync-produtos] catch', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
