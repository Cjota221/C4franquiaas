/**
 * 🔄 Componente: Sincronização Manual de Catálogo
 * 
 * Botão para sincronizar produtos manualmente do Painel C4 Admin.
 * Usado no painel da franqueada.
 * 
 * @component SyncCatalogButton
 */

'use client';

import React, { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';

// ============ TIPOS ============

interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

interface SyncCatalogButtonProps {
  /**
   * URL do endpoint de catálogo mestre do C4 Admin
   * Exemplo: "https://c4franquiaas.netlify.app/api/public/master-catalog"
   */
  masterCatalogUrl: string;
  
  /**
   * API Key ou Webhook Secret para autenticação
   */
  apiKey: string;
  
  /**
   * Modo de sincronização:
   * - 'update_only': Apenas atualiza produtos existentes
   * - 'create_and_update': Cria novos e atualiza existentes
   */
  mode?: 'update_only' | 'create_and_update';
  
  /**
   * Callback executado após sincronização bem-sucedida
   */
  onSyncComplete?: (result: SyncResult) => void;

  /**
   * Classe CSS customizada
   */
  className?: string;
}

// ============ COMPONENTE ============

export default function SyncCatalogButton({
  masterCatalogUrl,
  apiKey,
  mode = 'update_only',
  onSyncComplete,
  className = '',
}: SyncCatalogButtonProps) {
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('[SyncCatalogButton] 🔄 Iniciando sincronização...');

      // ============ PASSO 1: Buscar catálogo mestre do C4 Admin ============
      
      console.log(`[SyncCatalogButton] 📡 Buscando catálogo de: ${masterCatalogUrl}`);
      
      const catalogResponse = await fetch(masterCatalogUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!catalogResponse.ok) {
        const errorText = await catalogResponse.text();
        throw new Error(`Falha ao buscar catálogo: ${catalogResponse.status} - ${errorText}`);
      }

      const catalogData = await catalogResponse.json();
      
      if (!catalogData.success || !catalogData.produtos) {
        throw new Error('Resposta do catálogo inválida');
      }

      console.log(`[SyncCatalogButton] ✅ Catálogo recebido: ${catalogData.produtos.length} produtos`);

      // ============ PASSO 2: Enviar para endpoint local de sincronização ============
      
      console.log(`[SyncCatalogButton] 📤 Enviando para sincronização local...`);
      
      const syncResponse = await fetch('/api/products/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produtos: catalogData.produtos,
          mode,
        }),
      });

      if (!syncResponse.ok) {
        const errorText = await syncResponse.text();
        throw new Error(`Falha na sincronização: ${syncResponse.status} - ${errorText}`);
      }

      const syncData = await syncResponse.json();

      if (!syncData.success) {
        throw new Error('Sincronização falhou');
      }

      console.log('[SyncCatalogButton] ✅ Sincronização concluída!');
      console.log('[SyncCatalogButton] 📊 Resultado:', syncData.result);

      setResult(syncData.result);
      
      if (onSyncComplete) {
        onSyncComplete(syncData.result);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[SyncCatalogButton] ❌ Erro:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Botão de Sincronização */}
      <button
        onClick={handleSync}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${loading 
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }
        `}
      >
        <RefreshCw 
          size={18} 
          className={loading ? 'animate-spin' : ''} 
        />
        {loading ? 'Sincronizando...' : 'Sincronizar Catálogo Central'}
      </button>

      {/* Indicador de Progresso */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <RefreshCw size={20} className="text-blue-600 animate-spin" />
            <div>
              <p className="font-medium text-blue-900">Sincronizando produtos...</p>
              <p className="text-sm text-blue-700">Isso pode levar alguns segundos.</p>
            </div>
          </div>
        </div>
      )}

      {/* Resultado da Sincronização */}
      {result && !loading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-900 mb-2">Sincronização Concluída!</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Total:</span>{' '}
                  <span className="font-medium text-gray-900">{result.total}</span>
                </div>
                <div>
                  <span className="text-gray-600">Atualizados:</span>{' '}
                  <span className="font-medium text-green-700">{result.updated}</span>
                </div>
                {result.created > 0 && (
                  <div>
                    <span className="text-gray-600">Criados:</span>{' '}
                    <span className="font-medium text-blue-700">{result.created}</span>
                  </div>
                )}
                {result.errors > 0 && (
                  <div>
                    <span className="text-gray-600">Erros:</span>{' '}
                    <span className="font-medium text-red-700">{result.errors}</span>
                  </div>
                )}
              </div>
              {result.created > 0 && (
                <div className="mt-3 flex items-start gap-2 text-sm text-blue-800 bg-blue-100 rounded p-2">
                  <Info size={16} className="flex-shrink-0 mt-0.5" />
                  <p>
                    {result.created} produto(s) novo(s) foi(ram) criado(s) como <strong>DESATIVADO</strong>. 
                    Ative-os manualmente na página de Produtos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Erro na Sincronização</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
