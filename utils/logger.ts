import { createLogger, format, transports } from 'winston';

// Clean, message-only console output. Structure/prefixes are added by utils/steps.ts.
// Set LOG_LEVEL=debug to also print the per-step detail lines (values, counts, URLs).
export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: format.printf(({ message }) => String(message)),
  transports: [new transports.Console()],
});
