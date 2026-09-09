import { TestInfo } from '@playwright/test';

export const MOBILE_PROJECTS = ['mobile-chromium', 'mobile-webkit'];

/** Helpers for future per-environment cases (all current smoke cases run on all 3). */
export const isMobile = (info: TestInfo): boolean => MOBILE_PROJECTS.includes(info.project.name);
export const isDesktop = (info: TestInfo): boolean => !isMobile(info);
