import { test } from '@playwright/test';
import { logger } from './logger';

/** Short test-case id, e.g. "BEV-CRT-001" (the part before " - " in the title). */
function tcId(): string {
  const t = test.info().title;
  const i = t.indexOf(' - ');
  return i > 0 ? t.slice(0, i) : t.split(' ')[0];
}

/**
 * Run `body` as a named test step. The title:
 *   - appears as a step in the Playwright HTML report (`npm run report`), and
 *   - prints one clean line to the console:  `BEV-CRT-001 › <title>`
 *
 * Use one `step(...)` per logical phase (arrange / act / assert) so the console and
 * report read as a short, ordered narrative.
 */
export async function step<T>(title: string, body: () => Promise<T> | T): Promise<T> {
  return test.step(title, async () => {
    logger.info(`${tcId()} › ${title}`);
    return await body();
  });
}

/**
 * Log a detail value (price, count, URL, …). Printed only when LOG_LEVEL=debug, so
 * the default console stays a clean step-by-step narrative. Always available in the
 * HTML report via the enclosing step.
 */
export function log(message: string): void {
  logger.debug(`${tcId()}     ${message}`);
}
