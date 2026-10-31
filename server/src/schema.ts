export const SCHEMA = /* sql */ `
create table if not exists tours (
  id            serial primary key,
  slug          text unique not null,
  title         text not null,
  region        text not null,
  category      text not null,
  summary       text not null,
  description   text not null,
  duration_days int not null check (duration_days > 0),
  price         int not null check (price >= 0),
  max_group     int not null default 12 check (max_group > 0),
  rating        real not null default 5,
  review_count  int not null default 0,
  images        jsonb not null default '[]',
  highlights    jsonb not null default '[]',
  itinerary     jsonb not null default '[]',
  includes      jsonb not null default '[]',
  featured      boolean not null default false,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists bookings (
  id          serial primary key,
  tour_id     int not null references tours(id),
  full_name   text not null,
  email       text not null,
  phone       text not null,
  start_date  date not null,
  guests      int not null check (guests > 0),
  note        text not null default '',
  total_price int not null,
  status      text not null default 'pending'
              check (status in ('pending', 'confirmed', 'cancelled')),
  created_at  timestamptz not null default now()
);

-- Орчуулга: {"en": {"title": ..., "summary": ..., "itinerary": [...], ...}}
alter table tours add column if not exists translations jsonb not null default '{}';

-- Хандалтын статистик. IP, нэр, имэйл хадгалахгүй; visitor_id нь браузерт үүссэн санамсаргүй ID.
create table if not exists events (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  visitor_id text not null,
  session_id text not null,
  type       text not null,
  path       text not null default '',
  tour_id    int references tours(id) on delete set null,
  lang       text not null default 'mn',
  device     text not null default 'desktop',
  referrer   text not null default '',
  props      jsonb not null default '{}'
);

create index if not exists events_created_idx on events (created_at);
create index if not exists events_type_created_idx on events (type, created_at);

create index if not exists bookings_created_idx on bookings (created_at desc);
create index if not exists bookings_tour_idx on bookings (tour_id);
`;
