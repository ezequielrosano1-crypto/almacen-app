# Tailwind v4 + shadcn/ui (Mira)

## Objective
Install shadcn/ui with the Mira preset (compact, dense UI) on top of the STOCKIA brand.

## Why
User request (2026-09-24). shadcn's new styles (Vega/Nova/Maia/Lyra/Mira) target Tailwind v4; project was on Tailwind 3.4.

## Scope
- Upgrade Tailwind 3.4 → 4 with the official `@tailwindcss/upgrade` tool; use `@tailwindcss/vite`.
- `@/*` alias (tsconfig + vite).
- Move custom primitives `src/components/ui/*` → `src/components/common/*` (shadcn owns `src/components/ui`).
- `shadcn init --preset mira -t vite`.
- Map shadcn theme variables to STOCKIA tokens (primary = brand blue, sidebar = carbon, fonts Inter/Montserrat).

Out of scope: rewriting views to shadcn components (later, component by component).

## TDD
Strict (global config), runner `npm test`. No new logic expected; config migration verified by typecheck/tests/build/visual check.

## Tasks
- [x] T1 Tailwind v4 upgrade (official tool) + `@tailwindcss/vite`
- [x] T2 `@/*` alias
- [x] T3 Move custom primitives to `src/components/common/`
- [x] T4 `shadcn init --preset mira`
- [x] T5 Map shadcn vars to STOCKIA brand
- [x] T6 Checks: typecheck, lint (baseline), tests, build, visual

## Progress
- T1: `@tailwindcss/upgrade` migrated config + stylesheet but failed installing deps (EALLOWSCRIPTS: global npm `allow-scripts` config breaks npm spawned by npx). Installed `tailwindcss@4` + `@tailwindcss/vite` manually; the template pass then saw v4 and changed nothing, so v3→v4 renames were done by hand (`shadow-sm`→`shadow-xs` ×11, `outline-none`→`outline-hidden` ×7; no removed utilities in use). Removed `tailwind.config.js`, `postcss.config.js`, `autoprefixer`.
- T2: `@/*` alias in tsconfig (paths only; TS 7 deprecates baseUrl), vite.config.js, vitest.config.ts.
- T3: `src/components/ui` → `src/components/common` (git mv), imports updated.
- T4: `shadcn init --preset mira -b radix` via the local binary (`npm i -D shadcn`, `./node_modules/.bin/shadcn`) to avoid the npx/allow-scripts issue. Preset defaulted to Hugeicons; switched `iconLibrary` to lucide and removed `@hugeicons/*`. Added `button` as smoke test. `src/components/ui` excluded from Biome (generated code).
- T5: shadcn vars mapped to STOCKIA tokens in `src/index.css` (background=canvas, primary=brand, sidebar=carbon, charts=brand blues, heading font=Montserrat). Removed unused `.dark` block (no dark mode) and a duplicate font import.
- T6: typecheck clean; 175/175 tests; build OK; lint only baseline files; visual check desktop + mobile: no regressions.
- Note: Mira buttons default to h-7 (28px), below the 44px touch target; use a larger size for touch/POS.

## Next step
Adopt shadcn components view by view (decide touch sizing first).
