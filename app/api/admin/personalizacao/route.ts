// ============================================================================
// API ENDPOINT: Análise de Personalização das Revendedoras
// ============================================================================
// GET /api/admin/personalizacao
// GET /api/admin/personalizacao?reseller_id=xxx
// GET /api/admin/personalizacao?resumo=true

import { NextRequest, NextResponse } from 'next/server';
import {
  calcularPersonalizacaoLoja,
  analisarTodasRevendedoras,
  gerarResumoPersonalizacao,
} from '@/lib/services/personalizacao';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const resellerId = searchParams.get('reseller_id');
    const resumo = searchParams.get('resumo') === 'true';

    // ========================================================================
    // OPÇÃO 1: Resumo agregado
    // ========================================================================
    if (resumo) {
      const resumoData = await gerarResumoPersonalizacao();
      
      return NextResponse.json({
        success: true,
        data: resumoData,
      });
    }

    // ========================================================================
    // OPÇÃO 2: Análise de uma revendedora específica
    // ========================================================================
    if (resellerId) {
      const analise = await calcularPersonalizacaoLoja(resellerId);
      
      if (!analise) {
        return NextResponse.json(
          {
            success: false,
            error: 'Revendedora não encontrada',
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: analise,
      });
    }

    // ========================================================================
    // OPÇÃO 3: Análise de TODAS as revendedoras
    // ========================================================================
    const analises = await analisarTodasRevendedoras();
    
    return NextResponse.json({
      success: true,
      count: analises.length,
      data: analises,
    });
    
  } catch (error) {
    console.error('Erro na API de personalização:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar análise de personalização',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
