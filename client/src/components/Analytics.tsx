import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  Eye,
  Filter,
  Globe,
  LoaderCircle,
  MousePointerClick,
  PencilLine,
  Search,
  Send,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useI18n, type Dict } from '../lib/i18n'

// Графикийн өнгө: dataviz лавлах палитр (цагаан дэвсгэр дээр шалгасан)
const SERIES = ['#2a78d6', '#eb6834', '#1baf7a']
const GRID = '#e1e0d9'
const AXIS = '#c3c2b7'
const MUTED = '#898781'
const UP = '#006300'
const DOWN = '#d03b3b'

type Call = <T>(path: string, init?: RequestInit) => Promise<T>

interface Totals {
  visitors: number
  sessions: number
  pageViews: number
  tourViews: number
  bookings: number
}

interface Daily {
  day: string
  visitors: number
  pageViews: number
  bookings: number
}

interface TourStat {
  id: number
  slug: string
  title: string
  views: number
  visitors: number
  starts: number
  bookings: number
}

interface KeyValue {
  key: string
  value: number
}

interface RecentEvent {
  id: string
  createdAt: string
  type: string
  path: string
  device: string
  lang: string
  props: Record<string, string | number | boolean>
  tourTitle: string | null
}

interface AnalyticsData {
  days: number
  current: Totals
  previous: Totals
  daily: Daily[]
  tours: TourStat[]
  funnel: { visitors: number; tourViewers: number; starters: number; bookers: number }
  devices: KeyValue[]
  langs: KeyValue[]
  searches: KeyValue[]
  referrers: KeyValue[]
  pages: KeyValue[]
  recent: RecentEvent[]
}

const num = new Intl.NumberFormat('en-US')
const pct = (v: number) => `${(v * 100).toFixed(v > 0 && v < 0.1 ? 1 : 0)}%`
const shortDate = (iso: string) => `${iso.slice(5, 7)}.${iso.slice(8, 10)}`

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

// 1, 2, 5 × 10^k алхамтай цэвэр тэнхлэг
function niceScale(max: number, count = 4) {
  const raw = Math.max(1, max) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  return { step, max: step * Math.ceil(Math.max(1, max) / step) }
}

function Panel({
  title,
  sub,
  action,
  children,
  className = '',
}: {
  title: string
  sub?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-3xl bg-white p-6 ring-1 ring-mist ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {sub && <p className="mt-1 text-sm text-stone">{sub}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Delta({ cur, prev, days, points = false }: { cur: number; prev: number; days: number; points?: boolean }) {
  const { t } = useI18n()
  const a = t.analytics
  if (!prev && !points) return <p className="mt-1 text-xs text-stone">{a.noPrev}</p>
  const change = points ? (cur - prev) * 100 : (cur - prev) / prev
  if (!Number.isFinite(change)) return <p className="mt-1 text-xs text-stone">{a.noPrev}</p>
  const up = change >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  const label = points ? `${up ? '+' : ''}${change.toFixed(1)} pp` : `${up ? '+' : ''}${(change * 100).toFixed(0)}%`
  return (
    <p className="mt-1 flex items-center gap-1 text-xs">
      <span className="inline-flex items-center gap-0.5 font-bold" style={{ color: up ? UP : DOWN }}>
        <Icon className="size-3.5" aria-hidden />
        {label}
      </span>
      <span className="text-stone">{a.vsPrev(days)}</span>
    </p>
  )
}

function Stat({ label, value, children, hint }: { label: string; value: string; children: ReactNode; hint?: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-mist">
      <p className="text-sm font-semibold text-stone">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {children}
      {hint && <p className="mt-0.5 text-xs text-stone">{hint}</p>}
    </div>
  )
}

function DailyChart({ data }: { data: Daily[] }) {
  const { t } = useI18n()
  const a = t.analytics
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const height = 240
  const m = { top: 16, right: 20, bottom: 28, left: 40 }
  const w = Math.max(0, width - m.left - m.right)
  const h = height - m.top - m.bottom
  const { step, max } = niceScale(Math.max(...data.map((d) => d.visitors)))
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step)
  const x = (i: number) => m.left + (data.length > 1 ? (i * w) / (data.length - 1) : w / 2)
  const y = (v: number) => m.top + h - (v / max) * h
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.visitors).toFixed(1)}`).join('')
  const area = `${line}L${x(data.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(w / 70)))
  const lastIdx = data.length - 1
  // Хугацааг сольж өгөгдөл богиносоход хуучин hover индекс хүчингүй болно
  const active = hover !== null && hover < data.length ? hover : null

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left - m.left
    const i = Math.round((px / Math.max(1, w)) * (data.length - 1))
    setHover(Math.min(lastIdx, Math.max(0, i)))
  }

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={a.dailyTitle}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          className="touch-pan-y select-none"
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={m.left} x2={m.left + w} y1={y(v)} y2={y(v)} stroke={v === 0 ? AXIS : GRID} strokeWidth={1} />
              <text
                x={m.left - 8}
                y={y(v)}
                dy="0.32em"
                textAnchor="end"
                fontSize={11}
                fill={MUTED}
                className="tabular-nums"
              >
                {num.format(v)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % labelEvery === 0 || i === lastIdx ? (
              i !== lastIdx && lastIdx - i < labelEvery ? null : (
                <text
                  key={d.day}
                  x={x(i)}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fill={MUTED}
                  className="tabular-nums"
                >
                  {shortDate(d.day)}
                </text>
              )
            ) : null,
          )}
          <path d={area} fill={SERIES[0]} fillOpacity={0.1} />
          <path d={line} fill="none" stroke={SERIES[0]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* Сүүлийн цэгийн утгыг шууд бичнэ */}
          <circle cx={x(lastIdx)} cy={y(data[lastIdx].visitors)} r={4} fill={SERIES[0]} stroke="#fff" strokeWidth={2} />
          {active !== null && (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={m.top} y2={m.top + h} stroke={AXIS} strokeWidth={1} />
              <circle
                cx={x(active)}
                cy={y(data[active].visitors)}
                r={5}
                fill={SERIES[0]}
                stroke="#fff"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      )}
      {active !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-44 rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: Math.min(Math.max(0, x(active) - 88), Math.max(0, width - 176)) }}
          role="status"
        >
          <p className="font-bold">{data[active].day}</p>
          <p className="mt-1 flex justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: SERIES[0] }} />
              {a.visitors}
            </span>
            <span className="font-bold tabular-nums">{num.format(data[active].visitors)}</span>
          </p>
          <p className="flex justify-between text-white/75">
            <span>{a.pageViews}</span>
            <span className="tabular-nums">{num.format(data[active].pageViews)}</span>
          </p>
          <p className="flex justify-between text-white/75">
            <span>{a.bookings}</span>
            <span className="tabular-nums">{num.format(data[active].bookings)}</span>
          </p>
        </div>
      )}
    </div>
  )
}

