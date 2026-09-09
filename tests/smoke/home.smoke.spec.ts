import { test, expect } from '../../fixtures/pom.fixture';
import { filterNoise, IGNORE_CONSOLE, IGNORE_RESPONSE, sameOrigin } from '../../utils/health';
import { step, log } from '../../utils/steps';

test.describe('Home — smoke', () => {
  test('BEV-HOME-001 - Home page loads with header and product links visible @smoke', async ({ page, header, home }) => {
    const resp = await step('Open the Home page', () => page.goto('/', { waitUntil: 'domcontentloaded' }));

    await step('Verify the HTTP response is successful (< 400)', async () => {
      const status = resp?.status() ?? 0;
      log(`Home page responded with HTTP ${status}`);
      expect(status).toBeLessThan(400);
    });

    await step('Verify the header and a product link are visible', async () => {
      await expect(header.banner).toBeVisible();
      await expect(home.productLinks.first()).toBeVisible();
      log('Header banner and at least one product link are visible');
    });
  });

  test('BEV-HOME-003 - Home hero section and primary CTA render @smoke', async ({ home }) => {
    await step('Open the Home page', () => home.open());

    await step('Verify the hero section and its CTA are visible', async () => {
      await expect(home.hero).toBeVisible();
      await expect(home.heroCta).toBeVisible();
      log('Hero section and primary CTA are visible');
    });
  });

  test('BEV-HOME-008 - Clicking a home product card opens its product page @smoke', async ({ page, home }) => {
    await step('Open the Home page', () => home.open());

    await step('Click the first product link', () => home.productLinks.first().click());

    await step('Verify a product page (PDP) opened', async () => {
      await expect(page).toHaveURL(/\/products\//);
      log(`Navigated to product page: ${page.url()}`);
    });
  });

  test('BEV-HOME-023 - Home page loads with no console errors or failed requests @smoke', async ({ page, home, pageHealth }) => {
    await step('Open the Home page and confirm the hero renders', async () => {
      await home.open();
      await expect(home.hero).toBeVisible();
    });

    await step('Verify there are no console errors or same-origin failed responses', async () => {
      const base = page.url();
      const errs = filterNoise(pageHealth.consoleErrors, IGNORE_CONSOLE);
      const bad = pageHealth.failedResponses.filter((r) => sameOrigin(r.url, base) && !IGNORE_RESPONSE.some((p) => p.test(r.url)));
      log(`Console errors: ${errs.length} | Failed same-origin responses: ${bad.length}`);
      expect(errs, `console errors: ${errs.join(' | ')}`).toHaveLength(0);
      expect(bad, `failed responses: ${bad.map((b) => b.status + ' ' + b.url).join(' | ')}`).toHaveLength(0);
    });
  });
});
