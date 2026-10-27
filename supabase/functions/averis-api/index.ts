import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const COOKIE = "averis_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const MAX_BODY_BYTES = 1_500_000;
const ML_BASE = "https://averis-platform-api-mahi.onrender.com";
const ALLOWED_ORIGINS = new Set([
  "https://averis-saas.netlify.app",
  "https://main--averis-saas.netlify.app",
  "https://mahitech580.github.io",
  "https://averis-tau.vercel.app",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
]);
const SYNC_KEYS = new Set([
  "people", "tasks", "appointments", "resources", "workforce", "messages",
  "incidents", "diagnostics", "pharmacy", "finance", "reports", "audit",
  "compact", "focus", "notifications", "theme",
]);
const ERP_FIELDS: Record<string, Record<string, string>> = {
  products: { name:"text",sku:"text",category:"text",unit:"text",quantity:"number",reorder_level:"number",unit_cost:"number",selling_price:"number",location:"text",status:"text" },
  suppliers: { name:"text",company:"text",email:"email",phone:"text",city:"text",payment_terms:"text",status:"text" },
  purchase_orders: { po_number:"text",supplier:"text",order_date:"date",expected_date:"date",items_count:"number",total:"number",status:"text" },
  customers: { name:"text",company:"text",email:"email",phone:"text",segment:"text",city:"text",lifetime_value:"number",status:"text" },
  sales_orders: { so_number:"text",customer:"text",order_date:"date",due_date:"date",items_count:"number",total:"number",status:"text" },
  invoices: { invoice_number:"text",party:"text",direction:"text",issue_date:"date",due_date:"date",amount:"number",paid_amount:"number",status:"text" },
  employees: { name:"text",email:"email",department:"text",job_title:"text",manager:"text",employment_type:"text",start_date:"date",salary:"number",status:"text" },
  leads: { name:"text",company:"text",email:"email",source:"text",owner:"text",stage:"text",value:"number",next_activity:"date" },
  projects: { name:"text",client:"text",owner:"text",start_date:"date",due_date:"date",budget:"number",status:"text",progress:"number" },
  assets: { name:"text",asset_tag:"text",category:"text",assigned_to:"text",purchase_date:"date",value:"number",condition:"text",status:"text" },
  journal_entries: { entry_number:"text",date:"date",description:"text",debit_account:"text",credit_account:"text",amount:"number",status:"text" },
  support_tickets: { subject:"text",customer:"text",priority:"text",assignee:"text",created_date:"date",status:"text" },
  production_orders: { order_number:"text",product:"text",quantity:"number",due_date:"date",work_center:"text",status:"text" },
  stock_movements: { movement_date:"date",sku:"text",product:"text",movement_type:"text",quantity:"number",reference:"text" },
  quality_checks: { reference:"text",item:"text",check_type:"text",result:"text",inspector:"text",check_date:"date",status:"text" },
};
const ERP_LABELS: Record<string, string> = {
  products:"Inventory",suppliers:"Suppliers",purchase_orders:"Purchasing",customers:"Customers",
  sales_orders:"Sales",invoices:"Invoices & Finance",employees:"HR & Employees",leads:"CRM",
  projects:"Projects",assets:"Assets",journal_entries:"Accounting",support_tickets:"Support",
  production_orders:"Manufacturing",stock_movements:"Stock Ledger",quality_checks:"Quality",
};
const ERP_REQUIRED: Record<string, string[]> = {
  products:["name","sku"],suppliers:["name"],purchase_orders:["po_number","supplier"],customers:["name"],
  sales_orders:["so_number","customer"],invoices:["invoice_number","party","amount"],employees:["name","email"],
  leads:["name"],projects:["name"],assets:["name","asset_tag"],journal_entries:["entry_number","date","amount"],
  support_tickets:["subject"],production_orders:["order_number","product","quantity"],
  stock_movements:["movement_date","sku","quantity"],quality_checks:["reference","item","result"],
};
const ERP_PREFIX: Record<string, string> = {
  products:"PRD",suppliers:"SUP",purchase_orders:"PO",customers:"CUS",sales_orders:"SO",invoices:"INV",
  employees:"EMP",leads:"LEAD",projects:"PROJ",assets:"AST",journal_entries:"JRN",support_tickets:"TKT",
  production_orders:"MFG",stock_movements:"MOV",quality_checks:"QC",
};
const nowIso = () => new Date().toISOString();
function fail(status: number, detail: string): never {
  const error = new Error(detail) as Error & { status?: number };
  error.status = status;
  throw error;
}
function responseJson(status: number, body: unknown, headers: HeadersInit = {}) {
  const h = new Headers(headers);
  h.set("content-type", "application/json; charset=utf-8");
  h.set("cache-control", "no-store");
  h.set("x-content-type-options", "nosniff");
  h.set("referrer-policy", "strict-origin-when-cross-origin");
  h.set("x-frame-options", "DENY");
  return new Response(JSON.stringify(body), { status, headers: h });
}
function corsHeaders(origin: string | null) {
  const h = new Headers();
  if (origin && (ALLOWED_ORIGINS.has(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
    h.set("access-control-allow-origin", origin);
    h.set("access-control-allow-credentials", "true");
    h.set("vary", "Origin");
  }
  h.set("access-control-allow-methods", "GET,POST,PUT,DELETE,OPTIONS");
  h.set("access-control-allow-headers", "Authorization,Content-Type,X-Averis-Request");
  h.set("access-control-max-age", "600");
  return h;
}
function withCors(response: Response, origin: string | null) {
  const h = new Headers(response.headers);
  corsHeaders(origin).forEach((v, k) => h.set(k, v));
  return new Response(response.body, { status: response.status, headers: h });
}
function parsePath(url: URL) {
  const marker = "/averis-api";
  const i = url.pathname.indexOf(marker);
  let path = i >= 0 ? url.pathname.slice(i + marker.length) : url.pathname;
  if (!path.startsWith("/")) path = "/" + path;
  return path || "/";
}
function parseCookies(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const p = part.trim();
    if (!p) continue;
    const i = p.indexOf("=");
    if (i < 0) continue;
    try { out[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); } catch { out[p.slice(0, i)] = p.slice(i + 1); }
  }
  return out;
}
function requestToken(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (match) return match[1].trim();
  return parseCookies(request)[COOKIE] ?? "";
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, "0")).join("");
}
function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(48));
  return Array.from(bytes).map(x => x.toString(16).padStart(2, "0")).join("");
}
function randomInvite() {
  return randomToken().slice(0, 24);
}
function setCookie(token: string) {
  return COOKIE + "=" + encodeURIComponent(token) + "; Path=/; Max-Age=" + SESSION_SECONDS + "; HttpOnly; Secure; SameSite=None";
}
function clearCookie() {
  return COOKIE + "=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None";
}
async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name:"PBKDF2", salt, iterations:210000, hash:"SHA-256" }, key, 256);
  const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
  return "pbkdf2$210000$" + b64(salt) + "$" + b64(new Uint8Array(bits));
}
async function verifyPassword(password: string, stored: string) {
  try {
    const parts = stored.split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
    const iters = Number(parts[1]);
    if (!Number.isFinite(iters) || iters < 100000 || iters > 500000) return false;
    const b64 = (s: string) => Uint8Array.from(atob(s.replaceAll("-","+").replaceAll("_","/") + "=".repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
    const salt = b64(parts[2]), expected = b64(parts[3]);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const actual = new Uint8Array(await crypto.subtle.deriveBits({ name:"PBKDF2", salt, iterations:iters, hash:"SHA-256" }, key, 256));
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i=0;i<actual.length;i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch { return false; }
}
async function bodyJson(request: Request) {
  const len = Number(request.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) fail(413, "Request body is too large.");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) fail(413, "Request body is too large.");
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { fail(400, "Malformed JSON body."); }
}
async function dbResult<T>(query: PromiseLike<{data:T|null,error:{message:string,code?:string}|null}>, notFound = "Record not found.") : Promise<T> {
  const result = await query;
  if (result.error) {
    if (result.error.code === "23505") fail(409, "A record with this value already exists.");
    console.error("AVERIS database operation failed:", result.error.code ?? "database_error");
    fail(500, "The database operation could not be completed.");
  }
  if (result.data == null) fail(404, notFound);
  return result.data;
}
async function audit(orgId: string, userId: string, action: string, details: Record<string, unknown> = {}) {
  const result = await admin.from("server_audit_events").insert({
    organization_id:orgId, actor_id:userId, action:action.slice(0,80), details, created_at:nowIso(),
  });
  if (result.error) console.error("AVERIS audit insert failed:", result.error.code ?? "database_error");
}
function publicUser(user: any) {
  return { id:user.id, name:user.full_name, email:user.email, role:user.role, organization_id:user.organization_id };
}
function identity(user: any, org: any) {
  return { user:publicUser(user), organization:{ id:org.id, name:org.name, slug:org.slug } };
}
async function loadOrg(id: string) {
  return await dbResult(admin.from("organizations").select("*").eq("id", id).maybeSingle(), "Workspace not found.");
}
async function resolveIdentity(request: Request) {
  const token = requestToken(request);
  if (!token) fail(401, "Sign in required.");
  const tokenHash = await sha256(token);
  const sessionResult = await admin.from("auth_sessions").select("*").eq("token_hash", tokenHash).is("revoked_at", null).maybeSingle();
  if (sessionResult.error) {
    console.error("AVERIS session lookup failed:", sessionResult.error.code ?? "database_error");
    fail(500, "The session could not be verified.");
  }
  const session = sessionResult.data;
  if (!session || !session.expires_at || new Date(session.expires_at).getTime() <= Date.now()) fail(401, "Session expired. Sign in again.");
  const user = await dbResult(admin.from("users").select("*").eq("id", session.user_id).maybeSingle(), "Account is unavailable.");
  if (!user.is_active) fail(401, "Account is unavailable.");
  const org = await loadOrg(user.organization_id);
  return { token, tokenHash, user, org };
}
async function issueSession(user: any, request: Request) {
  const token = randomToken();
  const result = await admin.from("auth_sessions").insert({
    token_hash:await sha256(token), user_id:user.id, created_at:nowIso(),
    expires_at:new Date(Date.now() + SESSION_SECONDS * 1000).toISOString(), revoked_at:null,
  });
  if (result.error) fail(500, "Could not start the session.");
  const org = await loadOrg(user.organization_id);
  const id: any = identity(user, org);
  id.access_token = token;
  return { identity:id, cookie:setCookie(token) };
}
function cleanEmail(value: unknown) {
  if (typeof value !== "string") fail(422, "Enter a valid email address.");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(422, "Enter a valid email address.");
  return email;
}
function cleanText(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== "string") fail(422, label + " must be text.");
  const text = value.trim();
  if (text.length < min || text.length > max) fail(422, label + " must be between " + min + " and " + max + " characters.");
  return text;
}
function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "averis-workspace";
}
function sanitizeWorkspace(source: unknown) {
  if (!source || typeof source !== "object" || Array.isArray(source)) fail(422, "Workspace data must be an object.");
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    if (SYNC_KEYS.has(key)) out[key] = value;
  }
  if (new TextEncoder().encode(JSON.stringify(out)).length > MAX_BODY_BYTES) fail(413, "Workspace snapshot is too large.");
  for (const [key, value] of Object.entries(out)) {
    if (Array.isArray(value) && value.length > 4000) fail(422, "Workspace collection " + key + " is too large.");
  }
  return out;
}
function organizationInfo(org: any, user: any, members: any[]) {
  return { id:org.id, name:org.name, slug:org.slug, invite_code:org.invite_code, role:user.role, member_count:members.length,
    members:members.map(m=>({id:m.id,name:m.full_name,email:m.email,role:m.role,created_at:m.created_at})) };
}
async function getOrganization(user: any) {
  const org = await loadOrg(user.organization_id);
  const members = await dbResult(admin.from("users").select("id,full_name,email,role,created_at").eq("organization_id", org.id).eq("is_active", true).order("created_at", {ascending:true}), "No members found.");
  return organizationInfo(org, user, members);
}
function cleanErpPayload(collection: string, raw: any, key?: string) {
  const fields = ERP_FIELDS[collection];
  if (!fields) fail(404, "ERP module not found.");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail(422, "Record payload must be an object.");
  const allowed = new Set([...Object.keys(fields), "id", "created_at", "updated_at"]);
  const unknown = Object.keys(raw).filter(k=>!allowed.has(k));
  if (unknown.length) fail(422, "Unsupported field(s): " + unknown.join(", "));
  const clean: Record<string, any> = {};
  for (const [field, kind] of Object.entries(fields)) {
    if (!(field in raw)) continue;
    const value = raw[field];
    if (value == null || (typeof value === "string" && !value.trim())) { clean[field] = kind === "number" ? null : ""; continue; }
    if (kind === "number") {
      if (typeof value === "boolean" || !Number.isFinite(Number(value))) fail(422, field + " must be numeric.");
      const number = Number(value);
      if (number < 0) fail(422, field + " cannot be negative.");
      if (["quantity","reorder_level","items_count","progress"].includes(field) && !Number.isInteger(number)) fail(422, field + " must be a whole number.");
      if (field === "progress" && number > 100) fail(422, "progress must be between 0 and 100.");
      clean[field] = Number.isInteger(number) ? Math.trunc(number) : number;
    } else {
      if (typeof value !== "string") fail(422, field + " must be text.");
      const text = value.trim();
      if (text.length > 500) fail(422, field + " exceeds 500 characters.");
      if (kind === "date" && text && !/^\d{4}-\d{2}-\d{2}$/.test(text)) fail(422, field + " must use YYYY-MM-DD format.");
      if (kind === "email" && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) fail(422, field + " must be a valid email address.");
      clean[field] = text;
    }
  }
  const missing = (ERP_REQUIRED[collection] ?? []).filter(f=>clean[f]==null || String(clean[f]).trim()==="");
  if (missing.length) fail(422, "Required field(s): " + missing.join(", "));
  if (collection === "products" && clean.sku) clean.sku = String(clean.sku).trim().toUpperCase();
  if (key) clean.id = key;
  return clean;
}
function publicRecord(row: any) {
  return { ...(row.payload ?? {}), id:row.record_key, created_at:row.created_at, updated_at:row.updated_at };
}
function routeToken(prefix: string) {
  return prefix + "-" + randomToken().slice(0, 10).toUpperCase();
}
function demoRecord(collection: string, i: number, key: string, today: string): any {
  const d = new Date(today);
  const dateA = new Date(d.getTime() - (i * 3 % 75) * 86400000).toISOString().slice(0,10);
  const dateB = new Date(d.getTime() + ((i * 2) % 60 + 1) * 86400000).toISOString().slice(0,10);
  const state = ["Active","In Progress","Pending","Review"][i%4];
  const n = i+1;
  const simple: Record<string, any> = {
    products:{name:"Operations Supply "+String(n).padStart(2,"0"),sku:"AVR-DEMO-"+String(n).padStart(4,"0"),category:["Equipment","Consumables","IT","Maintenance"][i%4],unit:"unit",quantity:[4,18,62,11,2,37][i%6],reorder_level:[8,12,10,6,5,20][i%6],unit_cost:11.25+n*2.4,selling_price:17.5+n*3.1,location:"Zone "+String.fromCharCode(65+i%5),status:"Active"},
    suppliers:{name:"Supplier "+String(n).padStart(2,"0"),company:"Northstar Supply "+String(n).padStart(2,"0"),email:"supplier"+n+"@example.test",phone:"+91-90000-"+String(n).padStart(5,"0"),city:["Hyderabad","Bengaluru","Chennai","Pune"][i%4],payment_terms:["Net 15","Net 30","Net 45"][i%3],status:state},
    purchase_orders:{po_number:"PO-DEMO-"+String(n).padStart(4,"0"),supplier:"Supplier "+String(n).padStart(2,"0"),order_date:dateA,expected_date:dateB,items_count:i%8+1,total:3200+n*615.5,status:["Received","Open","Approved","In Transit"][i%4]},
    customers:{name:"Customer Account "+String(n).padStart(2,"0"),company:"Meridian Group "+String(n).padStart(2,"0"),email:"customer"+n+"@example.test",phone:"+91-91000-"+String(n).padStart(5,"0"),segment:["Enterprise","Mid-market","SMB"][i%3],city:["Hyderabad","Bengaluru","Chennai","Mumbai"][i%4],lifetime_value:12000+n*2475,status:state},
    sales_orders:{so_number:"SO-DEMO-"+String(n).padStart(4,"0"),customer:"Customer Account "+String(n).padStart(2,"0"),order_date:dateA,due_date:dateB,items_count:i%6+1,total:2400+n*845.25,status:["Fulfilled","Open","Processing","On Hold"][i%4]},
    invoices:{invoice_number:"INV-DEMO-"+String(n).padStart(4,"0"),party:"Customer Account "+String(n).padStart(2,"0"),direction:i%5===0?"payable":"receivable",issue_date:dateA,due_date:dateB,amount:1900+n*540.75,paid_amount:0,status:["Sent","Partially Paid","Overdue","Draft"][i%4]},
    employees:{name:"Team Member "+String(n).padStart(2,"0"),email:"team"+n+"@example.test",department:["Operations","Finance","Sales","Engineering","Quality"][i%5],job_title:["Coordinator","Analyst","Specialist","Manager"][i%4],manager:"Demo Administrator",employment_type:"Full-time",start_date:dateA,salary:30000+n*2250,status:"Active"},
    leads:{name:"Prospect "+String(n).padStart(2,"0"),company:"Enterprise Prospect "+String(n).padStart(2,"0"),email:"prospect"+n+"@example.test",source:["Website","Referral","Event","Outbound"][i%4],owner:"Team Member "+String(i%8+1).padStart(2,"0"),stage:["New","Qualified","Proposal","Negotiation"][i%4],value:15000+n*5200,next_activity:dateB},
    projects:{name:"Delivery Program "+String(n).padStart(2,"0"),client:"Customer Account "+String(i%10+1).padStart(2,"0"),owner:"Team Member "+String(i%8+1).padStart(2,"0"),start_date:dateA,due_date:dateB,budget:45000+n*15000,status:["Active","Planning","On Hold","Completed"][i%4],progress:[15,35,62,84,100][i%5]},
    assets:{name:"Workstation Asset "+String(n).padStart(2,"0"),asset_tag:"AST-DEMO-"+String(n).padStart(4,"0"),category:["Laptop","Monitor","Network","Office"][i%4],assigned_to:"Team Member "+String(i%8+1).padStart(2,"0"),purchase_date:dateA,value:22000+n*3300,condition:["Good","Excellent","Service Due"][i%3],status:"Assigned"},
    journal_entries:{entry_number:"JE-DEMO-"+String(n).padStart(4,"0"),date:dateA,description:"Monthly operating settlement "+String(n).padStart(2,"0"),debit_account:"Operating Expense",credit_account:"Accounts Payable",amount:1200+n*385.4,status:["Posted","Draft","Approved"][i%3]},
    support_tickets:{subject:"Operations request "+String(n).padStart(2,"0"),customer:"Customer Account "+String(i%10+1).padStart(2,"0"),priority:["Low","Normal","High","Critical"][i%4],assignee:"Team Member "+String(i%8+1).padStart(2,"0"),created_date:dateA,status:["Open","In Progress","Waiting","Resolved"][i%4]},
    production_orders:{order_number:"MO-DEMO-"+String(n).padStart(4,"0"),product:"Operations Supply "+String(i%12+1).padStart(2,"0"),quantity:(i+2)*5,due_date:dateB,work_center:["Assembly A","Packaging B","Quality C"][i%3],status:["Planned","In Progress","Completed"][i%3]},
    stock_movements:{movement_date:dateA,sku:"AVR-DEMO-"+String(i%12+1).padStart(4,"0"),product:"Operations Supply "+String(i%12+1).padStart(2,"0"),movement_type:["Receipt","Issue","Transfer","Adjustment"][i%4],quantity:i%20+1,reference:"REF-DEMO-"+String(n).padStart(4,"0")},
    quality_checks:{reference:"QC-DEMO-"+String(n).padStart(4,"0"),item:"Operations Supply "+String(i%12+1).padStart(2,"0"),check_type:["Visual","Functional","Count","Documentation"][i%4],result:["Pass","Pass","Review","Pass"][i%4],inspector:"Team Member "+String(i%8+1).padStart(2,"0"),check_date:dateA,status:["Passed","Passed","Review"][i%3]},
  };
  return simple[collection] ?? {};
}
const demoCounts: Record<string,number> = {
  products:25,suppliers:12,purchase_orders:18,customers:30,sales_orders:24,invoices:30,employees:18,leads:18,
  projects:12,assets:12,journal_entries:24,support_tickets:20,production_orders:12,stock_movements:40,quality_checks:18,
};
const demoWindow = new Map<string, number[]>();
function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (demoWindow.get(key) ?? []).filter(x => now - x < windowMs);
  if (recent.length >= limit) fail(429, "Too many attempts. Try again later.");
  recent.push(now);
  demoWindow.set(key, recent);
}
function clientKey(request: Request) {
  return (request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown").slice(0,120);
}
async function handle(request: Request) {
  if (!SUPABASE_URL || !SERVICE_KEY) fail(500, "Server database configuration is missing.");
  const url = new URL(request.url);
  const path = parsePath(url);
  const method = request.method.toUpperCase();
  if (path === "/api/health" && method === "GET") {
    const result = await admin.from("organizations").select("id", {head:true, count:"exact"});
    if (result.error) fail(503, "Database is unavailable.");
    return responseJson(200, {status:"ok",service:"AVERIS Workspace API",database:{postgresql:"PostgreSQL via Supabase"},database_driver:"postgresql",persistence:"server",live_sync_seconds:5,timestamp:nowIso(),synthetic_data_only:true});
  }
  if (method === "POST" && (path === "/api/auth/register" || path === "/api/auth/login")) {
    checkRateLimit(clientKey(request) + ":" + path + ":" + (request.headers.get("x-forwarded-for") ?? ""), 12, 10*60*1000);
    const payload = await bodyJson(request);
    const email = cleanEmail(payload.email);
    let user: any;
    if (path === "/api/auth/register") {
      const fullName = cleanText(payload.full_name, "Full name", 2, 100);
      const organizationName = cleanText(payload.organization_name, "Organization name", 2, 120);
      if (typeof payload.password !== "string" || payload.password.length < 12 || payload.password.length > 128) fail(422, "Password must be between 12 and 128 characters.");
      const existing = await admin.from("users").select("id").eq("email", email).maybeSingle();
      if (existing.data) fail(409, "An account with this email already exists.");
      const orgId = crypto.randomUUID();
      const short = randomToken().slice(0,6);
      const org = await dbResult(admin.from("organizations").insert({id:orgId,name:organizationName,slug:slugify(organizationName)+"-"+short,invite_code:randomInvite(),created_at:nowIso()}).select("*").single());
      const inserted = await admin.from("users").insert({id:crypto.randomUUID(),organization_id:org.id,full_name:fullName,email,password_hash:await hashPassword(payload.password),role:"owner",is_active:true,created_at:nowIso()}).select("*").single();
      if (inserted.error) {
        await admin.from("organizations").delete().eq("id",org.id);
        if (inserted.error.code === "23505") fail(409, "An account with this email already exists.");
        fail(500, "Could not create the account.");
      }
      user = inserted.data;
      await audit(org.id, user.id, "account.registered");
    } else {
      const found = await admin.from("users").select("*").eq("email",email).maybeSingle();
      user = found.data;
      if (!user || !user.is_active || !(await verifyPassword(String(payload.password ?? ""), user.password_hash))) fail(401, "Email or password is incorrect.");
      await audit(user.organization_id, user.id, "account.signed_in");
    }
    const issued = await issueSession(user, request);
    return responseJson(path.endsWith("register") ? 201 : 200, issued.identity, { "set-cookie": issued.cookie });
  }
  if (method === "POST" && path === "/api/auth/demo") {
    checkRateLimit("demo:" + clientKey(request), 5, 60*60*1000);
    checkRateLimit("demo-global", 30, 60*60*1000);
    const code = randomToken().slice(0,12).toUpperCase();
    const org = await dbResult(admin.from("organizations").insert({id:crypto.randomUUID(),name:"AVERIS Demo "+code.slice(0,6),slug:"averis-demo-"+code.toLowerCase(),invite_code:randomInvite(),created_at:nowIso()}).select("*").single());
    const user = await dbResult(admin.from("users").insert({id:crypto.randomUUID(),organization_id:org.id,full_name:"Demo Administrator",email:"demo+"+code.toLowerCase()+"@averis-demo.invalid",password_hash:await hashPassword(randomToken()),role:"owner",is_active:true,created_at:nowIso()}).select("*").single());
    const values: any[] = [];
    const today = nowIso().slice(0,10);
    for (const [collection, count] of Object.entries(demoCounts)) {
      for (let i=0;i<count;i++) {
        const key = ERP_PREFIX[collection] + "-D" + code.slice(0,5) + "-" + String(i+1).padStart(3,"0");
        const payload = demoRecord(collection, i, key, today);
        payload.id = key;
        values.push({id:crypto.randomUUID(),organization_id:org.id,collection,record_key:key,payload,created_at:nowIso(),updated_at:nowIso(),created_by:user.id,updated_by:user.id});
      }
    }
    for (let i=0;i<values.length;i+=100) {
      const result = await admin.from("erp_business_records").insert(values.slice(i,i+100));
      if (result.error) fail(500, "Could not seed the synthetic demo workspace.");
    }
    await audit(org.id,user.id,"demo.workspace_created",{seeded_erp_records:values.length,modules:Object.keys(demoCounts).length});
    const issued = await issueSession(user, request);
    issued.identity.demo_workspace = true;
    issued.identity.seeded_erp_records = values.length;
    return responseJson(200, issued.identity, { "set-cookie": issued.cookie });
  }
  if (method === "POST" && path === "/api/auth/logout") {
    const token = requestToken(request);
    if (token) {
      const tokenHash = await sha256(token);
      await admin.from("auth_sessions").update({revoked_at:nowIso()}).eq("token_hash",tokenHash).is("revoked_at",null);
    }
    return responseJson(200,{ok:true},{"set-cookie":clearCookie()});
  }
  const ctx = await resolveIdentity(request);
  const user = ctx.user, org = ctx.org;
  if (method === "GET" && path === "/api/auth/me") return responseJson(200, identity(user, org));
  if (method === "PUT" && path === "/api/auth/profile") {
    const payload = await bodyJson(request);
    const fullName = cleanText(payload.full_name,"Full name",2,100);
    const updated = await dbResult(admin.from("users").update({full_name:fullName}).eq("id",user.id).select("*").single());
    await audit(org.id,user.id,"account.profile_updated");
    return responseJson(200, identity(updated, org));
  }
  if (method === "GET" && path === "/api/organization") return responseJson(200, await getOrganization(user));
  if (method === "POST" && path === "/api/organization/join") {
    const payload = await bodyJson(request);
    const invite = cleanText(payload.invite_code,"Invite code",4,48);
    const target = await admin.from("organizations").select("*").eq("invite_code",invite).maybeSingle();
    if (!target.data) fail(404, "Invite code not found.");
    if (target.data.id === user.organization_id) return responseJson(200, await getOrganization(user));
    const changed = await dbResult(admin.from("users").update({organization_id:target.data.id,role:"member"}).eq("id",user.id).select("*").single());
    await audit(target.data.id,user.id,"organization.member_joined");
    return responseJson(200, await getOrganization(changed));
  }
  if (method === "POST" && path === "/api/organization/rotate-invite") {
    if (user.role !== "owner") fail(403, "Only workspace owners can rotate invite codes.");
    const updated = await dbResult(admin.from("organizations").update({invite_code:randomInvite()}).eq("id",org.id).select("*").single());
    await audit(org.id,user.id,"organization.invite_rotated");
    return responseJson(200, await getOrganization(user));
  }
  if (path === "/api/workspace" && method === "GET") {
    const row = await admin.from("workspace_snapshots").select("*").eq("organization_id",org.id).maybeSingle();
    if (row.error) fail(500, "Could not load the workspace snapshot.");
    if (!row.data) return responseJson(200,{data:null,revision:0,updated_at:null,updated_by:null});
    return responseJson(200,{data:row.data.data,revision:row.data.revision,updated_at:row.data.updated_at,updated_by:row.data.updated_by});
  }
  if (path === "/api/workspace" && method === "PUT") {
    const payload = await bodyJson(request);
    const data = sanitizeWorkspace(payload.data);
    const row = await admin.from("workspace_snapshots").select("*").eq("organization_id",org.id).maybeSingle();
    if (row.error) fail(500, "Could not load workspace state.");
    const current = row.data?.revision ?? 0;
    if (Number(payload.revision) !== current) return responseJson(409,{detail:"Workspace changed in another session.",data:row.data?.data ?? null,revision:current,updated_at:row.data?.updated_at ?? null});
    const next = {organization_id:org.id,data,revision:current+1,updated_at:nowIso(),updated_by:user.id};
    let saved: any;
    if (row.data) {
      const up = await admin.from("workspace_snapshots").update(next).eq("organization_id",org.id).eq("revision",current).select("*").maybeSingle();
      if (up.error) fail(500, "Could not save workspace state.");
      if (!up.data) {
        const latest = await admin.from("workspace_snapshots").select("*").eq("organization_id",org.id).maybeSingle();
        return responseJson(409,{detail:"Workspace changed in another session.",data:latest.data?.data ?? null,revision:latest.data?.revision ?? 0,updated_at:latest.data?.updated_at ?? null});
      }
      saved = up.data;
    } else {
      const ins = await admin.from("workspace_snapshots").insert(next).select("*").maybeSingle();
      if (ins.error || !ins.data) {
        const latest = await admin.from("workspace_snapshots").select("*").eq("organization_id",org.id).maybeSingle();
        if (latest.data) return responseJson(409,{detail:"Workspace changed in another session.",data:latest.data.data,revision:latest.data.revision,updated_at:latest.data.updated_at});
        fail(500, "Could not create workspace snapshot.");
      }
      saved = ins.data;
    }
    await audit(org.id,user.id,"workspace.snapshot_saved",{revision:saved.revision,collections:Object.fromEntries(Object.entries(data).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,(v as unknown[]).length]))});
    return responseJson(200,{data:saved.data,revision:saved.revision,updated_at:saved.updated_at,updated_by:saved.updated_by});
  }
  if (path === "/api/activity" && method === "GET") {
    const limit = Math.max(1,Math.min(Number(url.searchParams.get("limit") ?? "30") || 30,100));
    const rows = await dbResult(admin.from("server_audit_events").select("id,action,actor_id,details,created_at").eq("organization_id",org.id).order("created_at",{ascending:false}).limit(limit));
    return responseJson(200,{items:rows});
  }
  if (path === "/api/erp/modules" && method === "GET") {
    return responseJson(200,{modules:Object.keys(ERP_FIELDS).map(key=>({key,label:ERP_LABELS[key],fields:ERP_FIELDS[key],required:ERP_REQUIRED[key]}))});
  }
  if (path === "/api/erp/summary" && method === "GET") {
    const rows = await dbResult(admin.from("erp_business_records").select("collection,record_key,payload,updated_at").eq("organization_id",org.id).order("updated_at",{ascending:false}).limit(5000));
    const counts: Record<string,number> = {};
    for (const key of Object.keys(ERP_FIELDS)) counts[key] = 0;
    for (const row of rows) if (row.collection in counts) counts[row.collection]++;
    const products = rows.filter((r:any)=>r.collection==="products");
    const low = products.filter((r:any)=>Number(r.payload?.quantity ?? 0) <= Number(r.payload?.reorder_level ?? 0));
    const reorderAlerts = low.sort((a:any,b:any)=>(Number(a.payload?.quantity??0)-Number(a.payload?.reorder_level??0))-(Number(b.payload?.quantity??0)-Number(b.payload?.reorder_level??0))).slice(0,6).map((r:any)=>({...r.payload,id:r.record_key,shortage:Math.max(0,Number(r.payload?.reorder_level??0)-Number(r.payload?.quantity??0)),reorder_alert:true}));
    let receivables = 0, payables = 0;
    for (const row of rows.filter((r:any)=>r.collection==="invoices")) {
      const p=row.payload??{}, outstanding=Math.max(0,Number(p.amount??0)-Number(p.paid_amount??0));
      if (!["paid","void","cancelled"].includes(String(p.status??"").toLowerCase())) {
        if (["payable","outgoing","purchase"].includes(String(p.direction??"receivable").toLowerCase())) payables += outstanding; else receivables += outstanding;
      }
    }
    return responseJson(200,{counts,low_stock:low.length,reorder_alerts:reorderAlerts,outstanding_receivables:Math.round(receivables*100)/100,outstanding_payables:Math.round(payables*100)/100,generated_at:nowIso(),synthetic_data_only:true});
  }
  if (path === "/api/erp/search" && method === "GET") {
    const q = (url.searchParams.get("q")??"").trim().toLowerCase();
    const limit = Math.max(1,Math.min(Number(url.searchParams.get("limit")??"20")||20,50));
    if (!q) return responseJson(200,{items:[],count:0});
    const rows = await dbResult(admin.from("erp_business_records").select("*").eq("organization_id",org.id).order("updated_at",{ascending:false}).limit(1000));
    const items = [];
    for (const row of rows) {
      const p=publicRecord(row);
      if (!JSON.stringify(p).toLowerCase().includes(q)) continue;
      const label=p.name||p.company||p.sku||p.subject||p.invoice_number||p.po_number||p.so_number||p.order_number||p.id;
      items.push({id:row.record_key,collection:row.collection,module_label:ERP_LABELS[row.collection],label:String(label),record:p});
      if(items.length>=limit) break;
    }
    return responseJson(200,{items,count:items.length});
  }
  if (path.startsWith("/api/ai/")) {
    if (path === "/api/ai/capabilities" && method === "GET") {
      return responseJson(200,{enabled:true,models:[{id:"tfidf-logistic-regression-synthetic-v1",purpose:"synthetic non-clinical operations-note routing"},{id:"isolation-forest-v1",purpose:"inventory outlier screening"}],libraries:["Python","NumPy","Pandas","scikit-learn"],external_inference:false,clinical_decisioning:false,data_retention:"Triage text is not persisted; audit records include only model and predicted class.",notice:"Synthetic operational data only. Not a diagnostic or treatment model."});
    }
    if (path === "/api/ai/triage" && method === "POST") {
      const payload = await bodyJson(request);
      const text = cleanText(payload.text,"Operations note",4,2000);
      let result: any = null;
      try {
        const resp = await fetch(ML_BASE + "/api/ai/triage-public", {method:"POST",headers:{"content-type":"application/json","x-averis-request":"1"},body:JSON.stringify({text}),signal:AbortSignal.timeout(8000)});
        if (resp.ok) result = await resp.json();
      } catch (e) { console.warn("Python ML inference is temporarily unavailable; using bounded fallback."); }
      if (!result) result = fallbackClassify(text);
      await audit(org.id,user.id,"ai.operational_triage",{category:result.category,priority:result.priority,model:result.model});
      return responseJson(200,result);
    }
    if (path === "/api/ai/inventory/anomalies" && method === "GET") {
      const rows = await dbResult(admin.from("erp_business_records").select("record_key,payload").eq("organization_id",org.id).eq("collection","products").order("updated_at",{ascending:false}).limit(2000));
      const records = rows.map((r:any)=>({id:r.record_key,...(r.payload??{})}));
      let result: any = null;
      try {
        const resp = await fetch(ML_BASE + "/api/ai/inventory/anomalies-public",{method:"POST",headers:{"content-type":"application/json","x-averis-request":"1"},body:JSON.stringify({items:records}),signal:AbortSignal.timeout(12000)});
        if(resp.ok) result=await resp.json();
      } catch (e) { console.warn("Python inventory model unavailable; using statistical fallback."); }
      if(!result) result=fallbackInventory(records);
      return responseJson(200,result);
    }
  }
  const match = path.match(/^\/api\/erp\/([a-z_]+)(?:\/([^/]+))?$/);
  if (match) {
    const collection = match[1];
    const recordKey = match[2] ? decodeURIComponent(match[2]) : "";
    if (!(collection in ERP_FIELDS)) fail(404,"ERP module not found.");
    if (method === "GET" && !recordKey) {
      const q = (url.searchParams.get("q")??"").trim().toLowerCase();
      const statusFilter = (url.searchParams.get("status_filter")??"").trim().toLowerCase();
      const limit = Math.max(1,Math.min(Number(url.searchParams.get("limit")??"100")||100,500));
      const rows = await dbResult(admin.from("erp_business_records").select("*").eq("organization_id",org.id).eq("collection",collection).order("updated_at",{ascending:false}).limit(1000));
      let items = rows.map(publicRecord);
      if (q) items = items.filter((item:any)=>JSON.stringify(item).toLowerCase().includes(q));
      if (statusFilter) items = items.filter((item:any)=>String(item.status??"").toLowerCase()===statusFilter);
      return responseJson(200,{items:items.slice(0,limit),count:items.length,collection,limit});
    }
    if (method === "POST" && !recordKey) {
      const payload = await bodyJson(request);
      const clean = cleanErpPayload(collection,payload);
      if (collection==="products") {
        const rows=await admin.from("erp_business_records").select("record_key,payload").eq("organization_id",org.id).eq("collection","products").limit(1000);
        if(rows.error) fail(500,"Could not validate inventory SKU.");
        if((rows.data??[]).some((r:any)=>String(r.payload?.sku??"").toUpperCase()===String(clean.sku??"").toUpperCase())) fail(409,"A product with this SKU already exists in your organization.");
      }
      const key=routeToken(ERP_PREFIX[collection]);
      clean.id=key;
      const row={id:crypto.randomUUID(),organization_id:org.id,collection,record_key:key,payload:clean,created_at:nowIso(),updated_at:nowIso(),created_by:user.id,updated_by:user.id};
      await dbResult(admin.from("erp_business_records").insert(row).select("*").single());
      await audit(org.id,user.id,"erp.record_created",{collection,record_key:key});
      return responseJson(201,{item:publicRecord(row)});
    }
    if (method === "PUT" && recordKey) {
      const found=await admin.from("erp_business_records").select("*").eq("organization_id",org.id).eq("collection",collection).eq("record_key",recordKey).maybeSingle();
      if(!found.data) fail(404,"ERP record not found.");
      const clean=cleanErpPayload(collection,await bodyJson(request),recordKey);
      if(collection==="products") {
        const rows=await admin.from("erp_business_records").select("record_key,payload").eq("organization_id",org.id).eq("collection","products").limit(1000);
        if(rows.error) fail(500,"Could not validate inventory SKU.");
        if((rows.data??[]).some((r:any)=>r.record_key!==recordKey&&String(r.payload?.sku??"").toUpperCase()===String(clean.sku??"").toUpperCase())) fail(409,"A product with this SKU already exists in your organization.");
      }
      const changed={...found.data,payload:clean,updated_at:nowIso(),updated_by:user.id};
      const saved=await dbResult(admin.from("erp_business_records").update({payload:clean,updated_at:changed.updated_at,updated_by:user.id}).eq("id",found.data.id).eq("organization_id",org.id).select("*").single());
      await audit(org.id,user.id,"erp.record_updated",{collection,record_key:recordKey});
      return responseJson(200,{item:publicRecord(saved)});
    }
    if (method === "DELETE" && recordKey) {
      const found=await admin.from("erp_business_records").select("id").eq("organization_id",org.id).eq("collection",collection).eq("record_key",recordKey).maybeSingle();
      if(!found.data) fail(404,"ERP record not found.");
      const del=await admin.from("erp_business_records").delete().eq("id",found.data.id).eq("organization_id",org.id);
      if(del.error) fail(500,"Could not delete ERP record.");
      await audit(org.id,user.id,"erp.record_deleted",{collection,record_key:recordKey});
      return responseJson(200,{ok:true,id:recordKey,collection});
    }
  }
  fail(404,"API route not found.");
}
function fallbackClassify(text: string) {
  const lower=text.toLowerCase();
  const groups: Record<string,string[]> = {
    inventory:["stock","inventory","replenishment","supplier","reorder","out of stock","pharmacy"],
    scheduling:["schedule","appointment","calendar","slot","reschedule","booking"],
    capacity:["capacity","workload","staff","coverage","utilization","coordinator"],
    workflow:["blocked","handoff","approval","overdue","workflow","queue"],
    communications:["message","email","response","callback","contact","follow up"],
    quality:["quality","audit","verification","inspection","checklist","validation"],
  };
  const scores=Object.fromEntries(Object.entries(groups).map(([k,words])=>[k,words.reduce((n,w)=>n+(lower.includes(w)?1:0),0)])) as Record<string,number>;
  const category=Object.keys(scores).sort((a,b)=>scores[b]-scores[a])[0] || "workflow";
  const priority=/(critical|urgent|immediate|severe|blocked|out of stock)/i.test(text)?"CRITICAL":/(high|delay|late|shortage|overdue|failed)/i.test(text)?"HIGH":"NORMAL";
  return {category,priority,confidence:Math.min(92,55+scores[category]*8),priority_confidence:priority==="CRITICAL"?86:priority==="HIGH"?78:67,recommended_queue:category,signals:groups[category].filter(w=>lower.includes(w)).slice(0,5),model:"keyword-fallback-v1",persisted:false,clinical_decisioning:false,notice:"Operational routing suggestion only; human review required."};
}
function fallbackInventory(records: any[]) {
  const items=records.map((r:any)=>({...r,quantity:Math.max(0,Number(r.quantity??0)),reorder_level:Math.max(0,Number(r.reorder_level??r.minimum??0))}));
  const flagged=items.filter((r:any)=>r.quantity<=r.reorder_level).map((r:any)=>({...r,reorder_risk:true,outlier:false,score:Math.min(100,50+Math.max(0,r.reorder_level-r.quantity)*2),signals:["below_reorder_level"]}));
  return {scanned:items.length,reorder_risk_count:flagged.length,anomaly_count:0,anomalies:flagged.slice(0,50),method:"reorder-threshold fallback (Python ML service unavailable)",clinical_decisioning:false,notice:"Synthetic inventory screening only. Confirm findings before action."};
}
Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  const cors = corsHeaders(origin);
  if (request.method === "OPTIONS") return new Response(null, { status:204, headers:cors });
  try {
    if (!SERVICE_KEY || !SUPABASE_URL) return withCors(responseJson(500,{detail:"Server database configuration is missing."}),origin);
    if (request.url && request.method !== "GET" && request.method !== "OPTIONS") {
      const o = request.headers.get("origin");
      if (o && !ALLOWED_ORIGINS.has(o) && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) {
        return withCors(responseJson(403,{detail:"Origin is not allowed."}),origin);
      }
    }
    return withCors(await handle(request),origin);
  } catch (error) {
    const status = Number((error as any)?.status ?? 500);
    if (status >= 500) console.error("AVERIS API error:", (error as Error)?.name ?? "Error");
    return withCors(responseJson(status,{detail:status>=500?"The request could not be completed.":(error as Error).message}),origin);
  }
});
