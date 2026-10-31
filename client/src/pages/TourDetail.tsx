import {
  ArrowLeft,
  Calendar,
  Check,
  CircleCheck,
  Clock,
  LoaderCircle,
  MapPin,
  Minus,
  Plus,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Rating } from '../components/TourCard'
import { api, useApi, type Tour } from '../lib/api'
import { formatDate, formatPrice, tomorrowIso, unsplash } from '../lib/format'
import { useI18n } from '../lib/i18n'
import { track } from '../lib/track'

function Gallery({ tour }: { tour: Tour }) {
  const [main, ...rest] = tour.images
  return (
    <div className="grid h-[22rem] gap-3 sm:h-[30rem] sm:grid-cols-[2fr_1fr] sm:grid-rows-2">
      <img
        src={unsplash(main, 1600)}
        alt={tour.title}
        className={`size-full rounded-3xl object-cover sm:row-span-2 ${rest.length === 0 ? 'sm:col-span-2' : ''}`}
      />
      {/* 2 зурагтай бол хоёр дахь нь баруун баганыг бүтэн дүүргэнэ */}
      {rest.slice(0, 2).map((src) => (
        <img
          key={src}
          src={unsplash(src, 800)}
          alt=""
          loading="lazy"
          className={`hidden size-full rounded-3xl object-cover sm:block ${rest.length === 1 ? 'sm:row-span-2' : ''}`}
        />
      ))}
    </div>
  )
}

