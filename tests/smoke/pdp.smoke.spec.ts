import { test, expect } from '../../fixtures/pom.fixture';
import type { Page } from '@playwright/test';
import { collections, sampleProduct } from '../../test-data/site';
import { parseMoney, computeSavePct } from '../../utils/pricing';
import { filterNoise, IGNORE_CONSOLE, IGNORE_RESPONSE, sameOrigin } from '../../utils/health';
import { step, log } from '../../utils/steps';
import type { CollectionPage } from '../../pages/CollectionPage';
import type { ProductPage } from '../../pages/ProductPage';

/** Opens the sample PDP directly, falling back to the first mushroom product. */
async function openSampleProduct(page: Page, collectionPage: CollectionPage, productPage: ProductPage): Promise<void> {
  await step('Open a product page (PDP)', async () => {
    if (sampleProduct.mushroom) {
      const resp = await page.goto(`/products/${sampleProduct.mushroom}`, { waitUntil: 'domcontentloaded' });
      if (resp && resp.status() < 400 && (await productPage.title.isVisible().catch(() => false))) {
        log(`Opened sample product directly: /products/${sampleProduct.mushroom}`);
        return;
      }
    }
    // Fallback: first product of the mushroom collection.
    log('Sample product unavailable — falling back to the first mushroom product');
    await collectionPage.openCollection(collections.mushroom);
    await collectionPage.productLink(collectionPage.cardByIndex(0)).click();
  });
}

test.describe('PDP — smoke', () => {
  test('BEV-PDP-002 - Product page loads with title, price and Add to Cart @smoke', async ({ page, collectionPage, productPage }) => {
    await openSampleProduct(page, collectionPage, productPage);

    await step('Verify the title, price and Add to Cart are visible', async () => {
      await expect(productPage.title).toBeVisible();
      await expect(productPage.price).toBeVisible();
      await expect(productPage.addToCartButton).toBeVisible();
      log('Title, price and Add to Cart are all visible');
    });
  });

  test('BEV-PDP-003 - Product title and main image render @smoke', async ({ page, collectionPage, productPage }) => {
    await openSampleProduct(page, collectionPage, productPage);

    await step('Verify the product title has text and the main image is visible', async () => {
      await expect(productPage.title).toBeVisible();
      const title = (await productPage.title.innerText()).trim();
      log(`Product title: "${title}"`);
      expect(title.length).toBeGreaterThan(0);
      await expect(productPage.mainImage).toBeVisible();
    });
  });

  test('BEV-PDP-004 - Product price displays and is greater than zero @smoke', async ({ page, collectionPage, productPage }) => {
    await openSampleProduct(page, collectionPage, productPage);

    await step('Verify the price is visible and greater than $0', async () => {
      await expect(productPage.price).toBeVisible();
      const value = await productPage.priceValue();
      log(`Product price: ${value}`);
      expect(value).toBeGreaterThan(0);
    });
  });

  test('BEV-PDP-005 - Save% badge matches the computed discount @smoke', async ({ page, collectionPage, productPage }) => {
    await openSampleProduct(page, collectionPage, productPage);

    const gate = await step('Check the product is discounted with a Save% badge', async () => {
      const hasCompare = await productPage.comparePrice.count();
      const hasBadge = await productPage.saveBadge.count();
      return !hasCompare || !hasBadge;
    });
    test.skip(gate, 'product not discounted / no Save% badge');

    await step('Verify the shown Save% equals the computed discount', async () => {
      const sale = await productPage.priceValue();
      const cmp = parseMoney(await productPage.comparePrice.textContent());
      const shown = parseInt(((await productPage.saveBadge.textContent()) ?? '').match(/(\d+)%/)?.[1] ?? 'NaN', 10);
      log(`Sale: ${sale} | Compare-at: ${cmp} | Shown Save%: ${shown} | Computed: ${computeSavePct(cmp, sale)}`);
      expect(shown).toBe(computeSavePct(cmp, sale));
    });
  });

  test('BEV-PDP-006 - Product page price matches the collection card price @smoke', async ({ collectionPage, productPage }) => {
    const cardPrice = await step(`Read the first card price on the ${collections.mushroom} collection`, async () => {
      await collectionPage.openCollection(collections.mushroom);
      const price = parseMoney(await collectionPage.price(collectionPage.cardByIndex(0)).textContent());
      log(`Collection card price: ${price}`);
      return price;
    });

    await step('Open the product page and verify its price matches the card', async () => {
      await collectionPage.productLink(collectionPage.cardByIndex(0)).click();
      await expect(productPage.title).toBeVisible();
      const pdpPrice = await productPage.priceValue();
      log(`Product page price: ${pdpPrice}`);
      // toBeCloseTo avoids float-formatting mismatches; products with a variant price
      // range ("from $X") may legitimately differ card-vs-PDP.
      expect(pdpPrice).toBeCloseTo(cardPrice, 2);
    });
  });

  test('BEV-PDP-018 - Add to Cart from PDP adds the correct product @smoke', async ({ page, collectionPage, productPage, cartDrawer }) => {
    await openSampleProduct(page, collectionPage, productPage);

    const name = await step('Read the product title', async () => {
      const t = (await productPage.title.innerText()).trim();
      log(`Product under test: "${t}"`);
      return t;
    });

    await step('Add to Cart and verify the matching line item appears', async () => {
      await productPage.addToCart();
      await expect(cartDrawer.line(name)).toBeVisible();
      log(`Cart shows line item "${name}"`);
    });
  });

  test('BEV-PDP-019 - Add to Cart from PDP increments the header cart count @smoke', async ({ page, collectionPage, productPage, header }) => {
    await openSampleProduct(page, collectionPage, productPage);

    const before = await step('Read the header cart count before adding', async () => {
      const c = await header.cartCountValue();
      log(`Header cart count before: ${c}`);
      return c;
    });

    await step('Add to Cart and verify the count increments by 1', async () => {
      await productPage.addToCart();
      await expect.poll(() => header.cartCountValue()).toBe(before + 1);
      log(`Header cart count after: ${await header.cartCountValue()}`);
    });
  });

  test('BEV-PDP-033 - Product page loads with no broken assets or console errors @smoke', async ({ page, collectionPage, productPage, pageHealth }) => {
    await openSampleProduct(page, collectionPage, productPage);

    await step('Verify the title renders and there are no console/asset errors', async () => {
      await expect(productPage.title).toBeVisible();
      const base = page.url();
      const errs = filterNoise(pageHealth.consoleErrors, IGNORE_CONSOLE);
      const bad = pageHealth.failedResponses.filter((r) => sameOrigin(r.url, base) && !IGNORE_RESPONSE.some((p) => p.test(r.url)));
      log(`Console errors: ${errs.length} | Failed same-origin responses: ${bad.length}`);
      expect(errs, `console errors: ${errs.join(' | ')}`).toHaveLength(0);
      expect(bad, `failed responses: ${bad.map((b) => b.status + ' ' + b.url).join(' | ')}`).toHaveLength(0);
    });
  });
});
