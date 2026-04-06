export const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const getTrustRank = (
  score: number
): { label: string; color: string; icon: string } => {
  if (score >= 80) return { label: 'Leader', color: '#f97316', icon: '★' }
  if (score >= 60) return { label: 'Sub-Leader', color: '#3b82f6', icon: '◆' }
  if (score >= 30) return { label: 'Standard', color: '#eab308', icon: '●' }
  return { label: 'New', color: '#9ca3af', icon: '○' }
}

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}
