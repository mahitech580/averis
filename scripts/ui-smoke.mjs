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
  assert.deepEqual(primaryLabels, ["Today", "People", "Journeys", "Workflow", "Capacity"], "only five primary items should be visible");
  assert.equal(await page.locator("#site-nav-menu button[data-route]").count(), 4, "secondary destinations should be grouped under More");
  assert.equal(await page.locator("#command-trigger").count(), 0, "the header search button should be removed");
  await page.locator("#site-more-toggle").click();
  assert.equal(await page.locator("#site-more-toggle").getAttribute("aria-expanded"), "true", "More menu should open accessibly");
  await page.locator('#site-nav-menu button[data-route="insights"]').click();
  await page.waitForFunction(() => location.hash === "#/insights");
  assert.equal(await page.locator("#site-more-toggle").getAttribute("aria-expanded"), "false", "More menu should close after navigation");
  await page.evaluate(() => { location.hash = "/today"; });
  await page.waitForFunction(() => location.hash === "#/today");

  // Sign-up and sign-in remain working routes without turning the dashboard into a marketing page.
  await page.evaluate(() => { location.hash = "/login"; });
  await page.waitForFunction(() => location.hash === "#/login");
  assert.equal(await page.locator('form[data-auth-form="login"]').count(), 1, "login form should render");
  await page.locator('#workspace-root [data-action="open-register"]').click();
  await page.waitForFunction(() => location.hash === "#/register");
  assert.equal(await page.locator('form[data-auth-form="register"]').count(), 1, "signup form should render");
  await page.locator('#workspace-root [data-action="open-login"]').click();
  await page.waitForFunction(() => location.hash === "#/login");
  assert.equal(await page.locator('form[data-auth-form="login"]').count(), 1, "login form should render after switching");
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

  // AVERIS offers both color schemes; the choice persists through reload.
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  assert.equal(await page.locator("html").evaluate((node) => getComputedStyle(node).colorScheme), "dark");
  await page.evaluate(() => { location.hash = "/settings"; });
  await page.waitForFunction(() => location.hash === "#/settings");
  await page.locator('#workspace-root [data-action="toggle-theme"]').click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light", "theme control should switch to light");
  assert.equal(await page.locator("html").evaluate((node) => getComputedStyle(node).colorScheme), "light");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#site-header").waitFor({ state: "visible" });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light", "light theme should persist after reload");
  await page.locator('#workspace-root [data-action="toggle-theme"]').click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark", "theme control should switch back to dark");

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

  // Exercise the control-room dashboard with state-derived metrics and real workspace actions.
  const dashboardText = await page.locator("#workspace-root").innerText();
  assert.ok(dashboardText.includes("Operations overview"), "home should open the operations dashboard");
  assert.ok(dashboardText.includes("Needs attention"), "dashboard should show its priority queue");
  assert.ok(dashboardText.includes("Movement"), "dashboard should show schedule movement");
  assert.ok(dashboardText.includes("Capacity pulse"), "dashboard should show resource load");
  assert.ok(dashboardText.includes("Recent activity"), "dashboard should show change history");
  assert.ok(dashboardText.includes("SYNTHETIC RECORDS"), "synthetic data boundary should remain visible");
  assert.ok(!dashboardText.includes("HOW IT WORKS"), "home must not render technical marketing sections");
  assert.ok(!dashboardText.includes("PostgreSQL + Python APIs"), "home must not describe its implementation");

  assert.equal(await page.locator("#workspace-root .ops-kpi").count(), 4, "four operational summary metrics should render");
  assert.ok(await page.locator("#workspace-root .ops-table tbody tr").count() > 0, "priority table should be populated");
  assert.ok(await page.locator("#workspace-root .ops-schedule-row").count() > 0, "schedule should be populated");
  assert.ok(await page.locator("#workspace-root .ops-resource-row").count() > 0, "capacity panel should be populated");
  assert.ok(await page.locator("#workspace-root .ops-activity-row").count() > 0, "activity feed should show workspace events");
  const quickLinksCount = await page.locator("#workspace-root .ops-quick-card").count();
  assert.ok(quickLinksCount >= 6, "expected six workspace shortcuts");

  await page.locator("#workspace-root .ops-table [data-open-task]").first().click();
  assert.ok(await page.locator("#drawer.open").count(), "task inspection should open the detail drawer");
  await page.locator("#drawer-close").click();
  await page.locator("#workspace-root .ops-schedule-row").first().click();
  assert.ok(await page.locator("#drawer.open").count(), "appointment inspection should open the detail drawer");
  await page.locator("#drawer-close").click();

  await page.locator('#workspace-root [data-action="go-queue"]').first().click();
  await page.waitForFunction(() => location.hash === "#/queue");
  assert.ok((await page.locator("#workspace-root").innerText()).includes("New task"), "queue route should expose work actions");
  await page.evaluate(() => { location.hash = "/today"; });
  await page.waitForFunction(() => location.hash === "#/today");

  const dashboardHeading = page.locator("#workspace-root .ops-home-header h1");
  assert.ok((await dashboardHeading.innerText()).includes("Operations overview"), "dashboard heading should identify the current work surface");
  const dashboardGeometry = await page.locator("#workspace-root .ops-home").evaluate((node) => ({
    width: Math.round(node.getBoundingClientRect().width),
    kpiColumns: getComputedStyle(node.querySelector(".ops-kpis")).gridTemplateColumns.split(" ").length,
    fontFamily: getComputedStyle(node.querySelector(".ops-home-header h1")).fontFamily,
  }));
  assert.ok(dashboardGeometry.width > 900, "dashboard should use available desktop width: " + JSON.stringify(dashboardGeometry));
  assert.equal(dashboardGeometry.kpiColumns, 4, "desktop dashboard should show four KPI columns: " + JSON.stringify(dashboardGeometry));
  assert.ok(dashboardGeometry.fontFamily.includes("Space Grotesk"), "dashboard headings should use Space Grotesk");

  const dashboardPhotoRules = [];
  for (const selector of [".ops-kpi", ".ops-panel", ".ops-quick-card"]) {
    assert.ok(await page.locator("#workspace-root " + selector).count() > 0, "expected dashboard component " + selector);
    const photo = await page.locator("#workspace-root " + selector).first().evaluate((node) =>
      [getComputedStyle(node).backgroundImage, getComputedStyle(node, "::before").backgroundImage].join(" ")
    );
    dashboardPhotoRules.push({selector, photo:photo.includes("https://")});
  }
  assert.ok(dashboardPhotoRules.every(item => !item.photo), "operational dashboard cards must not be marketing photo tiles");

  const footerStyle = await page.locator("footer.site-footer").evaluate((node) => ({
    backgroundImage: getComputedStyle(node).backgroundImage,
    borderTopWidth: getComputedStyle(node).borderTopWidth,
  }));
  assert.equal(footerStyle.backgroundImage, "none", "footer should share the single theme surface rather than add another photo");
  assert.equal(footerStyle.borderTopWidth, "1px", "footer should use a restrained theme-border divider");

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

  const goToWorkspace = async (route) => {
    await page.evaluate((value) => { location.hash = "/" + value; }, route);
    await page.waitForFunction((value) => location.hash === "#/" + value, route);
    await page.locator("#workspace-root").waitFor({ state: "visible" });
  };

  // Person creation rejects an empty name, then persists a valid synthetic person.
  await goToWorkspace("people");
  const peopleBefore = await page.locator("#workspace-root .person-card").count();
  await page.locator('#workspace-root [data-action="new-person"]').click();
  await page.locator('#modal-foot [data-action="save-person"]').click();
  assert.equal(await page.locator("#modal-overlay").evaluate(node => node.hidden), false, "invalid person form should remain open");
  await page.locator("#f-name").fill("UI CRUD Person");
  await page.locator("#f-notes").fill("Synthetic browser regression record.");
  await page.locator('#modal-foot [data-action="save-person"]').click();
  assert.equal(await page.locator("#workspace-root .person-card").count(), peopleBefore + 1, "person form should create a record");
  assert.ok((await page.locator("#workspace-root").innerText()).includes("UI CRUD Person"), "created person should render");

  // Work queue create flow.
  await goToWorkspace("queue");
  await page.locator('#workspace-root [data-action="new-task"]').click();
  await page.locator("#f-task-title").fill("UI CRUD Task");
  await page.locator("#f-task-priority").selectOption("Critical");
  await page.locator('#modal-foot [data-action="save-task"]').click();
  assert.ok((await page.locator("#workspace-root").innerText()).includes("UI CRUD Task"), "task form should create a record");

  // Appointment scheduler create flow.
  await goToWorkspace("schedule");
  await page.locator('#workspace-root [data-action="new-appointment"]').click();
  await page.locator("#f-ap-time").fill("13:45");
  await page.locator("#f-ap-type").selectOption("Coordination");
  await page.locator('#modal-foot [data-action="save-appointment"]').click();
  assert.ok((await page.locator("#workspace-root").innerText()).includes("13:45"), "appointment form should save its time");

  // Resource and workforce forms.
  await goToWorkspace("capacity");
  await page.locator('#workspace-root [data-action="new-resource"]').click();
  await page.locator("#f-r-name").fill("UI CRUD Resource");
  await page.locator("#f-r-util").fill("56");
  await page.locator('#modal-foot [data-action="save-resource"]').click();
  assert.ok((await page.locator("#workspace-root").innerText()).includes("UI CRUD Resource"), "resource form should create a record");

  await goToWorkspace("workforce");
  await page.locator('#workspace-root [data-action="new-workforce"]').click();
  await page.locator("#f-w-name").fill("UI CRUD Workforce");
  await page.locator("#f-w-load").fill("43");
  await page.locator('#modal-foot [data-action="save-workforce"]').click();
  assert.ok((await page.locator("#workspace-root").innerText()).includes("UI CRUD Workforce"), "workforce form should create a record");

  // Workflow/diagnostic record.
  await goToWorkspace("diagnostics");
  await page.locator('#workspace-root [data-action="new-diagnostic"]').click();
  await page.locator("#f-d-value").fill("UI CRUD Diagnostic");
  await page.locator('#modal-foot [data-action="save-diagnostic"]').click();
  assert.ok((await page.locator("#workspace-root").innerText()).includes("UI CRUD Diagnostic"), "workflow result form should create a record");

  // Pharmacy validation must reject negative quantities, then accept a valid item.
  await goToWorkspace("pharmacy");
  await page.locator('#workspace-root [data-action="new-pharmacy"]').click();
  await page.locator("#f-p-item").fill("UI Invalid Negative Inventory");
  await page.locator("#f-p-qty").fill("-1");
  await page.locator('#modal-foot [data-action="save-pharmacy"]').click();
  assert.equal(await page.locator("#modal-overlay").evaluate(node => node.hidden), false, "negative inventory should not close the modal");
  assert.ok((await page.locator("#toast-stack").innerText()).includes("must be zero or greater"), "negative inventory should show validation");
  await page.locator("#f-p-item").fill("UI CRUD Inventory");
  await page.locator("#f-p-qty").fill("12");
  await page.locator("#f-p-min").fill("4");
  await page.locator("#f-p-var").fill("0");
  await page.locator('#modal-foot [data-action="save-pharmacy"]').click();
  assert.ok((await page.locator("#workspace-root").innerText()).includes("UI CRUD Inventory"), "valid inventory form should create a record");

  // Finance, messaging, incidents and report templates.
  await goToWorkspace("finance");
  await page.locator('#workspace-root [data-action="new-finance"]').click();
  await page.locator("#f-f-label").fill("UI CRUD Finance");
  await page.locator("#f-f-amount").fill("1250");
  await page.locator('#modal-foot [data-action="save-finance"]').click();
  assert.ok((await page.locator("#workspace-root").innerText()).includes("UI CRUD Finance"), "finance form should create a record");

  await goToWorkspace("messages");
  await page.locator('#workspace-root [data-action="new-message"]').click();
  await page.locator("#f-message-subject").fill("UI CRUD Subject");
  await page.locator("#f-message-text").fill("UI CRUD Message Body");
  await page.locator('#modal-foot [data-action="save-message"]').click();
  assert.ok((await page.locator("#workspace-root").innerText()).includes("UI CRUD Subject"), "message subject must be preserved");
  assert.ok((await page.locator("#workspace-root").innerText()).includes("UI CRUD Message Body"), "message body must be preserved");
  const createdMessage = await page.evaluate(() => JSON.parse(localStorage.getItem("averis-neon-v8") || "{}").messages?.find(x => x.subject === "UI CRUD Subject"));
  assert.ok(createdMessage, "message subject should be persisted in browser state");

  await goToWorkspace("incidents");
  await page.locator('#workspace-root [data-action="new-incident"]').click();
  await page.locator("#f-incident-title").fill("UI CRUD Incident");
  await page.locator("#f-incident-note").fill("Synthetic incident note.");
  await page.locator('#modal-foot [data-action="save-incident"]').click();
  assert.ok((await page.locator("#workspace-root").innerText()).includes("UI CRUD Incident"), "incident form should create a record");

  await goToWorkspace("reports");
  await page.locator('#workspace-root [data-action="new-report"]').click();
  await page.locator("#f-rep-name").fill("UI CRUD Report");
  await page.locator('#modal-foot [data-action="save-report"]').click();
  assert.ok((await page.locator("#workspace-root").innerText()).includes("UI CRUD Report"), "report form should create a record");

  // Local ERP create, update and delete should operate on the browser demo store.
  await goToWorkspace("erp");
  await page.locator('#workspace-root .erp-module-tabs [data-action="erp-module:products"]').click();
  await page.locator('#workspace-root .erp-table-panel .erp-list-actions [data-action="erp-create"]').click();
  await page.locator('#erp-record-form [data-erp-field="name"]').fill("UI CRUD ERP Product");
  const uiSku = "UI-CRUD-" + Date.now().toString(36).toUpperCase();
  await page.locator('#erp-record-form [data-erp-field="sku"]').fill(uiSku);
  await page.locator('#erp-record-form [data-erp-field="quantity"]').fill("15");
  await page.locator('#erp-record-form [data-erp-field="reorder_level"]').fill("5");
  await page.locator("#erp-record-form button[type='submit']").click();
  await page.waitForFunction(() => document.querySelector("#workspace-root")?.innerText.includes("UI CRUD ERP Product"));
  let productRow = page.locator("#workspace-root tr").filter({ hasText: "UI CRUD ERP Product" });
  await productRow.locator('button[data-action^="erp-edit:products:"]').click();
  await page.locator('#erp-record-form [data-erp-field="name"]').fill("UI CRUD ERP Product Updated");
  await page.locator("#erp-record-form button[type='submit']").click();
  await page.waitForFunction(() => document.querySelector("#workspace-root")?.innerText.includes("UI CRUD ERP Product Updated"));
  productRow = page.locator("#workspace-root tr").filter({ hasText: "UI CRUD ERP Product Updated" });
  page.once("dialog", dialog => dialog.accept());
  await productRow.locator('button[data-action^="erp-delete:products:"]').click();
  await page.waitForFunction(() => !document.querySelector("#workspace-root")?.innerText.includes("UI CRUD ERP Product Updated"));
  assert.equal(await page.locator("#workspace-root tr").filter({ hasText: "UI CRUD ERP Product Updated" }).count(), 0, "ERP delete should remove the record from the local demo store");

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
  assert.equal(savedRegistration.account?.email, "ui-smoke@example.test", "signup should save the local account email");

  // Local sign-out keeps the new account on this browser; verify it still signs in after a reload.
  await page.locator("#profile-button").click();
  await page.locator('#drawer-body [data-action="logout"]').click();
  await page.waitForFunction(() => location.hash === "#/login");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('form[data-auth-form="login"]').waitFor({ state: "visible" });
  const persistedAfterLogout = await page.evaluate(() => JSON.parse(localStorage.getItem("averis-neon-v8") || "{}"));
  assert.equal(persistedAfterLogout.account?.email, "ui-smoke@example.test", "local account should survive sign-out/reload");
  await page.locator("#auth-email").fill("ui-smoke@example.test");
  await page.locator("#auth-password").fill("Synthetic-QA-Password-2026!");
  await page.locator('form[data-auth-form="login"] button[type="submit"]').click();
  await page.waitForFunction(() => location.hash === "#/today");
  const persistedAfterLogin = await page.evaluate(() => JSON.parse(localStorage.getItem("averis-neon-v8") || "{}"));
  assert.equal(persistedAfterLogin.session?.authenticated, true, "successful local sign-in should persist the session");

  // Stored workspace values are text, never executable HTML, in list views and drawers.
  await page.evaluate(() => { window.__averisXssCanary = 0; location.hash = "/people"; });
  await page.waitForFunction(() => location.hash === "#/people");
  await page.locator('#workspace-root [data-action="new-person"]').click();
  const xssPayload = '<img src=x onerror="window.__averisXssCanary=1"><svg onload="window.__averisXssCanary=2"></svg>';
  await page.locator("#f-name").fill(xssPayload);
  await page.locator('#modal-foot [data-action="save-person"]').click();
  const injectedPerson = page.locator("#workspace-root .person-card").filter({ hasText: xssPayload });
  assert.equal(await injectedPerson.count(), 1, "the entered name should display as plain text");
  assert.equal(await page.evaluate(() => window.__averisXssCanary), 0, "user-controlled HTML must not execute");
  assert.equal(await page.locator('#workspace-root img[src="x"], #workspace-root svg[onload], #workspace-root script').count(), 0, "list view must not contain injected executable nodes");
  await injectedPerson.locator('button[data-open-person]').click();
  assert.equal(await page.evaluate(() => window.__averisXssCanary), 0, "profile drawer must not execute stored HTML");
  assert.equal(await page.locator('#drawer-body img[src="x"], #drawer-body svg[onload], #drawer-body script').count(), 0, "profile drawer must not contain injected executable nodes");
  const headerZ = Number(await page.locator("#site-header").evaluate(node => getComputedStyle(node).zIndex));
  const drawerZ = Number(await page.locator("#drawer").evaluate(node => getComputedStyle(node).zIndex));
  assert.ok(drawerZ > headerZ, "drawer must layer above the sticky header so its close control is reachable");
  await page.locator("#drawer-close").click();

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
  console.log("OK: fixed header, five primary links + More submenu, persistent light/dark themes, working auth routes, operational dashboard metrics, task and appointment inspection, " + quickLinksCount + " workspace shortcuts, " + routes.length + " footer routes and mobile width.");
} finally {
  await browser.close();
}
