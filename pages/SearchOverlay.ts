import { Page, Locator } from '@playwright/test';

// Verified: search is an off-canvas overlay (<div class="overlay overlay-search">)
// with a single <input type="search" name="q" aria-label="Search">. Results render
// as product links INSIDE the overlay, so we scope results to it (the page behind
// the overlay also has product links).
export class SearchOverlay {
  readonly page: Page;
  readonly root: Locator;
  readonly input: Locator;
  readonly results: Locator;
  readonly noResults: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator('.overlay-search');
    this.input = this.root.getByRole('searchbox')
      .or(this.root.locator('input[type="search"]'))
      .or(this.root.getByPlaceholder(/search/i))
      .first();
    this.results = this.root.locator('a[href*="/products/"]');
    this.noResults = this.root.getByText(/no results|nothing found|couldn.?t find/i).first();
  }

  async query(text: string) {
    // Instant-search overlay. Type real keystrokes so the debounced handler fires
    // (a bulk fill() can leave results un-triggered), then Enter to commit — which
    // makes results settle faster/more reliably under parallel load. Enter keeps
    // the overlay open (it does not navigate away).
    await this.input.click();
    await this.input.fill('');
    await this.input.pressSequentially(text, { delay: 30 });
    await this.input.press('Enter');
  }

  /**
   * Run a query and wait for results. The live instant-search backend occasionally
   * responds empty/slow, so we re-issue the query a few times before giving up —
   * a query with known matches (e.g. "coffee") that yields nothing is a backend
   * blip, not a test failure. Throws only if no results appear after all attempts.
   */
  async searchForResults(text: string, attempts = 3): Promise<void> {
    for (let i = 1; i <= attempts; i++) {
      await this.query(text);
      try {
        await this.results.first().waitFor({ state: 'visible', timeout: 8000 });
        return;
      } catch (err) {
        if (i === attempts) throw err;
        // else: the backend returned nothing — re-issue the query.
      }
    }
  }

  resultByText(name: string): Locator { return this.results.filter({ hasText: name }).first(); }
}
