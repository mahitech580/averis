/* =========================================================
   AVERIS — application logic (vanilla JS, static/client-only)
   Everything here runs entirely in the browser. No network
   calls, no backend. All persistence is via localStorage.
   ========================================================= */

(() => {
"use strict";

/* ---------------------------------------------------------
   0. STORAGE
--------------------------------------------------------- */
const NS = "averis_";
const store = {
  get(key, fallback){
    try{
      const raw = localStorage.getItem(NS+key);
      return raw === null ? fallback : JSON.parse(raw);
    }catch(e){ return fallback; }
  },
  set(key, value){
    try{ localStorage.setItem(NS+key, JSON.stringify(value)); }catch(e){/* storage full/unavailable */}
  },
  remove(key){ localStorage.removeItem(NS+key); },
  wipeAll(){
    Object.keys(localStorage).filter(k=>k.startsWith(NS)).forEach(k=>localStorage.removeItem(k));
  }
};

/* ---------------------------------------------------------
   1. SYNTHETIC DATA GENERATION
--------------------------------------------------------- */
const FIRST = ["Olivia","Liam","Emma","Noah","Ava","Ethan","Sophia","Mason","Isabella","Lucas","Mia","Elijah","Amelia","James","Harper","Benjamin","Evelyn","Henry","Luna","Alex","Grace","Owen","Chloe","Wyatt","Ella","Jack","Scarlett","Leo","Nora","Sam","Priya","Arjun","Wei","Fatima","Diego","Hana","Kwame","Ingrid","Mateo","Zoe","Aria","Caleb","Nina","Omar","Talia","Ravi","Elena","Dmitri","Sana","Kofi"];
const LAST = ["Bennett","Carter","Diaz","Ellison","Fischer","Grant","Huang","Ibrahim","Jansen","Kapoor","Lindqvist","Moreau","Nakamura","Ortiz","Patel","Quinn","Reyes","Sato","Thompson","Ueda","Vance","Walsh","Xu","Yamamoto","Zimmerman","Alvarez","Boone","Castillo","Dubois","Eriksen"];
const SPECIALTIES = ["Internal Medicine","Family Practice","Cardiology","Endocrinology","Pediatrics","Dermatology","Orthopedics","Psychiatry","Neurology","OB/GYN"];
const LOCATIONS = ["Downtown Clinic","Riverside Campus","North Medical Plaza","Harborview Center","Elmwood Practice"];
const DEPARTMENTS = ["Primary Care","Cardiology","Diagnostics","Behavioral Health","Pediatrics","Orthopedics"];
const APPT_TYPES = ["Check-up","Follow-up","Consultation","Procedure","Screening","Telehealth"];
const APPT_STATUSES = ["Scheduled","Confirmed","Checked In","In Progress","Completed","Cancelled","No Show"];
const CARE_GOALS = ["Follow-up adherence","Medication review reminder","Lifestyle coaching","Diagnostic completion","Post-procedure monitoring"];

function rnd(seed){ return function(){ seed = (seed*9301+49297) % 233280; return seed/233280; }; }
function pick(rng, arr){ return arr[Math.floor(rng()*arr.length)]; }
function pickInt(rng, min, max){ return Math.floor(rng()*(max-min+1))+min; }
function fullName(rng){ return `${pick(rng,FIRST)} ${pick(rng,LAST)}`; }
function initials(name){ return name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase(); }
function pad(n){ return n<10 ? "0"+n : ""+n; }
function daysAgo(n){ const d=new Date(); d.setDate(d.getDate()-n); return d; }
function daysFromNow(n){ const d=new Date(); d.setDate(d.getDate()+n); return d; }
function fmtDate(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function fmtDateShort(d){ return d.toLocaleDateString(undefined,{month:"short",day:"numeric"}); }

function generateProviders(rng){
  const arr=[];
  for(let i=0;i<24;i++){
    const name = "Dr. "+fullName(rng);
    arr.push({
      id:"PR"+(1000+i),
      name, specialty:pick(rng,SPECIALTIES), location:pick(rng,LOCATIONS),
      todayAppts:pickInt(rng,1,11), activePatients:pickInt(rng,18,140), openTasks:pickInt(rng,0,7)
    });
  }
  return arr;
}

function generatePatients(rng, providers){
  const statuses=["Active","Stable","Needs Attention","Critical"];
  const risks=["Low","Medium","High"];
  const arr=[];
  for(let i=0;i<128;i++){
    const name = fullName(rng);
    const prov = pick(rng, providers);
    const lastVisit = daysAgo(pickInt(rng,1,190));
    const hasNext = rng() > 0.35;
    arr.push({
      id:"AV-"+(20400+i),
      name, age:pickInt(rng,4,89), gender:pick(rng,["Female","Male","Other"]),
      providerId:prov.id, provider:prov.name,
      lastVisit: fmtDate(lastVisit),
      nextAppt: hasNext ? fmtDate(daysFromNow(pickInt(rng,-2,30))) : null,
      status: pick(rng,statuses),
      risk: pick(rng,risks),
      attendanceRate: pickInt(rng,55,99),
      priorCancellations: pickInt(rng,0,4),
      archived:false
    });
  }
  return arr;
}

function generateAppointments(rng, patients, providers){
  const arr=[];
  for(let i=0;i<160;i++){
    const p = pick(rng,patients);
    const prov = providers.find(x=>x.id===p.providerId) || pick(rng,providers);
    const offset = pickInt(rng,-10,14);
    const date = offset<0 ? daysAgo(-offset) : daysFromNow(offset);
    const hour = pickInt(rng,8,17);
    const status = offset<0
      ? pick(rng,["Completed","Completed","Completed","No Show","Cancelled"])
      : pick(rng,["Scheduled","Confirmed","Confirmed"]);
    arr.push({
      id:"AP"+(5000+i),
      patientId:p.id, patientName:p.name,
      providerId:prov.id, providerName:prov.name,
      department:pick(rng,DEPARTMENTS),
      date: fmtDate(date), time:`${pad(hour)}:${pick(rng,["00","15","30","45"])}`,
      duration:pick(rng,[15,20,30,45,60]),
      type:pick(rng,APPT_TYPES), status, notes:""
    });
  }
  return arr;
}

function generateTasks(rng, patients){
  const arr=[]; const assignees=["Jordan P.","Sam R.","Casey L.","Morgan T.","You"];
  for(let i=0;i<42;i++){
    const p = pick(rng,patients);
    arr.push({
      id:"TSK"+(700+i),
      title: pick(rng,["Review lab results","Confirm insurance","Call for follow-up","Update care plan","Prep discharge summary","Verify medication list","Schedule screening"]),
      patient:p.name, assignee:pick(rng,assignees),
      priority:pick(rng,["Low","Medium","High","Urgent"]),
      dueDate: fmtDate(daysFromNow(pickInt(rng,-3,10))),
      status: pick(rng,["To Do","To Do","In Progress","Completed"])
    });
  }
  return arr;
}

function generateCareCards(rng, patients){
  const stages=["New","Assigned","In Progress","Waiting","Resolved"];
  const arr=[];
  for(let i=0;i<26;i++){
    const p=pick(rng,patients);
    arr.push({
      id:"CC"+(300+i), patient:p.name,
      issue: pick(rng,["Overdue follow-up","Unresolved lab query","Care plan review due","Discharge coordination","Referral pending","Medication reconciliation"]),
      stage: pick(rng,stages)
    });
  }
  return arr;
}

function generateNotifications(rng){
  const templates=[
    ["Appointment confirmed","Maria confirmed her 2:30 PM visit."],
    ["New task assigned","You were assigned a follow-up call."],
    ["Follow-up overdue","A care plan follow-up is 6 days overdue."],
    ["New message","You have a new message from a colleague."],
    ["Provider schedule conflict","Two appointments overlap for Dr. Huang."],
    ["Analytics alert","No-show rate rose 4pts this week."]
  ];
  return templates.map((t,i)=>({id:"N"+i, title:t[0], body:t[1], time:`${pickInt(rnd(i+1),1,10)}h ago`, unread:i<4}));
}

function generateMessages(rng){
  const people=["Dr. Huang","Dr. Patel","Front Desk — Riverside","Casey (Care Coord.)","Dr. Moreau"];
  return people.map((p,i)=>({
    id:"C"+i, name:p, unread: i<2 ? pickInt(rng,1,3):0,
    messages:[
      {from:"them", text:"Can you confirm the 3pm slot is still open?", time:"9:14 AM"},
      {from:"me", text:"Yes — holding it for the Reyes follow-up.", time:"9:16 AM"},
      {from:"them", text:"Great, sending the referral now.", time:"9:20 AM"}
    ]
  }));
}

function seedData(){
  const rng = rnd(42);
  const providers = generateProviders(rng);
  const patients = generatePatients(rng, providers);
  const appointments = generateAppointments(rng, patients, providers);
  const tasks = generateTasks(rng, patients);
  const careCards = generateCareCards(rng, patients);
  const notifications = generateNotifications(rng);
  const messages = generateMessages(rng);
  store.set("providers", providers);
  store.set("patients", patients);
  store.set("appointments", appointments);
  store.set("tasks", tasks);
  store.set("careCards", careCards);
  store.set("notifications", notifications);
  store.set("messages", messages);
}

function ensureData(){
  if(!store.get("patients")) seedData();
}

/* ---------------------------------------------------------
   2. STATE
--------------------------------------------------------- */
const state = {
  patients:[], providers:[], appointments:[], tasks:[], careCards:[], notifications:[], messages:[],
  view:"overview", role:"Organization Admin",
  patientsPage:1, patientsPageSize:8, patientsSort:{key:"name",dir:1}, patientsFilter:"", patientsStatus:"all",
  tasksFilter:"all", tasksSearch:"",
  analyticsTab:"Operations",
  activeConvo:0
};

function loadState(){
  state.patients = store.get("patients",[]);
  state.providers = store.get("providers",[]);
  state.appointments = store.get("appointments",[]);
  state.tasks = store.get("tasks",[]);
  state.careCards = store.get("careCards",[]);
  state.notifications = store.get("notifications",[]);
  state.messages = store.get("messages",[]);
  state.role = store.get("role","Organization Admin");
}
function persist(key){ store.set(key, state[key]); }

/* ---------------------------------------------------------
   3. UTIL: toasts, icons, DOM helpers
--------------------------------------------------------- */
function el(html){ const t=document.createElement("template"); t.innerHTML=html.trim(); return t.content.firstChild; }
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return [...root.querySelectorAll(sel)]; }

function toast(msg, type="default"){
  const host = $("#toastHost");
  const icon = type==="success" ? "✓" : type==="error" ? "!" : "•";
  const node = el(`<div class="toast"><span class="dot" style="color:${type==='error'?'var(--danger)':'var(--accent)'}">${icon}</span><span>${msg}</span></div>`);
  host.appendChild(node);
  setTimeout(()=>{ node.classList.add("out"); setTimeout(()=>node.remove(),260); }, 3000);
}

const ICONS = {
  overview:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>`,
  patients:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.6-3.6 3-5.6 5.5-5.6s4.9 2 5.5 5.6"/><circle cx="17.5" cy="7.5" r="2.3"/><path d="M15 20c.4-2.6 1.9-4.2 3.6-4.6"/></svg>`,
  appointments:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v3M16 3v3"/><path d="M8 14l2 2 4-4"/></svg>`,
  carehub:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s-7.2-4.4-9.8-9C.6 8.4 2.4 4.6 6 4c2.3-.4 4.3.8 6 2.9C13.7 4.8 15.7 3.6 18 4c3.6.6 5.4 4.4 3.8 8-2.6 4.6-9.8 9-9.8 9z"/></svg>`,
  providers:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3v6M9 6h6"/><circle cx="12" cy="14" r="7"/></svg>`,
  messages:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5h16v11H8l-4 4V5z"/></svg>`,
  tasks:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 12l2.5 2.5L16 9"/></svg>`,
  analytics:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>`,
  ai:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>`,
  settings:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 000-2l2-1.5-2-3.4-2.4.7a7.6 7.6 0 00-1.7-1L14.8 3H9.2l-.5 2.8a7.6 7.6 0 00-1.7 1l-2.4-.7-2 3.4L4.6 11a7.6 7.6 0 000 2l-2 1.5 2 3.4 2.4-.7a7.6 7.6 0 001.7 1l.5 2.8h5.6l.5-2.8a7.6 7.6 0 001.7-1l2.4.7 2-3.4z"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
  bell:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 004 0"/></svg>`,
  moon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z"/></svg>`,
  sun:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>`,
  plus:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  menu:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`
};

/* ---------------------------------------------------------
   4. CHART HELPERS (inline SVG, animated entrance)
--------------------------------------------------------- */
function lineChart(values, {w=520,h=180,color="var(--accent)",fill=true}={}){
  const max = Math.max(...values)*1.15, min = Math.min(0,Math.min(...values));
  const stepX = w/(values.length-1);
  const pts = values.map((v,i)=>[i*stepX, h - ((v-min)/(max-min||1))*h]);
  const path = pts.map((p,i)=>(i===0?"M":"L")+p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
  const area = path + ` L${w},${h} L0,${h} Z`;
  const gid = "g"+Math.random().toString(36).slice(2,8);
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="anim-chart">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    ${fill?`<path d="${area}" fill="url(#${gid})" stroke="none"/>`:""}
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="draw-path"/>
  </svg>`;
}
function barChart(values, labels, {w=520,h=180,color="var(--accent)"}={}){
  const max = Math.max(...values)*1.15 || 1;
  const bw = w/values.length*0.55, gap = w/values.length;
  const bars = values.map((v,i)=>{
    const bh = (v/max)*h;
    return `<rect x="${(i*gap+(gap-bw)/2).toFixed(1)}" y="${(h-bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="4" fill="${color}" class="bar-grow" style="--bh:${bh.toFixed(1)}px"/>`;
  }).join("");
  return `<svg viewBox="0 0 ${w} ${h+18}" preserveAspectRatio="none" class="anim-chart">${bars}
    ${labels?labels.map((l,i)=>`<text x="${(i*gap+gap/2).toFixed(1)}" y="${h+14}" font-size="9" fill="var(--text-faint)" text-anchor="middle">${l}</text>`).join(""):""}
  </svg>`;
}
function animateCharts(root){
  $all(".draw-path", root).forEach(p=>{
    const len = p.getTotalLength ? p.getTotalLength() : 400;
    p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
    requestAnimationFrame(()=>{ p.style.transition="stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)"; p.style.strokeDashoffset=0; });
  });
  $all(".bar-grow", root).forEach((b,i)=>{
    const full = b.getAttribute("height");
    b.setAttribute("height",0); b.setAttribute("y", (+b.getAttribute("y")+ +full));
    setTimeout(()=>{
      b.style.transition="height .6s cubic-bezier(.22,1,.36,1), y .6s cubic-bezier(.22,1,.36,1)";
      b.setAttribute("height", full);
      b.setAttribute("y", +b.getAttribute("y") - +full);
    }, 30+i*25);
  });
}
function animateCount(node, to, {decimals=0, suffix=""}={}){
  const from = 0, dur=900, start=performance.now();
  function step(t){
    const p = Math.min(1,(t-start)/dur); const eased = 1-Math.pow(1-p,3);
    node.textContent = (from+(to-from)*eased).toFixed(decimals)+suffix;
    if(p<1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------------------------------------------------------
   5. ML DEMO MODELS (deterministic, transparent)
--------------------------------------------------------- */
function noShowRisk({attendanceRate, dayOfWeek, leadTimeDays, priorCancellations}){
  let score = (100-attendanceRate)*0.5;
  score += (dayOfWeek==="Monday"||dayOfWeek==="Friday") ? 8 : 0;
  score += Math.min(leadTimeDays*0.9, 18);
  score += priorCancellations*6;
  score = Math.max(2, Math.min(96, score));
  const level = score<30?"Low Risk":score<60?"Medium Risk":"High Risk";
  return {score:Math.round(score), level};
}
function followUpPriority({daysSinceContact, openTasks, hasUpcoming, planProgress}){
  let score = Math.min(daysSinceContact*2.2, 55);
  score += openTasks*7;
  score += hasUpcoming ? -10 : 12;
  score += (100-planProgress)*0.2;
  score = Math.max(3, Math.min(98, score));
  return Math.round(score);
}
function providerWorkloadLevel(p){
  const load = p.todayAppts*3 + p.activePatients*0.35 + p.openTasks*4;
  if(load>85) return "Overloaded";
  if(load>55) return "Busy";
  return "Normal";
}

/* ---------------------------------------------------------
   6. AI INSIGHTS ENGINE (deterministic, data-grounded)
--------------------------------------------------------- */
function computeMetrics(){
  const appts = state.appointments;
  const past = appts.filter(a=>new Date(a.date) <= new Date());
  const noShows = past.filter(a=>a.status==="No Show").length;
  const noShowRate = past.length ? Math.round((noShows/past.length)*100) : 0;
  const overloaded = state.providers.filter(p=>providerWorkloadLevel(p)==="Overloaded");
  const busy = state.providers.filter(p=>providerWorkloadLevel(p)==="Busy");
  const openCare = state.careCards.filter(c=>c.stage!=="Resolved");
  const overdueFollowups = openCare.filter(c=>c.issue.toLowerCase().includes("overdue"));
  const byDept = {};
  appts.forEach(a=>{ byDept[a.department] = byDept[a.department]||{total:0,noshow:0}; byDept[a.department].total++; if(a.status==="No Show") byDept[a.department].noshow++; });
  let worstDept = null, worstRate = -1;
  Object.entries(byDept).forEach(([d,v])=>{ const r=v.total?v.noshow/v.total:0; if(r>worstRate){worstRate=r; worstDept=d;} });
  const thisWeek = appts.filter(a=>{ const d=new Date(a.date); const now=new Date(); const diff=(now-d)/86400000; return diff>=0 && diff<7; }).length;
  const lastWeek = appts.filter(a=>{ const d=new Date(a.date); const now=new Date(); const diff=(now-d)/86400000; return diff>=7 && diff<14; }).length;
  return { noShowRate, overloaded, busy, overdueFollowups, worstDept, worstRate:Math.round(worstRate*100), thisWeek, lastWeek };
}

function aiRespond(question){
  const q = question.toLowerCase();
  const m = computeMetrics();
  let answer, action, confidence;
  if(q.includes("decline") || q.includes("appointments this week") || q.includes("volume")){
    const delta = m.thisWeek - m.lastWeek;
    answer = `Scheduled appointment volume is ${delta>=0?"up":"down"} ${Math.abs(delta)} visits versus last week (${m.thisWeek} vs ${m.lastWeek}). ${delta<0?"The drop lines up with a rise in cancellations and a higher no-show rate.":"Volume held steady across most departments."}`;
    action = delta<0 ? "Send a reminder pass to patients with appointments in the next 3 days to recover at-risk slots." : "No action needed — monitor next week's intake.";
    confidence = 78;
  } else if(q.includes("overload") || q.includes("provider")){
    answer = m.overloaded.length
      ? `${m.overloaded.length} provider${m.overloaded.length>1?"s are":" is"} currently flagged Overloaded: ${m.overloaded.map(p=>p.name).join(", ")}. ${m.busy.length} more are running Busy.`
      : `No providers are currently Overloaded. ${m.busy.length} are running Busy and worth watching.`;
    action = m.overloaded.length ? "Rebalance same-day bookings toward providers marked Normal for the rest of the week." : "Keep current scheduling distribution.";
    confidence = 84;
  } else if(q.includes("follow-up") || q.includes("followup") || q.includes("attention")){
    answer = `${m.overdueFollowups.length} follow-ups are marked overdue in Care Hub, out of ${state.careCards.filter(c=>c.stage!=='Resolved').length} open coordination items.`;
    action = "Assign the oldest overdue items to a care coordinator today to prevent further slippage.";
    confidence = 81;
  } else if(q.includes("no-show") || q.includes("no show") || q.includes("department")){
    answer = m.worstDept
      ? `${m.worstDept} has the highest no-show rate at roughly ${m.worstRate}%, against an overall rate of ${m.noShowRate}%.`
      : `Overall no-show rate is currently ${m.noShowRate}%.`;
    action = "Add a same-day SMS reminder for that department's afternoon slots.";
    confidence = 73;
  } else {
    answer = `Here's a snapshot: overall no-show rate is ${m.noShowRate}%, ${m.overloaded.length} provider(s) are Overloaded, and ${m.overdueFollowups.length} follow-ups are overdue.`;
    action = "Ask me about a specific area — providers, follow-ups, no-shows, or weekly volume — for a focused read.";
    confidence = 66;
  }
  return {answer, action, confidence, metrics:m};
}

/* ---------------------------------------------------------
   7. AUTH
--------------------------------------------------------- */
const DEMO_EMAIL = "admin@averis.demo", DEMO_PASS = "averis123";

function currentSession(){ return store.get("session", null); }
function setSession(s){ store.set("session", s); }

function tryLogin(email, pass){
  if(email.toLowerCase()===DEMO_EMAIL && pass===DEMO_PASS){
    setSession({email, name:"Alex Rivera", org:"Averis Demo Health Network", role:"Organization Admin"});
    return true;
  }
  const users = store.get("users", {});
  const u = users[email.toLowerCase()];
  if(u && u.password===pass){
    setSession({email, name:u.name, org:u.org, role:"Organization Admin"});
    return true;
  }
  return false;
}
function signup({name,email,org,orgType,password}){
  const users = store.get("users", {});
  users[email.toLowerCase()] = {name,email,org,orgType,password};
  store.set("users", users);
  setSession({email,name,org,role:"Organization Admin"});
}

/* ---------------------------------------------------------
   8. RENDERING — VIEWS
--------------------------------------------------------- */
const NAV = [
  {id:"overview", label:"Overview"},
  {id:"patients", label:"Patients"},
  {id:"appointments", label:"Appointments"},
  {id:"carehub", label:"Care Hub"},
  {id:"providers", label:"Providers"},
  {id:"messages", label:"Messages"},
  {id:"tasks", label:"Tasks"},
  {id:"analytics", label:"Analytics"},
  {id:"ai", label:"AI Insights"},
  {id:"settings", label:"Settings"}
];
const ROLE_HIDDEN = {
  "Patient": ["providers","analytics","ai"],
  "Receptionist": ["analytics","ai"],
  "Doctor": [],
  "Care Coordinator": [],
  "Organization Admin": []
};

function renderSidebar(){
  const nav = $("#navList"); nav.innerHTML = "";
  const hidden = ROLE_HIDDEN[state.role] || [];
  NAV.filter(n=>!hidden.includes(n.id)).forEach(n=>{
    const item = el(`<div class="nav-item" data-view="${n.id}" tabindex="0" role="button" aria-label="${n.label}">${ICONS[n.id]}<span>${n.label}</span></div>`);
    if(n.id===state.view) item.classList.add("active");
    item.addEventListener("click", ()=>navigate(n.id));
    item.addEventListener("keydown", e=>{ if(e.key==="Enter") navigate(n.id); });
    nav.appendChild(item);
  });
  $("#rolePillLabel").textContent = state.role;
}

function navigate(view){
  state.view = view;
  $all(".view").forEach(v=>v.classList.remove("active"));
  const target = $(`#view-${view}`);
  if(target) target.classList.add("active");
  renderSidebar();
  closeMobileSidebar();
  renderView(view);
  location.hash = view;
}

function renderView(view){
  const fns = {
    overview: renderOverview, patients: renderPatients, appointments: renderAppointments,
    carehub: renderCareHub, providers: renderProviders, messages: renderMessages,
    tasks: renderTasks, analytics: renderAnalytics, ai: renderAI, settings: renderSettings
  };
  if(fns[view]) fns[view]();
  setupReveal();
}

/* ---- Overview ---- */
function renderOverview(){
  const root = $("#view-overview");
  const appts = state.appointments;
  const today = fmtDate(new Date());
  const apptsToday = appts.filter(a=>a.date===today);
  const activePatients = state.patients.filter(p=>!p.archived).length;
  const followUps = state.careCards.filter(c=>c.issue.toLowerCase().includes("overdue")).length;
  const past = appts.filter(a=>new Date(a.date)<=new Date());
  const noShows = past.filter(a=>a.status==="No Show").length;
  const noShowRate = past.length ? Math.round((noShows/past.length)*100) : 0;
  const openCare = state.careCards.filter(c=>c.stage!=="Resolved").length;
  const openTasks = state.tasks.filter(t=>t.status!=="Completed").length;
  const satisfaction = 92;
  const revenue = 184300;

  root.innerHTML = `
    <div class="view-head reveal">
      <div><div class="view-title">Overview</div><div class="view-sub">${state.role} · ${new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</div></div>
      <button class="btn btn-primary" id="qNewAppt">${ICONS.plus}New appointment</button>
    </div>
    <div class="kpi-grid">
      ${kpi("Active Patients", activePatients, "+3.2%","up")}
      ${kpi("Appointments Today", apptsToday.length, "on schedule","up")}
      ${kpi("Follow-ups Due", followUps, followUps>3?"needs review":"on track", followUps>3?"down":"up")}
      ${kpi("No-show Rate", noShowRate+"%", noShowRate>12?"above target":"within target", noShowRate>12?"down":"up")}
      ${kpi("Care Plans Active", openCare, "in motion","up")}
      ${kpi("Open Tasks", openTasks, openTasks>10?"backlog growing":"steady", openTasks>10?"down":"up")}
      ${kpi("Patient Satisfaction", satisfaction+"%", "+1.1%","up")}
      ${kpi("Revenue (MTD)", "$"+revenue.toLocaleString(), "+4.6%","up")}
    </div>
    <div class="dash-grid">
      <div class="card card-pad reveal chart-card">
        <div class="row between"><h3 style="font-size:14px;font-weight:600">Appointment activity</h3><span class="faint" style="font-size:12px">Last 14 days</span></div>
        <div id="apptChart" style="margin-top:14px"></div>
        <div class="legend"><span><span class="swatch" style="background:var(--accent)"></span>Completed</span><span><span class="swatch" style="background:var(--amber)"></span>No-show / cancelled</span></div>
      </div>
      <div class="card card-pad reveal">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:12px">Today's flow</h3>
        <ul class="tl" id="todayFlow"></ul>
      </div>
    </div>
    <div class="dash-grid" style="margin-top:16px">
      <div class="card card-pad reveal">
        <div class="row between"><h3 style="font-size:14px;font-weight:600">Patient growth</h3><span class="faint" style="font-size:12px">Rolling 6 months</span></div>
        <div id="growthChart" style="margin-top:14px"></div>
      </div>
      <div class="card card-pad reveal">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:10px">Alerts</h3>
        <div id="alertList"></div>
      </div>
    </div>
  `;
  $("#qNewAppt").addEventListener("click", openNewAppointmentModal);

  const rng = rnd(7);
  const completedSeries = Array.from({length:14},()=>pickInt(rng,14,34));
  const noshowSeries = Array.from({length:14},()=>pickInt(rng,1,7));
  $("#apptChart").innerHTML = lineChart(completedSeries,{color:"var(--accent)"});
  const growthRng = rnd(3);
  const growthSeries = [420,438,451,470,489,activePatients+380];
  $("#growthChart").innerHTML = barChart(growthSeries, ["Apr","May","Jun","Jul","Aug","Sep"], {color:"var(--accent)"});

  const flowItems = apptsToday.slice(0,6).map(a=>`<li><div class="tl-dot"></div><div class="tl-time">${a.time}</div><div class="tl-body"><b>${a.patientName}</b> — ${a.type} with ${a.providerName}</div></li>`).join("")
    || `<li class="faint" style="padding:6px 0">No appointments scheduled for today.</li>`;
  $("#todayFlow").innerHTML = flowItems;

  const alerts = [
    {icon:"⚠", color:"amber", text:`${followUps} overdue follow-ups need outreach`},
    {icon:"◐", color:"teal", text:`${state.careCards.filter(c=>c.issue.includes('outreach')).length || 2} patients flagged for proactive outreach`},
    {icon:"⨯", color:"danger", text:`${Math.max(1,Math.round(apptsToday.length*0.03))} appointment conflicts detected today`},
    {icon:"◻", color:"amber", text:`${openTasks>8?3:1} documentation task(s) pending review`}
  ];
  $("#alertList").innerHTML = alerts.map(a=>`
    <div class="alert-item">
      <div class="alert-icon" style="background:var(--${a.color==='danger'?'danger':a.color==='amber'?'amber':'accent'}-soft);color:var(--${a.color==='danger'?'danger':a.color==='amber'?'amber':'accent'})">${a.icon}</div>
      <div style="font-size:13px">${a.text}</div>
    </div>`).join("");
  animateCharts(root);
  $all(".kpi-value", root).forEach(node=>{
    const raw = node.dataset.raw;
    if(raw && !isNaN(parseFloat(raw))){ /* leave as-is for currency/percent strings */ }
  });
}
function kpi(label,value,delta,dir){
  return `<div class="card kpi reveal">
    <div class="kpi-label"><span>${label}</span></div>
    <div class="kpi-value">${value}</div>
    <div class="kpi-delta ${dir}">${dir==="up"?"▲":"▼"} ${delta}</div>
  </div>`;
}

/* ---- Patients ---- */
function renderPatients(){
  const root = $("#view-patients");
  root.innerHTML = `
    <div class="view-head reveal">
      <div><div class="view-title">Patients</div><div class="view-sub">${state.patients.length} patients across all locations</div></div>
      <div class="row gap-s">
        <button class="btn" id="exportPatients">Export CSV</button>
        <button class="btn btn-primary" id="addPatientBtn">${ICONS.plus}Add patient</button>
      </div>
    </div>
    <div class="toolbar reveal">
      <input class="input" id="patientSearch" placeholder="Search patients..." style="width:240px" value="${state.patientsFilter}"/>
      <select class="select" id="patientStatusFilter">
        <option value="all">All statuses</option>
        <option>Active</option><option>Stable</option><option>Needs Attention</option><option>Critical</option>
      </select>
    </div>
    <div class="table-wrap reveal">
      <table>
        <thead><tr>
          <th data-k="name">Patient</th><th data-k="id">ID</th><th data-k="age">Age</th>
          <th data-k="provider">Provider</th><th data-k="lastVisit">Last Visit</th>
          <th data-k="nextAppt">Next Appointment</th><th data-k="status">Care Status</th><th data-k="risk">Risk</th>
        </tr></thead>
        <tbody id="patientsBody"></tbody>
      </table>
    </div>
    <div class="pagination"><span id="pageInfo"></span>
      <button class="btn btn-sm btn-icon" id="prevPage">‹</button>
      <button class="btn btn-sm btn-icon" id="nextPage">›</button>
    </div>
  `;
  $("#patientSearch").value = state.patientsFilter;
  $("#patientStatusFilter").value = state.patientsStatus;
  $("#patientSearch").addEventListener("input", e=>{ state.patientsFilter=e.target.value; state.patientsPage=1; drawPatientsTable(); });
  $("#patientStatusFilter").addEventListener("change", e=>{ state.patientsStatus=e.target.value; state.patientsPage=1; drawPatientsTable(); });
  $all("thead th", root).forEach(th=>th.addEventListener("click", ()=>{
    const k = th.dataset.k;
    state.patientsSort = state.patientsSort.key===k ? {key:k, dir:-state.patientsSort.dir} : {key:k, dir:1};
    drawPatientsTable();
  }));
  $("#addPatientBtn").addEventListener("click", openAddPatientModal);
  $("#exportPatients").addEventListener("click", ()=>exportCSV("averis_patients.csv", filteredPatients()));
  $("#prevPage").addEventListener("click", ()=>{ if(state.patientsPage>1){state.patientsPage--; drawPatientsTable();} });
  $("#nextPage").addEventListener("click", ()=>{ const total=Math.ceil(filteredPatients().length/state.patientsPageSize); if(state.patientsPage<total){state.patientsPage++; drawPatientsTable();} });
  drawPatientsTable();
}
function filteredPatients(){
  let list = state.patients.filter(p=>!p.archived);
  if(state.patientsFilter) list = list.filter(p=>p.name.toLowerCase().includes(state.patientsFilter.toLowerCase()) || p.id.toLowerCase().includes(state.patientsFilter.toLowerCase()));
  if(state.patientsStatus!=="all") list = list.filter(p=>p.status===state.patientsStatus);
  const {key,dir} = state.patientsSort;
  list = [...list].sort((a,b)=> (a[key]>b[key]?1:a[key]<b[key]?-1:0)*dir);
  return list;
}
function riskBadge(r){ return `<span class="badge badge-${r==='High'?'danger':r==='Medium'?'amber':'teal'}"><span class="dot"></span>${r}</span>`; }
function statusBadge(s){ const cls = s==="Critical"?"danger": s==="Needs Attention"?"amber":"teal"; return `<span class="badge badge-${cls}">${s}</span>`; }
function drawPatientsTable(){
  const list = filteredPatients();
  const total = Math.ceil(list.length/state.patientsPageSize) || 1;
  if(state.patientsPage>total) state.patientsPage=total;
  const slice = list.slice((state.patientsPage-1)*state.patientsPageSize, state.patientsPage*state.patientsPageSize);
  const body = $("#patientsBody");
  body.innerHTML = slice.length ? slice.map(p=>`
    <tr data-id="${p.id}">
      <td><b>${p.name}</b></td><td class="faint">${p.id}</td><td>${p.age}</td>
      <td>${p.provider}</td><td>${p.lastVisit}</td><td>${p.nextAppt||"—"}</td>
      <td>${statusBadge(p.status)}</td><td>${riskBadge(p.risk)}</td>
    </tr>`).join("") : `<tr><td colspan="8"><div class="empty">${ICONS.patients}<div>No patients match your filters.</div></div></td></tr>`;
  $all("tr[data-id]", body).forEach(tr=>tr.addEventListener("click", ()=>openPatientProfile(tr.dataset.id)));
  $("#pageInfo").textContent = `${list.length ? (state.patientsPage-1)*state.patientsPageSize+1 : 0}–${Math.min(state.patientsPage*state.patientsPageSize,list.length)} of ${list.length}`;
}
function openAddPatientModal(){
  openModal("Add patient", `
    <div class="field"><label>Full name</label><input class="input" style="width:100%" id="npName"/></div>
    <div class="field-row">
      <div class="field"><label>Age</label><input class="input" style="width:100%" type="number" id="npAge"/></div>
      <div class="field"><label>Gender</label><select class="select" style="width:100%" id="npGender"><option>Female</option><option>Male</option><option>Other</option></select></div>
    </div>
    <div class="field"><label>Assigned provider</label><select class="select" style="width:100%" id="npProvider">${state.providers.map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}</select></div>
    <div class="field"><label>Care status</label><select class="select" style="width:100%" id="npStatus"><option>Active</option><option>Stable</option><option>Needs Attention</option><option>Critical</option></select></div>
  `, [{label:"Cancel", ghost:true},{label:"Add patient", primary:true, onClick:()=>{
    const name = $("#npName").value.trim();
    if(!name){ toast("Enter a patient name","error"); return false; }
    const prov = state.providers.find(p=>p.id===$("#npProvider").value);
    state.patients.unshift({
      id:"AV-"+(30000+Math.floor(Math.random()*9000)), name, age:+$("#npAge").value||30,
      gender:$("#npGender").value, providerId:prov.id, provider:prov.name,
      lastVisit:fmtDate(new Date()), nextAppt:null, status:$("#npStatus").value, risk:"Low",
      attendanceRate:90, priorCancellations:0, archived:false
    });
    persist("patients"); drawPatientsTable(); toast("Patient added","success");
    return true;
  }}]);
}
function openPatientProfile(id){
  const p = state.patients.find(x=>x.id===id); if(!p) return;
  const apts = state.appointments.filter(a=>a.patientId===id).slice(0,5);
  const tasks = state.tasks.filter(t=>t.patient===p.name);
  const body = `
    <div class="profile-head">
      <div class="profile-avatar">${initials(p.name)}</div>
      <div><div style="font-weight:650;font-size:16px">${p.name}</div><div class="faint" style="font-size:12.5px">${p.id} · ${p.age} yrs · ${p.gender}</div></div>
      <div style="margin-left:auto">${statusBadge(p.status)}</div>
    </div>
    <div class="tabs" id="ppTabs">
      ${["Overview","Timeline","Care Plan","Tasks"].map((t,i)=>`<div class="tab ${i===0?'active':''}" data-t="${t}">${t}</div>`).join("")}
    </div>
    <div id="ppBody"></div>
  `;
  openModal(`Patient profile`, body, [{label:"Close", ghost:true}], {wide:true});
  const panels = {
    Overview: `<div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
      <div><div class="faint" style="font-size:11.5px">Provider</div><div>${p.provider}</div></div>
      <div><div class="faint" style="font-size:11.5px">Risk</div>${riskBadge(p.risk)}</div>
      <div><div class="faint" style="font-size:11.5px">Last visit</div><div>${p.lastVisit}</div></div>
      <div><div class="faint" style="font-size:11.5px">Next appointment</div><div>${p.nextAppt||"Not scheduled"}</div></div>
    </div>`,
    Timeline: `<ul class="tl">${apts.map(a=>`<li><div class="tl-dot"></div><div class="tl-time">${a.date}</div><div class="tl-body"><b>${a.type}</b> with ${a.providerName} — ${a.status}</div></li>`).join("") || '<li class="faint">No recorded activity.</li>'}</ul>`,
    "Care Plan": `<div style="font-size:13px">
      <p style="margin-bottom:10px"><b>Goal:</b> ${pick(rnd(id.length),CARE_GOALS)}</p>
      <div class="row between" style="margin-bottom:4px"><span class="faint" style="font-size:12px">Progress</span><span class="faint" style="font-size:12px">${p.attendanceRate}%</span></div>
      <div class="pbar"><div style="width:${p.attendanceRate}%"></div></div>
      <p class="faint" style="margin-top:12px;font-size:12px">This demonstration does not generate autonomous treatment recommendations.</p>
    </div>`,
    Tasks: tasks.length ? `<ul class="tl">${tasks.map(t=>`<li><div class="tl-dot"></div><div class="tl-time">${t.dueDate}</div><div class="tl-body"><b>${t.title}</b> — ${t.status}</div></li>`).join("")}</ul>` : `<div class="empty">${ICONS.tasks}<div>No open tasks for this patient.</div></div>`
  };
  $("#ppBody").innerHTML = panels.Overview;
  $all(".tab", $("#ppTabs")).forEach(tab=>tab.addEventListener("click", ()=>{
    $all(".tab", $("#ppTabs")).forEach(t=>t.classList.remove("active")); tab.classList.add("active");
    $("#ppBody").innerHTML = panels[tab.dataset.t];
  }));
}

/* ---- Appointments ---- */
function renderAppointments(){
  const root = $("#view-appointments");
  const today = fmtDate(new Date());
  root.innerHTML = `
    <div class="view-head reveal">
      <div><div class="view-title">Appointments</div><div class="view-sub">${state.appointments.filter(a=>a.date===today).length} scheduled today</div></div>
      <button class="btn btn-primary" id="newApptBtn">${ICONS.plus}New appointment</button>
    </div>
    <div class="toolbar reveal">
      <select class="select" id="apptStatusFilter"><option value="all">All statuses</option>${APPT_STATUSES.map(s=>`<option>${s}</option>`).join("")}</select>
      <select class="select" id="apptRangeFilter"><option value="today">Today</option><option value="week">This week</option><option value="all">All upcoming</option></select>
    </div>
    <div class="table-wrap reveal">
      <table><thead><tr><th>Patient</th><th>Provider</th><th>Department</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th></tr></thead>
      <tbody id="apptBody"></tbody></table>
    </div>
  `;
  $("#newApptBtn").addEventListener("click", openNewAppointmentModal);
  $("#apptStatusFilter").addEventListener("change", drawAppts);
  $("#apptRangeFilter").addEventListener("change", drawAppts);
  drawAppts();
}
function drawAppts(){
  const statusF = $("#apptStatusFilter")?.value || "all";
  const rangeF = $("#apptRangeFilter")?.value || "today";
  const today = new Date(); const todayStr = fmtDate(today);
  let list = [...state.appointments];
  if(rangeF==="today") list = list.filter(a=>a.date===todayStr);
  else if(rangeF==="week") list = list.filter(a=>{ const d=new Date(a.date); const diff=(d-today)/86400000; return diff>=0 && diff<7; });
  if(statusF!=="all") list = list.filter(a=>a.status===statusF);
  list.sort((a,b)=> a.date===b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date));
  const statusColor = s=>({"Completed":"teal","Confirmed":"teal","Scheduled":"neutral","Checked In":"teal","In Progress":"amber","Cancelled":"danger","No Show":"danger"}[s]||"neutral");
  $("#apptBody").innerHTML = list.length ? list.slice(0,60).map(a=>`
    <tr><td><b>${a.patientName}</b></td><td>${a.providerName}</td><td>${a.department}</td><td>${a.date}</td><td>${a.time}</td><td>${a.type}</td>
    <td><span class="badge badge-${statusColor(a.status)}">${a.status}</span></td></tr>`).join("")
    : `<tr><td colspan="7"><div class="empty">${ICONS.appointments}<div>No appointments in this range.</div></div></td></tr>`;
}
function openNewAppointmentModal(){
  openModal("New appointment", `
    <div class="auth-error" id="conflictBox">Scheduling conflict detected — this provider already has an appointment at that time.</div>
    <div class="field"><label>Patient</label><select class="select" style="width:100%" id="naPatient">${state.patients.slice(0,60).map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}</select></div>
    <div class="field-row">
      <div class="field"><label>Provider</label><select class="select" style="width:100%" id="naProvider">${state.providers.map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}</select></div>
      <div class="field"><label>Department</label><select class="select" style="width:100%" id="naDept">${DEPARTMENTS.map(d=>`<option>${d}</option>`).join("")}</select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Date</label><input class="input" style="width:100%" type="date" id="naDate" value="${fmtDate(new Date())}"/></div>
      <div class="field"><label>Time</label><input class="input" style="width:100%" type="time" id="naTime" value="09:00"/></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Duration (min)</label><select class="select" style="width:100%" id="naDur"><option>15</option><option>20</option><option selected>30</option><option>45</option><option>60</option></select></div>
      <div class="field"><label>Type</label><select class="select" style="width:100%" id="naType">${APPT_TYPES.map(t=>`<option>${t}</option>`).join("")}</select></div>
    </div>
    <div class="field"><label>Notes</label><input class="input" style="width:100%" id="naNotes" placeholder="Optional"/></div>
  `, [{label:"Cancel", ghost:true},{label:"Create appointment", primary:true, onClick:()=>{
    const providerId = $("#naProvider").value, date=$("#naDate").value, time=$("#naTime").value.slice(0,5);
    const conflict = state.appointments.some(a=>a.providerId===providerId && a.date===date && a.time===time && a.status!=="Cancelled");
    if(conflict){ $("#conflictBox").style.display="block"; return false; }
    const patient = state.patients.find(p=>p.id===$("#naPatient").value);
    const provider = state.providers.find(p=>p.id===providerId);
    state.appointments.unshift({
      id:"AP"+Math.floor(Math.random()*90000), patientId:patient.id, patientName:patient.name,
      providerId, providerName:provider.name, department:$("#naDept").value, date, time,
      duration:+$("#naDur").value, type:$("#naType").value, status:"Scheduled", notes:$("#naNotes").value
    });
    persist("appointments");
    toast("Appointment created","success");
    if(state.view==="appointments") drawAppts();
    return true;
  }}]);
}

/* ---- Care Hub ---- */
function renderCareHub(){
  const root = $("#view-carehub");
  const stages = ["New","Assigned","In Progress","Waiting","Resolved"];
  root.innerHTML = `
    <div class="view-head reveal">
      <div><div class="view-title">Care Hub</div><div class="view-sub">Coordination workspace — drag cards between stages</div></div>
    </div>
    <div class="kanban reveal">
      ${stages.map(s=>`<div class="kanban-col" data-stage="${s}"><h4>${s}<span>${state.careCards.filter(c=>c.stage===s).length}</span></h4><div class="kcol-body"></div></div>`).join("")}
    </div>
  `;
  drawKanban();
}
function drawKanban(){
  const stages = ["New","Assigned","In Progress","Waiting","Resolved"];
  stages.forEach(s=>{
    const col = $(`.kanban-col[data-stage="${s}"] .kcol-body`);
    const cards = state.careCards.filter(c=>c.stage===s);
    col.innerHTML = cards.map(c=>`<div class="kcard" draggable="true" data-id="${c.id}"><b>${c.patient}</b><p>${c.issue}</p></div>`).join("");
  });
  $(".kanban-col h4 + span");
  $all(".kanban-col h4 span").forEach((s,i)=>{ s.textContent = state.careCards.filter(c=>c.stage===stages[i]).length; });
  $all(".kcard").forEach(card=>{
    card.addEventListener("dragstart", e=>{ card.classList.add("dragging"); e.dataTransfer.setData("text/plain", card.dataset.id); });
    card.addEventListener("dragend", ()=>card.classList.remove("dragging"));
  });
  $all(".kanban-col").forEach(col=>{
    col.addEventListener("dragover", e=>{ e.preventDefault(); col.classList.add("dragover"); });
    col.addEventListener("dragleave", ()=>col.classList.remove("dragover"));
    col.addEventListener("drop", e=>{
      e.preventDefault(); col.classList.remove("dragover");
      const id = e.dataTransfer.getData("text/plain");
      const card = state.careCards.find(c=>c.id===id);
      if(card){ card.stage = col.dataset.stage; persist("careCards"); toast(`Moved to ${card.stage}`); renderCareHub(); }
    });
  });
}

/* ---- Providers ---- */
function renderProviders(){
  const root = $("#view-providers");
  root.innerHTML = `
    <div class="view-head reveal">
      <div><div class="view-title">Providers</div><div class="view-sub">${state.providers.length} providers across ${LOCATIONS.length} locations</div></div>
    </div>
    <div class="table-wrap reveal"><table>
      <thead><tr><th>Provider</th><th>Specialty</th><th>Location</th><th>Today</th><th>Active Patients</th><th>Workload</th></tr></thead>
      <tbody id="provBody"></tbody>
    </table></div>
  `;
  $("#provBody").innerHTML = state.providers.map(p=>{
    const wl = providerWorkloadLevel(p);
    return `<tr data-id="${p.id}"><td><b>${p.name}</b></td><td>${p.specialty}</td><td>${p.location}</td><td>${p.todayAppts}</td><td>${p.activePatients}</td>
    <td><span class="badge badge-${wl==='Overloaded'?'danger':wl==='Busy'?'amber':'teal'}">${wl}</span></td></tr>`;
  }).join("");
  $all("#provBody tr").forEach(tr=>tr.addEventListener("click", ()=>openProviderModal(tr.dataset.id)));
}
function openProviderModal(id){
  const p = state.providers.find(x=>x.id===id); if(!p) return;
  const upcoming = state.appointments.filter(a=>a.providerId===id && new Date(a.date)>=new Date()).slice(0,5);
  openModal(p.name, `
    <div class="row gap-m" style="margin-bottom:14px">
      <div class="profile-avatar">${initials(p.name)}</div>
      <div><div style="font-weight:600">${p.specialty}</div><div class="faint" style="font-size:12.5px">${p.location}</div></div>
    </div>
    <div class="grid" style="grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
      <div class="card card-pad"><div class="faint" style="font-size:11px">Today</div><div style="font-size:18px;font-weight:650">${p.todayAppts}</div></div>
      <div class="card card-pad"><div class="faint" style="font-size:11px">Active patients</div><div style="font-size:18px;font-weight:650">${p.activePatients}</div></div>
      <div class="card card-pad"><div class="faint" style="font-size:11px">Open tasks</div><div style="font-size:18px;font-weight:650">${p.openTasks}</div></div>
    </div>
    <h4 style="font-size:13px;margin-bottom:8px">Upcoming appointments</h4>
    <ul class="tl">${upcoming.map(a=>`<li><div class="tl-dot"></div><div class="tl-time">${a.date}</div><div class="tl-body">${a.patientName} — ${a.type}</div></li>`).join("") || '<li class="faint">Nothing scheduled.</li>'}</ul>
  `, [{label:"Close", ghost:true}]);
}

/* ---- Messages ---- */
function renderMessages(){
  const root = $("#view-messages");
  root.innerHTML = `
    <div class="view-head reveal"><div><div class="view-title">Messages</div><div class="view-sub">Secure care-team collaboration</div></div></div>
    <div class="msg-shell reveal">
      <div class="conv-list" id="convList"></div>
      <div class="thread" id="threadPane"></div>
    </div>
  `;
  drawConvList(); drawThread();
}
function drawConvList(){
  $("#convList").innerHTML = state.messages.map((c,i)=>`
    <div class="conv-item ${i===state.activeConvo?'active':''}" data-i="${i}">
      <div class="profile-avatar" style="width:34px;height:34px;font-size:11px">${initials(c.name)}</div>
      <div style="flex:1;min-width:0"><div class="n">${c.name}</div><div class="p">${c.messages[c.messages.length-1].text}</div></div>
      ${c.unread ? `<div class="unread-dot"></div>` : ""}
    </div>`).join("");
  $all("#convList .conv-item").forEach(item=>item.addEventListener("click", ()=>{
    state.activeConvo = +item.dataset.i; state.messages[state.activeConvo].unread=0;
    persist("messages"); drawConvList(); drawThread();
  }));
}
function drawThread(){
  const c = state.messages[state.activeConvo];
  const pane = $("#threadPane");
  pane.innerHTML = `
    <div class="thread-head">${c.name}</div>
    <div class="thread-body" id="threadBody">${c.messages.map(m=>`<div class="bubble ${m.from==='me'?'me':'them'}">${m.text}</div>`).join("")}</div>
    <div class="thread-input"><input class="input" id="threadInput" placeholder="Write a message..."/><button class="btn btn-primary" id="threadSend">Send</button></div>
  `;
  const body = $("#threadBody"); body.scrollTop = body.scrollHeight;
  const send = ()=>{
    const val = $("#threadInput").value.trim(); if(!val) return;
    c.messages.push({from:"me", text:val, time:"now"}); persist("messages");
    $("#threadInput").value=""; drawThread(); drawConvList();
    setTimeout(()=>{
      c.messages.push({from:"them", text:"Got it — thanks for the update.", time:"now"});
      persist("messages"); if(state.view==="messages") { drawThread(); }
    }, 1100);
  };
  $("#threadSend").addEventListener("click", send);
  $("#threadInput").addEventListener("keydown", e=>{ if(e.key==="Enter") send(); });
}

/* ---- Tasks ---- */
function renderTasks(){
  const root = $("#view-tasks");
  root.innerHTML = `
    <div class="view-head reveal">
      <div><div class="view-title">Tasks</div><div class="view-sub">${state.tasks.filter(t=>t.status!=='Completed').length} open</div></div>
      <button class="btn btn-primary" id="addTaskBtn">${ICONS.plus}New task</button>
    </div>
    <div class="toolbar reveal">
      <input class="input" id="taskSearch" placeholder="Search tasks..." style="width:220px"/>
      <select class="select" id="taskFilter"><option value="all">All statuses</option><option>To Do</option><option>In Progress</option><option>Completed</option></select>
    </div>
    <div class="table-wrap reveal"><table>
      <thead><tr><th></th><th>Title</th><th>Patient</th><th>Assignee</th><th>Priority</th><th>Due</th><th>Status</th></tr></thead>
      <tbody id="taskBody"></tbody>
    </table></div>
  `;
  $("#addTaskBtn").addEventListener("click", openAddTaskModal);
  $("#taskSearch").addEventListener("input", e=>{ state.tasksSearch=e.target.value; drawTasks(); });
  $("#taskFilter").addEventListener("change", e=>{ state.tasksFilter=e.target.value; drawTasks(); });
  drawTasks();
}
function drawTasks(){
  let list = [...state.tasks];
  if(state.tasksSearch) list = list.filter(t=>t.title.toLowerCase().includes(state.tasksSearch.toLowerCase()) || t.patient.toLowerCase().includes(state.tasksSearch.toLowerCase()));
  if(state.tasksFilter && state.tasksFilter!=="all") list = list.filter(t=>t.status===state.tasksFilter);
  const prColor = p=>({"Urgent":"danger","High":"amber","Medium":"neutral","Low":"teal"}[p]);
  $("#taskBody").innerHTML = list.length ? list.map(t=>`
    <tr data-id="${t.id}">
      <td><input type="checkbox" ${t.status==='Completed'?'checked':''} data-check="${t.id}"/></td>
      <td style="${t.status==='Completed'?'text-decoration:line-through;color:var(--text-faint)':''}">${t.title}</td>
      <td>${t.patient}</td><td>${t.assignee}</td>
      <td><span class="badge badge-${prColor(t.priority)}">${t.priority}</span></td>
      <td>${t.dueDate}</td><td class="faint">${t.status}</td>
    </tr>`).join("") : `<tr><td colspan="7"><div class="empty">${ICONS.tasks}<div>No tasks match.</div></div></td></tr>`;
  $all("[data-check]").forEach(cb=>cb.addEventListener("change", e=>{
    const t = state.tasks.find(x=>x.id===e.target.dataset.check);
    t.status = e.target.checked ? "Completed" : "To Do";
    persist("tasks"); drawTasks(); toast(e.target.checked?"Task completed":"Task reopened");
  }));
}
function openAddTaskModal(){
  openModal("New task", `
    <div class="field"><label>Title</label><input class="input" style="width:100%" id="ntTitle"/></div>
    <div class="field"><label>Patient</label><select class="select" style="width:100%" id="ntPatient">${state.patients.slice(0,60).map(p=>`<option>${p.name}</option>`).join("")}</select></div>
    <div class="field-row">
      <div class="field"><label>Priority</label><select class="select" style="width:100%" id="ntPriority"><option>Low</option><option selected>Medium</option><option>High</option><option>Urgent</option></select></div>
      <div class="field"><label>Due date</label><input class="input" style="width:100%" type="date" id="ntDue" value="${fmtDate(new Date())}"/></div>
    </div>
  `, [{label:"Cancel", ghost:true},{label:"Create task", primary:true, onClick:()=>{
    const title = $("#ntTitle").value.trim(); if(!title){ toast("Enter a title","error"); return false; }
    state.tasks.unshift({id:"TSK"+Math.floor(Math.random()*90000), title, patient:$("#ntPatient").value, assignee:"You", priority:$("#ntPriority").value, dueDate:$("#ntDue").value, status:"To Do"});
    persist("tasks"); if(state.view==="tasks") drawTasks(); toast("Task created","success");
    return true;
  }}]);
}

/* ---- Analytics ---- */
const ANALYTICS_TABS = ["Operations","Patients","Appointments","Care Coordination","Providers","Financial","Engagement"];
function renderAnalytics(){
  const root = $("#view-analytics");
  root.innerHTML = `
    <div class="view-head reveal"><div><div class="view-title">Analytics</div><div class="view-sub">Operational performance across the network</div></div></div>
    <div class="toolbar reveal">
      <select class="select"><option>Last 30 days</option><option>Last 90 days</option><option>Year to date</option></select>
      <select class="select"><option>All locations</option>${LOCATIONS.map(l=>`<option>${l}</option>`).join("")}</select>
      <select class="select"><option>All providers</option>${state.providers.slice(0,10).map(p=>`<option>${p.name}</option>`).join("")}</select>
    </div>
    <div class="tabs reveal" id="anTabs">${ANALYTICS_TABS.map(t=>`<div class="tab ${t===state.analyticsTab?'active':''}" data-t="${t}">${t}</div>`).join("")}</div>
    <div id="anBody"></div>
  `;
  $all("#anTabs .tab").forEach(t=>t.addEventListener("click", ()=>{ state.analyticsTab=t.dataset.t; $all("#anTabs .tab").forEach(x=>x.classList.remove("active")); t.classList.add("active"); drawAnalyticsTab(); }));
  drawAnalyticsTab();
}
function drawAnalyticsTab(){
  const tab = state.analyticsTab;
  const rng = rnd(tab.length*13+3);
  const series = Array.from({length:12},()=>pickInt(rng,20,90));
  const kpis = {
    Operations:[["Appointment volume","1,842","+5.4%","up"],["Avg wait time","14 min","-2.1%","up"],["Task completion","88%","+3%","up"]],
    Patients:[["Active patient growth","+3.2%","vs last month","up"],["Avg age","41","stable","up"],["High risk cohort","9%","+1pt","down"]],
    Appointments:[["No-show rate","11%","-1.4pt","up"],["Same-day cancellations","6%","+0.5pt","down"],["Utilization","82%","+2pt","up"]],
    "Care Coordination":[["Follow-up completion","76%","+4pt","up"],["Overdue items", state.careCards.filter(c=>c.issue.includes('overdue')).length,"needs review","down"],["Avg resolution time","3.2 days","-0.4","up"]],
    Providers:[["Avg utilization","79%","+1.8pt","up"],["Overloaded providers", state.providers.filter(p=>providerWorkloadLevel(p)==='Overloaded').length,"watch list","down"],["Patients / provider","34","+2","up"]],
    Financial:[["Revenue (MTD)","$184,300","+4.6%","up"],["Avg claim cycle","6.1 days","-0.3","up"],["Collections rate","94%","+0.8pt","up"]],
    Engagement:[["Patient satisfaction","92%","+1.1pt","up"],["Portal adoption","67%","+5pt","up"],["Message response time","2.4 hrs","-0.6","up"]]
  }[tab];
  $("#anBody").innerHTML = `
    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">${kpis.map(k=>kpi(k[0],k[1],k[2],k[3])).join("")}</div>
    <div class="card card-pad reveal">
      <h3 style="font-size:14px;font-weight:600;margin-bottom:12px">${tab} trend</h3>
      <div id="anChart"></div>
    </div>
  `;
  $("#anChart").innerHTML = lineChart(series, {color:"var(--accent)"});
  animateCharts($("#anBody"));
  setupReveal();
}

/* ---- AI Insights ---- */
function renderAI(){
  const root = $("#view-ai");
  root.innerHTML = `
    <div class="view-head reveal"><div><div class="view-title">Averis Intelligence</div><div class="view-sub">Client-side demonstration — deterministic answers grounded in this workspace's synthetic data. Not a live LLM connection, and not diagnostic guidance.</div></div></div>
    <div class="ai-shell reveal">
      <div class="card ai-chat">
        <div class="ai-msgs" id="aiMsgs">
          <div class="ai-bubble bot">Ask me about scheduling, provider load, or follow-ups — I'll answer using this workspace's live demo metrics.</div>
        </div>
        <div style="padding:0 14px 8px">
          ${["Why did appointments decline this week?","Which providers are overloaded?","Which follow-ups need attention?","Which department has the highest no-show rate?"].map(q=>`<span class="chip" data-q="${q}">${q}</span>`).join("")}
        </div>
        <div class="ai-input"><input class="input" id="aiInput" placeholder="Ask Averis Intelligence..."/><button class="btn btn-primary" id="aiSend">Ask</button></div>
      </div>
      <div class="card card-pad">
        <h4 style="font-size:13px;margin-bottom:10px">No-show risk model</h4>
        <div class="field"><label>Patient</label><select class="select" style="width:100%" id="mlPatient">${state.patients.slice(0,40).map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}</select></div>
        <div class="field"><label>Appointment day</label><select class="select" style="width:100%" id="mlDay">${["Monday","Tuesday","Wednesday","Thursday","Friday"].map(d=>`<option>${d}</option>`).join("")}</select></div>
        <div class="field"><label>Lead time (days)</label><input class="input" style="width:100%" type="number" id="mlLead" value="5"/></div>
        <button class="btn btn-primary" style="width:100%" id="mlRun">Predict risk</button>
        <div id="mlResult" style="margin-top:12px"></div>
        <p class="faint" style="font-size:11.5px;margin-top:10px">Demonstration model — computed from attendance history, lead time, and prior cancellations. Not a clinical tool.</p>
      </div>
    </div>
  `;
  const send = (q)=>{
    if(!q) return;
    $("#aiMsgs").insertAdjacentHTML("beforeend", `<div class="ai-bubble user">${q}</div>`);
    const thinking = el(`<div class="ai-bubble bot">Analyzing workspace data…</div>`);
    $("#aiMsgs").appendChild(thinking);
    $("#aiMsgs").scrollTop = $("#aiMsgs").scrollHeight;
    setTimeout(()=>{
      const r = aiRespond(q);
      thinking.innerHTML = `${r.answer}<br><br><b>Recommended action:</b> ${r.action}<div class="conf">Confidence: ${r.confidence}% · based on ${state.appointments.length} appointments, ${state.providers.length} providers</div>`;
      $("#aiMsgs").scrollTop = $("#aiMsgs").scrollHeight;
    }, 550);
  };
  $("#aiSend").addEventListener("click", ()=>{ const v=$("#aiInput").value.trim(); $("#aiInput").value=""; send(v); });
  $("#aiInput").addEventListener("keydown", e=>{ if(e.key==="Enter"){ const v=$("#aiInput").value.trim(); $("#aiInput").value=""; send(v); } });
  $all(".chip", root).forEach(c=>c.addEventListener("click", ()=>send(c.dataset.q)));
  $("#mlRun").addEventListener("click", ()=>{
    const p = state.patients.find(x=>x.id===$("#mlPatient").value);
    const r = noShowRisk({attendanceRate:p.attendanceRate, dayOfWeek:$("#mlDay").value, leadTimeDays:+$("#mlLead").value, priorCancellations:p.priorCancellations});
    const color = r.level==="Low Risk"?"var(--accent)":r.level==="Medium Risk"?"var(--amber)":"var(--danger)";
    $("#mlResult").innerHTML = `
      <div class="row between"><b>${r.level}</b><span class="faint">${r.score}%</span></div>
      <div class="risk-bar"><div class="risk-fill" style="width:${r.score}%;background:${color}"></div></div>
      <p class="faint" style="font-size:11.5px;margin-top:8px">Based on ${p.attendanceRate}% historic attendance and ${p.priorCancellations} prior cancellations.</p>
    `;
  });
}

/* ---- Settings ---- */
const SETTINGS_TABS = ["Profile","Organization","Notifications","Appearance","Security","Billing"];
let settingsTab = "Appearance";
function renderSettings(){
  const root = $("#view-settings");
  const session = currentSession() || {name:"Alex Rivera", email:DEMO_EMAIL, org:"Averis Demo Health Network"};
  root.innerHTML = `
    <div class="view-head reveal"><div><div class="view-title">Settings</div><div class="view-sub">Workspace preferences and demo controls</div></div></div>
    <div class="settings-grid reveal">
      <div class="settings-nav">${SETTINGS_TABS.map(t=>`<div class="nav-item ${t===settingsTab?'active':''}" data-t="${t}">${t}</div>`).join("")}</div>
      <div class="card card-pad" id="settingsBody"></div>
    </div>
  `;
  $all(".settings-nav .nav-item", root).forEach(n=>n.addEventListener("click", ()=>{ settingsTab=n.dataset.t; renderSettings(); }));
  const panels = {
    Profile: `<div class="field"><label>Full name</label><input class="input" style="width:100%" value="${session.name}"/></div><div class="field"><label>Work email</label><input class="input" style="width:100%" value="${session.email}"/></div><button class="btn btn-primary" onclick="window.__averisToast && window.__averisToast()">Save changes</button>`,
    Organization: `<div class="field"><label>Organization</label><input class="input" style="width:100%" value="${session.org}"/></div><div class="field"><label>Organization type</label><select class="select" style="width:100%"><option>Multi-location practice</option><option>Diagnostic center</option><option>Single clinic</option></select></div>`,
    Notifications: `${["Appointment reminders","Task assignments","Follow-up alerts","Weekly analytics digest"].map(n=>`<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--border-soft)"><span>${n}</span><input type="checkbox" checked/></div>`).join("")}`,
    Appearance: `
      <div class="theme-row">
        <div class="theme-opt" id="themeDarkOpt"><div class="theme-swatch swatch-dark"></div><span>Dark</span></div>
        <div class="theme-opt" id="themeLightOpt"><div class="theme-swatch swatch-light"></div><span>Light</span></div>
      </div>
      <div class="row between" style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border-soft)">
        <div><div style="font-weight:560">Reduce motion</div><div class="faint" style="font-size:12px">Minimize animation across the product</div></div>
        <input type="checkbox" id="reduceMotionToggle" ${store.get("reduceMotion",false)?"checked":""}/>
      </div>`,
    Security: `<div class="field"><label>Password</label><input class="input" style="width:100%" type="password" value="averis123" disabled/></div>
      <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border-soft)">
        <div style="font-weight:560;margin-bottom:6px">Reset demo data</div>
        <p class="faint" style="font-size:12.5px;margin-bottom:10px">Clears all local changes and regenerates fresh synthetic patients, appointments, and tasks.</p>
        <button class="btn" id="resetDemoBtn" style="border-color:var(--danger);color:var(--danger)">Reset demo data</button>
      </div>`,
    Billing: `<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:14px">
      ${[["Starter","$249/mo","For small practices",false],["Growth","$699/mo","For growing organizations",true],["Enterprise","Custom","Multi-location networks",false]].map(p=>`
      <div class="card card-pad">
        <div class="row between"><b>${p[0]}</b>${p[3]?'<span class="badge badge-teal">Current</span>':''}</div>
        <div style="font-size:20px;font-weight:650;margin:8px 0">${p[1]}</div>
        <div class="faint" style="font-size:12.5px;margin-bottom:12px">${p[2]}</div>
        <button class="btn ${p[3]?'':'btn-primary'}" style="width:100%" ${p[3]?'disabled':''}>${p[3]?'Current plan':'Upgrade'}</button>
      </div>`).join("")}</div>`
  };
  $("#settingsBody").innerHTML = panels[settingsTab];
  if(settingsTab==="Appearance"){
    syncThemeOptions();
    $("#themeDarkOpt").addEventListener("click", ()=>setTheme("dark"));
    $("#themeLightOpt").addEventListener("click", ()=>setTheme("light"));
    $("#reduceMotionToggle").addEventListener("change", e=>{ store.set("reduceMotion", e.target.checked); document.documentElement.classList.toggle("force-reduced-motion", e.target.checked); toast("Preference saved"); });
  }
  if(settingsTab==="Security"){
    $("#resetDemoBtn").addEventListener("click", ()=>{
      if(confirm("Reset all demo data? This clears your local changes.")){
        store.wipeAll(); seedData(); loadState();
        toast("Demo data reset","success");
        setTimeout(()=>location.reload(), 400);
      }
    });
  }
  $all("[onclick]", root).forEach(b=>b.removeAttribute("onclick"));
  $all(".btn", root).forEach(b=>{ if(b.textContent.trim()==="Save changes") b.addEventListener("click", ()=>toast("Profile saved","success")); if(b.textContent.trim()==="Upgrade") b.addEventListener("click", ()=>toast("Plan updated (demo only)","success")); });
}
function syncThemeOptions(){
  const t = document.documentElement.getAttribute("data-theme")||"dark";
  $("#themeDarkOpt")?.classList.toggle("active", t==="dark");
  $("#themeLightOpt")?.classList.toggle("active", t==="light");
}

/* ---------------------------------------------------------
   9. MODAL / TOAST / NOTIFICATIONS / COMMAND PALETTE
--------------------------------------------------------- */
function openModal(title, bodyHtml, buttons, opts={}){
  const overlay = $("#modalOverlay");
  overlay.innerHTML = `<div class="modal" style="${opts.wide?'width:640px':''}">
    <div class="modal-head"><div class="modal-title">${title}</div><button class="btn btn-icon btn-ghost" id="modalClose">✕</button></div>
    <div id="modalBody">${bodyHtml}</div>
    <div class="modal-foot" id="modalFoot"></div>
  </div>`;
  const foot = $("#modalFoot");
  (buttons||[]).forEach(b=>{
    const btn = el(`<button class="btn ${b.primary?'btn-primary':''} ${b.ghost?'btn-ghost':''}">${b.label}</button>`);
    btn.addEventListener("click", ()=>{ const ok = b.onClick ? b.onClick() : true; if(ok!==false) closeModal(); });
    foot.appendChild(btn);
  });
  $("#modalClose").addEventListener("click", closeModal);
  overlay.classList.add("active");
  const firstInput = overlay.querySelector("input,select"); if(firstInput) setTimeout(()=>firstInput.focus(), 80);
}
function closeModal(){ $("#modalOverlay").classList.remove("active"); }

function renderNotifPanel(){
  const panel = $("#notifPanel");
  const unread = state.notifications.filter(n=>n.unread).length;
  $("#notifBadge").classList.toggle("hidden", unread===0);
  panel.innerHTML = `
    <div class="notif-head"><span>Notifications</span><a href="#" id="markAllRead" style="color:var(--accent);font-size:12px;text-decoration:none">Mark all read</a></div>
    ${state.notifications.map(n=>`<div class="notif-item ${n.unread?'unread':''}"><div><b>${n.title}</b><div class="faint" style="font-size:12px;margin-top:2px">${n.body}</div><div class="t">${n.time}</div></div></div>`).join("")}
  `;
  $("#markAllRead").addEventListener("click", e=>{ e.preventDefault(); state.notifications.forEach(n=>n.unread=false); persist("notifications"); renderNotifPanel(); });
}

const COMMANDS = [
  {label:"Go to Overview", action:()=>navigate("overview")},
  {label:"Go to Patients", action:()=>navigate("patients")},
  {label:"Go to Appointments", action:()=>navigate("appointments")},
  {label:"Go to Care Hub", action:()=>navigate("carehub")},
  {label:"Go to Analytics", action:()=>navigate("analytics")},
  {label:"Open AI Insights", action:()=>navigate("ai")},
  {label:"Create patient", action:openAddPatientModal},
  {label:"Create appointment", action:openNewAppointmentModal},
  {label:"Toggle dark mode", action:toggleTheme}
];
function openCommandPalette(prefill=""){
  const overlay = $("#modalOverlay");
  overlay.innerHTML = `<div class="modal cmdk">
    <input class="cmdk-input" id="cmdkInput" placeholder="Search patients, appointments, providers, tasks, or type a command..." value="${prefill}"/>
    <div class="cmdk-list" id="cmdkList"></div>
  </div>`;
  overlay.classList.add("active");
  const input = $("#cmdkInput"); setTimeout(()=>input.focus(),60);
  let sel = 0;
  function results(q){
    q = q.toLowerCase();
    const out = [];
    if(!q){ COMMANDS.forEach(c=>out.push({label:c.label, tag:"Command", action:c.action})); return out; }
    COMMANDS.filter(c=>c.label.toLowerCase().includes(q)).forEach(c=>out.push({label:c.label, tag:"Command", action:c.action}));
    state.patients.filter(p=>p.name.toLowerCase().includes(q)).slice(0,4).forEach(p=>out.push({label:p.name, tag:"Patient", action:()=>{navigate("patients"); setTimeout(()=>openPatientProfile(p.id),150);}}));
    state.providers.filter(p=>p.name.toLowerCase().includes(q)).slice(0,3).forEach(p=>out.push({label:p.name, tag:"Provider", action:()=>{navigate("providers"); setTimeout(()=>openProviderModal(p.id),150);}}));
    state.tasks.filter(t=>t.title.toLowerCase().includes(q)).slice(0,3).forEach(t=>out.push({label:t.title, tag:"Task", action:()=>navigate("tasks")}));
    return out.slice(0,10);
  }
  function draw(){
    const list = results(input.value);
    $("#cmdkList").innerHTML = list.length ? list.map((r,i)=>`<div class="cmdk-item ${i===sel?'sel':''}" data-i="${i}">${r.label}<span class="tag">${r.tag}</span></div>`).join("") : `<div class="empty" style="padding:24px">No matches.</div>`;
    $all(".cmdk-item").forEach(item=>item.addEventListener("click", ()=>{ list[+item.dataset.i].action(); closeModal(); }));
    input._results = list;
  }
  input.addEventListener("input", ()=>{ sel=0; draw(); });
  input.addEventListener("keydown", e=>{
    const list = input._results||[];
    if(e.key==="ArrowDown"){ e.preventDefault(); sel=Math.min(sel+1,list.length-1); draw(); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); sel=Math.max(sel-1,0); draw(); }
    else if(e.key==="Enter"){ if(list[sel]){ list[sel].action(); closeModal(); } }
    else if(e.key==="Escape"){ closeModal(); }
  });
  draw();
}

/* ---------------------------------------------------------
   10. THEME + MOUSE GLOW + REVEAL
--------------------------------------------------------- */
function setTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  store.set("theme", t);
  $("#themeToggleIcon").innerHTML = t==="dark" ? ICONS.moon : ICONS.sun;
  syncThemeOptions();
}
function toggleTheme(){ setTheme((document.documentElement.getAttribute("data-theme")||"dark")==="dark" ? "light" : "dark"); }

