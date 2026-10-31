import {
  CalendarClock,
  CircleCheck,
  Hourglass,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Logo } from '../components/Layout'
import TourForm from '../components/TourForm'
import Analytics from '../components/Analytics'
import { api, ApiError, type AdminBooking, type AdminStats, type AdminTour, type BookingStatus } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import { LangSwitch, useI18n } from '../lib/i18n'

const TOKEN_KEY = 'emt-admin-token'

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function saveToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // хувийн цонхонд sessionStorage ажиллахгүй байж болно
  }
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const { t } = useI18n()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { token } = await api<{ token: string }>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      onLogin(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-svh place-items-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl shadow-ink/5 ring-1 ring-mist"
      >
        <div className="flex items-center justify-between">
          <Logo />
          <LangSwitch />
        </div>
        <h1 className="mt-8 font-display text-2xl font-semibold">{t.admin.loginTitle}</h1>
        <label className="mt-6 block text-sm font-semibold">
          {t.admin.password}
          <input
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl bg-sand px-4 py-3 outline-none focus:bg-white focus:ring-1 focus:ring-ink"
          />
        </label>
        {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-bold text-white disabled:opacity-60"
        >
          {busy && <LoaderCircle className="size-5 animate-spin" />}
          {t.admin.signIn}
        </button>
        <Link to="/" className="mt-4 block text-center text-sm text-stone hover:text-ink">
          {t.admin.backHome}
        </Link>
      </form>
    </div>
  )
}

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-stone/15 text-stone',
}

const STATUSES = Object.keys(STATUS_STYLE) as BookingStatus[]

