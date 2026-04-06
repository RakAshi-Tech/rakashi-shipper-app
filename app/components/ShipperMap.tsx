'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

interface Driver {
  id: string
  name: string
  trust_score: number
  last_lat?: number | null
  last_lng?: number | null
  is_active: boolean
}

interface Props {
  currentLat: number
  currentLng: number
  drivers: Driver[]
  onDriverClick: (driverId: string) => void
}

export default function ShipperMap({
  currentLat,
  currentLng,
  drivers,
  onDriverClick,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      const map = L.map(mapRef.current!, {
        center: [currentLat, currentLng],
        zoom: 14,
        dragging: true,
        scrollWheelZoom: true,
        touchZoom: true,
      })
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map)

      // 現在地マーカー（青）
      const currentIcon = L.divIcon({
        html: `<div style="
          width:18px;height:18px;
          background:#3b82f6;
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [18, 18],
        className: '',
      })
      L.marker([currentLat, currentLng], { icon: currentIcon })
        .addTo(map)
        .bindPopup('現在地')

      // ドライバーマーカー
      drivers.forEach((driver) => {
        if (!driver.last_lat || !driver.last_lng) return
        const color = driver.is_active ? '#16a34a' : '#ef4444'
        const driverIcon = L.divIcon({
          html: `<div style="
            background:${color};
            color:#fff;
            padding:4px 8px;
            border-radius:8px;
            font-size:11px;
            font-weight:bold;
            white-space:nowrap;
            box-shadow:0 2px 6px rgba(0,0,0,0.4);
          ">${driver.name?.charAt(0)} ${driver.trust_score}pt</div>`,
          className: '',
        })
        L.marker([driver.last_lat, driver.last_lng], { icon: driverIcon })
          .addTo(map)
          .on('click', () => onDriverClick(driver.id))
          .bindPopup(`${driver.name} (${driver.trust_score}pt)`)
      })
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        ;(mapInstanceRef.current as { remove: () => void }).remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLat, currentLng])

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '300px',
        touchAction: 'pan-x pan-y pinch-zoom',
      }}
    />
  )
}
