import { test, expect } from '../../fixtures/pom.fixture';
import { search } from '../../test-data/site';
import { filterNoise, IGNORE_CONSOLE } from '../../utils/health';
import { step, log } from '../../utils/steps';

test.describe('Search — smoke', () => {
  test('BEV-SRCH-001 - Search icon opens the search overlay @smoke', async ({ page, header, searchOverlay }) => {
    await step('Open the Home page', () => page.goto('/'));

    await step('Click the header search icon', () => header.openSearch());

    await step('Verify the search input is visible', async () => {
      await expect(searchOverlay.input).toBeVisible();
      log('Search overlay input is visible');
    });
  });

  test('BEV-SRCH-003 - Search query returns relevant product results @smoke', async ({ page, header, searchOverlay }) => {
    await step('Open the Home page and open search', async () => {
      await page.goto('/');
      await header.openSearch();
    });

    await step(`Search for "${search.validQuery}" and verify results appear`, async () => {
      await searchOverlay.searchForResults(search.validQuery);
      await expect(searchOverlay.results.first()).toBeVisible();
      log(`Search "${search.validQuery}" returned ${await searchOverlay.results.count()} result(s)`);
    });
  });

  test('BEV-SRCH-006 - Clicking a search result opens the product page @smoke', async ({ page, header, searchOverlay }) => {
    await step('Open the Home page and open search', async () => {
      await page.goto('/');
      await header.openSearch();
    });

    await step(`Search for "${search.validQuery}" and wait for results`, () =>
      searchOverlay.searchForResults(search.validQuery));

    await step('Click the first result and verify a product page opens', async () => {
      await searchOverlay.results.first().click();
      await expect(page).toHaveURL(/\/products\//);
      log(`Opened product page from search result: ${page.url()}`);
    });
  });

  test('BEV-SRCH-017 - Searching produces no console errors @smoke', async ({ page, header, searchOverlay, pageHealth }) => {
    await step('Open the Home page, open search and query', async () => {
      await page.goto('/');
      await header.openSearch();
      await searchOverlay.searchForResults(search.validQuery);
    });

    await step('Verify there are no console errors during search', async () => {
      const errs = filterNoise(pageHealth.consoleErrors, IGNORE_CONSOLE);
      log(`Console errors during search: ${errs.length}`);
      expect(errs, `console errors: ${errs.join(' | ')}`).toHaveLength(0);
    });
  });
});
