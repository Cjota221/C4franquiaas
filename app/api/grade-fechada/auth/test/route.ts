import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar usuário
    const { data: usuario, error } = await supabase
      .from('grade_fechada_usuarios')
      .select('*')
      .eq('email', 'admin@gradefechada.com')
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    if (!usuario) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    // Testar senhas
    const senhas = ['Admin@123', 'password', 'admin@123'];
    const resultados = [];

    for (const senha of senhas) {
      const valida = await bcrypt.compare(senha, usuario.senha_hash);
      resultados.push({
        senha,
        valida,
        hashInicio: usuario.senha_hash.substring(0, 30),
      });
    }

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        ativo: usuario.ativo,
        hashInicio: usuario.senha_hash.substring(0, 30),
        hashCompleto: usuario.senha_hash,
      },
      testeSenhas: resultados,
      env: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
        urlStart: supabaseUrl?.substring(0, 30),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
