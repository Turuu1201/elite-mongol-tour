import { ArrowUpRight, Clock, MapPin, Star } from 'lucide-react'
import { Link } from 'react-router'
import type { Tour } from '../lib/api'
import { formatPrice, unsplash } from '../lib/format'
import { useI18n } from '../lib/i18n'

export function Rating({ value, count, light = false }: { value: number; count?: number; light?: boolean }) {
  const { t } = useI18n()
  // Сэтгэгдэлгүй шинэ аялалд үнэлгээний оронд "Шинэ" тэмдэг
  if (count === 0) {
    return (
      <span className="rounded-full bg-ember px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase">{t.newTour}</span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold">
      <Star className="size-4 fill-amber-400 text-amber-400" />
      {value.toFixed(1)}
      {count !== undefined && <span className={light ? 'text-white/70' : 'text-stone'}>({count})</span>}
    </span>
  )
}

export function TourCard({ tour }: { tour: Tour }) {
  const { t } = useI18n()
  return (
    <Link to={`/tours/${tour.slug}`} className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-mist">
        <img
          src={unsplash(tour.images[0], 900)}
          alt={tour.title}
          loading="lazy"
          className="size-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold backdrop-blur">
          <MapPin className="size-3.5 text-ember" />
          {t.regions[tour.region] ?? tour.region}
        </span>
        <span className="absolute right-4 bottom-4 grid size-11 translate-y-2 place-items-center rounded-full bg-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-5" />
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm text-stone">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-4" />
          {t.days(tour.durationDays)}
        </span>
        <span>·</span>
        <span>{t.categories[tour.category] ?? tour.category}</span>
        <span className="ml-auto text-ink">
          <Rating value={tour.rating} count={tour.reviewCount} />
        </span>
      </div>
      <h3 className="mt-2 font-display text-lg leading-snug font-semibold group-hover:text-ember-dark">{tour.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-stone">{tour.summary}</p>
      <p className="mt-3 text-lg font-extrabold">
        {formatPrice(tour.price)} <span className="text-sm font-medium text-stone">{t.perPerson}</span>
      </p>
    </Link>
  )
}

export function TourCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] rounded-3xl bg-mist" />
      <div className="mt-4 h-4 w-1/2 rounded bg-mist" />
      <div className="mt-3 h-6 w-3/4 rounded bg-mist" />
      <div className="mt-3 h-4 w-full rounded bg-mist" />
    </div>
  )
}
