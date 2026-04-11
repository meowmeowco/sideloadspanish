/**
 * Playwright fixture that launches Chromium with the Sideload Spanish extension loaded.
 * MV3 extensions require a persistent context.
 */
import { test as base, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getExtensionLaunchOptions } from './runtime.js';

const EXTENSION_PATH = path.resolve(import.meta.dirname, '..', '..');

export const test = base.extend({
  // Provide a browser context with the extension loaded
  context: async ({}, use) => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sideload-test-'));

    const context = await chromium.launchPersistentContext(
      userDataDir,
      getExtensionLaunchOptions(EXTENSION_PATH),
    );

    await use(context);
    await context.close();

    // Clean up temp profile
    fs.rmSync(userDataDir, { recursive: true, force: true });
  },

  // Convenience: a page that has waited for the extension to be ready
  extensionPage: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
