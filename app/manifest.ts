import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RakAshi Shipper',
    short_name: 'RakAshi',
    description: '配送依頼プラットフォーム',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0f1a',
    theme_color: '#f97316',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
