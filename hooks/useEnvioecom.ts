/**
 * Hook customizado para integração com API Envioecom
 * Encapsula toda lógica de comunicação, estados e tratamento de erros
 */

import { useState, useCallback } from 'react';
import type {
  CotacaoRequest,
  CotacaoResponse,
  EtiquetaRequest,
  EtiquetaResponse,
  RastreioResponse,
  EnvioecomState,
} from '@/types/envioecom';

const ENVIOECOM_BASE_URL = 'https://api.envioecom.com.br/v1';

/**
 * Hook principal para integração Envioecom
 */
export function useEnvioecom() {
  const [state, setState] = useState<EnvioecomState>({
    isLoading: false,
    isError: false,
    error: null,
  });

  // Obter credenciais das variáveis de ambiente
  const getCredentials = useCallback(() => {
    const slug = process.env.NEXT_PUBLIC_ENVIOECOM_SLUG;
    const eToken = process.env.NEXT_PUBLIC_ENVIOECOM_ETOKEN;

    if (!slug || !eToken) {
      throw new Error(
        'Credenciais Envioecom não configuradas. Configure NEXT_PUBLIC_ENVIOECOM_SLUG e NEXT_PUBLIC_ENVIOECOM_ETOKEN no arquivo .env'
      );
    }

    return { slug, eToken };
  }, []);

  // Função auxiliar para fazer requisições à API
  const makeRequest = useCallback(
    async <T,>(endpoint: string, body?: unknown): Promise<T> => {
      setState({ isLoading: true, isError: false, error: null });

      try {
        const { slug, eToken } = getCredentials();

        const response = await fetch(`${ENVIOECOM_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${eToken}`,
            'X-User-Slug': slug,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.mensagem || 
            errorData.erro || 
            `Erro HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        setState({ isLoading: false, isError: false, error: null });
        return data as T;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setState({ isLoading: false, isError: true, error: errorMessage });
        throw error;
      }
    },
    [getCredentials]
  );

  /**
   * COTAÇÃO DE FRETE EM TEMPO REAL
   * Retorna lista de serviços disponíveis com preços e prazos
   */
  const cotarFrete = useCallback(
    async (request: CotacaoRequest): Promise<CotacaoResponse> => {
      try {
        const response = await makeRequest<CotacaoResponse>('/cotacao', request);

        if (!response.sucesso) {
          throw new Error(response.mensagem || response.erro || 'Erro ao cotar frete');
        }

        return response;
      } catch (error) {
        console.error('[useEnvioecom] Erro ao cotar frete:', error);
        throw error;
      }
    },
    [makeRequest]
  );

  /**
   * GERAÇÃO DE ETIQUETA DE ENVIO
   * Gera etiqueta e retorna URL do PDF + código de rastreio
   * 
   * ⚠️ IMPORTANTE: Só deve ser chamado APÓS confirmação do pagamento
   */
  const gerarEtiqueta = useCallback(
    async (request: EtiquetaRequest): Promise<EtiquetaResponse> => {
      try {
        const response = await makeRequest<EtiquetaResponse>('/etiqueta/gerar', request);

        if (!response.sucesso) {
          throw new Error(response.mensagem || response.erro || 'Erro ao gerar etiqueta');
        }

        return response;
      } catch (error) {
        console.error('[useEnvioecom] Erro ao gerar etiqueta:', error);
        throw error;
      }
    },
    [makeRequest]
  );

  /**
   * RASTREAMENTO DE PEDIDO
   * Retorna status atual e histórico de movimentações
   */
  const rastrearPedido = useCallback(
    async (codigoRastreio: string): Promise<RastreioResponse> => {
      try {
        if (!codigoRastreio || codigoRastreio.trim() === '') {
          throw new Error('Código de rastreio não fornecido');
        }

        const response = await makeRequest<RastreioResponse>(
          `/rastreamento/${codigoRastreio}`
        );

        if (!response.sucesso) {
          throw new Error(response.mensagem || response.erro || 'Erro ao rastrear pedido');
        }

        return response;
      } catch (error) {
        console.error('[useEnvioecom] Erro ao rastrear pedido:', error);
        throw error;
      }
    },
    [makeRequest]
  );

  /**
   * Resetar estado de erro
   */
  const resetError = useCallback(() => {
    setState({ isLoading: false, isError: false, error: null });
  }, []);

  return {
    // Funções principais
    cotarFrete,
    gerarEtiqueta,
    rastrearPedido,

    // Estados
    isLoading: state.isLoading,
    isError: state.isError,
    error: state.error,

    // Utilidades
    resetError,
  };
}

/**
 * Hook específico para cotação de frete
 * Mantém os resultados da última cotação
 */
export function useCotacaoFrete() {
  const [cotacoes, setCotacoes] = useState<CotacaoResponse | null>(null);
  const { cotarFrete, ...state } = useEnvioecom();

  const cotar = useCallback(
    async (request: CotacaoRequest) => {
      try {
        const response = await cotarFrete(request);
        setCotacoes(response);
        return response;
      } catch (error) {
        setCotacoes(null);
        throw error;
      }
    },
    [cotarFrete]
  );

  const limparCotacoes = useCallback(() => {
    setCotacoes(null);
  }, []);

  return {
    cotar,
    cotacoes,
    limparCotacoes,
    ...state,
  };
}

/**
 * Hook específico para rastreamento
 * Mantém os dados do último rastreamento
 */
export function useRastreamento() {
  const [rastreio, setRastreio] = useState<RastreioResponse | null>(null);
  const { rastrearPedido, ...state } = useEnvioecom();

  const rastrear = useCallback(
    async (codigoRastreio: string) => {
      try {
        const response = await rastrearPedido(codigoRastreio);
        setRastreio(response);
        return response;
      } catch (error) {
        setRastreio(null);
        throw error;
      }
    },
    [rastrearPedido]
  );

  const limparRastreio = useCallback(() => {
    setRastreio(null);
  }, []);

  return {
    rastrear,
    rastreio,
    limparRastreio,
    ...state,
  };
}