function initMouseGlow(){
  let raf=null, mx=50, my=20;
  document.addEventListener("mousemove", e=>{
    mx = (e.clientX/window.innerWidth)*100; my=(e.clientY/window.innerHeight)*100;
    if(!raf) raf = requestAnimationFrame(()=>{
      document.documentElement.style.setProperty("--mouse-x", mx+"%");
      document.documentElement.style.setProperty("--mouse-y", my+"%");
      raf=null;
    });
  });
}
function setupReveal(){
  const els = $all(".reveal:not(.in)");
  if(!("IntersectionObserver" in window)){ els.forEach(e=>e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
  }, {threshold:0.08});
  els.forEach(e=>io.observe(e));
}

/* ---------------------------------------------------------
   11. CSV EXPORT
--------------------------------------------------------- */
function exportCSV(filename, rows){
  if(!rows.length){ toast("Nothing to export","error"); return; }
  const cols = Object.keys(rows[0]).filter(k=>typeof rows[0][k] !== "object");
  const csv = [cols.join(",")].concat(rows.map(r=>cols.map(c=>`"${(r[c]??"").toString().replace(/"/g,'""')}"`).join(","))).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  toast("Export ready","success");
}

/* ---------------------------------------------------------
   12. MOBILE SIDEBAR
--------------------------------------------------------- */
function closeMobileSidebar(){ $("#sidebar").classList.remove("open"); }

