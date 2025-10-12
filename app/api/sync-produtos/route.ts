import { NextResponse } from 'next/server';
// Usamos o atalho @/ que aponta para a raiz do projeto, é mais seguro
import { syncProdutos } from '../../../lib/syncProdutos';

export async function POST() {
    try {
      const resultado = await syncProdutos();

      if (!resultado.sucesso) {
        return NextResponse.json({ 
          message: 'Falha na sincronização', 
          error: resultado.erro 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Sincronização concluída com sucesso!', 
        total: resultado.total 
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro interno inesperado";
      return NextResponse.json({ 
        message: 'Erro interno no servidor', 
        error: errorMessage 
      }, { status: 500 });
    }
  }

export async function GET() {
  return POST();
}