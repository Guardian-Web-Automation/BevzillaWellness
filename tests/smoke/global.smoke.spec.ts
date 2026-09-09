import { test, expect } from '../../fixtures/pom.fixture';
import { collections } from '../../test-data/site';
import { filterNoise, IGNORE_CONSOLE, IGNORE_RESPONSE, sameOrigin } from '../../utils/health';
import { step, log } from '../../utils/steps';

test.describe('Global — smoke', () => {
  test('BEV-GLOB-002 - Header logo navigates back to the Home page @smoke', async ({ page, collectionPage, header }) => {
    await step(`Open the ${collections.mushroom} collection`, () => collectionPage.openCollection(collections.mushroom));

    await step('Click the header logo', () => header.gotoHome());

    await step('Verify the URL is the Home page ("/")', async () => {
      await expect.poll(() => new URL(page.url()).pathname).toBe('/');
      log(`Landed on: ${page.url()}`);
    });
  });

  test('BEV-GLOB-003 - Primary header navigation links all resolve (no broken links) @smoke', async ({ page, request }) => {
    await step('Open the Home page', () => page.goto('/'));

    const internal = await step('Collect the header navigation links', async () => {
      const base = page.url();
      const hrefs: string[] = await page.getByRole('banner').locator('a[href]').evaluateAll((els) =>
        Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).href))),
      );
      const links = hrefs.filter((h) => sameOrigin(h, base)).slice(0, 20);
      log(`Found ${links.length} internal header links to verify`);
      expect(links.length, 'header has internal links').toBeGreaterThan(0);
      return links;
    });

    await step('Verify every header link resolves (HTTP < 400)', async () => {
      const broken: string[] = [];
      for (const h of internal) {
        const r = await request.get(h).catch(() => null);
        if (!r || r.status() >= 400) broken.push(`${r?.status() ?? 'ERR'} ${h}`);
      }
      log(broken.length ? `Broken links: ${broken.join(' | ')}` : 'All header links resolved');
      expect(broken, broken.join(' | ')).toHaveLength(0);
    });
  });

  test('BEV-GLOB-006 - Cart count persists when navigating between pages @smoke', async ({ page, collectionPage, header }) => {
    await step(`Open the ${collections.mushroom} collection and add the first product`, async () => {
      await collectionPage.openCollection(collections.mushroom);
      await collectionPage.addToCartButton(collectionPage.cardByIndex(0)).click();
    });

    const count = await step('Read the header cart count after adding', async () => {
      await expect.poll(() => header.cartCountValue()).toBeGreaterThan(0);
      const c = await header.cartCountValue();
      log(`Header cart count is ${c}`);
      return c;
    });

    await step('Navigate to Home and verify the cart count is unchanged', async () => {
      await page.goto('/');
      const after = await header.cartCountValue();
      log(`Header cart count after navigation is ${after}`);
      expect(after).toBe(count);
    });
  });

  test('BEV-GLOB-021 - Header/footer load with no broken assets or console errors @smoke', async ({ page, pageHealth }) => {
    await step('Open the Home page', () => page.goto('/', { waitUntil: 'domcontentloaded' }));

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