/* ---------------------------------------------------------
   13. BOOT
--------------------------------------------------------- */
function mountApp(){
  loadState();
  $("#app").classList.add("active");
  $("#authScreen").style.display = "none";
  const session = currentSession();
  $("#userAvatar").textContent = initials(session?.name || "Demo User");
  $("#orgName").textContent = session?.org || "Averis Demo Health Network";
  renderSidebar();
  const startView = (location.hash||"#overview").slice(1);
  navigate(NAV.some(n=>n.id===startView) ? startView : "overview");
  renderNotifPanel();

  $("#rolePillLabel").parentElement.addEventListener("click", ()=>{
    const roles = Object.keys(ROLE_HIDDEN);
    const idx = roles.indexOf(state.role);
    state.role = roles[(idx+1)%roles.length];
    persist("role"); renderSidebar();
    if(!NAV.some(n=>n.id===state.view) || (ROLE_HIDDEN[state.role]||[]).includes(state.view)) navigate("overview");
    toast(`Viewing as ${state.role}`);
  });
}

function initAuthScreens(){
  $("#loginForm").addEventListener("submit", e=>{
    e.preventDefault();
    const email = $("#loginEmail").value.trim(), pass = $("#loginPass").value;
    if(tryLogin(email, pass)){ ensureData(); mountApp(); }
    else { $("#loginError").style.display="block"; }
  });
  $("#goSignup").addEventListener("click", e=>{ e.preventDefault(); $("#loginPanel").classList.add("hidden"); $("#signupPanel").classList.remove("hidden"); });
  $("#goLogin").addEventListener("click", e=>{ e.preventDefault(); $("#signupPanel").classList.add("hidden"); $("#loginPanel").classList.remove("hidden"); });
  $("#signupForm").addEventListener("submit", e=>{
    e.preventDefault();
    signup({
      name:$("#suName").value.trim()||"New User", email:$("#suEmail").value.trim(),
      org:$("#suOrg").value.trim()||"New Organization", orgType:$("#suOrgType").value,
      password:$("#suPass").value
    });
    ensureData(); mountApp();
  });
  $("#fillDemoBtn").addEventListener("click", ()=>{ $("#loginEmail").value=DEMO_EMAIL; $("#loginPass").value=DEMO_PASS; });
}

