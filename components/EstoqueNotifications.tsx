'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type EstoqueNotification = {
  id: string;
  produto_nome: string;
  id_externo: string;
  variacao_nome: string | null;
  variacao_sku: string | null;
  estoque_anterior: number;
  estoque_atual: number;
  diferenca: number;
  tipo_mudanca: string;
  created_at: string;
  visualizada: boolean;
};

export default function EstoqueNotifications() {
  const [notifications, setNotifications] = useState<EstoqueNotification[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Buscar notificações não visualizadas
    const fetchNotifications = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('estoque_notifications')
        .select('*')
        .eq('visualizada', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[Notifications] Erro ao buscar:', error);
        return;
      }

      setNotifications(data || []);
    };

    // Buscar notificações iniciais
    fetchNotifications();

    // Configurar listener em tempo real
    const channel = supabase
      .channel('estoque_notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'estoque_notifications',
          filter: 'visualizada=eq.false',
        },
        (payload) => {
          console.log('[Notifications] Nova notificação:', payload.new);
          setNotifications((prev) => [payload.new as EstoqueNotification, ...prev].slice(0, 10));
          setIsVisible(true);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const marcarComoVisualizada = async (id: string) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('estoque_notifications')
      .update({ 
        visualizada: true, 
        visualizada_em: new Date().toISOString(),
        visualizada_por: 'admin' 
      })
      .eq('id', id);

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const marcarTodasComoVisualizadas = async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const ids = notifications.map((n) => n.id);

    if (ids.length === 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('estoque_notifications')
      .update({ 
        visualizada: true, 
        visualizada_em: new Date().toISOString(),
        visualizada_por: 'admin' 
      })
      .in('id', ids);

    setNotifications([]);
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 z-50 w-96 max-h-[80vh] overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-orange-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">
              Atualizações de Estoque
            </h3>
            <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {notifications.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={marcarTodasComoVisualizadas}
              className="text-xs text-orange-600 hover:text-orange-800 font-medium"
            >
              Marcar todas
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {notifications.map((notification) => {
            const isDiminuindo = notification.diferenca < 0;
            const isAumentando = notification.diferenca > 0;

            return (
              <div
                key={notification.id}
                className="p-4 hover:bg-gray-50 transition-colors relative group"
              >
                <button
                  onClick={() => marcarComoVisualizada(notification.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-full ${
                      isDiminuindo
                        ? 'bg-red-100'
                        : isAumentando
                        ? 'bg-green-100'
                        : 'bg-blue-100'
                    }`}
                  >
                    {isDiminuindo ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {notification.produto_nome}
                    </p>
                    {notification.variacao_nome && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        Tamanho: <span className="font-medium">{notification.variacao_nome}</span>
                        {notification.variacao_sku && (
                          <span className="text-gray-400 ml-1">
                            ({notification.variacao_sku})
                          </span>
                        )}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center text-xs font-semibold ${
                          isDiminuindo
                            ? 'text-red-700'
                            : isAumentando
                            ? 'text-green-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {notification.diferenca > 0 ? '+' : ''}
                        {notification.diferenca} unidades
                      </span>
                      <span className="text-xs text-gray-500">
                        {notification.estoque_anterior} → {notification.estoque_atual}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