function Itinerary({ tour }: { tour: Tour }) {
  return (
    <ol className="relative mt-6 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[1.1rem] before:w-px before:bg-mist">
      {tour.itinerary.map((d) => (
        <li key={d.day} className="relative flex gap-5">
          <span className="z-10 grid size-9 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-semibold text-white">
            {d.day}
          </span>
          <div className="pt-1">
            <h3 className="font-bold">{d.title}</h3>
            <p className="mt-1 text-stone">{d.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

interface BookingResult {
  reference: string
  totalPrice: number
}

function BookingCard({ tour }: { tour: Tour }) {
  const { t } = useI18n()
  const [guests, setGuests] = useState(2)
  const [form, setForm] = useState({ startDate: '', fullName: '', email: '', phone: '', note: '' })
  const [status, setStatus] = useState<'idle' | 'sending'>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<BookingResult | null>(null)
  const started = useRef(false)

  const update = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const res = await api<BookingResult>('/bookings', {
        method: 'POST',
        body: JSON.stringify({ tourId: tour.id, guests, ...form }),
      })
      setResult(res)
      track('booking_submit', { tourId: tour.id, props: { guests } })
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setStatus('idle')
    }
  }

  if (result) {
    return (
      <div className="rounded-3xl bg-white p-7 text-center shadow-xl shadow-ink/5 ring-1 ring-mist" role="status">
        <CircleCheck className="mx-auto size-14 text-emerald-600" />
        <h2 className="mt-4 font-display text-2xl font-semibold">{t.booking.successTitle}</h2>
        <p className="mt-2 text-stone">{t.booking.successText}</p>
        <dl className="mt-6 space-y-2 rounded-2xl bg-sand p-5 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-stone">{t.booking.reference}</dt>
            <dd className="font-bold">{result.reference}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">{t.booking.start}</dt>
            <dd className="font-bold">{formatDate(form.startDate)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">{t.booking.totalAmount}</dt>
            <dd className="font-bold">{formatPrice(result.totalPrice)}</dd>
          </div>
        </dl>
      </div>
    )
  }

  const input =
    'mt-1.5 w-full rounded-xl bg-sand px-4 py-3 font-medium outline-none ring-1 ring-transparent focus:bg-white focus:ring-ink'

  return (
    <form
      onSubmit={submit}
      onFocus={() => {
        if (started.current) return
        started.current = true
        track('booking_start', { tourId: tour.id })
      }}
      className="rounded-3xl bg-white p-6 shadow-xl shadow-ink/5 ring-1 ring-mist sm:p-7">
      <p className="text-sm text-stone">{t.booking.pricePerPerson}</p>
      <p className="font-display text-3xl font-semibold">{formatPrice(tour.price)}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" /> {t.booking.startDate}
          </span>
          <input type="date" required min={tomorrowIso()} value={form.startDate} onChange={update('startDate')} className={input} />
        </label>
        <div className="text-sm font-semibold">
          <span className="flex items-center gap-1.5">
            <Users className="size-4" /> {t.booking.guests}
          </span>
          <div className="mt-1.5 flex items-center justify-between rounded-xl bg-sand px-2 py-1.5">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1}
              className="grid size-9 place-items-center rounded-lg hover:bg-white disabled:opacity-30"
              aria-label={t.booking.minus}
            >
              <Minus className="size-4" />
            </button>
            <span className="text-base font-bold" aria-live="polite">
              {guests}
            </span>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(tour.maxGroup, g + 1))}
              disabled={guests >= tour.maxGroup}
              className="grid size-9 place-items-center rounded-lg hover:bg-white disabled:opacity-30"
              aria-label={t.booking.plus}
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <label className="mt-4 block text-sm font-semibold">
        {t.booking.fullName}
        <input required autoComplete="name" value={form.fullName} onChange={update('fullName')} className={input} />
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <label className="block text-sm font-semibold">
          {t.booking.email}
          <input type="email" required autoComplete="email" value={form.email} onChange={update('email')} className={input} />
        </label>
        <label className="block text-sm font-semibold">
          {t.booking.phone}
          <input type="tel" required autoComplete="tel" placeholder="9911 2233" value={form.phone} onChange={update('phone')} className={input} />
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold">
        {t.booking.note} <span className="font-normal text-stone">{t.booking.optional}</span>
        <textarea rows={2} value={form.note} onChange={update('note')} className={`${input} resize-none`} />
      </label>

      <div className="mt-6 space-y-2 border-t border-mist pt-5 text-sm">
        <div className="flex justify-between text-stone">
          <span>
            {formatPrice(tour.price)} × {t.booking.persons(guests)}
          </span>
          <span>{formatPrice(tour.price * guests)}</span>
        </div>
        <div className="flex justify-between text-base font-extrabold">
          <span>{t.booking.total}</span>
          <span>{formatPrice(tour.price * guests)}</span>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ember py-4 font-bold text-white transition hover:bg-ember-dark disabled:opacity-60"
      >
        {status === 'sending' && <LoaderCircle className="size-5 animate-spin" />}
        {t.booking.submit}
      </button>
      <p className="mt-3 text-center text-xs text-stone">{t.booking.noPayment}</p>
    </form>
  )
}

export default function TourDetail() {
  const { t } = useI18n()
  const { slug } = useParams()
  const { data: tour, error, loading } = useApi<Tour>(`/tours/${slug}`)
  const tourId = tour?.id
  useEffect(() => {
    if (tourId) track('tour_view', { tourId })
  }, [tourId])

  if (loading && !tour) {
    return (
      <div className="container-page animate-pulse pt-28">
        <div className="h-10 w-2/3 rounded bg-mist" />
        <div className="mt-8 h-[30rem] rounded-3xl bg-mist" />
      </div>
    )
  }
  if (error || !tour) {
    return (
      <div className="container-page pt-40 text-center">
        <h1 className="font-display text-3xl font-semibold">{t.tour.notFound}</h1>
        <p className="mt-3 text-stone">{error}</p>
        <Link to="/tours" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 font-bold text-white">
          {t.tour.backToAll}
        </Link>
      </div>
    )
  }

  return (
    <article className="container-page pt-24">
      <Link to="/tours" className="inline-flex items-center gap-2 text-sm font-semibold text-stone hover:text-ink">
        <ArrowLeft className="size-4" /> {t.tour.back}
      </Link>
      <header className="fade-up mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">{tour.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-stone">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-ember" /> {t.tour.region(t.regions[tour.region] ?? tour.region)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-ember" /> {t.days(tour.durationDays)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-ember" /> {t.tour.upTo(tour.maxGroup)}
            </span>
            <span className="text-ink">
              <Rating value={tour.rating} count={tour.reviewCount} />
            </span>
          </div>
        </div>
        <span className="rounded-full bg-sage/60 px-4 py-2 text-sm font-bold text-moss">{t.categories[tour.category] ?? tour.category}</span>
      </header>

      <div className="fade-up mt-8 [animation-delay:100ms]">
        <Gallery tour={tour} />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0">
          <section>
            <h2 className="font-display text-2xl font-semibold">{t.tour.about}</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/80">{tour.description}</p>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold">{t.tour.highlights}</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {tour.highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 rounded-2xl bg-cream p-4 font-semibold ring-1 ring-mist">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ember/10 text-ember">
                    <Check className="size-4" />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold">{t.tour.itinerary}</h2>
            <Itinerary tour={tour} />
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold">{t.tour.includes}</h2>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {tour.includes.map((i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <CircleCheck className="size-5 shrink-0 text-emerald-600" />
                  {i}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside id="book" className="lg:sticky lg:top-24 lg:self-start">
          <BookingCard tour={tour} />
        </aside>
      </div>
    </article>
  )
}
