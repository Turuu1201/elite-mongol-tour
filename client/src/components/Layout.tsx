import { Mail, MapPin, Menu, Phone, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { CONTACT } from '../lib/catalog'
import { LangSwitch, useI18n, type Dict } from '../lib/i18n'
import { track } from '../lib/track'

const YEAR = new Date().getFullYear()

const navItems = (t: Dict) => [
  { to: '/tours', label: t.nav.tours },
  { to: '/#regions', label: t.nav.regions },
  { to: '/#why', label: t.nav.about },
  { to: '/#contact', label: t.nav.contact },
]

export function Logo({ light = false }: { light?: boolean }) {
  const { t } = useI18n()
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={t.nav.home}>
      <img src="/favicon.svg" alt="" className="size-9" />
      {/* "Elite Mongol" том, "TOUR" жижиг: урт нэр гар утасны header-т багтана */}
      <span className="flex flex-col leading-none" aria-hidden>
        <span className={`font-display text-base font-semibold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
          Elite Mongol
        </span>
        <span className="mt-1 text-[0.625rem] font-bold tracking-[0.35em] text-ember uppercase">Tour</span>
      </span>
    </Link>
  )
}

function Header() {
  const { t } = useI18n()
  const { pathname, hash } = useLocation()
  // Цэс зөвхөн нээсэн хуудсан дээрээ нээлттэй үлдэнэ; шилжихэд автоматаар хаагдана
  const here = pathname + hash
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === here
  const [scrolled, setScrolled] = useState(false)
  const overHero = pathname === '/' && !scrolled && !open
  const nav = navItems(t)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        overHero ? 'bg-transparent' : 'border-b border-mist/80 bg-sand/85 backdrop-blur-xl'
      }`}
    >
      <div className="container-page flex h-18 items-center justify-between gap-3">
        <Logo light={overHero} />
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  overHero ? 'text-white/90 hover:bg-white/15' : 'text-ink/80 hover:bg-ink/5'
                } ${isActive && item.to === '/tours' ? (overHero ? 'bg-white/15' : 'bg-ink/5 text-ink') : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch light={overHero} />
          <Link
            to="/tours"
            className="hidden rounded-full bg-ember px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-ember/25 transition hover:bg-ember-dark sm:inline-flex"
          >
            {t.nav.book}
          </Link>
          <button
            type="button"
            onClick={() => setOpenAt(open ? null : here)}
            className={`grid size-11 place-items-center rounded-full md:hidden ${overHero ? 'text-white' : 'text-ink'}`}
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="container-page border-t border-mist bg-sand pb-6 md:hidden">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className="block border-b border-mist py-4 font-semibold">
              {item.label}
            </Link>
          ))}
          <Link to="/tours" className="mt-5 block rounded-full bg-ember py-3.5 text-center font-bold text-white">
            {t.nav.book}
          </Link>
        </nav>
      )}
    </header>
  )
}

function Footer() {
  const { t } = useI18n()
  return (
    <footer id="contact" className="mt-24 bg-ink text-white">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm text-white/60">{t.footer.about}</p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold tracking-wider text-white/50 uppercase">{t.footer.contact}</h3>
          <ul className="mt-5 space-y-3 text-white/80">
            <li className="flex gap-3">
              <Phone className="size-5 shrink-0 text-ember" />
              <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="hover:text-white">
                {CONTACT.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="size-5 shrink-0 text-ember" />
              <a href={`mailto:${CONTACT.email}`} className="hover:text-white">
                {CONTACT.email}
              </a>
            </li>
            <li className="flex gap-3">
              <MapPin className="size-5 shrink-0 text-ember" />
              {t.footer.address}
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold tracking-wider text-white/50 uppercase">{t.footer.menu}</h3>
          <ul className="mt-5 space-y-3 text-white/80">
            {navItems(t).map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col justify-between gap-2 py-6 text-sm text-white/40 sm:flex-row">
          <span>
            © {YEAR} {t.footer.company}
          </span>
          <Link to="/admin" className="hover:text-white/70">
            {t.footer.staff}
          </Link>
        </div>
      </div>
    </footer>
  )
}

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => track('page_view'), [pathname])
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

export default function Layout() {
  return (
    <>
      <ScrollManager />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
