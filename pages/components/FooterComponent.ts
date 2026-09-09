import { Page, Locator } from '@playwright/test';

// Verified: the site-footer navigation (incl. policy links) renders in a section
// ABOVE the literal <footer> tag (which only holds social icons). Policy links are
// therefore located page-wide rather than scoped to <footer>.
export class FooterComponent {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByRole('contentinfo').or(page.locator('footer')).first();
  }

  link(name: RegExp): Locator { return this.page.getByRole('link', { name }).last(); }
  get policyLinks(): Locator { return this.page.locator('a[href*="/policies/"]'); }
}
