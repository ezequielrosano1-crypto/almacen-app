-- almacen-app initial schema.
-- Column names match src/types/db.ts exactly; the app talks to these tables
-- directly from the browser, so renaming a column is a breaking change.

-- ---------------------------------------------------------------- negocios
create table public.negocios (
  id         bigint generated always as identity primary key,
  nombre     text not null,
  created_at timestamptz not null default now()
);

-- The app hardcodes negocio_id = 1 everywhere; this row must exist for the FKs.
insert into public.negocios (nombre) overriding system value values ('Mi negocio');
select setval(pg_get_serial_sequence('public.negocios', 'id'), 1);

-- --------------------------------------------------------------- productos
-- id is supplied by the client (nextId / upsert onConflict id), so no identity.
create table public.productos (
  id            bigint primary key,
  negocio_id    bigint not null default 1 references public.negocios (id),
  nombre        text not null,
  precio        numeric(12, 2) not null check (precio >= 0),
  unidad        text not null check (unidad in ('unidad', 'kg')),
  stock         numeric(12, 3) not null default 0,
  stock_minimo  numeric(12, 3) not null default 0 check (stock_minimo >= 0),
  codigo_barras text,
  created_at    timestamptz not null default now()
);

create index productos_negocio_idx on public.productos (negocio_id);
create unique index productos_barcode_uniq
  on public.productos (negocio_id, codigo_barras)
  where codigo_barras is not null;

-- ----------------------------------------------------------------- jornada
create table public.jornada (
  id                 text primary key,
  negocio_id         bigint not null default 1 references public.negocios (id),
  fecha              date not null,
  estado             text not null check (estado in ('ABIERTA', 'CERRADA')),
  hora_apertura      text not null,
  hora_cierre        text,
  cerrado_automatico boolean not null default false,
  total              numeric(12, 2),
  cantidad_ventas    integer,
  updated_at         timestamptz not null default now(),
  unique (negocio_id, fecha)
);

-- ------------------------------------------------------------------ ventas
create table public.ventas (
  id         bigint generated always as identity primary key,
  negocio_id bigint not null default 1 references public.negocios (id),
  jornada_id text,
  fecha      timestamptz not null default now(),
  total      numeric(12, 2) not null check (total >= 0),
  pago       text not null check (pago in ('Efectivo', 'Débito')),
  created_at timestamptz not null default now()
);

create index ventas_negocio_fecha_idx on public.ventas (negocio_id, fecha desc);
create index ventas_jornada_idx on public.ventas (jornada_id);

-- -------------------------------------------------------------- venta_items
create table public.venta_items (
  id              bigint generated always as identity primary key,
  venta_id        bigint not null references public.ventas (id) on delete cascade,
  producto_id     bigint not null references public.productos (id),
  nombre          text not null, -- snapshot: keeps history if the product is renamed
  cantidad        numeric(12, 3) not null check (cantidad > 0),
  unidad          text not null check (unidad in ('unidad', 'kg')),
  precio_unitario numeric(12, 2) not null check (precio_unitario >= 0),
  subtotal        numeric(12, 2) not null check (subtotal >= 0)
);

create index venta_items_venta_idx on public.venta_items (venta_id);
create index venta_items_producto_idx on public.venta_items (producto_id);

-- -------------------------------------------------------- movimientos_stock
create table public.movimientos_stock (
  id          bigint generated always as identity primary key,
  negocio_id  bigint not null default 1 references public.negocios (id),
  producto_id bigint references public.productos (id) on delete set null,
  jornada_id  text,
  fecha       timestamptz not null default now(),
  tipo        text not null check (tipo in ('entrada', 'ajuste', 'venta')),
  cantidad    numeric(12, 3),
  unidad      text check (unidad in ('unidad', 'kg')),
  diferencia  numeric(12, 3),
  motivo      text
);

create index movimientos_negocio_fecha_idx on public.movimientos_stock (negocio_id, fecha desc);
create index movimientos_producto_idx on public.movimientos_stock (producto_id);

-- --------------------------------------------------------------------- RLS
-- The app has no auth yet and uses the publishable key from the browser, so
-- these policies are intentionally open to anon/authenticated. Tighten them
-- (per-user negocio membership) as soon as auth is introduced.
alter table public.negocios          enable row level security;
alter table public.productos         enable row level security;
alter table public.jornada           enable row level security;
alter table public.ventas            enable row level security;
alter table public.venta_items       enable row level security;
alter table public.movimientos_stock enable row level security;

create policy negocios_all          on public.negocios          for all to anon, authenticated using (true) with check (true);
create policy productos_all         on public.productos         for all to anon, authenticated using (true) with check (true);
create policy jornada_all           on public.jornada           for all to anon, authenticated using (true) with check (true);
create policy ventas_all            on public.ventas            for all to anon, authenticated using (true) with check (true);
create policy venta_items_all       on public.venta_items       for all to anon, authenticated using (true) with check (true);
create policy movimientos_stock_all on public.movimientos_stock for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------- Realtime
-- REPLICA IDENTITY FULL so DELETE events carry negocio_id and pass the
-- `negocio_id=eq.1` channel filter.
alter table public.productos         replica identity full;
alter table public.ventas            replica identity full;
alter table public.jornada           replica identity full;
alter table public.movimientos_stock replica identity full;

alter publication supabase_realtime add table
  public.productos, public.ventas, public.jornada, public.movimientos_stock;
