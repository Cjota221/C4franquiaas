import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy local para imagens do Facilzap em desenvolvimento
 * Resolve problema de CORS/403 do Facilzap
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      console.error('[Proxy Image] URL não fornecida');
      return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 });
    }

    console.log(`[Proxy Image] Buscando imagem: ${imageUrl}`);

    // Buscar a imagem do Facilzap
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://facilzap.app.br/',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Imagem não encontrada', status: response.status },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/webp';

    // Retornar a imagem com headers apropriados
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Proxy Image] Erro ao carregar imagem:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar imagem', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
