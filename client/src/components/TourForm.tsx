import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, ImageOff, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { ItineraryDay } from '../lib/api'
import { CATEGORIES, REGIONS } from '../lib/catalog'
import { LANGS, useI18n, type Lang } from '../lib/i18n'

type Call = <T>(path: string, init?: RequestInit) => Promise<T>

interface Day {
  title: string
  text: string
}

interface Content {
  title: string
  summary: string
  description: string
  highlights: string
  includes: string
  itinerary: Day[]
}

interface FormState {
  slug: string
  region: string
  category: string
  durationDays: string
  price: string
  maxGroup: string
  images: string
  featured: boolean
  active: boolean
  mn: Content
  en: Content
}

interface StoredContent {
  title?: string
  summary?: string
  description?: string
  highlights?: string[]
  includes?: string[]
  itinerary?: ItineraryDay[]
}

interface StoredTour extends Required<StoredContent> {
  slug: string
  region: string
  category: string
  durationDays: number
  price: number
  maxGroup: number
  images: string[]
  featured: boolean
  active: boolean
  translations: { en?: StoredContent }
}

const emptyContent = (): Content => ({
  title: '',
  summary: '',
  description: '',
  highlights: '',
  includes: '',
  itinerary: [{ title: '', text: '' }],
})

const EMPTY: FormState = {
  slug: '',
  region: REGIONS[0],
  category: CATEGORIES[0].name,
  durationDays: '1',
  price: '',
  maxGroup: '12',
  images: '',
  featured: false,
  active: true,
  mn: emptyContent(),
  en: { ...emptyContent(), itinerary: [] },
}

const toContent = (c: StoredContent): Content => ({
  title: c.title ?? '',
  summary: c.summary ?? '',
  description: c.description ?? '',
  highlights: (c.highlights ?? []).join('\n'),
  includes: (c.includes ?? []).join('\n'),
  itinerary: (c.itinerary ?? []).map(({ title, text }) => ({ title, text })),
})

const fromStored = (t: StoredTour): FormState => ({
  slug: t.slug,
  region: t.region,
  category: t.category,
  durationDays: String(t.durationDays),
  price: String(t.price),
  maxGroup: String(t.maxGroup),
  images: t.images.join('\n'),
  featured: t.featured,
  active: t.active,
  mn: toContent(t),
  en: toContent(t.translations.en ?? {}),
})

const splitLines = (s: string) =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

const toPayloadContent = (c: Content) => ({
  title: c.title,
  summary: c.summary,
  description: c.description,
  highlights: splitLines(c.highlights),
  includes: splitLines(c.includes),
  // Хоосон өдрүүдийг (гарчиг, тайлбаргүй) хаяна
  itinerary: c.itinerary.filter((d) => d.title.trim() || d.text.trim()),
})

// Монгол кирилл → латин (одоо байгаа аяллын URL-уудын хэв маягаар: ө, ү → u, х → kh)
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'ye', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', ө: 'u', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ү: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: 'i', э: 'e', ю: 'yu', я: 'ya',
}

function slugify(text: string) {
  return [...text.toLowerCase()]
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const input =
  'mt-1.5 w-full rounded-xl bg-sand px-4 py-2.5 font-medium outline-none ring-1 ring-transparent focus:bg-white focus:ring-ink'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-stone">{hint}</span>}
    </label>
  )
}