function StatTile({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-mist">
      <div className="flex items-center gap-2 text-sm font-semibold text-stone">
        <Icon className="size-4" /> {label}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-emerald-600' : 'bg-mist'}`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? 'left-5.5' : 'left-0.5'}`}
      />
    </button>
  )
}

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const { t, lang } = useI18n()
  const [tab, setTab] = useState<'analytics' | 'bookings' | 'tours'>('analytics')
  // null: жагсаалт, 'new': шинэ аялал, тоо: тухайн аяллыг засах
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [filter, setFilter] = useState<BookingStatus | ''>('')
  const [data, setData] = useState<{ stats: AdminStats; bookings: AdminBooking[] }>()
  const [tours, setTours] = useState<AdminTour[]>()
  const [error, setError] = useState('')

  const call = useCallback(
    async <T,>(path: string, init?: RequestInit) => {
      try {
        return await api<T>(path, { ...init, token })
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) onLogout()
        setError(err instanceof Error ? err.message : String(err))
        throw err
      }
    },
    [token, onLogout],
  )

  const load = useCallback(async () => {
    setError('')
    const [b, t] = await Promise.all([
      call<{ stats: AdminStats; bookings: AdminBooking[] }>('/admin/bookings'),
      call<AdminTour[]>('/admin/tours'),
    ])
    setData(b)
    setTours(t)
  }, [call])

  // Хэл солиход аяллын нэрийг тухайн хэлээр дахин татна
  useEffect(() => {
    load().catch(() => {})
  }, [load, lang])

  async function setStatus(id: number, status: BookingStatus) {
    await call(`/admin/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    await load()
  }

  async function patchTour(id: number, patch: Partial<Pick<AdminTour, 'active' | 'featured'>>) {
    setTours((ts) => ts?.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    await call(`/admin/tours/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).catch(() => load())
  }

  const bookings = data?.bookings.filter((b) => !filter || b.status === filter) ?? []
  const tabClass = (on: boolean) =>
    `rounded-full px-5 py-2 text-sm font-bold transition ${on ? 'bg-ink text-white' : 'text-stone hover:text-ink'}`

  return (
    <div className="min-h-svh">
      <header className="border-b border-mist bg-cream">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-bold text-stone">{t.admin.badge}</span>
          </div>
          <div className="flex items-center gap-1">
            <LangSwitch />
            <button
              type="button"
              onClick={() => load().catch(() => {})}
              className="grid size-10 place-items-center rounded-full hover:bg-ink/5"
              aria-label={t.admin.refresh}
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold hover:bg-ink/5"
            >
              <LogOut className="size-4" /> {t.admin.signOut}
            </button>
          </div>
        </div>
      </header>

      <div className="container-page py-8">
        {error && <p className="mb-6 rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>}

        {editing !== null ? (
          <TourForm
            key={editing}
            tourId={editing === 'new' ? null : editing}
            call={call}
            onDone={() => {
              setEditing(null)
              load().catch(() => {})
            }}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-mist">
                <button type="button" className={tabClass(tab === 'analytics')} onClick={() => setTab('analytics')}>
                  {t.analytics.tab}
                </button>
                <button type="button" className={tabClass(tab === 'bookings')} onClick={() => setTab('bookings')}>
                  {t.admin.bookingsTab}
                </button>
                <button type="button" className={tabClass(tab === 'tours')} onClick={() => setTab('tours')}>
                  {t.admin.toursTab}
                </button>
              </div>
              {tab === 'bookings' && (
                <select
                  aria-label={t.admin.filterStatus}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as BookingStatus | '')}
                  className="rounded-full bg-white py-2 pr-9 pl-4 text-sm font-semibold ring-1 ring-mist"
                >
                  <option value="">{t.admin.allStatuses}</option>
                  {STATUSES.map((k) => (
                    <option key={k} value={k}>
                      {t.admin.status[k]}
                    </option>
                  ))}
                </select>
              )}
              {tab === 'tours' && (
                <button
                  type="button"
                  onClick={() => setEditing('new')}
                  className="inline-flex items-center gap-2 rounded-full bg-ember px-5 py-2.5 text-sm font-bold text-white hover:bg-ember-dark"
                >
                  <Plus className="size-4" /> {t.admin.addTour}
                </button>
              )}
            </div>

            {tab === 'analytics' ? (
              <div className="mt-4">
                <Analytics call={call} />
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatTile icon={CalendarClock} label={t.admin.totalBookings} value={data?.stats.total ?? '—'} />
                  <StatTile icon={Hourglass} label={t.admin.pending} value={data?.stats.pending ?? '—'} />
                  <StatTile icon={CircleCheck} label={t.admin.upcoming} value={data?.stats.upcoming ?? '—'} />
                  <StatTile
                    icon={Wallet}
                    label={t.admin.revenue}
                    value={data ? formatPrice(data.stats.revenue) : '—'}
                  />
                </div>

                <div className="mt-4 overflow-x-auto rounded-3xl bg-white ring-1 ring-mist">
                  {tab === 'bookings' ? (
                    <table className="w-full min-w-[56rem] text-left text-sm">
                      <thead className="border-b border-mist text-xs font-bold tracking-wide text-stone uppercase">
                        <tr>
                          <th className="px-5 py-4">{t.admin.cols.reference}</th>
                          <th className="px-5 py-4">{t.admin.cols.customer}</th>
                          <th className="px-5 py-4">{t.admin.cols.tour}</th>
                          <th className="px-5 py-4">{t.admin.cols.date}</th>
                          <th className="px-5 py-4 text-right">{t.admin.cols.amount}</th>
                          <th className="px-5 py-4">{t.admin.cols.status}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-mist">
                        {bookings.map((b) => (
                          <tr key={b.id} className="align-top">
                            <td className="px-5 py-4 font-bold whitespace-nowrap">{b.reference}</td>
                            <td className="px-5 py-4">
                              <p className="font-semibold">{b.fullName}</p>
                              <p className="text-stone">
                                <a href={`mailto:${b.email}`} className="hover:text-ink">
                                  {b.email}
                                </a>{' '}
                                ·{' '}
                                <a href={`tel:${b.phone}`} className="hover:text-ink">
                                  {b.phone}
                                </a>
                              </p>
                              {b.note && <p className="mt-1 max-w-xs text-stone italic">“{b.note}”</p>}
                            </td>
                            <td className="px-5 py-4">
                              <Link to={`/tours/${b.tourSlug}`} className="font-semibold hover:text-ember">
                                {b.tourTitle}
                              </Link>
                              <p className="text-stone">{t.booking.persons(b.guests)}</p>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <p className="font-semibold">{formatDate(b.startDate)}</p>
                              <p className="text-stone">
                                {t.admin.received}: {formatDate(b.createdAt)}
                              </p>
                            </td>
                            <td className="px-5 py-4 text-right font-bold whitespace-nowrap">
                              {formatPrice(b.totalPrice)}
                            </td>
                            <td className="px-5 py-4">
                              <select
                                aria-label={t.admin.statusOf(b.reference)}
                                value={b.status}
                                onChange={(e) => setStatus(b.id, e.target.value as BookingStatus).catch(() => {})}
                                className={`rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_STYLE[b.status]}`}
                              >
                                {STATUSES.map((k) => (
                                  <option key={k} value={k}>
                                    {t.admin.status[k]}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                        {data && bookings.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-5 py-12 text-center text-stone">
                              {t.admin.noBookings}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full min-w-[44rem] text-left text-sm">
                      <thead className="border-b border-mist text-xs font-bold tracking-wide text-stone uppercase">
                        <tr>
                          <th className="px-5 py-4">{t.admin.cols.tour}</th>
                          <th className="px-5 py-4">{t.admin.cols.region}</th>
                          <th className="px-5 py-4 text-right">{t.admin.cols.price}</th>
                          <th className="px-5 py-4 text-right">{t.admin.cols.bookings}</th>
                          <th className="px-5 py-4">{t.admin.cols.featured}</th>
                          <th className="px-5 py-4">{t.admin.cols.active}</th>
                          <th className="px-5 py-4" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-mist">
                        {tours?.map((tour) => (
                          <tr key={tour.id} className={tour.active ? '' : 'text-stone'}>
                            <td className="px-5 py-4 font-semibold">
                              <Link to={`/tours/${tour.slug}`} className="hover:text-ember">
                                {tour.title}
                              </Link>
                            </td>
                            <td className="px-5 py-4">{t.regions[tour.region] ?? tour.region}</td>
                            <td className="px-5 py-4 text-right whitespace-nowrap">{formatPrice(tour.price)}</td>
                            <td className="px-5 py-4 text-right">{tour.bookingCount}</td>
                            <td className="px-5 py-4">
                              <Toggle
                                on={tour.featured}
                                label={t.admin.featuredOf(tour.title)}
                                onChange={(v) => patchTour(tour.id, { featured: v })}
                              />
                            </td>
                            <td className="px-5 py-4">
                              <Toggle
                                on={tour.active}
                                label={t.admin.activeOf(tour.title)}
                                onChange={(v) => patchTour(tour.id, { active: v })}
                              />
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => setEditing(tour.id)}
                                aria-label={t.admin.editOf(tour.title)}
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-mist hover:ring-ink"
                              >
                                <Pencil className="size-3.5" /> {t.admin.edit}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Admin() {
  const [token, setToken] = useState(readToken)
  const logout = useCallback(() => {
    saveToken(null)
    setToken(null)
  }, [])

  if (!token) {
    return (
      <Login
        onLogin={(t) => {
          saveToken(t)
          setToken(t)
        }}
      />
    )
  }
  return <Dashboard token={token} onLogout={logout} />
}
