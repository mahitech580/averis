import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE_URL = "http://127.0.0.1:4173/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
});
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.locator("#site-header").waitFor({ state: "visible" });
  await page.locator("#workspace-root").waitFor({ state: "visible" });
  await page.waitForTimeout(250);
  assert.match(await page.title(), /AVERIS/i, "page title should identify AVERIS");

  const initialRouteContent = await page.locator("#workspace-root").innerText();
  assert.ok(initialRouteContent.trim().length > 80, "main route should render useful content");

  // Verify the navigation bar stays at the top of the viewport during scroll.
  const headerStyle = await page.locator("#site-header").evaluate((node) => ({
    position: getComputedStyle(node).position,
    top: getComputedStyle(node).top,
  }));
  assert.equal(headerStyle.position, "fixed", "site header must be fixed to the viewport");
  assert.equal(headerStyle.top, "0px", "fixed header must pin to the top edge");
  await page.evaluate(() => window.scrollTo(0, Math.min(900, document.documentElement.scrollHeight)));
  await page.waitForTimeout(150);
  const stickyTop = await page.locator("#site-header").evaluate((node) => node.getBoundingClientRect().top);
  const ancestorReport = await page.locator("#site-header").evaluate((node) => { const out=[]; for(let el=node;el;el=el.parentElement){const s=getComputedStyle(el);out.push({tag:el.tagName,id:el.id,cls:typeof el.className==="string"?el.className:"",position:s.position,overflowX:s.overflowX,overflowY:s.overflowY,height:Math.round(el.getBoundingClientRect().height)});} return out; });
  assert.ok(Math.abs(stickyTop) <= 2, "fixed header should remain visible; top=" + stickyTop + "; ancestors=" + JSON.stringify(ancestorReport));

  // Theme must persist through app renders and a page reload.
  await page.locator("#theme-trigger").click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#site-header").waitFor({ state: "visible" });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light", "theme should survive reload");
  await page.locator("#theme-trigger").click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");

  // Exercise all persistent footer navigation links; this footer is outside the re-rendered workspace root.
  const routes = await page.locator("footer [data-route]").evaluateAll((buttons) =>
    [...new Set(buttons.map((node) => node.getAttribute("data-route")).filter(Boolean))]
  );
  assert.ok(routes.length >= 15, "expected broad route navigation, found " + routes.length);
  for (const route of routes) {
    const button = page.locator('footer [data-route="' + route + '"]').first();
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await page.waitForFunction((expected) => location.hash === "#/" + expected, route);
    const contentLength = await page.locator("#workspace-root").innerText().then((value) => value.trim().length);
    assert.ok(contentLength > 30, 'route "' + route + '" should render content');
  }

  // Confirm first-party artwork is loadable rather than relying on third-party photo hotlinks.
  await page.evaluate(() => { location.hash = "/today"; });
  await page.waitForFunction(() => location.hash === "#/today");
  await page.waitForTimeout(250);
  const brokenImages = await page.locator("#workspace-root img").evaluateAll((images) =>
    images.filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.getAttribute("src") || img.src)
  );
  assert.deepEqual(brokenImages, [], "broken visible-view images: " + brokenImages.join(", "));

  // The offline demonstration must work without an API URL or shared demo password.
  await page.evaluate(() => { location.hash = "/login"; });
  await page.waitForFunction(() => location.hash === "#/login");
  await page.locator('[data-action="login-demo"]').click();
  await page.waitForFunction(() => location.hash === "#/today");
  assert.ok((await page.locator("#workspace-root").innerText()).length > 30, "offline demo should open");

  // The local signup experience must validate and create a session in a browser-only preview.
  await page.evaluate(() => { location.hash = "/register"; });
  await page.waitForFunction(() => location.hash === "#/register");
  await page.locator("#auth-name").fill("Browser Smoke Tester");
  await page.locator("#auth-organization").fill("Synthetic QA Workspace");
  await page.locator("#auth-email").fill("ui-smoke@example.test");
  await page.locator("#auth-password").fill("Synthetic-QA-Password-2026!");
  await page.locator("#auth-confirm").fill("Synthetic-QA-Password-2026!");
  await page.locator("#auth-local-only").check();
  await page.locator('form[data-auth-form="register"] button[type="submit"]').click();
  await page.waitForFunction(() => location.hash === "#/today");
  assert.equal(await page.locator("#profile-name").innerText(), "Browser Smoke Tester");

  // A narrow viewport must not force the whole page to be wider than the screen.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const dimensions = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(
    dimensions.scrollWidth <= dimensions.width + 2,
    "mobile horizontal overflow: viewport=" + dimensions.width + ", document=" + dimensions.scrollWidth
  );

  assert.deepEqual(pageErrors, [], "uncaught browser exceptions: " + pageErrors.join(" | "));
  console.log("OK: sticky scroll, theme persistence, " + routes.length + " navigation routes, local imagery, offline demo, signup, and 390px mobile width.");
} finally {
  await browser.close();
}
