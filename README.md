# Bevzilla Wellness — Playwright Smoke Automation

End-to-end **smoke** suite for the Bevzilla Wellness storefront (Shopify **Hydrogen**, headless), targeting **Production** (`https://bevzillawellness.com`). Page Object Model, TypeScript, three execution environments, HTML + JUnit reporting, GitHub Actions, optional Slack.

> Scope note: **Checkout, login/account, and payment are NOT automated in this phase** (manual). No Cloudflare/Turnstile handling — the Hydrogen storefront has no bot challenge.

## Execution matrix (3 projects)

| Project | Device |
|---|---|
| `desktop-chromium` | Desktop Chrome |
| `mobile-chromium` | Pixel 7 |
| `mobile-webkit` | iPhone 14 |

All 66 smoke cases run on all three → ~198 executions.

## Setup

```bash
npm install                  # (no lockfile committed yet; add one to enable `npm ci`)
npx playwright install       # browser binaries (chromium + webkit)
cp .env.example .env         # set BASE_URL etc.
```

## Run

```bash
npm run smoke                # all @smoke, all 3 projects
npm run smoke:desktop        # desktop-chromium only
npm run smoke:headed         # desktop, headed, 1 worker (watch it run)
npm run smoke:mobile         # both mobile projects
npm run report               # open the HTML report
npm run typecheck            # tsc --noEmit
```

> **Headed runs:** use `npm run smoke:headed` (single worker). Running many headed
> browser windows in parallel starves the machine and causes teardown timeouts — one
> worker keeps a headed run stable.

## Project structure

```
bevzilla-smoke/
├── playwright.config.ts        # 3 projects, list+html+junit, trace/screenshot/video on failure
├── fixtures/pom.fixture.ts     # injects page objects + pageHealth (console/network capture)
├── pages/
│   ├── BasePage.ts
│   ├── components/{HeaderComponent,CartDrawer,FooterComponent}.ts
│   └── {Home,Collection,Product,Search,Policy}Page.ts
├── utils/{env,logger,pricing,health,platform}.ts
├── test-data/site.ts           # routes, collection handles, expected counts, sample product
└── tests/smoke/
    ├── plp.shared.ts           # parametrized PLP smoke (mushroom/protein/flavoured reuse it)
    ├── mushroom|protein|flavoured.smoke.spec.ts
    ├── pdp|cart|search|home|global.smoke.spec.ts
    └── ...
```

## ✅ Selectors verified against production (2026-09)

The POM locators have been verified/corrected against the live Hydrogen DOM. Key facts about this theme, now encoded in the page objects:

- **Cart, search and the mobile menu are always-present off-canvas overlays** (`.overlay-cart` / `.overlay-search` / `.overlay-mobile`, each `role="dialog"`, `visibility:hidden` until opened). They render at the top of the DOM, so unscoped `main` / `h1` / `a[href*="/products/"]` / `$`-price selectors can latch onto them — POM locators are scoped to visible page content (or the specific overlay) to avoid this.
- **Product cards are `<div>`s** (not `<li>`/`<article>`) inside the `plp-choose-brew-title` section; each has a direct-child product image link + a `<form action="/cart">`. Compare-at price is a `.line-through` span; the header cart count lives in the cart **button's `aria-label`** ("Cart, N items"); cart line items are `<article>`s with a live-region qty `<span>` (not an input).
- **PDP** has three "Add to Cart" buttons (two are upsell cards); the primary CTA is the one carrying the price ("Add to Cart — $40.00"). No numeric qty input / radio variants, so those PDP cases self-skip.

Run `npm run smoke` for the full matrix. A browser install (`npx playwright install`) is required first.

## Logging

Every test logs its steps to **both** the console and the HTML report. Each logical
phase is wrapped in a `step(...)` helper (`utils/steps.ts`) that:

- registers a **`test.step`** — shown in the HTML report timeline (`npm run report`), and
- logs the step title + any values via **Winston** — printed in the terminal and
  captured into the report's stdout, prefixed with the current test-case name.

Example console output:

```
[2026-09-09T…Z] INFO: [BEV-HOME-001 - Home page loads … @smoke] ▶ Open the Home page
[2026-09-09T…Z] INFO: [BEV-HOME-001 - Home page loads … @smoke] Home page responded with HTTP 200
```

## 🐞 Known site issues (no longer asserted)

The suite previously caught these genuine production issues; the corresponding
checks were **removed at the team's request** as out of scope. The issues still
exist on the live site:

- **`/policies/shipping-policy` → 404** — footer links to a page that doesn't exist (was `BEV-GLOB-012`; the whole policies suite has been removed).
- **`/blogs/news` → 404** — linked but missing (was part of `BEV-HOME-019`, removed).
- **Cart quantity changes emit console errors** — `[h2:error:useOptimisticCart] …` (was `BEV-CRT-029`, removed).
- **`/pages/contact` has no web form** (mailto-only) — contact suite removed.

## Guarded behaviour on Production

- **Checkout CTA (BEV-CRT-020)** is only asserted visible/enabled — never clicked through.
- Pricing assertions are exact and always assert price/subtotal **> 0** (never $0).

## TC coverage (66 automated)

| Spec file | TC IDs |
|---|---|
| mushroom.smoke.spec.ts | BEV-MCC-002, 008, 009, 015, 016, 017, 020, 021, 024, 025, 026, 027, 051 |
| protein.smoke.spec.ts | BEV-PCC-002, 005, 006, 012, 013, 014, 017, 018, 020, 021, 031 |
| flavoured.smoke.spec.ts | BEV-FCC-002, 005, 007, 012, 013, 014, 017, 018, 020, 021, 032 |
| pdp.smoke.spec.ts | BEV-PDP-002, 003, 004, 005, 006, 012, 016, 018, 019, 033 |
| cart.smoke.spec.ts | BEV-CRT-001, 005, 006, 007, 008, 010, 011, 012, 020 |
| search.smoke.spec.ts | BEV-SRCH-001, 003, 006, 017 |
| home.smoke.spec.ts | BEV-HOME-001, 003, 008, 023 |
| global.smoke.spec.ts | BEV-GLOB-002, 003, 006, 021 |

### Not automated (by decision — manual / next phase)

| Area | Status |
|---|---|
| Checkout (BEV-CHK-*) | Manual this phase |
| Login / Account | Next phase |
| Catalog PLP (BEV-CAT), Account (BEV-ACCT) | Planned |
| Non-smoke cases in the master sheet | Manual |

Some variant/quantity PDP checks self-skip at runtime if the product has no variants/qty selector, so the executed count varies slightly by product state.