function Card({ title, hint, children, action }: { title: string; hint?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-mist">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {hint && <p className="mt-1 text-sm text-stone">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}

function ItineraryEditor({ days, onChange }: { days: Day[]; onChange: (days: Day[]) => void }) {
  const { t } = useI18n()
  const update = (i: number, patch: Partial<Day>) => onChange(days.map((d, j) => (j === i ? { ...d, ...patch } : d)))
  const move = (i: number, dir: -1 | 1) => {
    const next = [...days]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    onChange(next)
  }
  const iconBtn = 'grid size-8 place-items-center rounded-lg text-stone hover:bg-sand hover:text-ink disabled:opacity-30'

  return (
    <div className="space-y-3">
      {days.map((d, i) => (
        <div key={i} className="flex gap-3 rounded-2xl bg-sand/60 p-3">
          <span className="mt-2 grid size-8 shrink-0 place-items-center rounded-full bg-ink font-display text-xs font-semibold text-white">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              aria-label={`${t.tourForm.day(i + 1)}: ${t.tourForm.dayTitle}`}
              placeholder={t.tourForm.dayTitle}
              value={d.title}
              onChange={(e) => update(i, { title: e.target.value })}
              className="w-full rounded-lg bg-white px-3 py-2 font-semibold outline-none ring-1 ring-mist focus:ring-ink"
            />
            <textarea
              aria-label={`${t.tourForm.day(i + 1)}: ${t.tourForm.dayText}`}
              placeholder={t.tourForm.dayText}
              rows={2}
              value={d.text}
              onChange={(e) => update(i, { text: e.target.value })}
              className="w-full resize-y rounded-lg bg-white px-3 py-2 text-sm outline-none ring-1 ring-mist focus:ring-ink"
            />
          </div>
          <div className="flex flex-col gap-1">
            <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label={t.tourForm.moveUp}>
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              className={iconBtn}
              disabled={i === days.length - 1}
              onClick={() => move(i, 1)}
              aria-label={t.tourForm.moveDown}
            >
              <ArrowDown className="size-4" />
            </button>
            <button
              type="button"
              className={`${iconBtn} hover:text-red-600`}
              onClick={() => onChange(days.filter((_, j) => j !== i))}
              aria-label={t.tourForm.removeDay}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...days, { title: '', text: '' }])}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ring-1 ring-mist hover:ring-ink"
      >
        <Plus className="size-4" /> {t.tourForm.addDay}
      </button>
    </div>
  )
}

function ImagePreview({ url, index }: { url: string; index: number }) {
  const { t } = useI18n()
  const [failed, setFailed] = useState(false)
  return (
    <div className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-mist ${index === 0 ? 'col-span-2' : ''}`}>
      {failed ? (
        <div className="grid size-full place-items-center text-stone">
          <ImageOff className="size-6" />
        </div>
      ) : (
        <img src={url} alt={t.tourForm.imagePreview(index + 1)} onError={() => setFailed(true)} className="size-full object-cover" />
      )}
      <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold">{index + 1}</span>
    </div>
  )
}

export default function TourForm({ tourId, call, onDone }: { tourId: number | null; call: Call; onDone: () => void }) {
  const { t } = useI18n()
  const f = t.tourForm
  const [form, setForm] = useState<FormState | null>(tourId === null ? EMPTY : null)
  const [contentLang, setContentLang] = useState<Lang>('mn')
  const [slugTouched, setSlugTouched] = useState(tourId !== null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tourId === null) return
    call<StoredTour>(`/admin/tours/${tourId}`)
      .then((tour) => setForm(fromStored(tour)))
      .catch(() => {})
  }, [tourId, call])

  if (!form) {
    return (
      <div className="grid place-items-center py-24 text-stone">
        <LoaderCircle className="size-8 animate-spin" />
      </div>
    )
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value })
  const setContent = (patch: Partial<Content>) => {
    const next = { ...form, [contentLang]: { ...form[contentLang], ...patch } }
    if (contentLang === 'mn' && patch.title !== undefined && !slugTouched) next.slug = slugify(patch.title)
    setForm(next)
  }

  const content = form[contentLang]
  const images = splitLines(form.images)
  const filledDays = form.mn.itinerary.filter((d) => d.title.trim()).length
  const required = contentLang === 'mn'

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        slug: form.slug,
        region: form.region,
        category: form.category,
        durationDays: Number(form.durationDays),
        price: Number(form.price),
        maxGroup: Number(form.maxGroup),
        images,
        featured: form.featured,
        active: form.active,
        mn: toPayloadContent(form.mn),
        en: toPayloadContent(form.en),
      }
      await call(tourId === null ? '/admin/tours' : `/admin/tours/${tourId}`, {
        method: tourId === null ? 'POST' : 'PUT',
        body: JSON.stringify(payload),
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDone}
            className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-mist hover:ring-ink"
            aria-label={f.back}
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-display text-2xl font-semibold">{tourId === null ? f.newTitle : f.editTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          {tourId !== null && (
            <Link
              to={`/tours/${form.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-ink/5"
            >
              <ExternalLink className="size-4" /> {f.view}
            </Link>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-ember px-6 py-2.5 font-bold text-white hover:bg-ember-dark disabled:opacity-60"
          >
            {saving && <LoaderCircle className="size-4 animate-spin" />}
            {tourId === null ? f.create : f.save}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-2xl bg-red-50 p-4 font-medium text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <Card
          title={f.content}
          hint={f.contentHint}
          action={
            <div className="flex rounded-full bg-sand p-1 text-sm font-bold" role="tablist">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  role="tab"
                  aria-selected={contentLang === l.code}
                  onClick={() => setContentLang(l.code)}
                  className={`rounded-full px-4 py-1.5 ${contentLang === l.code ? 'bg-ink text-white' : 'text-stone hover:text-ink'}`}
                >
                  {l.code === 'mn' ? 'Монгол' : 'English'}
                </button>
              ))}
            </div>
          }
        >
          <Field label={`${f.title}${required ? ' *' : ''}`}>
            <input
              required={required}
              minLength={required ? 2 : undefined}
              maxLength={120}
              value={content.title}
              onChange={(e) => setContent({ title: e.target.value })}
              placeholder={contentLang === 'mn' ? form.mn.title || 'Хөвсгөл нуур: Хөх сувд' : form.mn.title}
              className={input}
            />
          </Field>
          <Field label={`${f.summary}${required ? ' *' : ''}`} hint={f.summaryHint}>
            <textarea
              required={required}
              minLength={required ? 10 : undefined}
              maxLength={300}
              rows={2}
              value={content.summary}
              onChange={(e) => setContent({ summary: e.target.value })}
              className={`${input} resize-y`}
            />
          </Field>
          <Field label={`${f.description}${required ? ' *' : ''}`}>
            <textarea
              required={required}
              minLength={required ? 20 : undefined}
              maxLength={5000}
              rows={5}
              value={content.description}
              onChange={(e) => setContent({ description: e.target.value })}
              className={`${input} resize-y`}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={f.highlights} hint={f.linesHint}>
              <textarea
                rows={5}
                value={content.highlights}
                onChange={(e) => setContent({ highlights: e.target.value })}
                className={`${input} resize-y`}
              />
            </Field>
            <Field label={f.includes} hint={f.linesHint}>
              <textarea
                rows={5}
                value={content.includes}
                onChange={(e) => setContent({ includes: e.target.value })}
                className={`${input} resize-y`}
              />
            </Field>
          </div>
          <div>
            <p className="text-sm font-semibold">{f.itinerary}</p>
            <div className="mt-2">
              <ItineraryEditor days={content.itinerary} onChange={(itinerary) => setContent({ itinerary })} />
            </div>
          </div>
        </Card>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Card title={f.basics}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={f.region}>
                <select value={form.region} onChange={(e) => set('region', e.target.value)} className={input}>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {t.regions[r]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={f.category}>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className={input}>
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {t.categories[c.name]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={f.duration}>
                <input
                  type="number"
                  required
                  min={1}
                  max={60}
                  value={form.durationDays}
                  onChange={(e) => set('durationDays', e.target.value)}
                  className={input}
                />
              </Field>
              <Field label={f.maxGroup}>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={form.maxGroup}
                  onChange={(e) => set('maxGroup', e.target.value)}
                  className={input}
                />
              </Field>
            </div>
            {filledDays > 0 && Number(form.durationDays) !== filledDays && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                {f.daysMismatch(Number(form.durationDays), filledDays)}
              </p>
            )}
            <Field label={f.price}>
              <input
                type="number"
                required
                min={0}
                step={1000}
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="1890000"
                className={input}
              />
            </Field>
            <Field label={f.slug} hint={f.slugHint}>
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={80}
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', e.target.value)
                }}
                className={`${input} font-mono text-sm`}
              />
            </Field>
            <label className="flex items-center justify-between gap-3 text-sm font-semibold">
              {f.active}
              <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="size-5 accent-emerald-600" />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm font-semibold">
              {f.featured}
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="size-5 accent-ember" />
            </label>
          </Card>

          <Card title={f.images} hint={f.imagesHint}>
            <textarea
              required
              rows={4}
              value={form.images}
              onChange={(e) => set('images', e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className={`${input} resize-y font-mono text-xs`}
            />
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {images.slice(0, 10).map((url, i) => (
                  <ImagePreview key={url + i} url={url} index={i} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </form>
  )
}
