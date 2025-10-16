import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pedido_id, codigo_barras, etiqueta, usuario } = body;

    if (!action || !pedido_id) return NextResponse.json({ error: 'missing' }, { status: 400 });

    if (action === 'start') {
      // set pedido status to em_separacao if not already
      await supabase.from('pedidos').update({ status: 'em_separacao' }).eq('id', pedido_id);
      await supabase.from('logs_pedidos').insert([{ pedido_id, acao: 'Iniciou separação', usuario: usuario ?? 'admin', data: new Date().toISOString() }]);
      return NextResponse.json({ ok: true });
    }

    if (action === 'bip') {
      if (!codigo_barras) return NextResponse.json({ error: 'missing barcode' }, { status: 400 });

      // find item by pedido_id + codigo_barras
      const { data: items } = await supabase.from('itens_pedido').select('*').eq('pedido_id', pedido_id).eq('codigo_barra', codigo_barras);
      if (!items || items.length === 0) return NextResponse.json({ error: 'item not found' }, { status: 404 });
      const item = items[0];

      // mark item as separado
      await supabase.from('itens_pedido').update({ status: 'separado' }).eq('id', item.id);

      // decrement stock in produtos table (assumes produtos table with id and estoque)
      try {
        const { data: prodRows } = await supabase.from('produtos').select('id,estoque').eq('id', item.produto_id).limit(1).maybeSingle();
        const current = (prodRows as any)?.estoque ?? null;
        if (current !== null) {
          const newStock = Number(current) - Number(item.quantidade || 1);
          await supabase.from('produtos').update({ estoque: newStock }).eq('id', item.produto_id);
        }
      } catch (e) {
        // best-effort; product stock update may be implemented later
      }

      await supabase.from('logs_pedidos').insert([{ pedido_id, acao: `Bipagem concluída: ${codigo_barras}`, usuario: usuario ?? 'admin', data: new Date().toISOString() }]);

      // if all items separated, update pedido status to separado
      const { data: remaining } = await supabase.from('itens_pedido').select('*').eq('pedido_id', pedido_id).neq('status', 'separado');
      if (!remaining || remaining.length === 0) {
        await supabase.from('pedidos').update({ status: 'separado' }).eq('id', pedido_id);
        await supabase.from('logs_pedidos').insert([{ pedido_id, acao: 'Pedido separado', usuario: usuario ?? 'admin', data: new Date().toISOString() }]);
      }

      return NextResponse.json({ ok: true });
    }

    if (action === 'label') {
      if (!etiqueta) return NextResponse.json({ error: 'missing etiqueta' }, { status: 400 });
      await supabase.from('pedidos').update({ etiqueta, status: 'enviado' }).eq('id', pedido_id);
      await supabase.from('logs_pedidos').insert([{ pedido_id, acao: `Etiqueta gerada: ${etiqueta}`, usuario: usuario ?? 'admin', data: new Date().toISOString() }]);
      return NextResponse.json({ ok: true });
    }

    if (action === 'complete') {
      await supabase.from('pedidos').update({ status: 'entregue', entregue_em: new Date().toISOString() }).eq('id', pedido_id);
      await supabase.from('logs_pedidos').insert([{ pedido_id, acao: 'Pedido entregue', usuario: usuario ?? 'admin', data: new Date().toISOString() }]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
