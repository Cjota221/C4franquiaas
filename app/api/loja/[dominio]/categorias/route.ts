import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar categorias ativas
    const { data: categorias, error } = await supabase
      .from('categorias')
      .select('id, nome, slug, descricao, imagem')  // ✅ ADICIONA 'imagem'
      .order('nome', { ascending: true});

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar categorias' },
        { status: 500 }
      );
    }

    // Mapear categorias com imagem real ou placeholder
    const categoriasComImagem = categorias?.map((cat) => {
      // Se já tem imagem real (do upload), usar ela
      if (cat.imagem && cat.imagem.trim().length > 0) {
        return {
          ...cat,
          imagem: cat.imagem
        };
      }
      
      // Se não tem imagem, usar placeholder colorido
      const cores: { [key: string]: string } = {
        'rasteirinhas': 'ec4899',
        'rasteirinha': 'ec4899',
        'salto': '8b5cf6',
        'salto-flat': '8b5cf6',
        'papete': '06b6d4',
        'flat': '06b6d4',
        'bolsa': 'f59e0b',
      };

      const cor = cores[cat.slug] || '6366f1';
      
      return {
        ...cat,
        imagem: `https://placehold.co/120x120/${cor}/ffffff?text=${encodeURIComponent(cat.nome)}`
      };
    }) || [];

    return NextResponse.json(categoriasComImagem);

  } catch (error) {
    console.error('Erro ao processar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao processar categorias' },
      { status: 500 }
    );
  }
}
