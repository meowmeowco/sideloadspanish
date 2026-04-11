export function getExtensionLaunchOptions(extensionPath, overrides = {}) {
  const headless = overrides.headless ?? process.env.PW_HEADLESS !== '0';

  return {
    channel: 'chromium',
    headless,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--disable-default-apps',
    ],
    ...overrides,
  };
}
