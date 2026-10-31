import { useEffect, useState, useSyncExternalStore } from 'react'

export interface ItineraryDay {
  day: number
  title: string
  text: string
}

export interface Tour {
  id: number
  slug: string
  title: string
  region: string
  category: string
  summary: string
  description: string
  durationDays: number
  price: number
  maxGroup: number
  rating: number
  reviewCount: number
  images: string[]
  highlights: string[]
  itinerary: ItineraryDay[]
  includes: string[]
  featured: boolean
  active: boolean
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface AdminBooking {
  id: number
  reference: string
  fullName: string
  email: string
  phone: string
  startDate: string
  guests: number
  note: string
  totalPrice: number
  status: BookingStatus
  createdAt: string
  tourTitle: string
  tourSlug: string
}

export interface AdminStats {
  total: number
  pending: number
  confirmed: number
  revenue: string
  upcoming: number
}

export interface AdminTour {
  id: number
  slug: string
  title: string
  region: string
  price: number
  durationDays: number
  featured: boolean
  active: boolean
  bookingCount: number
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Хөгжүүлэлтэд Vite proxy, Vercel дээр rewrite-аар /api нь Express руу очно.
const BASE = import.meta.env.VITE_API_URL ?? ''

// Сонгосон хэл. Хүсэлт бүрт ?lang= болж дамжина; өөрчлөгдөхөд useApi дахин татна.
let apiLang = 'mn'
const listeners = new Set<() => void>()

export function setApiLang(lang: string) {
  if (lang === apiLang) return
  apiLang = lang
  listeners.forEach((fn) => fn())
}

export const getApiLang = () => apiLang

function subscribeLang(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const withLang = (path: string) => `${path}${path.includes('?') ? '&' : '?'}lang=${apiLang}`

export async function api<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = init
  const res = await fetch(`${BASE}/api${withLang(path)}`, {
    ...rest,
    headers: {
      ...(rest.body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error ?? (apiLang === 'en' ? 'Something went wrong.' : 'Алдаа гарлаа.'))
  return data as T
}

export function useApi<T>(path: string | null) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true })
  const lang = useSyncExternalStore(subscribeLang, () => apiLang)

  useEffect(() => {
    if (!path) return
    const ctrl = new AbortController()
    setState((s) => ({ data: s.data, loading: true }))
    api<T>(path, { signal: ctrl.signal })
      .then((data) => setState({ data, loading: false }))
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return
        setState({ loading: false, error: err instanceof Error ? err.message : String(err) })
      })
    return () => ctrl.abort()
  }, [path, lang])

  return state
}
