'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BottomNav } from '../components/BottomNav'
import { LangToggle } from '../components/LangToggle'
import { useLang } from '../context/LanguageContext'

interface DeliveryRequest {
  id: string
  pickup_address: string
  delivery_address: string
  item_description: string
  item_quantity: number
  proposed_fare_inr: number | null
  status: string
  created_at: string
}

const getStatusBadge = (
  status: string,
  t: (key: string) => string
): { label: string; color: string } => {
  const map: Record<string, { labelKey: string; color: string }> = {
    pending: { labelKey: 'status_pending', color: '#eab308' },
    accepted: { labelKey: 'status_accepted', color: '#3b82f6' },
    picked_up: { labelKey: 'status_picked_up', color: '#f97316' },
    delivered: { labelKey: 'status_delivered', color: '#16a34a' },
    cancelled: { labelKey: 'status_cancelled', color: '#ef4444' },
  }
  const cfg = map[status]
  if (cfg) return { label: t(cfg.labelKey), color: cfg.color }
  return { label: status, color: '#9ca3af' }
}

export default function HistoryPage() {
  const router = useRouter()
  const { t } = useLang()
  const [requests, setRequests] = useState<DeliveryRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const shipperId = localStorage.getItem('shipperId')
    if (!shipperId) {
      router.replace('/')
      return
    }

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_requests')
          .select('*')
          .eq('shipper_id', shipperId)
          .order('created_at', { ascending: false })
          .limit(20)
        if (error) throw error
        if (data) setRequests(data)
      } catch (err) {
        console.error('Fetch history error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [router])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

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
        <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '18px' }}>
          📋 {t('history')}
        </span>
        <LangToggle />
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            {t('loading')}
          </div>
        ) : requests.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 0',
              color: '#9ca3af',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '14px', margin: 0 }}>{t('noHistory')}</p>
          </div>
        ) : (
          requests.map((req) => {
            const badge = getStatusBadge(req.status, t)
            return (
              <div
                key={req.id}
                onClick={() => router.push(`/status/${req.id}`)}
                style={{
                  background: '#1a1a2e',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '10px',
                  border: '1px solid #374151',
                  cursor: 'pointer',
                }}
              >
                {/* Top row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                    {formatDate(req.created_at)}
                  </div>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      background: badge.color + '22',
                      color: badge.color,
                      fontSize: '11px',
                      fontWeight: 'bold',
                      border: `1px solid ${badge.color}44`,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Route */}
                <div style={{ marginBottom: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>📍</span>
                    <span
                      style={{
                        color: '#ffffff',
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {req.pickup_address}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>🏁</span>
                    <span
                      style={{
                        color: '#9ca3af',
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {req.delivery_address}
                    </span>
                  </div>
                </div>

                {/* Bottom row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                    {req.item_description} × {req.item_quantity}
                  </span>
                  {req.proposed_fare_inr && (
                    <span
                      style={{
                        color: '#f97316',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      ₹{req.proposed_fare_inr}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <BottomNav />
    </div>
  )
}
