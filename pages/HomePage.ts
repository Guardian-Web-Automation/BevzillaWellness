import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly hero: Locator;
  readonly heroCta: Locator;
  readonly productLinks: Locator;

  constructor(page: Page) {
    super(page);
    // The homepage content lives in <main><div class="home"> ... </div></main>.
    // We scope to `.home` so we never latch onto the always-present (but hidden)
    // cart/search/menu overlays that Hydrogen renders at the top of the DOM.
    this.hero = page.locator('div.home').first();
    // First in-content "Shop"/CTA link (the benefit tiles link to PDPs with "Shop").
    this.heroCta = this.hero
      .getByRole('link', { name: /shop|buy|explore|discover|order/i })
      .first();
    // Product-CARD links only. We scope to `section` (and keep `:visible`) so we skip
    // the hero carousel slides, which live directly under `div.home` (outside any
    // <section>). Those slides are technically "visible" but continuously animate/
    // transform off-screen, so clicking `.first()` on the unscoped list fails with
    // "element is not stable / outside of the viewport". The real product cards render
    // inside the "Choose your brew" <section> grid and are stable, in-flow targets.
    this.productLinks = page.locator('section a[href*="/products/"]:visible');
  }

  async open() { await this.goto('/'); }
}
