'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '../context/LanguageContext'

export const BottomNav = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLang()

  const navItems = [
    { icon: '🏠', labelKey: 'home', path: '/home' },
    { icon: '➕', labelKey: 'request', path: '/request' },
    { icon: '📋', labelKey: 'historyNav', path: '/history' },
    { icon: '👤', labelKey: 'profile', path: '/profile' },
  ]

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#12122a',
        borderTop: '1px solid #374151',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 1000,
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          style={{
            flex: 1,
            padding: '10px 4px 8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
          <span
            style={{
              fontSize: '10px',
              color: isActive(item.path) ? '#f97316' : '#9ca3af',
              fontWeight: isActive(item.path) ? 'bold' : 'normal',
            }}
          >
            {t(item.labelKey)}
          </span>
        </button>
      ))}
    </nav>
  )
}
