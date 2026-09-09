import { test } from '@playwright/test';
import { logger } from './logger';

/** Short test-case id, e.g. "BEV-CRT-001" (the part before " - " in the title). */
function tcId(): string {
  const t = test.info().title;
  const i = t.indexOf(' - ');
  return i > 0 ? t.slice(0, i) : t.split(' ')[0];
}

// In CI the console belongs to Playwright's reporter; with parallel workers our own
// per-step lines would interleave across tests and clutter the run log. So we print
// the narrative to the console only for LOCAL runs. The full step breakdown is always
// in the HTML report (via test.step) — the artifact to read for CI detail.
const CONSOLE_LOGS = !process.env.CI;

/**
 * Run `body` as a named test step. The title:
 *   - always appears as a step in the Playwright HTML report (`npm run report`), and
 *   - prints one clean line to the console on LOCAL runs:  `BEV-CRT-001 › <title>`
 *
 * Use one `step(...)` per logical phase (arrange / act / assert) so the console and
 * report read as a short, ordered narrative.
 */
export async function step<T>(title: string, body: () => Promise<T> | T): Promise<T> {
  return test.step(title, async () => {
    if (CONSOLE_LOGS) logger.info(`${tcId()} › ${title}`);
    return await body();
  });
}

/**
 * Log a detail value (price, count, URL, …). Local-only and only when LOG_LEVEL=debug,
 * so the console stays clean. Always available in the HTML report via the enclosing step.
 */
export function log(message: string): void {
  if (CONSOLE_LOGS) logger.debug(`${tcId()}     ${message}`);
}
