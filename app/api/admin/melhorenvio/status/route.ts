import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se existe token no banco
    const { data, error } = await supabase
      .from('config_melhorenvio')
      .select('access_token, expires_at')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return NextResponse.json({ authorized: false });
    }

    // Verificar se o token existe e não expirou
    const hasToken = data.access_token && data.access_token !== '';
    const isExpired = data.expires_at ? new Date(data.expires_at) < new Date() : true;

    return NextResponse.json({
      authorized: hasToken && !isExpired,
      expires_at: data.expires_at,
    });

  } catch (error) {
    console.error('[MelhorEnvio Status] Erro:', error);
    return NextResponse.json({ authorized: false }, { status: 500 });
  }
}
