import { chromium, type Page } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";

const requireText = async (page: Page, selector: string, text: string) => {
  await page.waitForFunction(
    ({ selector: target, expected }) =>
      document.querySelector(target)?.textContent?.includes(expected) ?? false,
    { selector, expected: text },
  );
};
const completed = (page: Page) =>
  requireText(page, '[role="status"]', "Completed");
const cases: Array<[string, (page: Page) => Promise<void>]> = [
  [
    "baseline calculates and renders metrics",
    async (page) => {
      await page.getByRole("button", { name: "Run baseline" }).click();
      await completed(page);
      await requireText(
        page,
        '[aria-label="Simulation metrics"]',
        "Average wait",
      );
      await requireText(page, "table", "Energy");
    },
  ],
  [
    "peak injection completes through the visible control",
    async (page) => {
      await page.getByRole("button", { name: "Inject peak" }).click();
      await completed(page);
      await requireText(
        page,
        '[aria-label="Simulation metrics"]',
        "Left behind",
      );
    },
  ],
  [
    "invalid imports report a parsing error",
    async (page) => {
      await page.getByLabel("Import line JSON").setInputFiles({
        name: "invalid.json",
        mimeType: "application/json",
        buffer: Buffer.from("{"),
      });
      await requireText(page, '[role="alert"]', "not valid JSON");
    },
  ],
];

let server: ViteDevServer | undefined;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  server = await createServer({ server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string")
    throw new Error("Vite did not expose a TCP address.");
  for (const [name, check] of cases) {
    await page.goto(`http://127.0.0.1:${address.port}/`);
    await check(page);
    console.log(`PASS ${name}`);
  }
  await page.screenshot({
    path: "test-results/e2e-sandbox.png",
    fullPage: true,
  });
  console.log(`E2E ${cases.length}/${cases.length} paths passed.`);
} finally {
  await browser?.close();
  await server?.close();
}
