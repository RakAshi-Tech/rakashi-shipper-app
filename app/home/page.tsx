'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { haversineDistance, getTrustRank, formatDistance } from '@/lib/utils'
import { BottomNav } from '../components/BottomNav'
import { LangToggle } from '../components/LangToggle'
import { useLang } from '../context/LanguageContext'
import { requestNotificationPermission, onMessage } from '@/lib/firebase'

interface DriverWithDistance {
  id: string
  name: string
  trust_score: number
  last_lat: number | null
  last_lng: number | null
  is_active: boolean
  distance: number
}

const ShipperMap = dynamic(() => import('@/app/components/ShipperMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '300px',
        background: '#1a1a2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '14px',
      }}
    >
      地図を読み込み中...
    </div>
  ),
})

// Mumbai center as default
const DEFAULT_LAT = 19.076
const DEFAULT_LNG = 72.8777

export default function HomePage() {
  const router = useRouter()
  const { t } = useLang()
  const [currentLat, setCurrentLat] = useState(DEFAULT_LAT)
  const [currentLng, setCurrentLng] = useState(DEFAULT_LNG)
  const [drivers, setDrivers] = useState<DriverWithDistance[]>([])
  const [shipperName, setShipperName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const shipperId = localStorage.getItem('shipperId')
    if (!shipperId) {
      router.replace('/')
      return
    }
    setShipperName(localStorage.getItem('shipperName') ?? '')

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setCurrentLat(pos.coords.latitude)
        setCurrentLng(pos.coords.longitude)
      },
      () => {
        // Use default if permission denied
      }
    )
  }, [router])

  // ── Web Push setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    const setupPushNotification = async () => {
      try {
        const subscriptionJson = await requestNotificationPermission()
        if (!subscriptionJson) return

        const shipperId = localStorage.getItem('shipperId')
        if (!shipperId) return

        await supabase
          .from('shipper_profiles')
          .update({ fcm_token: subscriptionJson })
          .eq('id', shipperId)

        localStorage.setItem('pushSubscription', subscriptionJson)

        onMessage((payload) => {
          console.log('Shipper push received:', payload)
        })
      } catch (err) {
        console.error('Push notification setup error:', err)
      }
    }

    setupPushNotification()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDrivers = useCallback(
    async (lat: number, lng: number) => {
      try {
        const { data } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('is_active', true)
          .order('trust_score', { ascending: false })

        if (!data) return

        const withDistance = data
          .map((d) => ({
            ...d,
            distance: haversineDistance(
              lat,
              lng,
              d.last_lat ?? lat,
              d.last_lng ?? lng
            ),
          }))
          .filter((d) => d.distance < 10000)
          .sort((a, b) => {
            const diff = b.trust_score - a.trust_score
            if (Math.abs(diff) > 10) return diff
            return a.distance - b.distance
          })
          .slice(0, 10)

        setDrivers(withDistance)
      } catch (err) {
        console.error('Failed to fetch drivers:', err)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchDrivers(currentLat, currentLng)
  }, [currentLat, currentLng, fetchDrivers])

  const handleDriverMapClick = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId)
    if (driver) {
      localStorage.setItem('selectedDriverId', driver.id)
      localStorage.setItem('selectedDriverName', driver.name)
      router.push('/request')
    }
  }

  const handleRequestDriver = (driver: DriverWithDistance) => {
    localStorage.setItem('selectedDriverId', driver.id)
    localStorage.setItem('selectedDriverName', driver.name)
    router.push('/request')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f1a',
        paddingBottom: 'calc(70px + env(safe-area-inset-bottom))',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🚚</span>
          <span
            style={{ color: '#f97316', fontWeight: 'bold', fontSize: '18px' }}
          >
            RakAshi
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#9ca3af', fontSize: '13px' }}>
            {shipperName}
          </span>
          <LangToggle />
        </div>
      </div>

      {/* Map */}
      <ShipperMap
        currentLat={currentLat}
        currentLng={currentLng}
        drivers={drivers}
        onDriverClick={handleDriverMapClick}
      />

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h2
            style={{
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 'bold',
              margin: 0,
            }}
          >
            {t('nearbyDrivers')} ({drivers.length})
          </h2>
          <button
            onClick={() => fetchDrivers(currentLat, currentLng)}
            style={{
              background: 'none',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#9ca3af',
              fontSize: '12px',
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            ↻
          </button>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 0',
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            {t('loading')}
          </div>
        ) : drivers.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 0',
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            {t('noDrivers')}
          </div>
        ) : (
          drivers.map((driver) => {
            const rank = getTrustRank(driver.trust_score)
            return (
              <div
                key={driver.id}
                style={{
                  background: '#1a1a2e',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '10px',
                  border: '1px solid #374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: rank.color + '33',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: rank.color,
                      flexShrink: 0,
                    }}
                  >
                    {driver.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                      }}
                    >
                      {driver.name}
                    </div>
                    <div
                      style={{ display: 'flex', gap: '8px', marginTop: '3px' }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          color: rank.color,
                          fontWeight: 'bold',
                        }}
                      >
                        {rank.icon} {rank.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {formatDistance(driver.distance)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {t('score')} {driver.trust_score}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRequestDriver(driver)}
                  style={{
                    padding: '10px 16px',
                    background: '#f97316',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {t('requestBtn')}
                </button>
              </div>
            )
          })
        )}

        {/* New request button */}
        <button
          onClick={() => {
            localStorage.removeItem('selectedDriverId')
            localStorage.removeItem('selectedDriverName')
            router.push('/request')
          }}
          style={{
            width: '100%',
            padding: '16px',
            background: '#f97316',
            border: 'none',
            borderRadius: '12px',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '16px',
          }}
        >
          {t('requestDelivery')}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
