# Migrate views to shadcn/ui components

## Objective
Replace hand-rolled UI in views with shadcn/ui (Mira) components, applying better-ui and better-accessibility rules, keeping the STOCKIA look.

## Why
User request (2026-09-24), after shadcn Mira setup (feature `shadcn-mira`). User asked to load the better-ui skill first so design decisions follow its rules.

## Scope
- Add needed shadcn components via the local binary (`./node_modules/.bin/shadcn add ...`; npx fails with EALLOWSCRIPTS).
- `src/components/ui/*` stays pristine (regenerable). Brand/touch/a11y adaptations live in `src/components/common/*` wrappers, which keep their current APIs.
- Views adopt: Button, Card, Badge, Empty, ToggleGroup (filter chips), Input/InputGroup/Label/Field/Select/Textarea (forms), Table, Separator, AlertDialog (replaces `confirm()`), Sonner toasts (replaces `alert()`), Avatar, DropdownMenu (row actions), Skeleton where loading exists.
- No data/business-logic changes (repositories, RPCs, domain). `alert()` → toast in hooks is allowed (UI notification only).

## Design decisions (from better-ui / better-accessibility)
1. Hit areas: primary controls `h-10 pointer-coarse:h-11` (40px desktop / 44px touch). Mira compact sizes only for dense secondary actions (e.g. table row actions), with hit area extended via pseudo-element to ≥24px spacing rule, never overlapping.
2. Elevation: cards/containers use layered `--shadow-border` (+ `--shadow-border-hover` on clickable cards, `transition-property: box-shadow` 150ms ease-out) instead of border+shadow. Inputs, table cells and dividers keep borders.
3. Scale on press: `motion-safe:active:scale-[0.96]`, `transition-property: scale` 150ms ease-out; `static` prop disables it.
4. Concentric radius: outer = inner + padding for closely nested surfaces (inset ≤ 24px).
5. Icon stroke: 1.5 next to regular text, 2 next to semibold/bold. One icon library (lucide).
6. Transitions: name exact properties; never `transition-all` in our code (override shadcn's via className where wrapped).
7. Focus: visible `:focus-visible` ring, 2px solid brand (`ring-2 ring-ring ring-offset-2`), not Mira's `ring/30`.
8. Forms: every control has a bound `<Label>`; placeholder never a label; `inputmode="decimal"` price, `inputmode="numeric"` stock; submit stays enabled, validate on submit, `aria-invalid` + `aria-describedby` error text, focus first invalid field.
9. Feedback: `alert()` → Sonner toasts; error toasts persist until dismissed; success polite. `confirm()` → AlertDialog (focus trapped, Esc closes, focus returns).
10. Global: `touch-action: manipulation` on interactive elements; hover styles only via Tailwind 4 `hover:` (already gated by `@media (hover: hover)`); status never color-only (badges keep text).

## TDD
Strict (global config), runner `npm test`. New pure logic (e.g. form validation helpers) gets RED→GREEN tests. JSX without component harness → typecheck/build/visual check (disclosed). Existing tests that assert `alert` must be updated to the new notifier, not deleted.

## Tasks
- [x] T1 Add shadcn components + Toaster mount + global CSS tokens (`--shadow-border*`, touch-action)
- [x] T2 Rebuild `common/` wrappers on shadcn (Button, Card, StatusBadge→Badge, EmptyState→Empty, FilterChips→ToggleGroup, KpiCard, PageHeader) keeping APIs; SearchBar→InputGroup
- [x] T3 Forms: ProductForm, BusinessInfo, AddStockEntry, AdjustStock → Field/Label/Input/Select; validation helper tested
- [x] T4 Tables: Inventario, ClosingHistory, POS cart → Table; row actions → DropdownMenu
- [x] T5 Dialogs & toasts: `confirm()` → AlertDialog; `alert()` → toast
- [x] T6 Shell & rest: AppShell avatar → Avatar, sidebar nav polish, remaining views
- [x] T7 Checks: typecheck, lint (baseline), tests, build, visual (desktop + mobile)

## Progress

### Phase A (T1 + T2)
- Components added via `./node_modules/.bin/shadcn add ...`: card, badge, input, input-group, label, field, select, textarea, table, separator, alert-dialog, sonner, avatar, dropdown-menu, toggle-group, empty, skeleton. All requested components existed for the `radix-mira` style — none skipped (`toggle.tsx` was pulled in automatically as `toggle-group`'s dependency).
- `next-themes` (declared in package.json already, `^0.4.6`) installed cleanly as `sonner.tsx`'s dependency; the app has no `ThemeProvider`, so we don't rely on `useTheme()` — `<Toaster theme="light" .../>` is mounted once in `App.tsx`, forcing the light palette regardless. `mobileOffset={{ bottom: "88px" }}` clears the fixed mobile `BottomNav`.
- `cn` dedupe finding: verified with a standalone node script — `cn("transition-all duration-150", "transition-[color,...] duration-150 ease-out")` correctly drops `transition-all`, and `cn("active:translate-y-px", "active:translate-y-0")` correctly drops the Mira default. No manual override needed beyond passing our classes through `className`.
- `src/index.css`: added `--shadow-border` / `--shadow-border-hover` (oklch values from better-ui/surfaces.md) inside the STOCKIA `@theme` block — Tailwind v4 auto-generates the `shadow-border` / `shadow-border-hover` utilities from the `--shadow-*` namespace (verified in `dist/assets/*.css` after build). Added the `touch-action: manipulation` rule to `@layer base` for `a, button, [role="button"], input, select, textarea, label`.
- Rebuilt on shadcn/ui, all public APIs unchanged (only additive: `Button` gained a `static` prop and a `destructive` variant value; icon-only `Button` usage now requires `aria-label` at the type level via a discriminated union — no existing call sites are icon-only, so nothing broke):
  - `common/Button.tsx` — wraps `ui/button`; variant map primary→default, secondary→outline (brand border/text, brand-50 hover), dark→carbon bg (base "default" variant fully overridden via className), ghost→ghost, +destructive; sizes overridden to `h-10/h-8/h-11` (+`pointer-coarse:` bump) since Mira's base is `h-7`; scale-on-press `motion-safe:active:not-disabled:scale-[0.96]`, transition limited to `[color,background-color,border-color,box-shadow,scale]`, Mira's `active:translate-y-px` neutralized via `active:translate-y-0`; focus ring replaced with `ring-2 ring-ring ring-offset-2 ring-offset-background`; trailing-icon optical padding (`pe-*` = text-side − 2px) applied when `iconRight` is set.
  - `common/Card.tsx` — wraps `ui/card`; drops Mira's `ring-1 ring-foreground/10` (`ring-0`), applies `shadow-border`, adds `hover:shadow-border-hover` + `transition-[box-shadow]` only when `onClick`/`role="button"` (clickable).
  - `common/StatusBadge.tsx` — wraps `ui/badge` (`variant="secondary"` as a neutral base, fully overridden by tone classes); dot + text kept (status never color-only).
  - `common/EmptyState.tsx` — wraps `ui/empty` (`Empty`/`EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription`/`EmptyContent`), same props, brand-tinted icon medallion kept.
  - `common/FilterChips.tsx` — wraps `ui/toggle-group` (`type="single"`), `onValueChange` guards against `undefined` so a chip can't be deselected to empty; roving-tabindex arrow-key nav comes free from Radix.
  - `common/KpiCard.tsx`, `common/PageHeader.tsx` — rebuilt on the new `Card`; icon strokeWidth set to `1.5` next to regular-weight labels (decision 5); `PageHeader`'s back button got a real `40px`/`44px` (`pointer-coarse:`) hit area, `aria-label="Volver"` and a focus-visible ring (previously an unlabeled bare `<button>`).
  - `src/components/SearchBar.tsx` — wraps `ui/input-group` (`InputGroupAddon` + `InputGroupInput`), `type="search"` `inputMode="search"`, `aria-label` mirrors the placeholder, `h-10 pointer-coarse:h-11`.
  - `src/components/layout/AppShell.tsx` — desktop topbar initials now `ui/avatar` (`Avatar size="lg"` + `AvatarFallback`); sidebar nav icon strokeWidth set to `1.5` (regular-weight label). Left the shell's global `<style>` focus-visible outline in place as a baseline fallback for nav buttons not yet migrated (T6 will revisit).
- Deviations: none from the 10 decisions. Added `disabled:opacity-50` (inherited from Mira's base `Button`) on top of the previous `bg-line`/`text-ink-muted` disabled look — a minor additive visual change, not a decision violation; flagged here for visibility.
- `PrimaryButton.tsx` untouched — still delegates to `common/Button` (`variant="primary" size="lg" fullWidth`).

### Phase B (T3–T6)
- Phase A follow-up fixed first: `common/Button.tsx` disabled state now adds `disabled:opacity-100` after the token-pair classes, neutralizing Mira's stacked `disabled:opacity-50` so disabled buttons look exactly like `bg-line`/`text-ink-muted`, not that pair faded out.
- **T3 forms** — extracted the existing `puedeGuardar`-style checks into `src/lib/validation/forms.ts` (TDD: `src/lib/validation/forms.test.ts` written first, confirmed RED — module didn't exist — then implemented, 19 tests GREEN). Four pure validators: `validateProductForm`, `validateBusinessInfo`, `validateStockEntry`, `validateStockAdjustment`, each returning a field→message map in voseo. `ProductFormView`, `BusinessInfoView`, `AddStockEntryView`, `AdjustStockView` rebuilt on `Field`/`FieldLabel`/`FieldError`/`FieldDescription` + `Input`: submit stays enabled, validates on submit, sets `aria-invalid`/`aria-describedby` and focuses the first invalid field via refs; saving state shows a `Loader2` spinner (motion-safe) keeping the label. `inputMode` set per field (`decimal` price/kg quantities, `numeric` integer stock, `tel` contact, `organization` business name, `off` barcode). Product form's unit toggle and AdjustStock's reason picker use `ToggleGroup` (see decision below), not `Select`.
- **Select vs ToggleGroup** — chose `ToggleGroup` everywhere a fixed small set of mutually exclusive options is chosen (AdjustStock's 4 reasons, product unit, payment method): all options stay visible and reachable in one tap, which beats an extra open+choose step on a touch device (better-ui hit-areas.md). No screen in scope needed an open-ended/long option list, so `Select` wasn't used at all this phase.
- **T4 tables** — `StockView` desktop inventory table and `ClosingHistoryView` desktop table rebuilt on `Table`/`TableHeader`/`TableRow`/`TableHead`/`TableCell`; numeric columns (`Precio`, `Stock`, `Total`, `Ventas`) right-aligned with `tabular-nums`. `NewSaleView`'s desktop cart table rebuilt the same way. Mobile lists stay `Card`-based rows (role="button", keyboard-operable).
- **Row actions (DropdownMenu)** — Inventario desktop rows: icon-only trigger (`MoreHorizontal`, `aria-label="Acciones de {producto}"`) with `stopPropagation` (row click still opens detail) and items Ver detalle / Editar / Ingresar stock / Ajustar stock — all four kept because `addStockEntry`/`adjustStock` already accept a preselected `productId` via `push(screen, {productId})`.
- **T5 dialogs & toasts** — `ProductFormView`'s `confirm()` → `AlertDialog` (title `¿Eliminar "{nombre}"?`, description "Esta acción no se puede deshacer.", Cancelar/Eliminar destructive, disabled+spinner while deleting). Every `alert()` in `NewSaleView` and hooks (`useProducts`, `useCashRegister`, `useStockMovements`) → `toast.error(..., { duration: Infinity })` from sonner (errors persist until dismissed). `useProducts.test.ts`'s `vi.stubGlobal("alert", ...)` spy replaced with `vi.mock("sonner", ...)` + a `toastErrorSpy`, asserting the same FK-violation message — coverage preserved, not deleted. No success toasts added (existing flows already use `ConfirmationScreen`, no duplication).
- **T6 shell & remaining views** — removed `AppShell`'s global `<style>` focus-outline fallback now that interactive elements carry their own `focus-visible:ring-2` classes (added to the sidebar nav buttons and `BottomNav`). Converted remaining hand-rolled clickable `<button>` "cards"/rows to `common/Card` (`role="button"`, keyboard Enter/Space handling, `shadow-border`/`shadow-border-hover`) in `MoreView`, `SalesView`, `LowStockView`, `StockMovementsView`, `ProductRow` (shared by AddStockEntry/AdjustStock/NewSale search lists). `HomeView`'s "Ver todas" link and bell/alert icon button converted to `common/Button`. `CashRegisterSandboxView` and `ClearDataView` secondary/destructive text buttons converted to `common/Button` (`secondary`/`destructive` variants); `ClearDataView`'s inline confirm step kept (not native `confirm()`, no change needed there) but its buttons now use the shared component. `BarcodeScanner`'s icon-only close button (`X`, no prior aria-label) converted to `common/Button` with `aria-label="Cerrar escáner"`. `ClosingHistoryView`'s loading state got a `Skeleton`-based placeholder (`role="status"`) instead of plain "Cargando..." text.
- **Headings** — confirmed one `<h1>` per screen (`PageHeader`); the two `<h2>`s (`BarcodeScanner` overlay, `ConfirmationScreen`) are standalone full-screen replacements with no sibling `h1`, not a skipped level.
- Deviations from the 10 decisions: none. `BarcodeScannerCartPanel` (dark scanner overlay panel) and `SaleCartFooter`'s payment method left as plain-styled elements where they already had visible text labels or were converted lightly (SaleCartFooter's icon-only qty/remove buttons got `common/Button` + `aria-label`; its payment picker became `ToggleGroup`); `BarcodeScannerCartPanel` untouched since every control already has a visible text label and Mira's light-surface Toggle/Button styling doesn't fit its dark overlay without heavy overrides — no hard-rule violation there, deliberately out of scope this phase.

## Verification (Phase B)
- `npm run typecheck` → clean, no errors.
- `npm run lint` (biome) → only `lint/suspicious/noExplicitAny` in the 4 baseline test files (`useCashShiftRealtime`, `useInitialLoad`, `useProductsRealtime`, `useSalesRealtime` `.test.ts`); fixed two pre-existing `useOptionalChain` warnings (`NewSaleView.tsx`, `CashRegisterSandboxView.tsx`) and one a11y error (`ClosingHistoryView.tsx`'s loading `aria-label` → moved to `role="status"`) surfaced along the way.
- `npm test` → 39 files, 194 tests passed (includes new `src/lib/validation/forms.test.ts`, 19 tests, and the updated `useProducts.test.ts` toast assertion).
- `npm run build` → typecheck + vite build succeed (pre-existing >500kB chunk-size warning, unrelated to this change).
- `rg -n "alert\(|confirm\(" src --glob '!*.test.ts'` → empty.
- `rg -n "transition-all" src --glob '!src/components/ui/**'` → empty.
- `rg -n "<input|<select|<textarea|<table" src/views src/components --glob '!src/components/ui/**'` → empty (no raw form/table elements or hidden file inputs remain outside `components/ui`).

### T7 — visual check (parent), 2026-09-24
Isolated dev server (dummy Supabase) + headless Chromium (playwright-core), desktop 1440 and mobile 390/320 with touch.
Found and fixed:
- HIGH: focus-first-invalid failed and refs were dropped ("Function components cannot be given refs"): shadcn v4 components target React 19 (ref as prop, no forwardRef) while the app ran React 18 — also breaks Radix `asChild` triggers. Upgraded react/react-dom 19.3, @types/react(-dom) 19, lucide-react 0.383 → 1.48 (old version had no React 19 peer). No ref warnings after; focus lands on `product-name`.
- MEDIUM: Mira `Card` base adds `gap-4`, `py-4`, `text-xs` → KPI cards stretched, section titles shrank to 12px. Common `Card` now resets `gap-0 py-0 text-base leading-normal`.
- MEDIUM: product form lived under the `more` tab → sidebar highlighted Configuración. Moved `productForm` route to `stock`; callers use `push` / `goTabScreen("stock", ...)`.
- MEDIUM: mobile Inventario action row overflowed ("Movimientos" clipped) → 2-col grid on mobile, inline on lg. Inicio quick actions clipped at 320px → 1 col below 360px.
Measured: min visible button height 40px desktop / 44px touch; 4 `aria-invalid` fields on empty submit; no horizontal overflow at 320/390 on all tabs.
Not verified with real data: tables with rows, row DropdownMenu, AlertDialog delete, toasts (saves go to Supabase; isolated instance cannot persist).
Checks: typecheck clean, 194/194 tests, build OK, lint only baseline files.

## Next step
User review with real data (delete dialog, row actions menu, error toasts), then commit.
