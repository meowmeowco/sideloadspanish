import { defineConfig } from '@playwright/test';
import path from 'path';
import { getExtensionLaunchOptions } from './test/e2e/runtime.js';

const extensionPath = path.resolve(import.meta.dirname);
const launchOptions = getExtensionLaunchOptions(extensionPath);

export default defineConfig({
  testDir: './test/e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    channel: launchOptions.channel,
    headless: launchOptions.headless,
  },
  projects: [
    {
      name: 'chromium-extension',
      use: {
        // Playwright launches a persistent context with the extension loaded
        // Tests use the custom fixture in test/e2e/fixtures.js
      },
    },
  ],
  webServer: {
    command: `python3 -m http.server 8384 --directory ${path.resolve('test/fixtures')}`,
    port: 8384,
    reuseExistingServer: true,
  },
});