function DailyTable({ data }: { data: Daily[] }) {
  const { t } = useI18n()
  const a = t.analytics
  return (
    <div className="max-h-60 overflow-y-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white text-xs text-stone">
          <tr>
            <th className="py-2 font-semibold">{a.date}</th>
            <th className="py-2 text-right font-semibold">{a.visitors}</th>
            <th className="py-2 text-right font-semibold">{a.pageViews}</th>
            <th className="py-2 text-right font-semibold">{a.bookings}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-mist tabular-nums">
          {[...data].reverse().map((d) => (
            <tr key={d.day}>
              <td className="py-1.5">{d.day}</td>
              <td className="py-1.5 text-right font-semibold">{num.format(d.visitors)}</td>
              <td className="py-1.5 text-right">{num.format(d.pageViews)}</td>
              <td className="py-1.5 text-right">{num.format(d.bookings)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Bar({
  value,
  max,
  color = SERIES[0],
  thick = 8,
}: {
  value: number
  max: number
  color?: string
  thick?: number
}) {
  const w = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="w-full" style={{ height: thick }}>
      {value > 0 && <div className="h-full rounded-r-[4px]" style={{ width: `max(${w}%, 2px)`, background: color }} />}
    </div>
  )
}

function Funnel({ f }: { f: AnalyticsData['funnel'] }) {
  const { t } = useI18n()
  const a = t.analytics
  const steps = [f.visitors, f.tourViewers, f.starters, f.bookers]
  const first = steps[0]
  return (
    <ol className="space-y-4">
      {steps.map((v, i) => (
        <li key={i}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold">
              <span className="mr-2 text-stone tabular-nums">{i + 1}.</span>
              {a.funnelSteps[i]}
            </span>
            <span className="shrink-0">
              <span className="font-bold tabular-nums">{num.format(v)}</span>
              {i > 0 && first > 0 && <span className="ml-2 text-xs text-stone">{pct(v / first)}</span>}
            </span>
          </div>
          <div className="mt-1.5" title={`${a.funnelSteps[i]}: ${num.format(v)}`}>
            <Bar value={v} max={first} thick={20} />
          </div>
        </li>
      ))}
      <li className="text-xs text-stone">% = {a.ofFirst}</li>
    </ol>
  )
}

// Нэг бүхлийг хэсгүүдэд хуваасан өндөр хэсэгчилсэн багана (≤ 3 ангилал)
function Segmented({ items, names, label }: { items: KeyValue[]; names: Record<string, string>; label: string }) {
  const { t } = useI18n()
  const total = items.reduce((s, i) => s + i.value, 0)
  if (!total) return <p className="text-sm text-stone">{t.analytics.empty}</p>
  const top = items.slice(0, 3)
  return (
    <div>
      <div
        className="flex h-7 gap-0.5"
        role="img"
        aria-label={`${label}: ${top.map((i) => `${names[i.key] ?? i.key} ${pct(i.value / total)}`).join(', ')}`}
      >
        {top.map((item, i) =>
          item.value ? (
            <div
              key={item.key}
              className="flex items-center overflow-visible rounded-[4px] px-2 text-xs font-bold text-white"
              style={{ width: `${(item.value / total) * 100}%`, background: SERIES[i] }}
              title={`${names[item.key] ?? item.key}: ${num.format(item.value)} (${pct(item.value / total)})`}
            >
              {item.value / total >= 0.14 ? pct(item.value / total) : ''}
            </div>
          ) : null,
        )}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {top.map((item, i) => (
          <li key={item.key} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: SERIES[i] }} />
            <span className="flex-1">{names[item.key] ?? item.key}</span>
            <span className="font-semibold tabular-nums">{num.format(item.value)}</span>
            <span className="w-11 text-right text-stone tabular-nums">{pct(item.value / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RankList({ items, format = (k) => k }: { items: KeyValue[]; format?: (key: string) => ReactNode }) {
  const { t } = useI18n()
  if (!items.length) return <p className="text-sm text-stone">{t.analytics.empty}</p>
  const max = items[0].value
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{format(item.key)}</span>
            <span className="font-semibold tabular-nums">{num.format(item.value)}</span>
          </div>
          <div className="mt-1">
            <Bar value={item.value} max={max} thick={4} />
          </div>
        </li>
      ))}
    </ol>
  )
}

const EVENT_ICONS: Record<string, LucideIcon> = {
  page_view: Eye,
  tour_view: MousePointerClick,
  search: Search,
  filter: Filter,
  booking_start: PencilLine,
  booking_submit: Send,
  lang_switch: Globe,
}

function pathLabel(path: string, t: Dict, tours: TourStat[] = []) {
  if (path === '/') return t.analytics.home
  if (path === '/tours') return t.analytics.toursPage
  const slug = path.match(/^\/tours\/([^/]+)$/)?.[1]
  return tours.find((tour) => tour.slug === slug)?.title ?? path
}

function eventDetail(e: RecentEvent, t: Dict, tours: TourStat[]) {
  if (e.tourTitle) return e.tourTitle
  if (e.type === 'search') return `“${e.props.q ?? ''}”`
  if (e.type === 'filter')
    return `${e.props.key}: ${t.regions[String(e.props.value)] ?? t.categories[String(e.props.value)] ?? e.props.value}`
  if (e.type === 'lang_switch') return `→ ${String(e.props.to).toUpperCase()}`
  return pathLabel(e.path, t, tours)
}

export default function Analytics({ call }: { call: Call }) {
  const { t, lang } = useI18n()
  const a = t.analytics
  const [days, setDays] = useState(30)
  const [data, setData] = useState<AnalyticsData>()
  const [loading, setLoading] = useState(true)
  const [asTable, setAsTable] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let alive = true
    setLoading(true)
    call<AnalyticsData>(`/admin/analytics?days=${days}`)
      .then((d) => {
        if (!alive) return
        setData(d)
        setNow(Date.now())
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [days, call, lang])

  if (!data) {
    return (
      <div className="grid place-items-center py-24 text-stone">
        <LoaderCircle className="size-8 animate-spin" />
      </div>
    )
  }

  const c = data.current
  const p = data.previous
  const conv = c.visitors ? c.bookings / c.visitors : 0
  const prevConv = p.visitors ? p.bookings / p.visitors : 0
  const maxViews = Math.max(1, ...data.tours.map((tr) => tr.views))
  const hasAny = c.pageViews > 0 || data.recent.length > 0

  return (
    <div className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-stone">
          <ShieldCheck className="size-4 shrink-0" /> {a.privacy}
        </p>
        <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-mist" role="group" aria-label={a.title}>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={days === d}
              onClick={() => setDays(d)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${days === d ? 'bg-ink text-white' : 'text-stone hover:text-ink'}`}
            >
              {a.range(d)}
            </button>
          ))}
        </div>
      </div>

      {!hasAny && <p className="rounded-2xl bg-white p-5 text-stone ring-1 ring-mist">{a.emptyAll}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={a.visitors} value={num.format(c.visitors)}>
          <Delta cur={c.visitors} prev={p.visitors} days={days} />
        </Stat>
        <Stat label={a.pageViews} value={num.format(c.pageViews)}>
          <Delta cur={c.pageViews} prev={p.pageViews} days={days} />
        </Stat>
        <Stat label={a.tourViews} value={num.format(c.tourViews)}>
          <Delta cur={c.tourViews} prev={p.tourViews} days={days} />
        </Stat>
        <Stat label={a.bookings} value={num.format(c.bookings)}>
          <Delta cur={c.bookings} prev={p.bookings} days={days} />
        </Stat>
        <Stat label={a.conversion} value={pct(conv)} hint={a.conversionHint}>
          {p.visitors ? (
            <Delta cur={conv} prev={prevConv} days={days} points />
          ) : (
            <Delta cur={0} prev={0} days={days} />
          )}
        </Stat>
      </div>

      <Panel
        title={a.dailyTitle}
        sub={a.dailySub}
        action={
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            className="rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-mist hover:ring-ink"
          >
            {asTable ? a.showChart : a.showTable}
          </button>
        }
      >
        {asTable ? <DailyTable data={data.daily} /> : <DailyChart data={data.daily} />}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title={a.topTours}>
          {data.tours.length ? (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="text-xs text-stone">
                  <tr>
                    <th className="px-2 pb-2 font-semibold">{a.tour}</th>
                    <th className="px-2 pb-2 text-right font-semibold">{a.views}</th>
                    <th className="px-2 pb-2 text-right font-semibold">{a.uniqueViewers}</th>
                    <th className="px-2 pb-2 text-right font-semibold">{a.starts}</th>
                    <th className="px-2 pb-2 text-right font-semibold">{a.bookings}</th>
                    <th className="px-2 pb-2 text-right font-semibold">{a.conv}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist tabular-nums">
                  {data.tours.map((tr) => (
                    <tr key={tr.id}>
                      <td className="px-2 py-2.5">
                        <Link to={`/tours/${tr.slug}`} target="_blank" className="font-semibold hover:text-ember">
                          {tr.title}
                        </Link>
                        <div className="mt-1.5">
                          <Bar value={tr.views} max={maxViews} thick={6} />
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-right font-bold">{num.format(tr.views)}</td>
                      <td className="px-2 py-2.5 text-right">{num.format(tr.visitors)}</td>
                      <td className="px-2 py-2.5 text-right">{num.format(tr.starts)}</td>
                      <td className="px-2 py-2.5 text-right">{num.format(tr.bookings)}</td>
                      <td className="px-2 py-2.5 text-right text-stone">
                        {tr.visitors ? pct(tr.bookings / tr.visitors) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-stone">{a.empty}</p>
          )}
        </Panel>
        <Panel title={a.funnel} sub={a.funnelSub}>
          <Funnel f={data.funnel} />
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel title={a.devices}>
          <Segmented items={data.devices} names={a.device} label={a.devices} />
        </Panel>
        <Panel title={a.languages}>
          <Segmented items={data.langs} names={a.language} label={a.languages} />
        </Panel>
        <Panel title={a.referrers}>
          <RankList items={data.referrers} />
        </Panel>
        <Panel title={a.searches}>
          <RankList items={data.searches} format={(k) => `“${k}”`} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Panel title={a.pages}>
          <RankList items={data.pages} format={(k) => pathLabel(k, t, data.tours)} />
        </Panel>
        <Panel title={a.recent}>
          {data.recent.length ? (
            <ul className="max-h-80 divide-y divide-mist overflow-y-auto pr-1">
              {data.recent.map((e) => {
                const Icon = EVENT_ICONS[e.type] ?? CalendarCheck
                const mins = Math.max(0, Math.floor((now - new Date(e.createdAt).getTime()) / 60000))
                return (
                  <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full ${
                        e.type === 'booking_submit' ? 'bg-ember text-white' : 'bg-sand text-ink'
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{a.events[e.type] ?? e.type}</p>
                      <p className="truncate text-stone">{eventDetail(e, t, data.tours)}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-stone">
                      <p>{a.ago(mins)}</p>
                      <p>
                        {a.device[e.device] ?? e.device} · {e.lang.toUpperCase()}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-stone">{a.empty}</p>
          )}
        </Panel>
      </div>
    </div>
  )
}
