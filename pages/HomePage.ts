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
    // Visible only — the DOM's first product link is an off-screen carousel/SSR
    // duplicate that never becomes visible.
    this.productLinks = page.locator('a[href*="/products/"]:visible');
  }

  async open() { await this.goto('/'); }
}
