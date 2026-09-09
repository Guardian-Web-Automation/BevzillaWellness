import { Page, Locator } from '@playwright/test';

// Verified against the live Hydrogen DOM (bevzillawellness.com):
//  - Sticky site header is the only element with role=banner.
//  - Cart is a <button aria-label="Cart, N items"> — the count lives IN the
//    aria-label, there is no separate badge element.
//  - Search / menu are <button aria-label="Search"> / <button aria-label="Open menu">.
export class HeaderComponent {
  readonly page: Page;
  readonly banner: Locator;
  readonly logo: Locator;
  readonly cartIcon: Locator;
  readonly cartCount: Locator;
  readonly searchIcon: Locator;
  readonly menuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.banner = page.getByRole('banner');
    this.logo = this.banner.getByRole('link', { name: /bevzilla|home/i }).first();
    // The cart control is a button whose accessible name is "Cart, N items".
    this.cartIcon = this.banner.getByRole('button', { name: /cart|bag/i }).first();
    // Same element — the item count is encoded in its aria-label (see cartCountValue).
    this.cartCount = this.cartIcon;
    this.searchIcon = this.banner.getByRole('button', { name: /search/i }).first();
    this.menuButton = this.banner.getByRole('button', { name: /open menu|menu/i }).first();
  }

  navLink(name: string): Locator {
    return this.banner.getByRole('link', { name: new RegExp(`^\\s*${name}\\s*$`, 'i') }).first();
  }

  /**
   * On mobile the nav/search controls can be collapsed behind the hamburger.
   * Open it if the desired control isn't already visible. DOM-driven so it
   * works on any device without needing the Playwright project name.
   */
  async revealControls(target: Locator) {
    if (await target.isVisible().catch(() => false)) return;
    if (await this.menuButton.isVisible().catch(() => false)) {
      await this.menuButton.click();
    }
  }

  async gotoHome() { await this.logo.click(); }
  async clickNav(name: string) { await this.revealControls(this.navLink(name)); await this.navLink(name).click(); }
  async openCart() { await this.revealControls(this.cartIcon); await this.cartIcon.click(); }
  async openSearch() { await this.revealControls(this.searchIcon); await this.searchIcon.click(); }

  /** Reads the item count from the cart button's aria-label ("Cart, N items"). */
  async cartCountValue(): Promise<number> {
    const label = (await this.cartIcon.getAttribute('aria-label').catch(() => '')) ?? '';
    const m = label.match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  }
}
