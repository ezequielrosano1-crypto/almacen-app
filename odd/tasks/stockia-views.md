# STOCKIA views redesign

## Objective
Redesign the app's views to match the STOCKIA mockups (zip in repo root, `MOCK UPS/`), with a responsive shell: carbon sidebar on desktop, carbon header + bottom tab bar on mobile.

## Problem / Why
The app is mobile-only (`max-w-sm`) with the legacy layout. The client supplied mockups for every section. Brand tokens/fonts/logo are already applied (feature `stockia-brand-theme`).

## Scope (authorized by user, 2026-09-24)
- Redesign existing sections using ONLY existing data: Inicio, Inventario, Ventas, Configuración.
- Compras, Proveedores, Reportes appear in navigation as "Próximamente" screens (no backend).
- Stock movements and cash closing are folded into Inventario and Ventas respectively.

Out of scope: new DB tables/migrations (suppliers, purchases, categories, customers, users, branches), new payment methods, product images/SKU/categories.

## Constraints
- No data-layer or behavior changes (repositories, hooks, RPCs untouched) except navigation wiring.
- Artifacts in English; UI copy in Rioplatense Spanish (voseo), matching mockup copy where data exists.
- Don't fake data: omit mockup widgets that need data we don't have (clients, categories, suppliers), or show honest empty states.
- User greeting: there are no users; use the business name (`useBusinessInfo`).

## Design reference
See Engram `design/stockia-branding` and `design/stockia-screens`. Tokens: `src/lib/theme.ts`, Tailwind classes `carbon`, `brand`, `ink-*`, `line-*`, `canvas`, `success/warning/danger(-50)`, `font-display`.

## TDD
Mode: strict (source: global orchestrator config). Runner: `npm test` (vitest). Logic (navigation mapping, filters, derived KPIs) gets RED→GREEN tests. Pure presentational JSX has no component-test harness (no Testing Library); verified by typecheck/build/visual check — disclosed.

- [x] T1 Navigation model: tabs Inicio/Inventario/Ventas/Compras/Proveedores/Reportes/Configuración (+ mobile "Más"); movements under Inventario; update useNavigation + tests
- [x] T2 UI primitives: PageHeader, Card, KpiCard, StatusBadge, Button variants, FilterChips, ComingSoon
- [x] T3 Responsive AppShell: desktop Sidebar (logo-white, active blue pill, business card at bottom) + Topbar; mobile carbon header + restyled BottomNav
- [x] T4 Compras / Proveedores / Reportes "Próximamente" screens
- [x] T5 Inicio redesign
- [x] T6 Inventario redesign (stock landing + catalog/products merged, KPIs, filters, table/cards, movements access)
- [x] T7 Ventas redesign (landing, POS NewSale, closing views)
- [x] T8 Configuración redesign (card grid: Negocio, etc.)
- [x] T9 Restyle remaining sub-views (detail, forms, entry/adjust, movements) with primitives
- [x] T10 Checks: typecheck, lint (no new errors), tests, build, visual check mobile + desktop

## Acceptance criteria
- Desktop (≥1024px): sidebar + topbar layout like mockups; mobile: carbon header + bottom tabs.
- All existing flows still work (sale, closing, stock entry/adjust, product CRUD, settings).
- Compras/Proveedores/Reportes reachable and show "Próximamente".
- typecheck, tests, build pass; lint has no new errors.

## Progress

### Phase 1 (T1–T4) — done, 2026-09-24

Nav mapping decision: `TabId` = home/sales/stock/purchases/suppliers/reports/more.
`movements` is no longer a top-level tab — its two screens (`movements`,
`stockMovementDetail`) moved under `stock`, reached via a new "Ver movimientos"
row in `StockView`. Desktop sidebar shows all 7 sections in mockup order
(`src/lib/navigation.ts#DESKTOP_NAV_ITEMS`), `more` labeled "Configuración".
Mobile bottom bar shows only 5 (`MOBILE_NAV_ITEMS`): Inicio, Inventario,
Ventas, Compras, and the same `more` tab relabeled "Más" — it opens
`MoreView`, now a hub listing Proveedores/Reportes (goTab to their own tabs)
plus the pre-existing Productos/Información del negocio/Configuración rows.

