'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BottomNav } from '../components/BottomNav'
import { LangToggle } from '../components/LangToggle'
import { useLang } from '../context/LanguageContext'

interface Stats {
  total: number
  completed: number
}

export default function ProfilePage() {
  const router = useRouter()
  const { t } = useLang()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const shipperId = localStorage.getItem('shipperId')
    if (!shipperId) {
      router.replace('/')
      return
    }
    setName(localStorage.getItem('shipperName') ?? '')
    setPhone(localStorage.getItem('shipperPhone') ?? '')

    const fetchProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from('shipper_profiles')
          .select('*')
          .eq('id', shipperId)
          .single()
        if (profile) {
          setName(profile.name ?? '')
          setPhone(profile.phone_number ?? '')
          setCompany(profile.company_name ?? '')
        }

        const { data: allReqs } = await supabase
          .from('delivery_requests')
          .select('status')
          .eq('shipper_id', shipperId)

        if (allReqs) {
          setStats({
            total: allReqs.length,
            completed: allReqs.filter((r) => r.status === 'delivered').length,
          })
        }
      } catch (err) {
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('shipperId')
    localStorage.removeItem('shipperName')
    localStorage.removeItem('shipperPhone')
    localStorage.removeItem('selectedDriverId')
    localStorage.removeItem('selectedDriverName')
    router.replace('/')
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
          👤 {t('profileTitle')}
        </span>
        <LangToggle />
      </div>

      <div style={{ padding: '16px' }}>
        {/* Avatar & Name */}
        <div
          style={{
            background: '#1a1a2e',
            borderRadius: '16px',
            padding: '28px 24px',
            marginBottom: '16px',
            border: '1px solid #374151',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#f9731622',
              border: '2px solid #f97316',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#f97316',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div
            style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}
          >
            {name}
          </div>
          {company && (
            <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px' }}>
              🏢 {company}
            </div>
          )}
          <div style={{ color: '#9ca3af', fontSize: '13px' }}>📞 {phone}</div>
        </div>

        {/* Stats */}
        {!loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            {[
              {
                label: t('totalRequests'),
                value: stats.total,
                icon: '📦',
                color: '#3b82f6',
              },
              {
                label: t('completedRequests'),
                value: stats.completed,
                icon: '✅',
                color: '#16a34a',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: '#1a1a2e',
                  borderRadius: '12px',
                  padding: '20px 16px',
                  border: `1px solid ${stat.color}44`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>
                  {stat.icon}
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: stat.color,
                    marginBottom: '4px',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SQL reminder */}
        <div
          style={{
            background: '#1a1a2e',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #374151',
          }}
        >
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            🔧 DB Migration (run in Supabase SQL Editor)
          </div>
          <code
            style={{
              display: 'block',
              color: '#eab308',
              fontSize: '11px',
              background: '#0f0f1a',
              padding: '10px',
              borderRadius: '6px',
              whiteSpace: 'pre',
              overflowX: 'auto',
            }}
          >
            {`ALTER TABLE driver_profiles\nADD COLUMN IF NOT EXISTS last_lat numeric,\nADD COLUMN IF NOT EXISTS last_lng numeric,\nADD COLUMN IF NOT EXISTS last_seen_at timestamptz;`}
          </code>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
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
          🚪 {t('logout')}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
