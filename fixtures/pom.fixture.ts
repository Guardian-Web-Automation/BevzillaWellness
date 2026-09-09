import { test as base } from '@playwright/test';
import { HeaderComponent } from '../pages/components/HeaderComponent';
import { CartDrawer } from '../pages/components/CartDrawer';
import { FooterComponent } from '../pages/components/FooterComponent';
import { HomePage } from '../pages/HomePage';
import { CollectionPage } from '../pages/CollectionPage';
import { ProductPage } from '../pages/ProductPage';
import { SearchOverlay } from '../pages/SearchOverlay';

export type PageHealth = {
  consoleErrors: string[];
  failedResponses: { url: string; status: number }[];
};

type Fixtures = {
  header: HeaderComponent;
  cartDrawer: CartDrawer;
  footer: FooterComponent;
  home: HomePage;
  collectionPage: CollectionPage;
  productPage: ProductPage;
  searchOverlay: SearchOverlay;
  pageHealth: PageHealth;
};

export const test = base.extend<Fixtures>({
  header: async ({ page }, use) => use(new HeaderComponent(page)),
  cartDrawer: async ({ page }, use) => use(new CartDrawer(page)),
  footer: async ({ page }, use) => use(new FooterComponent(page)),
  home: async ({ page }, use) => use(new HomePage(page)),
  collectionPage: async ({ page }, use) => use(new CollectionPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  searchOverlay: async ({ page }, use) => use(new SearchOverlay(page)),
  pageHealth: async ({ page }, use) => {
    const consoleErrors: string[] = [];
    const failedResponses: { url: string; status: number }[] = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(e.message));
    page.on('response', (r) => { const s = r.status(); if (s >= 400) failedResponses.push({ url: r.url(), status: s }); });
    await use({ consoleErrors, failedResponses });
  },
});

export { expect } from '@playwright/test';
