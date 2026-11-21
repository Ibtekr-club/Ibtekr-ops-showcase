import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
// The public web demo (npm run demo:web): built, then served as the static site it is, and driven like a visitor.
const baseURL = 'http://127.0.0.1:4191';
const sandboxChromium = '/opt/pw-browsers/chromium';
const launchOptions = existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {};
const serverEnv = { NODE_OPTIONS: [process.env.NODE_OPTIONS, '--disable-warning=DEP0066'].filter(Boolean).join(' ') };
export default defineConfig({
  testDir: 'demo-web',
  reporter: 'list',
  timeout: 60000,
  webServer: { command: 'npm run demo:web:serve', url: baseURL, reuseExistingServer: false, timeout: 120000, env: serverEnv },
  use: { baseURL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions } }],
});