function init(){
  setTheme(store.get("theme","dark"));
  if(store.get("reduceMotion", false)) document.documentElement.classList.add("force-reduced-motion");
  initMouseGlow();
  initAuthScreens();

  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#searchTrigger").addEventListener("click", ()=>openCommandPalette());
  $("#mobileMenuBtn").addEventListener("click", ()=>$("#sidebar").classList.toggle("open"));
  $("#notifBtn").addEventListener("click", ()=>$("#notifPanel").classList.toggle("active"));
  document.addEventListener("click", e=>{
    if(!e.target.closest("#notifPanel") && !e.target.closest("#notifBtn")) $("#notifPanel").classList.remove("active");
  });
  document.addEventListener("keydown", e=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="k"){ e.preventDefault(); openCommandPalette(); }
    if(e.key==="Escape") closeModal();
  });
  $("#modalOverlay").addEventListener("mousedown", e=>{ if(e.target.id==="modalOverlay") closeModal(); });
  $all(".btn").forEach(()=>{});
  document.addEventListener("mousedown", e=>{
    const btn = e.target.closest(".btn"); if(!btn) return;
    const r = document.createElement("span"); r.className="ripple";
    const rect = btn.getBoundingClientRect();
    r.style.left = (e.clientX-rect.left)+"px"; r.style.top=(e.clientY-rect.top)+"px";
    btn.appendChild(r); setTimeout(()=>r.remove(),600);
  });

  const session = currentSession();
  if(session){ ensureData(); mountApp(); }
}

window.addEventListener("DOMContentLoaded", init);
})();
