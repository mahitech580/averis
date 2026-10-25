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

  const primaryLabels = (await page.locator(".site-nav > button[data-route]").allTextContents()).map((label) => label.trim());
  assert.deepEqual(primaryLabels, ["Website Overview", "People", "Journeys", "Workflow", "Capacity"], "only five primary items should be visible");
  assert.equal(await page.locator("#site-nav-menu button[data-route]").count(), 4, "secondary destinations should be grouped under More");
  assert.equal(await page.locator("#command-trigger").count(), 0, "the header search button should be removed");
  await page.locator("#site-more-toggle").click();
  assert.equal(await page.locator("#site-more-toggle").getAttribute("aria-expanded"), "true", "More menu should open accessibly");
  await page.locator('#site-nav-menu button[data-route="insights"]').click();
  await page.waitForFunction(() => location.hash === "#/insights");
  assert.equal(await page.locator("#site-more-toggle").getAttribute("aria-expanded"), "false", "More menu should close after navigation");
  await page.evaluate(() => { location.hash = "/today"; });
  await page.waitForFunction(() => location.hash === "#/today");

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

  // AVERIS is intentionally dark-only; no theme switch should remain in the shell.
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  assert.equal(await page.locator("html").evaluate((node) => getComputedStyle(node).colorScheme), "dark");
  assert.equal(await page.locator("#theme-trigger").count(), 0, "dark-only build must not show a theme switch");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#site-header").waitFor({ state: "visible" });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "dark-only theme should survive reload");
  assert.equal(await page.locator("#theme-trigger").count(), 0, "theme switching must remain removed after reload");

  // Enter the offline demo first so route checks test real protected screens, not login redirects.
  await page.evaluate(() => { location.hash = "/login"; });
  await page.waitForFunction(() => location.hash === "#/login");
  const loginArt = page.locator("#workspace-root .auth-image-frame img");
  await loginArt.waitFor({ state: "visible" });
  assert.ok((await loginArt.getAttribute("data-photo") || "").startsWith("https://"), "login view should request healthcare photography");
  assert.ok((await loginArt.getAttribute("data-fallback") || "").startsWith("./assets/"), "login view should have a local image fallback");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "login view must remain dark");
  await page.locator('[data-action="login-demo"]').click();
  await page.waitForFunction(() => location.hash === "#/today");
  assert.ok((await page.locator("#workspace-root").innerText()).length > 30, "offline demo should open before route coverage");

  // Verify every landing-page card CTA redirects to its named destination route.
  const landingActions = await page.locator(
    "#workspace-root .capability-card [data-action], #workspace-root .process-card [data-action], " +
    "#workspace-root .layer-card[data-action], #workspace-root .showcase-card[data-action], " +
    "#workspace-root .landing-actions [data-action]"
  ).evaluateAll((nodes) => {
    const values = nodes.map((node) => node.getAttribute("data-action"))
      .filter((value) => value && value.startsWith("go-"));
    return [...new Set(values)];
  });
  assert.ok(landingActions.length >= 12, "expected links across capability/process/layer/showcase cards, got " + landingActions.length);
  for (const action of landingActions) {
    await page.evaluate(() => { if (location.hash !== "#/today") location.hash = "/today"; });
    await page.waitForFunction(() => location.hash === "#/today");
    await page.locator('#workspace-root [data-action="' + action + '"]').first().click();
    const expectedRoute = action.slice(3);
    await page.waitForFunction((expected) => location.hash === "#/" + expected, expectedRoute);
    assert.ok((await page.locator("#workspace-root").innerText()).trim().length > 30, "card route should render: " + expectedRoute);
  }
  await page.evaluate(() => { location.hash = "/today"; });
  await page.waitForFunction(() => location.hash === "#/today");

  // Check every major homepage section and major card group has a photographic layer.
  for (const selector of [".hero-bg", ".capabilities-bg", ".process-bg", ".feature-bg", ".layers-bg", ".showcase-bg", ".boundary-bg", ".cta-bg"]) {
    const backgroundImage = await page.locator("#workspace-root " + selector).evaluate((node) => getComputedStyle(node).backgroundImage);
    assert.ok(backgroundImage.includes("https://"), "section must include a photo background: " + selector);
  }
  const footerPhoto = await page.locator("footer.site-footer").evaluate((node) => getComputedStyle(node).backgroundImage);
  assert.ok(footerPhoto.includes("https://"), "footer must include a photo background");

  for (const selector of [".capability-card", ".process-card", ".layer-card"]) {
    const count = await page.locator("#workspace-root " + selector).count();
    assert.ok(count > 0, "expected card group " + selector);
    const image = await page.locator("#workspace-root " + selector).first().evaluate((node) => getComputedStyle(node, "::before").backgroundImage);
    assert.ok(image.includes("https://"), "cards should have photo overlays: " + selector);
  }

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

  // Restored healthcare photos fall back to bundled local SVG artwork if a host blocks hotlinking.
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
  const signupArt = page.locator("#workspace-root .auth-image-frame img");
  await signupArt.waitFor({ state: "visible" });
  assert.ok((await signupArt.getAttribute("data-photo") || "").startsWith("https://"), "signup view should request healthcare photography");
  assert.ok((await signupArt.getAttribute("data-fallback") || "").startsWith("./assets/"), "signup view should have a local image fallback");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "signup view must remain dark");
  await page.locator("#auth-name").fill("Browser Smoke Tester");
  await page.locator("#auth-organization").fill("Synthetic QA Workspace");
  await page.locator("#auth-email").fill("ui-smoke@example.test");
  await page.locator("#auth-password").fill("Synthetic-QA-Password-2026!");
  await page.locator("#auth-confirm").fill("Synthetic-QA-Password-2026!");
  await page.locator("#auth-local-only").check();
  await page.locator('form[data-auth-form="register"] button[type="submit"]').click();
  await page.waitForFunction(() => location.hash === "#/today");
  const savedRegistration = await page.evaluate(() => JSON.parse(localStorage.getItem("averis-neon-v8") || "{}"));
  assert.equal(savedRegistration.profile?.name, "Browser Smoke Tester", "signup should save the new profile locally");

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
  assert.equal(await page.locator("#site-nav-menu button[data-route]").count(), 4, "secondary navigation remains available");
  console.log("OK: fixed header, five primary links + More submenu, dark-only theme, photo-backed sections/cards, login/signup photography with fallbacks, " + landingActions.length + " card destinations, " + routes.length + " footer routes, offline demo, signup and 390px mobile width.");
} finally {
  await browser.close();
}
