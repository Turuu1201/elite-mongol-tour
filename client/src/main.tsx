import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import './index.css'
import { LangProvider, useI18n } from './lib/i18n'
import Admin from './pages/Admin'
import Home from './pages/Home'
import TourDetail from './pages/TourDetail'
import Tours from './pages/Tours'

function NotFound() {
  const { t } = useI18n()
  return (
    <div className="container-page pt-40 text-center">
      <p className="font-display text-7xl font-semibold text-ember">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">{t.notFound.title}</h1>
      <Link to="/" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 font-bold text-white">
        {t.notFound.home}
      </Link>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="tours" element={<Tours />} />
            <Route path="tours/:slug" element={<TourDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  </StrictMode>,
)
