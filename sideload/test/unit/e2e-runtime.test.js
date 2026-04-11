import { describe, it, expect } from 'vitest';

import { getExtensionLaunchOptions } from '../e2e/runtime.js';

describe('getExtensionLaunchOptions', () => {
  it('uses bundled Chromium headlessly by default', () => {
    const options = getExtensionLaunchOptions('/tmp/my-extension');

    expect(options.channel).toBe('chromium');
    expect(options.headless).toBe(true);
    expect(options.args).toContain('--no-first-run');
    expect(options.args).toContain('--disable-default-apps');
    expect(options.args).toContain('--disable-extensions-except=/tmp/my-extension');
    expect(options.args).toContain('--load-extension=/tmp/my-extension');
  });

  it('allows opting back into headed mode', () => {
    const options = getExtensionLaunchOptions('/tmp/my-extension', {
      headless: false,
    });

    expect(options.headless).toBe(false);
  });
});
