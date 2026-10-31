import { ArrowRight, Clock, HeartHandshake, Leaf, MapPin, Search, ShieldCheck, Users } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Rating } from '../components/TourCard'
import { useApi, type Tour } from '../lib/api'
import { CATEGORIES, DURATIONS, HERO_IMAGE, REGION_IMAGES, REGIONS } from '../lib/catalog'
import { formatPrice, unsplash } from '../lib/format'
import { useI18n } from '../lib/i18n'
import { track } from '../lib/track'

function HeroSearch() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [region, setRegion] = useState('')
  const [category, setCategory] = useState('')
  const [duration, setDuration] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (region) params.set('region', region)
    if (category) params.set('category', category)
    if (duration) params.set('duration', duration)
    for (const [key, value] of params) track('filter', { props: { key, value, source: 'hero' } })
    navigate(`/tours?${params}`)
  }

  const field = 'w-full appearance-none bg-transparent font-semibold text-ink outline-none'
  return (
    <form
      onSubmit={submit}
      className="grid gap-2 rounded-[1.75rem] bg-white p-2 shadow-2xl shadow-ink/20 sm:grid-cols-[1fr_1fr_1fr_auto]"
    >
      <label className="rounded-2xl px-5 py-3 transition hover:bg-sand">
        <span className="block text-xs font-bold tracking-wide text-stone uppercase">{t.hero.where}</span>
        <select value={region} onChange={(e) => setRegion(e.target.value)} className={field}>
          <option value="">{t.hero.allRegions}</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {t.regions[r]}
            </option>
          ))}
        </select>
      </label>
      <label className="rounded-2xl px-5 py-3 transition hover:bg-sand sm:border-l sm:border-mist">
        <span className="block text-xs font-bold tracking-wide text-stone uppercase">{t.hero.type}</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
          <option value="">{t.hero.all}</option>
          {CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {t.categories[c.name]}
            </option>
          ))}
        </select>
      </label>
      <label className="rounded-2xl px-5 py-3 transition hover:bg-sand sm:border-l sm:border-mist">
        <span className="block text-xs font-bold tracking-wide text-stone uppercase">{t.hero.duration}</span>
        <select value={duration} onChange={(e) => setDuration(e.target.value)} className={field}>
          <option value="">{t.hero.any}</option>
          {DURATIONS.map((d) => (
            <option key={d} value={d}>
              {t.durations[d]}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-2xl bg-ember px-7 py-4 font-bold text-white transition hover:bg-ember-dark"
      >
        <Search className="size-5" />
        {t.hero.search}
      </button>
    </form>
  )
}

function Hero() {
  const { t } = useI18n()
  return (
    <section className="p-2 sm:p-3">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-ink sm:rounded-[2.5rem]">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-80" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/60 via-ink/20 to-ink/80" />
        <div className="container-page flex min-h-[min(92svh,60rem)] flex-col justify-end pt-32 pb-10 sm:pb-14">
          <div className="fade-up max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur">
              <span className="size-2 rounded-full bg-ember" />
              {t.hero.badge}
            </span>
            <h1 className="mt-6 font-display text-4xl leading-[1.08] font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t.hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">{t.hero.subtitle}</p>
          </div>
          <div className="fade-up mt-10 [animation-delay:150ms]">
            <HeroSearch />
          </div>
          <dl className="fade-up mt-8 grid grid-cols-3 gap-4 text-white [animation-delay:300ms] sm:max-w-lg">
            {t.hero.stats.map(([v, l]) => (
              <div key={l}>
                <dt className="font-display text-2xl font-semibold sm:text-3xl">{v}</dt>
                <dd className="text-sm text-white/70">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-bold tracking-widest text-ember uppercase">{eyebrow}</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}

function Categories() {
  const { t } = useI18n()
  return (
    <section className="container-page mt-16">
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {CATEGORIES.map(({ name, icon: Icon }) => (
          <Link
            key={name}
            to={`/tours?category=${encodeURIComponent(name)}`}
            className="flex shrink-0 items-center gap-2.5 rounded-full border border-mist bg-cream px-5 py-3 font-semibold transition hover:border-ink hover:bg-white"
          >
            <Icon className="size-5 text-ember" />
            {t.categories[name]}
          </Link>
        ))}
      </div>
    </section>
  )
}

function FeatureTile({ tour, big = false }: { tour: Tour; big?: boolean }) {
  const { t } = useI18n()
  return (
    <Link
      to={`/tours/${tour.slug}`}
      className={`group relative isolate flex min-h-72 flex-col justify-end overflow-hidden rounded-3xl p-6 text-white ${
        big ? 'md:col-span-2 md:row-span-2 md:p-8' : ''
      }`}
    >
      <img
        src={unsplash(tour.images[0], big ? 1400 : 800)}
        alt={tour.title}
        loading="lazy"
        className="absolute inset-0 -z-10 size-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
      <div className="flex items-center gap-3 text-sm text-white/85">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-4" />
          {t.regions[tour.region] ?? tour.region}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-4" />
          {t.days(tour.durationDays)}
        </span>
        <Rating value={tour.rating} count={tour.reviewCount === 0 ? 0 : undefined} light />
      </div>
      <h3 className={`mt-2 font-display font-semibold ${big ? 'text-2xl sm:text-4xl' : 'text-xl'}`}>{tour.title}</h3>
      {big && <p className="mt-3 max-w-md text-white/80">{tour.summary}</p>}
      <p className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur">
        {t.fromPrice(formatPrice(tour.price))}
        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </p>
    </Link>
  )
}

function Featured() {
  const { t } = useI18n()
  const { data, loading, error } = useApi<Tour[]>('/tours?featured=1')
  const tours = data?.slice(0, 5) ?? []
  return (
    <section className="container-page mt-20">
      <SectionHeading
        eyebrow={t.home.featuredEyebrow}
        title={t.home.featuredTitle}
        action={
          <Link to="/tours" className="inline-flex items-center gap-2 font-bold hover:text-ember">
            {t.home.allTours} <ArrowRight className="size-5" />
          </Link>
        }
      />
      {error && <p className="mt-10 rounded-2xl bg-red-50 p-5 text-red-700">{error}</p>}
      <div className="mt-10 grid auto-rows-[18rem] gap-4 md:grid-cols-4">
        {loading && !data
          ? Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={`animate-pulse rounded-3xl bg-mist ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`} />
            ))
          : tours.map((tour, i) => <FeatureTile key={tour.id} tour={tour} big={i === 0} />)}
      </div>
    </section>
  )
}

const REASON_ICONS = [Users, HeartHandshake, Leaf, ShieldCheck]

function Why() {
  const { t } = useI18n()
  return (
    <section id="why" className="container-page mt-24 scroll-mt-24">
      <div className="grid gap-10 overflow-hidden rounded-[2rem] bg-moss p-8 text-white sm:p-12 lg:grid-cols-[1fr_1.4fr] lg:p-16">
        <div>
          <p className="text-sm font-bold tracking-widest text-sage uppercase">{t.home.whyEyebrow}</p>
          <h2 className="mt-3 font-display text-3xl leading-tight font-semibold sm:text-4xl">{t.home.whyTitle}</h2>
          <p className="mt-5 text-white/70">{t.home.whyText}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {t.home.reasons.map(({ title, text }, i) => {
            const Icon = REASON_ICONS[i]
            return (
              <div key={title} className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10">
                <span className="grid size-12 place-items-center rounded-2xl bg-ember">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-white/70">{text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Regions() {
  const { t } = useI18n()
  return (
    <section id="regions" className="container-page mt-24 scroll-mt-24">
      <SectionHeading eyebrow={t.home.regionsEyebrow} title={t.home.regionsTitle} />
      <div className="no-scrollbar -mx-4 mt-10 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
        {REGIONS.map((r) => (
          <Link
            key={r}
            to={`/tours?region=${encodeURIComponent(r)}`}
            className="group relative isolate flex aspect-[3/4] w-60 shrink-0 snap-start flex-col justify-end overflow-hidden rounded-3xl p-5 text-white sm:w-auto"
          >
            <img
              src={unsplash(REGION_IMAGES[r], 700)}
              alt=""
              loading="lazy"
              className="absolute inset-0 -z-10 size-full object-cover transition duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/80 to-transparent" />
            <h3 className="font-display text-xl font-semibold">{t.regions[r]}</h3>
            <p className="text-sm text-white/80">{t.regionBlurbs[r]}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

const avatar = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=160&h=160&q=80`

const AVATARS = [
  avatar('1494790108377-be9c29b29330'),
  avatar('1500648767791-00dcc994a43e'),
  avatar('1438761681033-6461ffad8d80'),
]

function Testimonials() {
  const { t } = useI18n()
  return (
    <section className="container-page mt-24">
      <SectionHeading eyebrow={t.home.testimonialsEyebrow} title={t.home.testimonialsTitle} />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {t.home.testimonials.map((item, i) => (
          <figure key={item.name} className="flex flex-col rounded-3xl border border-mist bg-cream p-7">
            <Rating value={5} />
            <blockquote className="mt-4 flex-1 text-lg leading-relaxed">“{item.text}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <img src={AVATARS[i]} alt="" loading="lazy" className="size-12 rounded-full object-cover" />
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-sm text-stone">{item.trip}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function Cta() {
  const { t } = useI18n()
  const { data } = useApi<Tour[]>('/tours?sort=price-asc')
  const cheapest = data?.[0]
  return (
    <section className="container-page mt-24">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-ember px-8 py-14 text-white sm:px-14">
        <div className="absolute -top-24 -right-24 -z-10 size-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 left-1/3 -z-10 size-72 rounded-full bg-ember-dark/60" />
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <h2 className="max-w-xl font-display text-3xl leading-tight font-semibold sm:text-4xl">{t.home.ctaTitle}</h2>
            <p className="mt-3 text-white/85">
              {cheapest ? t.home.ctaText(cheapest.title, formatPrice(cheapest.price)) : t.home.ctaFallback}
            </p>
          </div>
          <Link
            to={cheapest ? `/tours/${cheapest.slug}` : '/tours'}
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-bold text-ink transition hover:bg-sand"
          >
            {t.home.ctaButton} <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <Featured />
      <Why />
      <Regions />
      <Testimonials />
      <Cta />
    </>
  )
}
