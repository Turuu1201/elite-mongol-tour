import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { TourCard, TourCardSkeleton } from '../components/TourCard'
import { useApi, type Tour } from '../lib/api'
import { CATEGORIES, DURATIONS, REGIONS, SORTS } from '../lib/catalog'
import { useI18n } from '../lib/i18n'
import { track } from '../lib/track'

const FILTER_KEYS = ['q', 'region', 'category', 'duration', 'sort'] as const

export default function Tours() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  const query = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const v = params.get(key)
    if (v) query.set(key, v)
  }
  const { data, loading, error } = useApi<Tour[]>(`/tours?${query}`)

  function set(key: string, value: string) {
    if (key !== 'q' && value) track('filter', { props: { key, value } })
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  // Хайлтыг бичиж дуусах хүртэл бага зэрэг хүлээнэ
  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.get('q') ?? '') === q.trim()) return
      if (q.trim().length >= 2) track('search', { props: { q: q.trim().slice(0, 100) } })
      set('q', q.trim())
    }, 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const region = params.get('region') ?? ''
  const active = FILTER_KEYS.filter((k) => k !== 'sort' && params.get(k)).length

  const pill = (on: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
      on ? 'bg-ink text-white' : 'bg-cream text-ink ring-1 ring-mist hover:ring-ink'
    }`
  const select =
    'rounded-full bg-cream py-2.5 pr-9 pl-4 text-sm font-semibold ring-1 ring-mist outline-none focus:ring-2 focus:ring-ink'

  return (
    <div className="container-page pt-28">
      <header className="fade-up">
        <p className="text-sm font-bold tracking-widest text-ember uppercase">{t.tours.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{t.tours.title}</h1>
        <p className="mt-4 max-w-xl text-lg text-stone">
          {t.tours.subtitle}
        </p>
      </header>

      <div className="sticky top-18 z-30 -mx-4 mt-10 border-b border-mist bg-sand/90 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:border sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.tours.searchPlaceholder}
              className="w-full rounded-full bg-white py-3 pr-4 pl-12 font-medium ring-1 ring-mist outline-none focus:ring-2 focus:ring-ink"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="size-5 text-stone" />
            <select aria-label={t.tours.typeLabel} value={params.get('category') ?? ''} onChange={(e) => set('category', e.target.value)} className={select}>
              <option value="">{t.tours.allTypes}</option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {t.categories[c.name]}
                </option>
              ))}
            </select>
            <select aria-label={t.tours.durationLabel} value={params.get('duration') ?? ''} onChange={(e) => set('duration', e.target.value)} className={select}>
              <option value="">{t.tours.allDurations}</option>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {t.durations[d]}
                </option>
              ))}
            </select>
            <select aria-label={t.tours.sortLabel} value={params.get('sort') ?? 'popular'} onChange={(e) => set('sort', e.target.value === 'popular' ? '' : e.target.value)} className={select}>
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {t.sorts[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          <button type="button" onClick={() => set('region', '')} className={pill(!region)}>
            {t.tours.allRegions}
          </button>
          {REGIONS.map((r) => (
            <button key={r} type="button" onClick={() => set('region', region === r ? '' : r)} className={pill(region === r)}>
              {t.regions[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between text-sm">
        <p className="text-stone">{data ? t.tours.found(data.length) : t.tours.searching}</p>
        {active > 0 && (
          <button
            type="button"
            onClick={() => {
              setQ('')
              setParams({}, { replace: true })
            }}
            className="inline-flex items-center gap-1 font-semibold hover:text-ember"
          >
            <X className="size-4" /> {t.tours.clear}
          </button>
        )}
      </div>

      {error && <p className="mt-6 rounded-2xl bg-red-50 p-5 text-red-700">{error}</p>}

      <div className={`mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 ${loading && data ? 'opacity-60' : ''}`}>
        {!data && loading
          ? Array.from({ length: 6 }, (_, i) => <TourCardSkeleton key={i} />)
          : data?.map((tour) => <TourCard key={tour.id} tour={tour} />)}
      </div>

      {data?.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-mist p-12 text-center">
          <p className="font-display text-xl font-semibold">{t.tours.emptyTitle}</p>
          <p className="mt-2 text-stone">{t.tours.emptyText}</p>
        </div>
      )}
    </div>
  )
}
