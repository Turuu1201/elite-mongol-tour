// Нэргүй хандалтын бүртгэл. IP, нэр, имэйл илгээхгүй; зөвхөн санамсаргүй зочны ID.
import { getApiLang } from './api'

export type EventType =
  | 'page_view'
  | 'tour_view'
  | 'search'
  | 'filter'
  | 'booking_start'
  | 'booking_submit'
  | 'lang_switch'

type Props = Record<string, string | number | boolean>

const BASE = import.meta.env.VITE_API_URL ?? ''

function randomId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
  }
}

function stored(storage: () => Storage, key: string) {
  try {
    const s = storage()
    let id = s.getItem(key)
    if (!id) {
      id = randomId()
      s.setItem(key, id)
    }
    return id
  } catch {
    // Хувийн цонх гэх мэтэд хадгалах боломжгүй бол энэ хуудсанд л хүчинтэй ID
    return (memoryIds[key] ??= randomId())
  }
}
const memoryIds: Record<string, string> = {}

const disabled = () =>
  typeof navigator === 'undefined' ||
  navigator.doNotTrack === '1' ||
  navigator.webdriver === true ||
  location.pathname.startsWith('/admin')

// React StrictMode-д effect хоёр удаа ажилладаг тул ижил үйлдлийг богино хугацаанд давтахгүй
let last = { key: '', at: 0 }
let referrerSent = false

export function track(type: EventType, data: { tourId?: number; props?: Props } = {}) {
  if (disabled()) return
  const path = location.pathname
  const key = `${type}|${path}|${data.tourId ?? ''}|${JSON.stringify(data.props ?? {})}`
  const now = Date.now()
  if (key === last.key && now - last.at < 1500) return
  last = { key, at: now }

  const body = JSON.stringify({
    type,
    path,
    tourId: data.tourId,
    props: data.props ?? {},
    lang: getApiLang(),
    visitorId: stored(() => localStorage, 'emt-vid'),
    sessionId: stored(() => sessionStorage, 'emt-sid'),
    // Хаанаас орж ирснийг зөвхөн сессийн эхний хуудсанд илгээнэ
    referrer: !referrerSent && type === 'page_view' ? document.referrer : undefined,
  })
  if (type === 'page_view') referrerSent = true

  const url = `${BASE}/api/events`
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }))) return
  } catch {
    // sendBeacon ажиллахгүй бол fetch-ээр
  }
  fetch(url, { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
}
