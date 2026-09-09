import { Page, Locator } from '@playwright/test';

// Verified against the live Hydrogen DOM:
//  - The cart is an off-canvas overlay: <div class="overlay overlay-cart" role="dialog">,
//    visibility:hidden when closed, gains ".expanded" + becomes visible when open.
//  - Each line item is an <article> containing the product link, image and prices.
//  - Quantity is a <span aria-live="polite"> (NOT an <input>), flanked by
//    aria-labelled Increase/Decrease/Remove buttons.
//  - Footer shows Subtotal (pre-discount), Discount, and Total (payable). We treat
//    "Total" as the cart value so it reconciles with the discounted line prices.
export class CartDrawer {
  readonly page: Page;
  readonly root: Locator;
  readonly lineItems: Locator;
  readonly subtotal: Locator;
  readonly checkoutButton: Locator;
  readonly emptyState: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('.overlay-cart');
    this.lineItems = this.root
      .locator('article')
      .filter({ has: page.locator('a[href*="/products/"]') });
    // The payable total row ("Total$40.00"); ^Total avoids matching "Subtotal".
    this.subtotal = this.root.locator('div', { hasText: /^Total\s*\$?\s?[\d.,]+$/ }).first();
    this.checkoutButton = this.root
      .getByRole('link', { name: /checkout/i })
      .or(this.root.getByRole('button', { name: /checkout/i }))
      .first();
    this.emptyState = this.root.getByText(/cart is empty/i).first();
    this.closeButton = this.root.getByRole('button', { name: /close cart|close/i }).first();
  }

  line(name: string): Locator { return this.lineItems.filter({ hasText: name }).first(); }
  // Quantity is shown in a live-region span, not an input.
  itemQty(name: string): Locator {
    return this.line(name).locator('span[aria-live="polite"], span.tabular-nums').first();
  }
  // Line price = the leaf money <span> that is NOT struck through (discounted price).
  itemPrice(name: string): Locator {
    return this.line(name).locator('span:not(.line-through)').filter({ hasText: /\$\s?\d/ }).first();
  }

  async increaseQty(name: string) {
    await this.line(name).getByRole('button', { name: /increase/i }).first().click();
  }
  async decreaseQty(name: string) {
    await this.line(name).getByRole('button', { name: /decrease/i }).first().click();
  }
  async removeItem(name: string) {
    // The explicit remove control is the type=submit "×" button (aria "Remove <name>").
    await this.line(name).locator('button[type="submit"][aria-label*="remove" i]').first().click();
  }

  async subtotalValue(): Promise<number> {
    const t = (await this.subtotal.textContent().catch(() => '')) ?? '';
    const m = t.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : NaN;
  }
  async itemPriceValue(name: string): Promise<number> {
    const t = (await this.itemPrice(name).textContent().catch(() => '')) ?? '';
    const m = t.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : NaN;
  }
  async itemQtyValue(name: string): Promise<number> {
    const t = (await this.itemQty(name).textContent().catch(() => '')) ?? '';
    const m = t.match(/\d+/);
    return m ? parseInt(m[0], 10) : NaN;
  }

  async close() { await this.closeButton.click(); }
}
