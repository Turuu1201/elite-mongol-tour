const money = new Intl.NumberFormat('en-US')

export const formatPrice = (n: number | string) => `${money.format(Number(n))}₮`

export function formatDate(iso: string) {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function tomorrowIso() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const unsplash = (url: string, width: number) => url.replace(/w=\d+/, `w=${width}`)
