import { defineConfig } from '@playwright/test';

/**
 * Local static server on http://127.0.0.1:4173.
 * Set LIVE_BASE_URL to point the same suite at a deployed origin (read-only).
 * When LIVE_BASE_URL is set, the local server is not started.
 */
const liveBaseUrl = process.env.LIVE_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: liveBaseUrl || 'http://127.0.0.1:4173',
    trace: 'off',
  },
  webServer: liveBaseUrl
    ? undefined
    : {
        command: 'npx --yes serve@14.2.5 -l tcp://127.0.0.1:4173 -c serve.json .',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
