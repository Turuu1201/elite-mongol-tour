import { Compass, Landmark, Mountain, Snowflake, Sun, Tent, Trees, type LucideIcon } from 'lucide-react'

// Түлхүүрүүд нь өгөгдлийн сангийн утгатай таарна; дэлгэцэнд гарах нэрийг i18n.tsx-ээс авна.
export const REGIONS = ['Төв', 'Говь', 'Хойд', 'Баруун', 'Зүүн'] as const

export const CATEGORIES: { name: string; icon: LucideIcon }[] = [
  { name: 'Байгаль', icon: Trees },
  { name: 'Адал явдал', icon: Compass },
  { name: 'Явган аялал', icon: Mountain },
  { name: 'Соёл', icon: Landmark },
  { name: 'Майхан', icon: Tent },
  { name: 'Амралт', icon: Sun },
  { name: 'Өвөл', icon: Snowflake },
]

export const DURATIONS = ['short', 'medium', 'long'] as const

export const SORTS = ['popular', 'price-asc', 'price-desc', 'duration'] as const

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`

export const REGION_IMAGES: Record<(typeof REGIONS)[number], string> = {
  Төв: photo('1472214103451-9374bd1c798e'),
  Говь: photo('1509316785289-025f5b846b35'),
  Хойд: photo('1464822759023-fed622ff2c3b'),
  Баруун: photo('1506905925346-21bda4d32df4'),
  Зүүн: photo('1441974231531-c6227db76b6e'),
}

export const HERO_IMAGE = photo('1506905925346-21bda4d32df4').replace('w=1200', 'w=2400')

export const CONTACT = {
  phone: '+976 7700 1234',
  email: 'info@nuudel.mn',
}
