import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

// Verified against the live Hydrogen PDP:
//  - The always-present cart/search/menu overlays also contain an <h1>, <main>,
//    images and prices, so we scope product locators to the ONE <main> that holds
//    the visible <h1> (overlays' headings are hidden, so getByRole skips them).
//  - Price is shown as a plain "$40.00" span; compare-at uses .line-through.
//  - This product has no numeric qty input and no radio variants (purchase options
//    are buttons) — so the variant/qty smoke cases self-skip by design.
export class ProductPage extends BasePage {
  private readonly productMain: Locator;
  readonly title: Locator;
  readonly mainImage: Locator;
  readonly thumbnails: Locator;
  readonly price: Locator;
  readonly comparePrice: Locator;
  readonly saveBadge: Locator;
  readonly addToCartButton: Locator;
  readonly qtyInput: Locator;
  readonly qtyIncrease: Locator;
  readonly qtyDecrease: Locator;
  readonly variantOptions: Locator;

  constructor(page: Page) {
    super(page);
    this.productMain = page.locator('main').filter({ has: page.getByRole('heading', { level: 1 }) }).first();
    this.title = page.getByRole('heading', { level: 1 }).first();
    // The gallery renders several slides; only the active one is visible.
    this.mainImage = this.productMain.locator('img:visible').first();
    this.thumbnails = this.productMain.getByRole('button', { name: /view image/i });
    // Current price = first pure "$…" text in the product area (compare-at follows it).
    this.price = this.productMain.getByText(/^\$\s?[\d,]+(?:\.\d{2})?$/).first();
    this.comparePrice = this.productMain.locator('.line-through, s, del').first();
    this.saveBadge = this.productMain.getByText(/save\s*\d+\s*%/i).first();
    // The product area also renders "Picked Just for You" upsell cards whose ATC
    // buttons read a bare "Add to Cart". The primary product CTA is the only one
    // that carries the price ("Add to Cart — $40.00"), so match on that.
    this.addToCartButton = this.productMain
      .getByRole('button', { name: /add to (cart|bag).*\$\s?\d/i })
      .first();
    this.qtyInput = this.productMain.locator('input[type="number"]').first();
    this.qtyIncrease = this.productMain.getByRole('button', { name: /increase|^\+$|plus/i }).first();
    this.qtyDecrease = this.productMain.getByRole('button', { name: /decrease|^-$|minus/i }).first();
    this.variantOptions = this.productMain.getByRole('radio');
  }

  async open(handle: string) { await this.goto(`/products/${handle}`); }
  async addToCart() { await this.addToCartButton.click(); }

  async priceValue(): Promise<number> {
    const t = (await this.price.textContent().catch(() => '')) ?? '';
    const m = t.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : NaN;
  }

  async hasVariants(): Promise<boolean> { return (await this.variantOptions.count()) > 1; }
}
