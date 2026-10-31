import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setApiLang } from './api'
import { track } from './track'

export type Lang = 'mn' | 'en'
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'mn', label: 'МН' },
  { code: 'en', label: 'EN' },
]

const mn = {
  meta: {
    title: 'Elite Mongol Tour | Монголыг нээ',
    description: 'Elite Mongol Tour: Монголын байгаль, соёлыг нээх аяллууд. Хөвсгөл, Говь, Алтай, Тэрэлж руу онлайнаар захиалаарай.',
  },
  brand: 'Elite Mongol Tour',
  nav: {
    tours: 'Аяллууд',
    regions: 'Бүс нутаг',
    about: 'Бидний тухай',
    contact: 'Холбоо барих',
    book: 'Аялал захиалах',
    openMenu: 'Цэс нээх',
    closeMenu: 'Цэс хаах',
    home: 'Elite Mongol Tour нүүр хуудас',
    language: 'Хэл сонгох',
  },
  footer: {
    about: '2014 оноос хойш Монголын байгаль, соёлыг аялагчдад таниулж буй орон нутгийн аялал жуулчлалын компани.',
    contact: 'Холбоо барих',
    menu: 'Цэс',
    company: 'Elite Mongol Tour',
    staff: 'Ажилтны нэвтрэх',
    address: 'Улаанбаатар, Сүхбаатар дүүрэг, Энхтайваны өргөн чөлөө 15',
  },
  regions: { Төв: 'Төв', Говь: 'Говь', Хойд: 'Хойд', Баруун: 'Баруун', Зүүн: 'Зүүн' } as Record<string, string>,
  regionBlurbs: {
    Төв: 'Тэрэлж, Орхоны хөндий',
    Говь: 'Элсэн манхан, оддын шөнө',
    Хойд: 'Хөвсгөл, тайгын ой',
    Баруун: 'Алтайн цасан оргилууд',
    Зүүн: 'Хэнтийн ой, Онон гол',
  } as Record<string, string>,
  categories: {
    Байгаль: 'Байгаль',
    'Адал явдал': 'Адал явдал',
    'Явган аялал': 'Явган аялал',
    Соёл: 'Соёл',
    Майхан: 'Майхан',
    Амралт: 'Амралт',
    Өвөл: 'Өвөл',
  } as Record<string, string>,
  durations: { short: '1–3 өдөр', medium: '4–7 өдөр', long: '8+ өдөр' },
  sorts: { popular: 'Эрэлттэй', 'price-asc': 'Үнэ: багаас их', 'price-desc': 'Үнэ: ихээс бага', duration: 'Хугацаа' },
  days: (n: number) => `${n} өдөр`,
  perPerson: '/ хүн',
  fromPrice: (price: string) => `${price}-өөс`,
  hero: {
    badge: '2027 оны зуны аяллын бүртгэл нээгдлээ',
    title: 'Монголын тал нутгийг шинээр нээ',
    subtitle: 'Хөвсгөлөөс Говь хүртэл. Орон нутгийн хөтөчтэй, жижиг бүлгээр, байгальд ээлтэй аяллууд.',
    where: 'Хаашаа',
    allRegions: 'Бүх бүс нутаг',
    type: 'Аяллын төрөл',
    all: 'Бүгд',
    duration: 'Хугацаа',
    any: 'Ямар ч',
    search: 'Хайх',
    stats: [
      ['12+', 'жилийн туршлага'],
      ['4,800+', 'сэтгэл хангалуун аялагч'],
      ['4.8', 'дундаж үнэлгээ'],
    ],
  },
  home: {
    featuredEyebrow: 'Онцлох аялал',
    featuredTitle: 'Энэ улиралд хамгийн их сонгогдож буй чиглэлүүд',
    allTours: 'Бүх аялал',
    whyEyebrow: 'Яагаад бид гэж?',
    whyTitle: 'Аялал биш, мартагдашгүй дурсамж бүтээдэг',
    whyText:
      'Бид 2014 оноос хойш 4,800 гаруй аялагчийг Монголын өнцөг булан бүрт хүргэсэн. Аялал бүрийг өөрсдөө туршиж, нутгийн малчин айлуудтай хамтран зохион байгуулдаг.',
    reasons: [
      { title: 'Жижиг бүлэг', text: 'Нэг бүлэгт 8–16 хүн. Хөтөч тань бүрт анхаарал хандуулна.' },
      { title: 'Орон нутгийн хөтөч', text: 'Тухайн нутгийн уугуул хөтөч нар хамгийн сайхан газруудыг мэднэ.' },
      { title: 'Байгальд ээлтэй', text: 'Ул мөргүй аялах зарчим баримталж, орлогын 5%-ийг нутгийн иргэдэд зарцуулдаг.' },
      { title: 'Аюулгүй, найдвартай', text: 'Даатгалтай, анхны тусламжийн бэлтгэлтэй баг, 24/7 холбоо.' },
    ],
    regionsEyebrow: 'Бүс нутаг',
    regionsTitle: 'Таны дараагийн аялал хаана вэ?',
    testimonialsEyebrow: 'Сэтгэгдэл',
    testimonialsTitle: 'Аялагчид юу гэж хэлж байна вэ?',
    testimonials: [
      {
        name: 'Номин Б.',
        trip: 'Хөвсгөл нуур',
        text: 'Хүүхдүүдтэйгээ анх удаа ийм урт аялалд явлаа. Хөтөч маань маш халамжтай, хоол нь ч гайхалтай байсан.',
      },
      {
        name: 'Тэмүүлэн Г.',
        trip: 'Алтай Таван Богд',
        text: 'Потанины мөсөн гол дээр зогсож байхдаа Монгол орон ямар үзэсгэлэнтэйг дахин мэдэрлээ. Зохион байгуулалт нь төгс.',
      },
      {
        name: 'Сарангэрэл Д.',
        trip: 'Говийн оддын шөнө',
        text: 'Сүүн замыг ийм тод харна гэж бодоогүй. Телескопоор Санчир гарагийн цагиргийг харсан мөч мартагдашгүй.',
      },
    ],
    ctaTitle: 'Амралтын өдрөө байгальд өнгөрөөе',
    ctaText: (title: string, price: string) => `«${title}» аялал ердөө ${price}-өөс эхэлнэ.`,
    ctaFallback: 'Хотоос холдолгүй амрах богино аяллууд.',
    ctaButton: 'Одоо захиалах',
  },
  tours: {
    eyebrow: 'Бүх аялал',
    title: 'Аяллаа сонгоорой',
    subtitle: 'Нэг өдрийн амралтаас 10 өдрийн экспедиц хүртэл. Бүс нутаг, төрөл, хугацаагаар шүүж хайгаарай.',
    searchPlaceholder: 'Аялал хайх… (жишээ нь: нуур, говь)',
    allTypes: 'Бүх төрөл',
    allDurations: 'Бүх хугацаа',
    allRegions: 'Бүх бүс',
    typeLabel: 'Аяллын төрөл',
    durationLabel: 'Хугацаа',
    sortLabel: 'Эрэмбэлэх',
    found: (n: number) => `${n} аялал олдлоо`,
    searching: 'Хайж байна…',
    clear: 'Шүүлтүүр арилгах',
    emptyTitle: 'Тохирох аялал олдсонгүй',
    emptyText: 'Шүүлтүүрээ өөрчилж үзнэ үү, эсвэл бидэнтэй холбогдож хувийн аялал захиалаарай.',
  },
  tour: {
    back: 'Бүх аялал',
    region: (r: string) => `${r} бүс`,
    upTo: (n: number) => `${n} хүртэл хүн`,
    about: 'Аяллын тухай',
    highlights: 'Онцлох үйл ажиллагаа',
    itinerary: 'Өдөр тутмын хөтөлбөр',
    includes: 'Үнэд багтсан',
    notFound: 'Аялал олдсонгүй',
    backToAll: 'Бүх аялал руу буцах',
  },
  booking: {
    pricePerPerson: 'Нэг хүний үнэ',
    startDate: 'Эхлэх өдөр',
    guests: 'Хүний тоо',
    minus: 'Хасах',
    plus: 'Нэмэх',
    fullName: 'Овог нэр',
    email: 'И-мэйл',
    phone: 'Утас',
    note: 'Нэмэлт хүсэлт',
    optional: '(заавал биш)',
    persons: (n: number) => `${n} хүн`,
    total: 'Нийт',
    submit: 'Захиалга илгээх',
    noPayment: 'Одоо төлбөр төлөхгүй. Бид эхлээд тантай холбогдоно.',
    successTitle: 'Захиалга хүлээн авлаа!',
    successText: 'Манай менежер 24 цагийн дотор тантай холбогдож баталгаажуулна.',
    reference: 'Захиалгын дугаар',
    start: 'Эхлэх өдөр',
    totalAmount: 'Нийт дүн',
  },
  admin: {
    loginTitle: 'Ажилтны нэвтрэх',
    password: 'Нууц үг',
    signIn: 'Нэвтрэх',
    backHome: '← Нүүр хуудас руу буцах',
    badge: 'Удирдлага',
    refresh: 'Шинэчлэх',
    signOut: 'Гарах',
    totalBookings: 'Нийт захиалга',
    pending: 'Хүлээгдэж буй',
    upcoming: 'Удахгүй эхлэх',
    revenue: 'Баталгаажсан орлого',
    bookingsTab: 'Захиалга',
    toursTab: 'Аялал',
    filterStatus: 'Төлөвөөр шүүх',
    allStatuses: 'Бүх төлөв',
    status: { pending: 'Хүлээгдэж буй', confirmed: 'Баталгаажсан', cancelled: 'Цуцалсан' },
    cols: {
      reference: 'Дугаар',
      customer: 'Захиалагч',
      tour: 'Аялал',
      date: 'Огноо',
      amount: 'Дүн',
      status: 'Төлөв',
      region: 'Бүс',
      price: 'Үнэ',
      bookings: 'Захиалга',
      featured: 'Онцлох',
      active: 'Идэвхтэй',
    },
    received: 'Ирсэн',
    noBookings: 'Захиалга алга байна.',
    statusOf: (ref: string) => `${ref} төлөв`,
    featuredOf: (title: string) => `${title} онцлох`,
    activeOf: (title: string) => `${title} идэвхтэй`,
    addTour: 'Шинэ аялал',
    edit: 'Засах',
    editOf: (title: string) => `${title} засах`,
  },
  tourForm: {
    newTitle: 'Шинэ аялал нэмэх',
    editTitle: 'Аялал засах',
    back: 'Буцах',
    basics: 'Үндсэн мэдээлэл',
    region: 'Бүс нутаг',
    category: 'Аяллын төрөл',
    duration: 'Хугацаа (өдөр)',
    price: 'Нэг хүний үнэ (₮)',
    maxGroup: 'Хамгийн их хүний тоо',
    slug: 'URL хаяг',
    slugHint: 'Монгол нэрээс автоматаар үүснэ. Зөвхөн латин жижиг үсэг, тоо, зураас.',
    featured: 'Нүүр хуудсанд онцлох',
    active: 'Сайтад харуулах',
    images: 'Зургууд',
    imagesHint: 'Мөр бүрт нэг зургийн холбоос (https://...). Эхний зураг нь гол зураг болно.',
    imagePreview: (n: number) => `${n}-р зураг`,
    content: 'Агуулга',
    contentHint: 'Англи хэсэг заавал биш. Хоосон талбар англи хувилбар дээр монголоор харагдана.',
    title: 'Аяллын нэр',
    summary: 'Товч тайлбар',
    summaryHint: 'Картан дээр харагдана, 1–2 өгүүлбэр.',
    description: 'Дэлгэрэнгүй тайлбар',
    highlights: 'Онцлох үйл ажиллагаа',
    includes: 'Үнэд багтсан',
    linesHint: 'Мөр бүрт нэг зүйл.',
    itinerary: 'Өдөр тутмын хөтөлбөр',
    day: (n: number) => `${n}-р өдөр`,
    dayTitle: 'Гарчиг',
    dayText: 'Тайлбар',
    addDay: 'Өдөр нэмэх',
    removeDay: 'Өдрийг хасах',
    moveUp: 'Дээш зөөх',
    moveDown: 'Доош зөөх',
    daysMismatch: (days: number, n: number) => `Хугацаа ${days} өдөр боловч хөтөлбөрт ${n} өдөр байна.`,
    save: 'Хадгалах',
    create: 'Аялал нэмэх',
    saved: 'Хадгалагдлаа',
    view: 'Сайт дээр харах',
  },
  newTour: 'Шинэ',
  analytics: {
    tab: 'Хяналт',
    title: 'Сайтын хандалт',
    range: (d: number) => `Сүүлийн ${d} хоног`,
    vsPrev: (d: number) => `өмнөх ${d} хоногоос`,
    noPrev: 'өмнөх үед өгөгдөлгүй',
    visitors: 'Зочид',
    pageViews: 'Хуудас үзсэн',
    tourViews: 'Аялал үзсэн',
    bookings: 'Захиалга',
    conversion: 'Захиалгад шилжсэн',
    conversionHint: 'захиалга ÷ зочид',
    dailyTitle: 'Өдөр бүрийн зочид',
    dailySub: 'Сайтад орсон давтагдашгүй зочдын тоо',
    showTable: 'Хүснэгтээр',
    showChart: 'Графикаар',
    date: 'Огноо',
    topTours: 'Хамгийн их үзсэн аяллууд',
    tour: 'Аялал',
    views: 'Үзсэн',
    uniqueViewers: 'Зочид',
    starts: 'Маягт нээсэн',
    conv: 'Хөрвөлт',
    funnel: 'Захиалгын замнал',
    funnelSub: 'Зочид сайтад орохоос захиалга өгөх хүртэл хэр алдагдаж байна',
    funnelSteps: ['Сайтад орсон', 'Аялал үзсэн', 'Захиалгын маягт бөглөж эхэлсэн', 'Захиалга илгээсэн'],
    ofFirst: 'эхний шатнаас',
    devices: 'Төхөөрөмж',
    device: { mobile: 'Утас', desktop: 'Компьютер', tablet: 'Таблет' } as Record<string, string>,
    languages: 'Хэл',
    language: { mn: 'Монгол', en: 'Англи' } as Record<string, string>,
    searches: 'Түгээмэл хайлтууд',
    referrers: 'Хаанаас орж ирсэн',
    pages: 'Их үзсэн хуудсууд',
    direct: 'Шууд хаягаар / тодорхойгүй',
    recent: 'Сүүлийн үйлдлүүд',
    empty: 'Энэ хугацаанд өгөгдөл алга.',
    emptyAll: 'Одоогоор хандалт бүртгэгдээгүй байна. Сайтад зочин орж эхлэхэд энд харагдана.',
    home: 'Нүүр хуудас',
    toursPage: 'Аяллын жагсаалт',
    events: {
      page_view: 'Хуудас үзсэн',
      tour_view: 'Аялал үзсэн',
      search: 'Хайлт хийсэн',
      filter: 'Шүүлтүүр сонгосон',
      booking_start: 'Захиалга бөглөж эхэлсэн',
      booking_submit: 'Захиалга илгээсэн',
      lang_switch: 'Хэл сольсон',
    } as Record<string, string>,
    ago: (mins: number) =>
      mins < 1 ? 'дөнгөж сая' : mins < 60 ? `${mins} мин өмнө` : mins < 1440 ? `${Math.floor(mins / 60)} цагийн өмнө` : `${Math.floor(mins / 1440)} өдрийн өмнө`,
    privacy: 'IP хаяг, нэр, имэйл хадгалдаггүй. Зочин бүрийг нэргүй санамсаргүй ID-гаар тоолно.',
  },
  notFound: { title: 'Хуудас олдсонгүй', home: 'Нүүр хуудас' },
  error: 'Алдаа гарлаа. Дахин оролдоно уу.',
}

