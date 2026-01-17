'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SystemNotification {
  id: string
  title: string
  description: string
  type: 'feature' | 'fix' | 'alert' | 'improvement'
  image_url?: string
  high_priority: boolean
  created_at: string
}

interface UseNotificationsOptions {
  audience?: 'all' | 'resellers' | 'admin'
  autoFetch?: boolean
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { audience = 'all', autoFetch = true } = options
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [priorityNotification, setPriorityNotification] = useState<SystemNotification | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  
  const supabase = createClient()

  // Buscar ID do usuário
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [supabase])

  // Buscar notificações não lidas
  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      
      // Buscar todas as notificações ativas
      const { data: allNotifications, error: notifError } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('is_active', true)
        .or(`target_audience.eq.all,target_audience.eq.${audience}`)
        .order('high_priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)

      if (notifError) throw notifError

      // Buscar quais o usuário já leu
      const { data: readNotifs, error: readError } = await supabase
        .from('user_read_notifications')
        .select('notification_id, dismissed_popup')
        .eq('user_id', userId)

      if (readError) throw readError

      const readIds = new Set(readNotifs?.map(r => r.notification_id) || [])
      const dismissedPopupIds = new Set(
        readNotifs?.filter(r => r.dismissed_popup).map(r => r.notification_id) || []
      )

      // Filtrar não lidas
      const unread = (allNotifications || []).filter(n => !readIds.has(n.id))
      setNotifications(allNotifications || [])
      setUnreadCount(unread.length)

      // Buscar notificação high_priority não vista (popup)
      const priorityNotif = (allNotifications || []).find(
        n => n.high_priority && !dismissedPopupIds.has(n.id)
      )
      setPriorityNotification(priorityNotif || null)

    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, audience, supabase])

  // Auto fetch quando userId mudar
  useEffect(() => {
    if (autoFetch && userId) {
      fetchNotifications()
    }
  }, [autoFetch, userId, fetchNotifications])

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('user_read_notifications')
        .upsert({
          user_id: userId,
          notification_id: notificationId,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,notification_id'
        })

      if (error) throw error

      // Atualizar contagem local
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }, [userId, supabase])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!userId || notifications.length === 0) return

    try {
      const unreadNotifications = notifications.filter(_n => {
        // Verificar se não está lida
        return true // Simplificado - marca todas
      })

      const inserts = unreadNotifications.map(n => ({
        user_id: userId,
        notification_id: n.id,
        read_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('user_read_notifications')
        .upsert(inserts, {
          onConflict: 'user_id,notification_id'
        })

      if (error) throw error

      setUnreadCount(0)
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }, [userId, notifications, supabase])

  // Dispensar popup de notificação prioritária
  const dismissPriorityPopup = useCallback(async (notificationId: string) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('user_read_notifications')
        .upsert({
          user_id: userId,
          notification_id: notificationId,
          read_at: new Date().toISOString(),
          dismissed_popup: true
        }, {
          onConflict: 'user_id,notification_id'
        })

      if (error) throw error

      setPriorityNotification(null)
    } catch (error) {
      console.error('Erro ao dispensar popup:', error)
    }
  }, [userId, supabase])

  return {
    notifications,
    unreadCount,
    priorityNotification,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissPriorityPopup
  }
}
