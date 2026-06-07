import type { Browser, Page } from "puppeteer-core";
import { signRenderToken } from "@/lib/auth";

// Reuse a single headless Chromium across exports — a cold launch costs seconds,
// and that is the bulk of export latency. Cached on globalThis so Next dev
// hot-reloads (and warm serverless invocations) don't leak browsers.
const globalForBrowser = globalThis as unknown as {
  __cvBrowser?: Promise<Browser> | undefined;
};

// Hosted runtimes use puppeteer-core + @sparticuz/chromium (production deps);
// only local dev uses the full `puppeteer` bundle (a dev dependency, absent from
// production installs) which ships its own Chromium. Detected hosts: Vercel/Lambda
// and Railway (`RAILWAY_ENVIRONMENT`); force the bundled build anywhere with
// `USE_CHROMIUM=1`.
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.USE_CHROMIUM === "1",
);

async function launch(): Promise<Browser> {
  let browser: Browser;
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    browser = (await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })) as unknown as Browser;
  } else {
    const puppeteer = (await import("puppeteer")).default;
    browser = (await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    })) as unknown as Browser;
  }
  // If the browser dies, drop the cache so the next call relaunches.
  browser.on("disconnected", () => {
    if (globalForBrowser.__cvBrowser) globalForBrowser.__cvBrowser = undefined;
  });
  return browser;
}

async function getBrowser(): Promise<Browser> {
  if (!globalForBrowser.__cvBrowser) {
    globalForBrowser.__cvBrowser = launch().catch((err) => {
      globalForBrowser.__cvBrowser = undefined;
      throw err;
    });
  }
  return globalForBrowser.__cvBrowser;
}

/**
 * Navigates a fresh page (on the reused browser) to a headless `/render/...`
 * route — the single source of truth for template + real Tailwind — runs
 * `capture`, and always closes the page. Both PDF and HTML export flow through
 * here so every format is pixel-for-pixel the same rendering.
 */
async function withRenderedPage<T>(
  path: string,
  resourceId: string,
  capture: (page: Page) => Promise<T>,
): Promise<T> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // Sign immediately before goto so the 5-min expiry can't lapse during launch.
    const renderToken = await signRenderToken(resourceId);

    // `domcontentloaded` (not networkidle): the render page is fully
    // server-rendered, so the template HTML is present on first paint. In dev
    // the Next HMR websocket keeps the network busy, so networkidle would block
    // until timeout on every export. Wait for fonts so layout/metrics are final.
    await page.goto(
      `${appUrl}${path}?token=${encodeURIComponent(renderToken)}`,
      { waitUntil: "domcontentloaded", timeout: 20000 },
    );
    // Cap the font wait so a never-resolving fonts.ready can't hang the export.
    await page.evaluate(async () => {
      const ready = (document as { fonts?: { ready?: Promise<unknown> } }).fonts
        ?.ready;
      if (!ready) return;
      await Promise.race([
        ready,
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    });

    return await capture(page);
  } finally {
    await page.close();
  }
}

/** Render a resume's `/render/[id]` page. */
export function withRenderedResume<T>(
  resumeId: string,
  capture: (page: Page) => Promise<T>,
): Promise<T> {
  return withRenderedPage(`/render/${resumeId}`, resumeId, capture);
}

/** Render a cover letter's `/render/cover-letter/[id]` page. */
export function withRenderedCoverLetter<T>(
  coverLetterId: string,
  capture: (page: Page) => Promise<T>,
): Promise<T> {
  return withRenderedPage(
    `/render/cover-letter/${coverLetterId}`,
    coverLetterId,
    capture,
  );
}

/**
 * Serializes the fully-rendered page into a self-contained HTML document with
 * every stylesheet inlined — so the downloaded .html carries the exact same
 * Tailwind/styling as the PDF, with no external requests.
 */
export async function capturePageHtml(page: Page): Promise<string> {
  return page.evaluate(async () => {
    // Strip Next.js dev-tools overlay / portals that aren't part of the CV.
    document
      .querySelectorAll(
        "nextjs-portal, [data-nextjs-toast], #__next-build-watcher",
      )
      .forEach((el) => el.remove());
    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    );
    await Promise.all(
      links.map(async (link) => {
        try {
          const css = await fetch(link.href).then((r) => r.text());
          const style = document.createElement("style");
          style.textContent = css;
          link.replaceWith(style);
        } catch {
          /* leave the link in place if it can't be inlined */
        }
      }),
    );
    return `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
  });
}