export type Dict = typeof mn

const en: Dict = {
  meta: {
    title: 'Elite Mongol Tour | Discover Mongolia',
    description: 'Elite Mongol Tour: small-group tours to Mongolia’s nature and culture. Book Khuvsgul, the Gobi, Altai and Terelj online.',
  },
  brand: 'Elite Mongol Tour',
  nav: {
    tours: 'Tours',
    regions: 'Regions',
    about: 'About us',
    contact: 'Contact',
    book: 'Book a tour',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    home: 'Elite Mongol Tour home',
    language: 'Choose language',
  },
  footer: {
    about: 'A local tour company sharing Mongolia’s nature and culture with travellers since 2014.',
    contact: 'Contact',
    menu: 'Menu',
    company: 'Elite Mongol Tour',
    staff: 'Staff sign-in',
    address: '15 Peace Avenue, Sukhbaatar District, Ulaanbaatar',
  },
  regions: { Төв: 'Central', Говь: 'Gobi', Хойд: 'North', Баруун: 'West', Зүүн: 'East' },
  regionBlurbs: {
    Төв: 'Terelj and the Orkhon Valley',
    Говь: 'Sand dunes and starry nights',
    Хойд: 'Khuvsgul and the taiga',
    Баруун: 'Snowy Altai peaks',
    Зүүн: 'Khentii forests, Onon River',
  },
  categories: {
    Байгаль: 'Nature',
    'Адал явдал': 'Adventure',
    'Явган аялал': 'Trekking',
    Соёл: 'Culture',
    Майхан: 'Camping',
    Амралт: 'Getaway',
    Өвөл: 'Winter',
  },
  durations: { short: '1–3 days', medium: '4–7 days', long: '8+ days' },
  sorts: { popular: 'Most popular', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low', duration: 'Duration' },
  days: (n: number) => (n === 1 ? '1 day' : `${n} days`),
  perPerson: '/ person',
  fromPrice: (price: string) => `From ${price}`,
  hero: {
    badge: 'Bookings for summer 2027 are now open',
    title: 'Discover the wide open steppe of Mongolia',
    subtitle: 'From Khuvsgul to the Gobi. Small groups, local guides and nature-friendly travel.',
    where: 'Where',
    allRegions: 'All regions',
    type: 'Tour type',
    all: 'All',
    duration: 'Duration',
    any: 'Any',
    search: 'Search',
    stats: [
      ['12+', 'years of experience'],
      ['4,800+', 'happy travellers'],
      ['4.8', 'average rating'],
    ],
  },
  home: {
    featuredEyebrow: 'Featured tours',
    featuredTitle: 'This season’s most popular journeys',
    allTours: 'All tours',
    whyEyebrow: 'Why travel with us?',
    whyTitle: 'We don’t sell trips, we create memories',
    whyText:
      'Since 2014 we have taken more than 4,800 travellers to every corner of Mongolia. We test every route ourselves and run our tours together with local herding families.',
    reasons: [
      { title: 'Small groups', text: '8–16 people per group, so your guide has time for everyone.' },
      { title: 'Local guides', text: 'Guides born in the region know the most beautiful places.' },
      { title: 'Nature friendly', text: 'We follow leave-no-trace principles and give 5% of revenue to local communities.' },
      { title: 'Safe and reliable', text: 'Fully insured, first-aid trained team, 24/7 support.' },
    ],
    regionsEyebrow: 'Regions',
    regionsTitle: 'Where will your next journey take you?',
    testimonialsEyebrow: 'Reviews',
    testimonialsTitle: 'What our travellers say',
    testimonials: [
      {
        name: 'Nomin B.',
        trip: 'Lake Khuvsgul',
        text: 'Our first long trip with the kids. Our guide was so caring, and the food was wonderful.',
      },
      {
        name: 'Temuulen G.',
        trip: 'Altai Tavan Bogd',
        text: 'Standing on Potanin Glacier I felt again how beautiful Mongolia is. The organisation was perfect.',
      },
      {
        name: 'Sarangerel D.',
        trip: 'Gobi Stargazing Nights',
        text: 'I never expected to see the Milky Way so clearly. Seeing Saturn’s rings through the telescope was unforgettable.',
      },
    ],
    ctaTitle: 'Spend your weekend in nature',
    ctaText: (title: string, price: string) => `“${title}” starts from just ${price}.`,
    ctaFallback: 'Short getaways not far from the city.',
    ctaButton: 'Book now',
  },
  tours: {
    eyebrow: 'All tours',
    title: 'Choose your journey',
    subtitle: 'From weekend getaways to 10-day expeditions. Filter by region, type and duration.',
    searchPlaceholder: 'Search tours… (e.g. lake, gobi)',
    allTypes: 'All types',
    allDurations: 'Any duration',
    allRegions: 'All regions',
    typeLabel: 'Tour type',
    durationLabel: 'Duration',
    sortLabel: 'Sort by',
    found: (n: number) => (n === 1 ? '1 tour found' : `${n} tours found`),
    searching: 'Searching…',
    clear: 'Clear filters',
    emptyTitle: 'No matching tours',
    emptyText: 'Try changing your filters, or contact us to arrange a private tour.',
  },
  tour: {
    back: 'All tours',
    region: (r: string) => `${r} region`,
    upTo: (n: number) => `Up to ${n} people`,
    about: 'About this tour',
    highlights: 'Highlights',
    itinerary: 'Day-by-day itinerary',
    includes: 'What’s included',
    notFound: 'Tour not found',
    backToAll: 'Back to all tours',
  },
  booking: {
    pricePerPerson: 'Price per person',
    startDate: 'Start date',
    guests: 'Travellers',
    minus: 'Remove one',
    plus: 'Add one',
    fullName: 'Full name',
    email: 'Email',
    phone: 'Phone',
    note: 'Special requests',
    optional: '(optional)',
    persons: (n: number) => (n === 1 ? '1 person' : `${n} people`),
    total: 'Total',
    submit: 'Send booking request',
    noPayment: 'No payment now. We will contact you first.',
    successTitle: 'Booking received!',
    successText: 'Our manager will contact you within 24 hours to confirm.',
    reference: 'Booking reference',
    start: 'Start date',
    totalAmount: 'Total',
  },
  admin: {
    loginTitle: 'Staff sign-in',
    password: 'Password',
    signIn: 'Sign in',
    backHome: '← Back to the website',
    badge: 'Admin',
    refresh: 'Refresh',
    signOut: 'Sign out',
    totalBookings: 'Total bookings',
    pending: 'Pending',
    upcoming: 'Upcoming',
    revenue: 'Confirmed revenue',
    bookingsTab: 'Bookings',
    toursTab: 'Tours',
    filterStatus: 'Filter by status',
    allStatuses: 'All statuses',
    status: { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled' },
    cols: {
      reference: 'Reference',
      customer: 'Customer',
      tour: 'Tour',
      date: 'Date',
      amount: 'Amount',
      status: 'Status',
      region: 'Region',
      price: 'Price',
      bookings: 'Bookings',
      featured: 'Featured',
      active: 'Active',
    },
    received: 'Received',
    noBookings: 'No bookings yet.',
    statusOf: (ref: string) => `${ref} status`,
    featuredOf: (title: string) => `${title} featured`,
    activeOf: (title: string) => `${title} active`,
    addTour: 'New tour',
    edit: 'Edit',
    editOf: (title: string) => `Edit ${title}`,
  },
  tourForm: {
    newTitle: 'Add a new tour',
    editTitle: 'Edit tour',
    back: 'Back',
    basics: 'Basics',
    region: 'Region',
    category: 'Tour type',
    duration: 'Duration (days)',
    price: 'Price per person (₮)',
    maxGroup: 'Maximum group size',
    slug: 'URL',
    slugHint: 'Generated from the Mongolian name. Lowercase Latin letters, digits and hyphens only.',
    featured: 'Feature on home page',
    active: 'Show on website',
    images: 'Images',
    imagesHint: 'One image URL per line (https://...). The first image is the cover.',
    imagePreview: (n: number) => `Image ${n}`,
    content: 'Content',
    contentHint: 'English is optional. Empty fields show the Mongolian text on the English site.',
    title: 'Tour name',
    summary: 'Short summary',
    summaryHint: 'Shown on cards, 1–2 sentences.',
    description: 'Full description',
    highlights: 'Highlights',
    includes: 'What’s included',
    linesHint: 'One item per line.',
    itinerary: 'Day-by-day itinerary',
    day: (n: number) => `Day ${n}`,
    dayTitle: 'Title',
    dayText: 'Description',
    addDay: 'Add day',
    removeDay: 'Remove day',
    moveUp: 'Move up',
    moveDown: 'Move down',
    daysMismatch: (days: number, n: number) => `Duration is ${days} days but the itinerary has ${n}.`,
    save: 'Save',
    create: 'Add tour',
    saved: 'Saved',
    view: 'View on website',
  },
  newTour: 'New',
  analytics: {
    tab: 'Analytics',
    title: 'Website traffic',
    range: (d: number) => `Last ${d} days`,
    vsPrev: (d: number) => `vs previous ${d} days`,
    noPrev: 'no data in previous period',
    visitors: 'Visitors',
    pageViews: 'Page views',
    tourViews: 'Tour views',
    bookings: 'Bookings',
    conversion: 'Conversion',
    conversionHint: 'bookings ÷ visitors',
    dailyTitle: 'Daily visitors',
    dailySub: 'Unique visitors per day',
    showTable: 'Table',
    showChart: 'Chart',
    date: 'Date',
    topTours: 'Most viewed tours',
    tour: 'Tour',
    views: 'Views',
    uniqueViewers: 'Visitors',
    starts: 'Form started',
    conv: 'Conversion',
    funnel: 'Booking funnel',
    funnelSub: 'Where visitors drop off on the way to booking',
    funnelSteps: ['Visited the site', 'Viewed a tour', 'Started the booking form', 'Sent a booking'],
    ofFirst: 'of first step',
    devices: 'Devices',
    device: { mobile: 'Mobile', desktop: 'Desktop', tablet: 'Tablet' },
    languages: 'Language',
    language: { mn: 'Mongolian', en: 'English' },
    searches: 'Top searches',
    referrers: 'Traffic sources',
    pages: 'Top pages',
    direct: 'Direct / unknown',
    recent: 'Recent activity',
    empty: 'No data for this period.',
    emptyAll: 'No visits recorded yet. They will show up here once people start visiting the site.',
    home: 'Home page',
    toursPage: 'Tour list',
    events: {
      page_view: 'Viewed a page',
      tour_view: 'Viewed a tour',
      search: 'Searched',
      filter: 'Used a filter',
      booking_start: 'Started booking',
      booking_submit: 'Sent a booking',
      lang_switch: 'Switched language',
    },
    ago: (mins: number) =>
      mins < 1 ? 'just now' : mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.floor(mins / 60)} h ago` : `${Math.floor(mins / 1440)} d ago`,
    privacy: 'No IP addresses, names or emails are stored. Each visitor is counted by an anonymous random ID.',
  },
  notFound: { title: 'Page not found', home: 'Home' },
  error: 'Something went wrong. Please try again.',
}

const DICTS: Record<Lang, Dict> = { mn, en }
const STORAGE_KEY = 'emt-lang'

const isLang = (v: unknown): v is Lang => v === 'mn' || v === 'en'

// ?lang=en холбоос > хадгалсан сонголт > монгол (Монголд олон браузер англи тохиргоотой байдаг тул автоматаар таахгүй)
function initialLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (isLang(fromUrl)) return fromUrl
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch {
    // localStorage хаалттай байж болно
  }
  return 'mn'
}

interface LangState {
  lang: Lang
  t: Dict
  setLang: (lang: Lang) => void
}

const LangContext = createContext<LangState | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const l = initialLang()
    setApiLang(l)
    return l
  })

  const setLang = useCallback((next: Lang) => {
    setApiLang(next)
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // хадгалж чадахгүй бол зөвхөн энэ удаад хүчинтэй
    }
  }, [])

  useEffect(() => {
    const t = DICTS[lang]
    document.documentElement.lang = lang
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
  }, [lang])

  const value = useMemo(() => ({ lang, t: DICTS[lang], setLang }), [lang, setLang])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useI18n() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useI18n must be used inside LangProvider')
  return ctx
}

export function LangSwitch({ light = false }: { light?: boolean }) {
  const { lang, setLang, t } = useI18n()
  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={`flex rounded-full p-0.5 text-xs font-bold ring-1 ${light ? 'ring-white/30' : 'ring-mist bg-cream'}`}
    >
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => {
            if (l.code !== lang) track('lang_switch', { props: { to: l.code } })
            setLang(l.code)
          }}
          aria-pressed={lang === l.code}
          className={`rounded-full px-2.5 py-1.5 transition ${
            lang === l.code ? (light ? 'bg-white text-ink' : 'bg-ink text-white') : light ? 'text-white/80 hover:text-white' : 'text-stone hover:text-ink'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
