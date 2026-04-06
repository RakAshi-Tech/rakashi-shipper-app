'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BottomNav } from '../../components/BottomNav'
import { LangToggle } from '../../components/LangToggle'
import { useLang } from '../../context/LanguageContext'

interface DeliveryRequest {
  id: string
  pickup_address: string
  delivery_address: string
  item_description: string
  item_quantity: number
  item_weight_kg: number | null
  proposed_fare_inr: number | null
  special_instructions: string | null
  status: string
  created_at: string
  driver_id: string | null
}

interface Notification {
  id: string
  driver_id: string
  status: string
  driver_profiles?: {
    name: string
    trust_score: number
  }
}

export default function StatusPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  const { t } = useLang()
  const [request, setRequest] = useState<DeliveryRequest | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [countdown, setCountdown] = useState(60)
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchRequest = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('id', requestId)
        .single()
      if (error) throw error
      if (data) {
        setRequest(data)
        if (data.status === 'accepted') setAccepted(true)
      }
    } catch (err) {
      console.error('Fetch request error:', err)
    } finally {
      setLoading(false)
    }
  }, [requestId])

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('request_notifications')
        .select('*, driver_profiles(name, trust_score)')
        .eq('request_id', requestId)
      if (data) setNotifications(data)
    } catch (err) {
      console.error('Fetch notifications error:', err)
    }
  }, [requestId])

  useEffect(() => {
    const shipperId = localStorage.getItem('shipperId')
    if (!shipperId) {
      router.replace('/')
      return
    }
    fetchRequest()
    fetchNotifications()
  }, [router, fetchRequest, fetchNotifications])

  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel(`request_status_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          setRequest(payload.new as DeliveryRequest)
          if ((payload.new as DeliveryRequest).status === 'accepted') {
            setAccepted(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [requestId])

  // Countdown timer
  useEffect(() => {
    if (accepted || (request && request.status !== 'pending')) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoCancel()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accepted, request?.status])

  const handleAutoCancel = async () => {
    try {
      await supabase
        .from('delivery_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
      setRequest((prev) => prev ? { ...prev, status: 'cancelled' } : prev)
    } catch (err) {
      console.error('Auto cancel error:', err)
    }
  }

  const handleCancel = async () => {
    try {
      await supabase
        .from('delivery_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
      router.push('/home')
    } catch (err) {
      console.error('Cancel error:', err)
    }
  }

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: string }> = {
      pending: { label: t('waitingApproval'), color: '#eab308', icon: '⏳' },
      accepted: { label: t('accepted'), color: '#16a34a', icon: '✅' },
      picked_up: { label: t('status_picked_up'), color: '#f97316', icon: '📦' },
      delivered: { label: t('status_delivered'), color: '#16a34a', icon: '🎉' },
      cancelled: { label: t('status_cancelled'), color: '#ef4444', icon: '❌' },
    }
    return map[status] ?? { label: status, color: '#9ca3af', icon: '❓' }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0f0f1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
        }}
      >
        {t('loading')}
      </div>
    )
  }

  if (!request) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0f0f1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
        }}
      >
        {t('error')}
      </div>
    )
  }

  const statusConfig = getStatusConfig(request.status)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f1a',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: '#12122a',
          padding: '12px 16px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #374151',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => router.push('/home')}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ←
          </button>
          <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}>
            {t('requestStatus')}
          </span>
        </div>
        <LangToggle />
      </div>

      <div style={{ padding: '16px' }}>
        {/* Status card */}
        <div
          style={{
            background: '#1a1a2e',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '16px',
            border: `1px solid ${statusConfig.color}44`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>
            {statusConfig.icon}
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: statusConfig.color,
              marginBottom: '8px',
            }}
          >
            {statusConfig.label}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>
            #{requestId.slice(0, 8).toUpperCase()}
          </div>

          {/* Countdown */}
          {request.status === 'pending' && (
            <div
              style={{
                marginTop: '20px',
                padding: '12px',
                background: '#0f0f1a',
                borderRadius: '10px',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: countdown <= 10 ? '#ef4444' : '#eab308',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                {String(countdown % 60).padStart(2, '0')}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
                {t('autoCancel')} {countdown} {t('seconds')}
              </div>
            </div>
          )}
        </div>

        {/* Notifications (sent to which drivers) */}
        {notifications.length > 0 && (
          <div
            style={{
              background: '#1a1a2e',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid #374151',
            }}
          >
            <div
              style={{
                color: '#9ca3af',
                fontSize: '12px',
                marginBottom: '10px',
              }}
            >
              {t('sentTo')}
            </div>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <span style={{ color: '#16a34a', fontSize: '14px' }}>✓</span>
                <span style={{ color: '#ffffff', fontSize: '14px' }}>
                  {n.driver_profiles?.name ?? 'Driver'}
                </span>
                {n.driver_profiles?.trust_score !== undefined && (
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                    ({n.driver_profiles.trust_score}pt)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Request details */}
        <div
          style={{
            background: '#1a1a2e',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #374151',
          }}
        >
          {[
            { label: t('pickupLabel'), value: request.pickup_address, icon: '📍' },
            { label: t('deliveryLabel'), value: request.delivery_address, icon: '🏁' },
            {
              label: t('itemLabel'),
              value: `${request.item_description} × ${request.item_quantity}`,
              icon: '📦',
            },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '16px', marginTop: '1px' }}>{row.icon}</span>
              <div>
                <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                  {row.label}
                </div>
                <div style={{ color: '#ffffff', fontSize: '14px', marginTop: '2px' }}>
                  {row.value}
                </div>
              </div>
            </div>
          ))}
          {request.proposed_fare_inr && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px' }}>💰</span>
              <div>
                <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                  {t('fareLabel')}
                </div>
                <div
                  style={{
                    color: '#f97316',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginTop: '2px',
                  }}
                >
                  ₹{request.proposed_fare_inr}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cancel button */}
        {(request.status === 'pending') && (
          <button
            onClick={handleCancel}
            style={{
              width: '100%',
              padding: '16px',
              background: 'transparent',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              color: '#ef4444',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {t('cancelRequest')}
          </button>
        )}

        {/* View history button after delivery */}
        {(request.status === 'delivered' || request.status === 'cancelled') && (
          <button
            onClick={() => router.push('/history')}
            style={{
              width: '100%',
              padding: '16px',
              background: '#374151',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            📋 {t('historyNav')}
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
