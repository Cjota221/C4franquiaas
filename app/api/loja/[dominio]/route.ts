import { NextResponse, NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dominio: string }> }
) {
  const { dominio } = await params;

  try {
    // Redireciona para o endpoint /info existente. Isso evita 404 para chamadas que
    // buscam apenas /api/loja/:dominio (compatibilidade retroativa).
    const target = new URL(`/api/loja/${dominio}/info`, req.url);
    return NextResponse.redirect(target, 307);
  } catch (err) {
    console.error('[API loja root] Erro ao redirecionar:', err);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
