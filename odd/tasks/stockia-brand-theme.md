# STOCKIA brand theme

## Objective
Apply the STOCKIA brand (colors, typography, logo, icons) to the app's global styles and existing components/views, without changing layouts. Layout redesign per mockups is a later feature.

## Problem / Why
The app still uses the old "Almacén" identity (green #2E6B4F, warm stone palette, system font). The client supplied the STOCKIA brand system (zip in repo root, gitignored).

## Scope
- Design tokens: Tailwind theme + CSS variables + a TS token module for inline `style`/icon `color` props.
- Fonts: Montserrat (display/headings/buttons) + Inter (body), bundled locally for PWA offline use.
- Logo assets: isotype (color + negative), horizontal logo, favicon, PWA icons, `Logo` component.
- Replace hardcoded hex colors and `stone-*` classes across src with brand tokens.
- Metadata: title, theme-color, PWA manifest name → STOCKIA.

Out of scope: sidebar/desktop shell, new screens, mockup layouts.

## Constraints
- Artifacts in English; UI copy stays in Rioplatense Spanish.
- No behavior changes; existing tests must keep passing.

## Brand tokens
| Token | Hex |
|---|---|
| carbon (primary dark) | #0F172A |
| brand / electric blue (accent) | #0066FF |
| brand-light | #4DA3FF |
| ink (main text / dark gray) | #1F2937 |
| slate (bluish gray) | #374151 |
| surface | #FFFFFF |
| canvas (app background) | #F5F7FB |
| success | #16A34A |
| warning | #F59E0B |
| danger | #DC2626 |

## TDD
Mode: strict (source: global orchestrator config). Runner: `npm test` (vitest).

## Tasks
- [x] T1 Logo assets in `public/` (isotype color/negative, logo, favicon, icon-192/512 on carbon)
- [x] T2 Token module `src/lib/theme.ts` + test (RED → GREEN)
- [x] T3 Tailwind theme, CSS variables, fonts (@fontsource), index.html + PWA manifest
- [x] T4 `Logo` component
- [x] T5 Replace hardcoded colors / stone classes in components and views
- [x] T6 Checks: typecheck, lint, tests, build

## Acceptance criteria
- No `#2E6B4F`, `#FAF8F5` or `stone-*` left in src.
- Headings/buttons render in Montserrat, body in Inter.
- Favicon/PWA icons show the STOCKIA isotype.
- `npm run typecheck`, `npm test`, `npm run build` pass.

## Progress
- T1: done prior to this session (logo/isotype/favicon/icon assets already in `public/`).
- T2: wrote `src/lib/theme.test.ts` first, ran `npx vitest run src/lib/theme.test.ts` → RED (`Failed to load url ./theme` — module didn't exist). Created `src/lib/theme.ts` exporting `colors`. Reran → GREEN (2 tests passed).
- T3: installed `@fontsource-variable/inter` + `@fontsource-variable/montserrat`; imported both in `src/main.tsx` before `index.css`. Updated `tailwind.config.js` (brand/ink/line/canvas/success/warning/danger tokens synced with theme.ts, sans/display fontFamily, `brand-gradient` backgroundImage). Rewrote `src/index.css` (CSS vars on `:root`, body canvas/ink/Inter, `@layer base` h1-h3 → font-display). Updated `index.html` (title, favicon, apple-touch-icon, theme-color, description). Updated `vite.config.js` PWA manifest (name/short_name/description/theme_color/background_color STOCKIA, includeAssets favicon + brand/*.png).
- T4: created `src/components/Logo.tsx` (`variant` color/white, `mark` full/icon, renders `<img>` from `/brand/*.png`, alt "STOCKIA"). Placed `<Logo className="h-7" />` at the top of `HomeView` above the existing "Hoy / Resumen del día" header (no other markup changes) — the app previously showed no app name anywhere else.
- T5: bulk-replaced old hex/`stone-*` classes across all 30 flagged files in `src` (components + views) plus `index.html`/`vite.config.js` per the mapping in the task brief. Added `font-display` to `PrimaryButton`, headline totals in `HomeView`/`DayClosingView`/`SaleCartFooter`. Fixed the "verde" comment in `PrimaryButton`. Judgment calls: `#5B7DB1` (StockMovementsView "entrada" indicator) → `brand-light` (kept as a 3rd distinct hue alongside brand/warning); `BarcodeScannerCartPanel` dark cart-overlay panel (`#111111`→ carbon `#0F172A`, disabled button `#3A3A3A`/`#8A8A8A` → `#374151`/`#94A3B8`) treated as UI chrome; `BarcodeScanner` root `#000000` backdrop kept pure black (camera video backdrop, out of scope per brief). Two characterization tests (`src/lib/stock.test.ts`, `test/characterization/lib-parity.test.js`) asserted the frozen legacy golden hex for `getStatusColor`; updated both to assert against `COLORS` from `src/lib/constants.ts` (current brand tokens) instead of the stale golden `output`, since the rebrand intentionally changes that color — status→color mapping logic itself is unchanged and still golden-input-driven.
- T6: `rg -n -i "2E6B4F|FAF8F5|stone-" src index.html vite.config.js` → empty. `npm run typecheck` → clean. `npm run lint` → 6 errors/29 warnings, all pre-existing `noExplicitAny` in `src/hooks/*.test.ts` files untouched by this change (verified via `git diff --name-only`, none of the flagged files were modified). `npm test` → 35 files / 155 tests passed. `npm run build` → succeeded, fonts self-hosted, PWA manifest generated.

## Next step
None — T1–T6 complete. Optional follow-up: consider fixing the pre-existing lint warnings in `useSalesRealtime.test.ts` etc. (out of scope for this restyle).
