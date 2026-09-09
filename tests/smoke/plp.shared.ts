import { test, expect } from '../../fixtures/pom.fixture';
import { parseMoney, computeSavePct } from '../../utils/pricing';
import { filterNoise, IGNORE_CONSOLE, IGNORE_RESPONSE, sameOrigin } from '../../utils/health';
import { step, log } from '../../utils/steps';

type Ids = Partial<Record<
  | 'load' | 'count' | 'mandatory' | 'saleCompare' | 'savePct' | 'priceParity'
  | 'imageToPdp' | 'titleToPdp' | 'atcAdds' | 'cartCount' | 'atcTwice' | 'atcMultiple' | 'health',
  string
>>;

/** Registers the shared PLP smoke tests for a collection, using the supplied TC IDs. */
export function plpSmoke(opts: { title: string; handle: string; expectedCount: number | null; ids: Ids }) {
  const { title, handle, expectedCount, ids } = opts;

  test.describe(`${title} — smoke`, () => {
    if (ids.load)
      test(`${ids.load} - Collection page loads via direct URL and product grid renders @smoke`, async ({ page, collectionPage }) => {
        const resp = await step(`Open the ${handle} collection by direct URL`, () =>
          page.goto(`/collections/${handle}`, { waitUntil: 'domcontentloaded' }));

        await step('Verify the response is successful and the grid renders', async () => {
          const status = resp?.status() ?? 0;
          log(`Collection responded with HTTP ${status}`);
          expect(status).toBeLessThan(400);
          await expect(collectionPage.productCards.first()).toBeVisible();
        });
      });

    if (ids.count)
      test(`${ids.count} - All products display and the product count is valid @smoke`, async ({ collectionPage }) => {
        await step(`Open the ${handle} collection`, () => collectionPage.openCollection(handle));

        await step('Verify the product count', async () => {
          await expect(collectionPage.productCards.first()).toBeVisible();
          const count = await collectionPage.productCards.count();
          log(`Product cards found: ${count}${expectedCount != null ? ` (expected ${expectedCount})` : ''}`);
          if (expectedCount != null) expect(count).toBe(expectedCount);
          else expect(count).toBeGreaterThan(0);
        });
      });

    if (ids.mandatory)
      test(`${ids.mandatory} - Each product card shows image, title, price and Add to Cart @smoke`, async ({ collectionPage }) => {
        await step(`Open the ${handle} collection`, () => collectionPage.openCollection(handle));

        await step('Verify the first card shows all mandatory elements', async () => {
          const card = collectionPage.cardByIndex(0);
          await expect(collectionPage.image(card)).toBeVisible();
          await expect(collectionPage.title(card)).toBeVisible();
          await expect(collectionPage.price(card)).toBeVisible();
          await expect(collectionPage.addToCartButton(card)).toBeVisible();
          log('Card shows image, title, price and Add to Cart');
        });
      });

    if (ids.saleCompare)
      test(`${ids.saleCompare} - Discounted product shows sale price with compare-at price @smoke`, async ({ collectionPage }) => {
        await step(`Open the ${handle} collection`, () => collectionPage.openCollection(handle));

        const found = await step('Find a card with a compare-at price and verify both prices show', async () => {
          const cards = collectionPage.productCards;
          const n = await cards.count();
          for (let i = 0; i < n; i++) {
            const c = cards.nth(i);
            if (await collectionPage.comparePrice(c).count()) {
              await expect(collectionPage.price(c)).toBeVisible();
              await expect(collectionPage.comparePrice(c).first()).toBeVisible();
              log(`Card #${i} shows sale + compare-at price`);
              return true;
            }
          }
          return false;
        });
        test.skip(!found, 'no discounted product with a compare-at price on this collection');
      });

    if (ids.savePct)
      test(`${ids.savePct} - Save% badge matches the computed discount @smoke`, async ({ collectionPage }) => {
        await step(`Open the ${handle} collection`, () => collectionPage.openCollection(handle));

        const checked = await step('Validate the Save% badge against the computed discount', async () => {
          const cards = collectionPage.productCards;
          const n = await cards.count();
          for (let i = 0; i < n; i++) {
            const c = cards.nth(i);
            if ((await collectionPage.saveBadge(c).count()) && (await collectionPage.comparePrice(c).count())) {
              const sale = parseMoney(await collectionPage.price(c).textContent());
              const cmp = parseMoney(await collectionPage.comparePrice(c).first().textContent());
              const shown = parseInt(((await collectionPage.saveBadge(c).first().textContent()) ?? '').match(/(\d+)%/)?.[1] ?? 'NaN', 10);
              log(`Card #${i} — Sale: ${sale} | Compare-at: ${cmp} | Shown: ${shown}% | Computed: ${computeSavePct(cmp, sale)}%`);
              expect(shown).toBe(computeSavePct(cmp, sale));
              return true;
            }
          }
          return false;
        });
        test.skip(!checked, 'no Save% badge to validate on this collection');
      });

    if (ids.priceParity)
      test(`${ids.priceParity} - Product card price matches the product page price @smoke`, async ({ collectionPage, productPage }) => {
        const cardPrice = await step(`Read the first card price on the ${handle} collection`, async () => {
          await collectionPage.openCollection(handle);
          const price = parseMoney(await collectionPage.price(collectionPage.cardByIndex(0)).textContent());
          log(`Card price: ${price}`);
          return price;
        });

        await step('Open the product page and verify the price matches', async () => {
          await collectionPage.productLink(collectionPage.cardByIndex(0)).click();
          await expect(productPage.title).toBeVisible();
          const pdpPrice = await productPage.priceValue();
          log(`Product page price: ${pdpPrice}`);
          // toBeCloseTo avoids float-formatting mismatches; variant price ranges
          // ("from $X") may legitimately differ card-vs-PDP.
          expect(pdpPrice).toBeCloseTo(cardPrice, 2);
        });
      });

    if (ids.imageToPdp)
      test(`${ids.imageToPdp} - Clicking a product image opens the correct product page @smoke`, async ({ page, collectionPage }) => {
        const href = await step(`Open the ${handle} collection and read the first card link`, async () => {
          await collectionPage.openCollection(handle);
          return collectionPage.productLink(collectionPage.cardByIndex(0)).getAttribute('href');
        });

        await step('Click the product image and verify the correct PDP opens', async () => {
          await collectionPage.image(collectionPage.cardByIndex(0)).click();
          await expect(page).toHaveURL(/\/products\//);
          log(`Opened: ${page.url()}`);
          if (href) expect(page.url()).toContain(href.split('?')[0]);
        });
      });

    if (ids.titleToPdp)
      test(`${ids.titleToPdp} - Clicking a product title opens the correct product page @smoke`, async ({ page, collectionPage }) => {
        const href = await step(`Open the ${handle} collection and read the first card link`, async () => {
          await collectionPage.openCollection(handle);
          return collectionPage.productLink(collectionPage.cardByIndex(0)).getAttribute('href');
        });

        await step('Click the product title and verify the correct PDP opens', async () => {
          await collectionPage.title(collectionPage.cardByIndex(0)).click();
          await expect(page).toHaveURL(/\/products\//);
          log(`Opened: ${page.url()}`);
          if (href) expect(page.url()).toContain(href.split('?')[0]);
        });
      });

    if (ids.atcAdds)
      test(`${ids.atcAdds} - Add to Cart from the card adds the correct product @smoke`, async ({ collectionPage, cartDrawer }) => {
        const name = await step(`Open the ${handle} collection and add the first product`, async () => {
          await collectionPage.openCollection(handle);
          const n = await collectionPage.nameOf(collectionPage.cardByIndex(0));
          await collectionPage.addToCartButton(collectionPage.cardByIndex(0)).click();
          log(`Added "${n}"`);
          return n;
        });

        await step(`Verify "${name}" appears in the cart`, () => expect(cartDrawer.line(name)).toBeVisible());
      });

    if (ids.cartCount)
      test(`${ids.cartCount} - Add to Cart increments the header cart count @smoke`, async ({ collectionPage, header }) => {
        const before = await step(`Open the ${handle} collection and read the cart count`, async () => {
          await collectionPage.openCollection(handle);
          const c = await header.cartCountValue();
          log(`Header cart count before: ${c}`);
          return c;
        });

        await step('Add the first product and verify the count increments by 1', async () => {
          await collectionPage.addToCartButton(collectionPage.cardByIndex(0)).click();
          await expect.poll(() => header.cartCountValue()).toBe(before + 1);
          log(`Header cart count after: ${await header.cartCountValue()}`);
        });
      });

    if (ids.atcTwice)
      test(`${ids.atcTwice} - Adding the same product twice increments its quantity @smoke`, async ({ collectionPage, cartDrawer }) => {
        const name = await step(`Open the ${handle} collection and add the first product`, async () => {
          await collectionPage.openCollection(handle);
          const n = await collectionPage.nameOf(collectionPage.cardByIndex(0));
          await collectionPage.addToCartButton(collectionPage.card(n)).click();
          await expect(cartDrawer.line(n)).toBeVisible();
          log(`Added "${n}" (1st time)`);
          return n;
        });

        await step(`Add "${name}" again and verify quantity becomes 2`, async () => {
          await collectionPage.openCollection(handle);
          await collectionPage.addToCartButton(collectionPage.card(name)).click();
          // Qty is shown in a <span> (live region), not an <input>, so assert text.
          await expect(cartDrawer.itemQty(name)).toHaveText(/^\s*2\s*$/);
          log(`Quantity for "${name}" is now 2`);
        });
      });

    if (ids.atcMultiple)
      test(`${ids.atcMultiple} - Adding multiple different products lists them all in the cart @smoke`, async ({ collectionPage, cartDrawer }) => {
        await step(`Open the ${handle} collection`, () => collectionPage.openCollection(handle));
        const total = await collectionPage.productCards.count();
        test.skip(total < 2, 'need at least two products');

        const name0 = await step('Add the first product and wait for it to land', async () => {
          const n = await collectionPage.nameOf(collectionPage.cardByIndex(0));
          await collectionPage.addToCartButton(collectionPage.card(n)).click();
          // Add is an async fetch — wait for it to land before navigating away, else
          // re-opening the collection cancels the in-flight add and the item is lost.
          await expect(cartDrawer.line(n)).toBeVisible();
          log(`Added first product "${n}"`);
          return n;
        });

        const name1 = await step('Add a second, different product', async () => {
          await collectionPage.openCollection(handle);
          const n = await collectionPage.nameOf(collectionPage.cardByIndex(1));
          await collectionPage.addToCartButton(collectionPage.card(n)).click();
          log(`Added second product "${n}"`);
          return n;
        });

        await step('Verify both products are listed in the cart', async () => {
          await expect(cartDrawer.line(name0)).toBeVisible();
          await expect(cartDrawer.line(name1)).toBeVisible();
          log(`Cart lists both "${name0}" and "${name1}"`);
        });
      });

    if (ids.health)
      test(`${ids.health} - Collection page loads with no broken assets or console errors @smoke`, async ({ page, collectionPage, pageHealth }) => {
        await step(`Open the ${handle} collection and confirm the grid renders`, async () => {
          await collectionPage.openCollection(handle);
          await expect(collectionPage.productCards.first()).toBeVisible();
        });

        await step('Verify no console errors and no same-origin failed responses', async () => {
          const base = page.url();
          const errs = filterNoise(pageHealth.consoleErrors, IGNORE_CONSOLE);
          const bad = pageHealth.failedResponses.filter((r) => sameOrigin(r.url, base) && !IGNORE_RESPONSE.some((p) => p.test(r.url)));
          log(`Console errors: ${errs.length} | Failed same-origin responses: ${bad.length}`);
          expect(errs, `console errors: ${errs.join(' | ')}`).toHaveLength(0);
          expect(bad, `failed responses: ${bad.map((b) => b.status + ' ' + b.url).join(' | ')}`).toHaveLength(0);
        });
      });
  });
}
