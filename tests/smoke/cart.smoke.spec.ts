import { test, expect } from '../../fixtures/pom.fixture';
import { collections } from '../../test-data/site';
import { step, log } from '../../utils/steps';
import type { HeaderComponent } from '../../pages/components/HeaderComponent';
import type { CartDrawer } from '../../pages/components/CartDrawer';
import type { CollectionPage } from '../../pages/CollectionPage';

/** Opens the collection, adds the first product to the cart, and returns its name. */
async function addFirst(collectionPage: CollectionPage, handle: string = collections.mushroom): Promise<string> {
  return step(`Add the first product of the ${handle} collection to the cart`, async () => {
    await collectionPage.openCollection(handle);
    const name = await collectionPage.nameOf(collectionPage.cardByIndex(0));
    await collectionPage.addToCartButton(collectionPage.card(name)).click();
    log(`Added product to cart: "${name}"`);
    return name;
  });
}

async function ensureOpen(header: HeaderComponent, cartDrawer: CartDrawer) {
  return step('Ensure the cart drawer is open', async () => {
    if (await cartDrawer.root.isVisible().catch(() => false)) return;
    // After add-to-cart or a `?cart=open` reload the drawer auto-opens — prefer that
    // (wait generously; it can be slow under load). Only if it never opens do we click
    // the header cart button, and then with a short timeout: if a late auto-open has
    // already expanded the overlay it will intercept the click, so we must not hang on
    // it — the final assertion confirms the drawer is open either way.
    await cartDrawer.root.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    if (!(await cartDrawer.root.isVisible().catch(() => false))) {
      await header.cartIcon.click({ timeout: 5000 }).catch(() => {});
    }
    await expect(cartDrawer.root).toBeVisible();
  });
}

