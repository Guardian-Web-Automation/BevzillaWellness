import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CollectionPage extends BasePage {
  readonly productCards: Locator;
  readonly purchasableCards: Locator;

  constructor(page: Page) {
    super(page);
    // The PLP grid is the "Choose your brew" section. Scoping to it avoids the
    // always-present (hidden) cart-drawer "Picked for you" cards. Card markup
    // differs by collection (mushroom uses a compact card, protein/flavoured a
    // wide featured card), but every card is a <div> with a direct-child product
    // image link plus an Add-to-Cart <form action="/cart">, which we match on.
    this.productCards = page
      .locator('section[aria-labelledby="plp-choose-brew-title"]')
      .locator('div:has(> a[href*="/products/"] > img):has(form[action="/cart"])');
    // Cards that can actually be added to cart. An out-of-stock product keeps the
    // same card markup but its cart-form button reads "Sold out" (disabled) instead
    // of "Add to Cart", so it has no button matching the ATC name — filtering on that
    // button excludes sold-out cards. Lets the add-to-cart tests pick a buyable product
    // (and skip when a whole collection is sold out) instead of hard-failing on stock.
    this.purchasableCards = this.productCards.filter({
      has: page.getByRole('button', { name: /add to cart|add to bag/i }),
    });
  }

  async openCollection(handle: string) { await this.goto(`/collections/${handle}`); }

  card(name: string): Locator { return this.productCards.filter({ hasText: name }).first(); }
  cardByIndex(i: number): Locator { return this.productCards.nth(i); }

  image(card: Locator): Locator { return card.locator('img').first(); }
  // The title is the text-bearing product link (the image link has an empty text node).
  title(card: Locator): Locator { return card.locator('a[href*="/products/"]').filter({ hasText: /\w/ }).first(); }
  // Current price = the leaf money <span> that is NOT struck through.
  // (Must be a leaf span — an ancestor div would also carry "$" plus noise like
  // "30 Servings", corrupting the parsed value.)
  price(card: Locator): Locator {
    return card.locator('span:not(.line-through)').filter({ hasText: /\$\s?\d/ }).first();
  }
  // Compare-at price is a <span class="line-through">.
  comparePrice(card: Locator): Locator { return card.locator('.line-through, s, del'); }
  saveBadge(card: Locator): Locator { return card.getByText(/save\s*\d+\s*%/i); }
  addToCartButton(card: Locator): Locator { return card.getByRole('button', { name: /add to cart|add to bag/i }).first(); }
  // The card's purchase control — the cart-form button, whether it reads "Add to Cart"
  // or "Sold out". Used to assert the CTA exists without requiring the product to be in stock.
  purchaseControl(card: Locator): Locator { return card.locator('form[action="/cart"] button').first(); }
  productLink(card: Locator): Locator { return card.locator('a[href*="/products/"]').first(); }

  async addToCart(name: string) { await this.addToCartButton(this.card(name)).click(); }
  async openProduct(name: string) { await this.productLink(this.card(name)).click(); }

  async nameOf(card: Locator): Promise<string> {
    return (await this.title(card).innerText()).trim();
  }
}
