import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
await server.listen();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('Vite did not expose a TCP address.');
  await page.goto(`http://127.0.0.1:${address.port}/`);
  await page.getByRole('button', { name: 'Inject peak' }).click();
  await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent?.includes('Completed') ?? false);
  await mkdir('docs/assets', { recursive: true });
  await page.screenshot({ path: 'docs/assets/sandbox.png', fullPage: true });
  console.log('Generated docs/assets/sandbox.png from the live application.');
} finally {
  await browser.close();
  await server.close();
}