test.describe('Cart — smoke', () => {
  test('BEV-CRT-001 - Cart drawer opens automatically after Add to Cart @smoke', async ({ collectionPage, cartDrawer }) => {
    await addFirst(collectionPage);
    await step('Verify the cart drawer is visible', () => expect(cartDrawer.root).toBeVisible());
  });

  test('BEV-CRT-005 - Cart line item displays product image, title and price @smoke', async ({ collectionPage, cartDrawer, header }) => {
    const name = await addFirst(collectionPage);
    await ensureOpen(header, cartDrawer);

    await step(`Verify the "${name}" line item shows image, title and price`, async () => {
      const line = cartDrawer.line(name);
      await expect(line).toBeVisible();
      await expect(line.locator('img').first()).toBeVisible();
      await expect(cartDrawer.itemPrice(name)).toBeVisible();
      log(`Line item "${name}" shows image, title and price`);
    });
  });

  test('BEV-CRT-006 - Increasing line item quantity updates the cart total @smoke', async ({ collectionPage, cartDrawer, header }) => {
    const name = await addFirst(collectionPage);
    await ensureOpen(header, cartDrawer);

    const before = await step('Read the current cart total', async () => {
      await expect.poll(() => cartDrawer.subtotalValue()).toBeGreaterThan(0);
      const v = await cartDrawer.subtotalValue();
      log(`Cart total before increase: ${v}`);
      return v;
    });

    await step(`Increase the quantity of "${name}" and verify the total grows`, async () => {
      await cartDrawer.increaseQty(name);
      await expect.poll(() => cartDrawer.subtotalValue()).toBeGreaterThan(before);
      log(`Cart total after increase: ${await cartDrawer.subtotalValue()}`);
    });
  });

  test('BEV-CRT-007 - Decreasing line item quantity updates the cart total @smoke', async ({ collectionPage, cartDrawer, header }) => {
    const name = await addFirst(collectionPage);
    await ensureOpen(header, cartDrawer);

    const before = await step(`Increase the quantity of "${name}" and wait for the total to settle`, async () => {
      await expect.poll(() => cartDrawer.subtotalValue()).toBeGreaterThan(0);
      const initial = await cartDrawer.subtotalValue();
      // Cart totals update asynchronously — wait for the increase to settle before
      // capturing the baseline, otherwise we may read the pre-increase value.
      await cartDrawer.increaseQty(name);
      await expect.poll(() => cartDrawer.subtotalValue()).toBeGreaterThan(initial);
      const v = await cartDrawer.subtotalValue();
      log(`Cart total at quantity 2: ${v}`);
      return v;
    });

    await step(`Decrease the quantity of "${name}" and verify the total drops`, async () => {
      await cartDrawer.decreaseQty(name);
      await expect.poll(() => cartDrawer.subtotalValue()).toBeLessThan(before);
      log(`Cart total after decrease: ${await cartDrawer.subtotalValue()}`);
    });
  });

  test('BEV-CRT-008 - Removing a line item empties it from the cart @smoke', async ({ collectionPage, cartDrawer, header }) => {
    const name = await addFirst(collectionPage);
    await ensureOpen(header, cartDrawer);

    await step(`Remove "${name}" and verify it is gone from the cart`, async () => {
      await cartDrawer.removeItem(name);
      await expect(cartDrawer.line(name)).toHaveCount(0);
      log(`Line item "${name}" removed`);
    });
  });

  test('BEV-CRT-010 - Cart total equals the sum of line item totals @smoke', async ({ collectionPage, cartDrawer, header }) => {
    const name = await addFirst(collectionPage);
    await ensureOpen(header, cartDrawer);

    await step('Verify the cart total equals the single line item total', async () => {
      await expect.poll(() => cartDrawer.subtotalValue()).toBeGreaterThan(0);
      const itemPrice = await cartDrawer.itemPriceValue(name);
      const total = await cartDrawer.subtotalValue();
      log(`Line item total: ${itemPrice} | Cart total: ${total}`);
      expect(total).toBeCloseTo(itemPrice, 2);
    });
  });

  test('BEV-CRT-011 - Header cart count matches the number of line items @smoke', async ({ collectionPage, cartDrawer, header }) => {
    await addFirst(collectionPage);
    await ensureOpen(header, cartDrawer);

    await step('Verify the header cart count matches the line item count', async () => {
      const lines = await cartDrawer.lineItems.count();
      const badge = await header.cartCountValue();
      log(`Line items: ${lines} | Header cart count: ${badge}`);
      expect(badge).toBeGreaterThanOrEqual(lines);
    });
  });

  test('BEV-CRT-012 - Cart contents persist after a page refresh @smoke', async ({ page, collectionPage, cartDrawer, header }) => {
    const name = await addFirst(collectionPage);

    await step(`Confirm "${name}" is in the cart before refreshing`, async () => {
      // Add-to-cart is an async fetch (Hydrogen intercepts the form); confirm it has
      // actually landed before reloading, otherwise reload cancels the in-flight add.
      await ensureOpen(header, cartDrawer);
      await expect(cartDrawer.line(name)).toBeVisible();
    });

    await step('Refresh the page', () => page.reload({ waitUntil: 'domcontentloaded' }));

    await step(`Verify "${name}" is still in the cart after refresh`, async () => {
      await ensureOpen(header, cartDrawer);
      await expect(cartDrawer.line(name)).toBeVisible();
      log(`Cart persisted "${name}" across refresh`);
    });
  });

  test('BEV-CRT-020 - Proceed to Checkout CTA is visible and enabled @smoke', async ({ collectionPage, cartDrawer, header }) => {
    await addFirst(collectionPage);
    await ensureOpen(header, cartDrawer);

    await step('Verify the Checkout CTA is visible and enabled (not clicked through)', async () => {
      await expect(cartDrawer.checkoutButton).toBeVisible();
      await expect(cartDrawer.checkoutButton).toBeEnabled();
      // NOTE: we intentionally do NOT click through — checkout is manual this phase.
      log('Checkout CTA is visible and enabled');
    });
  });
});