RED→GREEN evidence:
- `src/lib/navigation.test.ts` (new) — RED: `Failed to load url ./navigation`
  (module didn't exist) → GREEN after adding `src/lib/navigation.ts`
  (3 tests: 7 desktop items in order, 5 mobile items with "Más" hub, icons present).
- `src/lib/format.test.ts` (`getInitials`, new) — RED:
  `TypeError: getInitials is not a function` → GREEN after implementing it in
  `src/lib/format.ts` (used by `AppShell` for the desktop avatar initials).
- `src/hooks/useNavigation.test.ts` — unchanged (its pure functions are
  already generic over `TabId`/`ScreenId`); still green after the type changes.

T2 primitives added under `src/components/ui/` (Card, PageHeader, KpiCard,
StatusBadge, Button, FilterChips, EmptyState) — presentational only, verified
via typecheck/build per the disclosed no-Testing-Library constraint.
`PrimaryButton` now delegates to `Button` (API unchanged). `Header.tsx` left
as-is (still used directly by several views); not removed.

T3: `src/components/layout/AppShell.tsx` replaces the `max-w-sm` wrapper in
`App.tsx`. Desktop (`lg:+`): fixed carbon sidebar (logo, 7 nav items, active
`bg-brand` pill, bottom business card with `useBusinessInfo` name) + topbar
with an avatar circle (business-name initials); no search bar or bell (would
need to be wired to real data/notifications, omitted per instructions).
Mobile: carbon header with small white logo, restyled `BottomNav` (now 5
items from `MOBILE_NAV_ITEMS`, safe-area bottom padding, `z-10`) — kept below
`BarcodeScanner`'s `z-50` fullscreen overlay so it still covers the sidebar.
Removed the now-redundant `<Logo>` from the top of `HomeView`.

Known gap (disclosed, deferred to T5–T9 view redesign): `AppShell`'s `<main>`
uses `px-4` on mobile as specified, but existing per-view containers (e.g.
`HomeView`, `StockView`) still carry their own `px-5`, so mobile content is
slightly over-padded until those views are redesigned.

T4: `src/views/ComingSoonView.tsx` — one component, `section` prop
(`purchases` | `suppliers` | `reports`), each with the mockup's title/subtitle
copy, `PageHeader` + `EmptyState` (brand-50 icon circle, "Próximamente",
section description, "En desarrollo" `StatusBadge`). Wired in `App.tsx` for
the three new tabs.

Verification (foreground):
- `npm run typecheck`: passes, no errors.
- `npm run lint`: 6 errors / 29 warnings — same 4 pre-existing files as
  baseline (`useCashShiftRealtime.test.ts`, `useInitialLoad.test.ts`,
  `useProductsRealtime.test.ts`, `useSalesRealtime.test.ts`); no new files.
- `npm test -- --run`: 36 files, 161 tests, all passing.
- `npm run build`: succeeds (tsc --noEmit + vite build + PWA precache).

### Phase 2 (T5–T6) — done, 2026-09-24

New pure logic (TDD, `npm test` runner):
- `src/lib/metrics.ts#getSalesDelta` — % change of today's sales vs
  yesterday's (via `uruguayDateKey`), returns `null` when yesterday had no
  sales (avoids a divide-by-zero/undefined %). RED:
  `TypeError: getSalesDelta is not a function` → GREEN after implementing;
  tests reuse `metrics.test.ts`'s existing `movimientos` fixture
  (420 hoy / 500 ayer → -16%, "down"; and a null case).
- `src/lib/stock.ts#getStatusTone` — maps `normal/bajo/agotado` → StatusBadge
  tone (`success/warning/danger`, `neutral` default). RED:
  `TypeError: getStatusTone is not a function` → GREEN.
- `src/lib/productFilters.ts` (new) `filterProducts` — name-substring search +
  `all/low/outOfStock` status filter, used by Inventario's toolbar. RED:
  `Failed to load url ./productFilters` (module didn't exist) → GREEN
  (`productFilters.test.ts`, 5 tests: all, name search, low, outOfStock,
  combined query+filter).
- `src/lib/chart.ts` (new) `buildLineChartGeometry` — maps a value series to
  SVG line/area path coordinates (no chart library), used by the "Evolución
  de ventas" widget. RED: `Failed to load url ./chart` → GREEN
  (`chart.test.ts`, 4 tests: empty series, value→y mapping direction, path
  shape, single-value centering without divide-by-zero).
- Reused pre-existing tested `getWeekSales` (already in `metrics.ts` with
  golden coverage) for the 7-day series instead of writing a new one.

T5 `src/views/HomeView.tsx` (full rewrite): `PageHeader` greeting from
`useBusinessInfo` name (`businessInfo.nombre`, fallback "Hola 👋"); KPI row
(`Ventas hoy` w/ delta+hint, `Ventas realizadas`, `Stock bajo`, `Sin stock`) —
all from existing data; `CashRegisterStatusCard` kept, now restyled on top of
the `Card` primitive; "Evolución de ventas (últimos 7 días)" as a plain
responsive inline SVG line+area chart (brand blue, `buildLineChartGeometry` +
`getWeekSales`, no library); Alertas card listing low/no-stock products
(`StatusDot` + "Quedan N unidades", "Ver todas →" to `stock/lowStock`); quick
actions grid (Nueva venta, Agregar producto, Ingresar stock, Cierre de caja,
all wired to existing `goTabScreen` targets); "Stockia te avisa" banner when
there are stock alerts. `App.tsx` now passes `businessName`, `todaySalesCount`,
`weekSales`, `salesDelta` to `HomeView`; `todayCashTotal`/`todayDebitTotal`
are no longer passed to `HomeView` (the old cash/débito breakdown card is
superseded by the KPI row + `CashRegisterStatusCard`) but are kept in
`App.tsx` since `DayClosingView` still needs them.

T6 `src/views/StockView.tsx` (full rewrite) is now the Inventario landing:
`PageHeader` + "+ Agregar producto" (→ `more/productForm`, existing flow);
KPIs (Total de productos, Stock bajo, Sin stock); toolbar with `SearchBar` +
`FilterChips` (Todos/Bajo stock/Sin stock, via `filterProducts`) plus
secondary buttons to the existing Ingresar stock / Ajustar stock / Movimientos
screens (`push("addStockEntry"|"adjustStock"|"movements")`); product list as
an `lg:` table (Producto, Código de barras, Precio, Stock, Estado via
`StatusBadge`+`getStatusTone`, Acciones) and mobile card rows; row click →
`productDetail`, "Editar" → `more/productForm`; `EmptyState` for no
products/no results. `App.tsx` now passes `products` and `goTabScreen` to
`StockView`.

Route consolidation: `StockView`'s old Row-list ("Ver productos" →
`productCatalog`, "Stock bajo" → `lowStock`) is gone — Inventario's own
list+filters now covers that browsing, so nothing pushes to
`productCatalog` anymore; `ProductCatalogView` and its route in `App.tsx`
are left in place (unreachable, not deleted, per instructions) rather than
removed. `lowStock` stays wired and reachable (HomeView's Alertas "Ver
todas →" still goes to `stock/lowStock`). `MoreView`'s "Productos" row now
does `goTab("stock")` instead of `push("products")` (it was a subset of what
Inventario shows); `ProductsView`/`products` screen is likewise left in
`App.tsx`, unreachable but not deleted.

Omitted mockup widgets (disclosed, no fake data): "Clientes" KPI (no
customer data model); % vs-ayer delta on every KPI (only "Ventas hoy" has a
same-shape yesterday total to diff — implemented via `getSalesDelta`; the
other three don't have a comparable historical snapshot); "Productos más
vendidos" ranking card (no per-product sales aggregation available without
new logic beyond scope); "Tendencia positiva" banner (needs a longer
historical baseline than 7 days of local `movements`); Inventario's
Categoría/Proveedor columns and category/provider filter dropdowns (no
category/supplier data model, out of scope per the feature doc).

Known gap (disclosed, carried from Phase 1, now narrowed): per-view `px-5`
wrappers are removed from `HomeView`/`StockView` as instructed, so body
content (KPI grid, cards, table) aligns to `AppShell`'s own `px-4`. The
`PageHeader` primitive itself still carries a baked-in `px-5 lg:px-0` (from
T2, shared across all screens), so on mobile the header title sits slightly
more inset than the body content below it. Left as-is: `PageHeader` is
shared infra outside T5/T6's scope and touching it risks affecting the
already-shipped `ComingSoonView` (T4); flagged here for a dedicated pass if
desired.

Verification (foreground):
- `npm run typecheck`: passes, no errors.
- `npm run lint` (`node_modules/.bin/biome lint .`, `npx biome lint .` fails
  locally with an npm auto-install prompt for a stray `lint` package, ran the
  binary directly instead): 6 errors / 29 warnings, same 4 pre-existing files
  as baseline (`useCashShiftRealtime.test.ts`, `useInitialLoad.test.ts`,
  `useProductsRealtime.test.ts`, `useSalesRealtime.test.ts`); no new files.
- `npm test` (`npx vitest run`): 38 files, 173 tests, all passing (was 36
  files/161 tests after Phase 1; +2 files/+12 tests from this phase).
- `npm run build`: succeeds (tsc --noEmit + vite build + PWA precache).

### Phase 3 (fixes + T7–T9) — done, 2026-09-24

Fixes first:
1. `PageHeader`'s baked-in `px-5 lg:px-0` removed (`src/components/ui/PageHeader.tsx`);
   `AppShell`'s own `px-4 lg:px-8` on `<main>` is now the only horizontal
   padding, so header and body align. `ComingSoonView`'s redundant wrapper
   `px-5 lg:px-0` removed too. `ConfirmationScreen` (full-screen confirmation
   after sale/entry/adjust) had its own `px-5` removed for the same reason —
   it renders inside `AppShell`'s `<main>`. Verified with
   `rg -n "px-5" src/views src/components`: remaining hits are legitimate —
   fixed-position mobile overlays that render outside `AppShell`'s padded
   flow (`SaleCartFooter`, `BarcodeScanner`, `BarcodeScannerCartPanel`) plus
   `Button.tsx`'s unrelated `lg` size-scale class name.
2. `getTopProducts(movements, limit, referenceDate)` added to
   `src/lib/metrics.ts` — aggregates `SaleMovement.items` quantity by
   productId over the last 7 days (today included), ranked desc. RED:
   `TypeError: getTopProducts is not a function` (confirmed by stashing the
   implementation and re-running) → GREEN after implementing
   (`metrics.test.ts`, 2 new tests: ranks by quantity across the 7-day
   window ignoring out-of-range/non-venta movements, empty when no sales).
   Wired into `App.tsx` (`topProducts = getTopProducts(movements, 5)`) and
   rendered as a new "Productos más vendidos (últimos 7 días)" card in
   `HomeView` (rank badge, name, "N u.") — hidden when empty, no fake data.
3. Dead routes removed: confirmed via `rg` that nothing pushes to
   `productCatalog` or `products` anymore (Inventario's own list/filters and
   `goTab("stock")` superseded them since Phase 2). Deleted
   `ProductCatalogView.tsx`, `ProductsView.tsx`, their `App.tsx` routes/
   imports, and the two `ScreenId` values (`types/navigation.ts`).
   `useNavigation.test.ts` used `"productCatalog"` as an arbitrary stack
   fixture; swapped to `"movements"` (still an arbitrary literal, not a
   behavior change).

T7 Ventas:
- `SalesView` (landing): `PageHeader` + brand CTA card "Nueva venta · Punto
  de venta", secondary cards to `DayClosingView`/`ClosingHistoryView`,
  `CashRegisterStatusCard`, manual-open button (unchanged logic), and a new
  "Últimas ventas" card (today's sales, sorted desc, top 5, `StatusBadge` by
  payment method) — wired from the already-computed `todaySales` (no new
  fetching, `App.tsx` now passes it as a prop).
- `NewSaleView` (POS): `PageHeader` with "Escanear código" secondary action.
  Added a `lg:` 2-column desktop layout alongside the existing mobile flow
  (both share the same `useSaleCart` state/handlers): left = search + product
  card grid (name, price, brand "+" tile, no images) + "Productos en venta
  (N)" table with qty stepper, subtotal, trash, "Limpiar"; right = sticky
  "Total de la venta" (`font-display`) + payment method tiles (Efectivo/
  Débito only) + "Cobrar venta". Mobile keeps `ProductRow` list +
  `SaleCartFooter` fixed footer + `BarcodeScanner`/`BarcodeScannerCartPanel`
  untouched (dark overlay semantics preserved), just toggled `lg:hidden` /
  `hidden lg:block` against the new desktop markup. All business logic
  (`useSaleCart`, `submitSale`, stock checks via cart add/change, closed-caja
  guard, scanner dedupe/cooldown) is unchanged — only presentation.
- `DayClosingView`, `ClosingHistoryView` restyled with `PageHeader`/`Card`/
  `Button`, totals in `font-display`; history got a `lg:` table + mobile
  cards, `StatusBadge` for automático/manual.

T8 Configuración:
- `MoreView` (desktop "Configuración" section / mobile "Más" hub) rewritten
  as a card grid (`lg:grid-cols-4`) / mobile row list: Negocio
  (`businessInfo`), Configuración (`settings`), Proveedores/Reportes with a
  "Próximamente" `StatusBadge` and disabled (non-clickable) per instructions
  — no fake Usuarios/Integraciones/Notificaciones cards added. Desktop adds
  an "Información del negocio" summary card with an "Editar" link (no
  "Usuarios recientes" — no user data model). Dropped the standalone
  "Productos" row (superseded by the Inventario tab since Phase 2 T6, same
  decision already applied on mobile).
- `BusinessInfoView`, `SettingsView` restyled with `PageHeader`/`Card`, kit
  inputs (`rounded-xl`, `border-line`, `focus:ring-brand`). `ClearDataView`
  and `CashRegisterSandboxView` (danger action panels) restyled onto `Card`
  with `text-danger`/`bg-danger` tokens instead of inline hex.

T9 Remaining sub-views: `ProductDetailView`, `ProductFormView`,
`AddStockEntryView`, `AdjustStockView`, `LowStockView`,
`StockMovementsView` (now uses `FilterChips` + `StatusBadge` per movement
type instead of custom pills), `StockMovementDetailView`,
`ConfirmationScreen` all restyled onto `PageHeader`/`Card`/`Button`/
`StatusBadge`/`EmptyState`; forms use `text-sm font-medium` labels and kit
inputs; desktop forms/detail constrained to `lg:max-w-2xl`. The now-unused
`Header.tsx` and `Row.tsx` components (no remaining callers after migrating
every view to `PageHeader`) were deleted; `PrimaryButton` is still used by
`SaleCartFooter`'s mobile-only fixed footer, kept as-is.
`BarcodeScannerCartPanel` left with its dark-overlay styling as instructed
(scanner-mode cart summary, not a form).

Omitted / disclosed: no new payment methods, categories, suppliers, or
customer data added anywhere (out of scope, unchanged from Phase 1–2
decisions).

Verification (foreground):
- `rg -n "px-5" src/views src/components`: 7 hits, all justified (see fix
  #1 above) — no unjustified leftovers.
- `npm run typecheck`: passes, no errors.
- `npm run lint` (`node_modules/.bin/biome lint .`): 6 errors / 29 warnings,
  same 4 pre-existing files as baseline (`useCashShiftRealtime.test.ts`,
  `useInitialLoad.test.ts`, `useProductsRealtime.test.ts`,
  `useSalesRealtime.test.ts`); no new files/errors.
- `npm test` (`npx vitest run`): 38 files, 175 tests, all passing (was 38
  files/173 tests after Phase 2; +2 tests from `getTopProducts`).
- `npm run build`: succeeds (tsc --noEmit + vite build + PWA precache).

Uncertain / for visual check (T10): the NewSaleView desktop 2-column POS
layout, product card grid and cart table are new composition not covered by
a mockup screenshot pixel-check in this pass — worth a close visual look.
Same for the MoreView desktop card grid proportions and the "Productos más
vendidos" card placement/spacing on Inicio.

## Next step
T10 (visual check, mobile + desktop, focusing on the areas flagged above).
