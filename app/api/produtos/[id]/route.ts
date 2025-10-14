import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const expected = process.env.SYNC_PRODUCTS_TOKEN;
    const provided = request.headers.get('x-admin-token') ?? '';
    if (expected && provided !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body.ativo !== 'boolean') {
      return NextResponse.json({ error: 'Payload inválido. Esperado { ativo: boolean }' }, { status: 400 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const resolvedParams = (params instanceof Promise ? await params : params) as { id: string };
  const id = resolvedParams.id;
    // Attempt update by numeric id or id_externo match
    const { data, error } = await supabase
      .from('produtos')
      .update({ ativo: body.ativo })
      .or(`id.eq.${id},id_externo.eq.${id}`);

    if (error) {
      console.error('[api/produtos/:id] update error', error);
      return NextResponse.json({ error: error.message || 'Erro ao atualizar produto.' }, { status: 500 });
    }

  const dataAny = data as unknown;
  const updatedCount = Array.isArray(dataAny) ? (dataAny as unknown[]).length : 0;
  return NextResponse.json({ message: 'Produto atualizado.', updated: updatedCount }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado.';
    console.error('[api/produtos/:id] catch', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
