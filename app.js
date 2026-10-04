
/* =========================================================
   AVERIS BY MAHI — rebuilt healthcare operations workspace
   Static GitHub Pages portfolio • synthetic data only
   ========================================================= */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  };

  var DB = {
    get: function (k, fallback) {
      try {
        var raw = localStorage.getItem("MAHI_AVERIS_2026_" + k);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (k, v) {
      try { localStorage.setItem("MAHI_AVERIS_2026_" + k, JSON.stringify(v)); } catch (e) {}
    },
    remove: function (k) {
      try { localStorage.removeItem("MAHI_AVERIS_2026_" + k); } catch (e) {}
    }
  };

  var APP = {
    product: "Averis",
    owner: "Mahi",
    workspace: "Mahi Health",
    role: "Healthcare Operations"
  };

  var IMAGE = {
    hero: "https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg?auto=compress&cs=tinysrgb&w=1800&q=80",
    team: "https://images.pexels.com/photos/6129207/pexels-photo-6129207.jpeg?auto=compress&cs=tinysrgb&w=1400&q=78",
    care: "https://images.pexels.com/photos/8413204/pexels-photo-8413204.jpeg?auto=compress&cs=tinysrgb&w=1400&q=78"
  };

  var NAV = [
    ["COMMAND", [["overview","Command Center","▦"],["analytics","Analytics","◫"],["ai","AI Copilot","✦"]]],
    ["PATIENT FLOW", [["patients","Patients","♙"],["patient360","Patient 360","◎"],["queue","Live Queue","≡"],["appointments","Appointments","◷"],["emergency","Emergency","⚕"]]],
    ["CLINICAL OPERATIONS", [["care","Care Hub","♡"],["clinical","Clinical Monitor","♥"],["providers","Providers","✚"],["beds","Bed Board","▤"]]],
    ["HOSPITAL SERVICES", [["lab","Laboratory","△"],["pharmacy","Pharmacy","◉"],["billing","Billing","₹"],["messages","Messages","◌"],["tasks","Tasks","✓"],["reports","Reports","▥"]]],
    ["SYSTEM", [["settings","Settings","⚙"]]]
  ];

  var state = {
    view: location.hash.replace("#", "") || "overview",
    theme: DB.get("theme", "light"),
    live: DB.get("live", true),
    patients: DB.get("patients", null),
    appointments: DB.get("appointments", null),
    providers: DB.get("providers", null),
    tasks: DB.get("tasks", null),
    care: DB.get("care", null),
    beds: DB.get("beds", null),
    messages: DB.get("messages", null),
    invoices: DB.get("invoices", null),
    inventory: DB.get("inventory", null),
    notifications: DB.get("notifications", null),
    selectedPatient: DB.get("selectedPatient", null),
    conversation: 0,
    patientQuery: "",
    patientStatus: "All",
    taskStatus: "All",
    tick: 0
  };

  var names = ["Aarav Sharma","Maya Patel","Noah Williams","Olivia Chen","Arjun Rao","Sophia Bennett","Ethan Brooks","Isabella Martin","Kabir Mehta","Amelia Jones","Rohan Kapoor","Emma Davis","Vihaan Reddy","Mia Wilson","Aditya Nair","Ava Thomas","Reyansh Gupta","Liam Anderson","Anaya Singh","Lucas Brown"];
  var providerSeed = [
    ["Dr. Maya Chen","Cardiology","North Tower"],["Dr. Arjun Rao","General Medicine","Central Campus"],["Dr. Sofia Martinez","Neurology","Riverside"],
    ["Dr. Ethan Lee","Pediatrics","North Tower"],["Dr. Priya Nair","Orthopedics","Central Campus"],["Dr. Daniel Brooks","Oncology","Riverside"],
    ["Dr. Kavya Singh","Dermatology","North Tower"],["Dr. Noah Carter","Radiology","Central Campus"],["Dr. Elena Patel","Internal Medicine","Riverside"]
  ];
  var departments = ["Cardiology","General Medicine","Neurology","Pediatrics","Orthopedics"];
  var conditions = ["Hypertension","Type 2 Diabetes","Asthma","Arrhythmia","Migraine","Arthritis","Recovery","Routine review"];
  var seed = 804;
  var rand = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  var between = function (a, b) { return Math.floor(rand() * (b - a + 1)) + a; };
  var today = function () { return new Date().toISOString().slice(0, 10); };
  var shift = function (d) { var x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
  var dateText = function (v) { return new Date(v + "T12:00:00").toLocaleDateString(undefined, {day:"2-digit", month:"short"}); };
  var clock = function () { return new Date().toLocaleTimeString([], {hour12:false}); };
  var initials = function (n) { return String(n || "Mahi").split(/\s+/).map(function (x) { return x[0]; }).slice(0, 2).join("").toUpperCase(); };

  function seedData() {
    if (state.patients && state.appointments && state.providers && state.tasks && state.care && state.beds && state.messages) return;

    var providers = providerSeed.map(function (p, i) {
      return {id:"PR-" + (100+i), name:p[0], specialty:p[1], location:p[2], load:between(48,94), today:between(4,14), capacity:between(10,18), status:i % 4 === 0 ? "Busy" : "Available"};
    });

    var patients = names.map(function (name, i) {
      return {id:"AV-" + (26000+i), name:name, age:between(21,81), condition:conditions[i % conditions.length], department:providers[i % providers.length].specialty, provider:providers[i % providers.length].name, status:["Active","Stable","Needs Attention","Active"][i%4], risk:["Low","Low","Medium","High"][i%4], attendance:between(78,99), lastVisit:shift(-between(2,42)), nextVisit:shift(between(1,18))};
    });

    var appointments = Array.from({length:60}, function (_, i) {
      var d = shift(between(-4,14)), p = patients[i % patients.length], pr = providers[i % providers.length];
      return {id:"AP-" + (4300+i), date:d, time:["08:30","09:15","10:00","10:45","11:30","12:15","13:30","14:15","15:00","16:00"][i%10], patient:p.name, patientId:p.id, provider:pr.name, type:["Consultation","Follow-up","Screening","Review","Telehealth"][i%5], status:d < today() ? (i%10===0 ? "No Show" : i%13===0 ? "Cancelled" : "Completed") : (i%3===0 ? "Confirmed" : "Scheduled")};
    });

    var tasks = Array.from({length:32}, function (_, i) {
      return {id:"TK-" + (7000+i), title:["Call patient about lab result","Review discharge plan","Verify insurance documents","Confirm specialist referral","Medication reconciliation","Prepare handoff note"][i%6], patient:patients[i%patients.length].name, priority:["Low","Medium","High","Urgent"][i%4], owner:["Mahi","Care Team","Front Desk","Clinical Lead"][i%4], due:shift(between(-2,9)), status:["To Do","To Do","In Progress","Completed"][i%4]};
    });

    var care = Array.from({length:25}, function (_, i) {
      return {id:"CH-" + (9000+i), patient:patients[i%patients.length].name, issue:["Overdue follow-up","Referral pending","Care-plan review","Unresolved result query","Discharge coordination"][i%5], priority:["Normal","Normal","High","Urgent"][i%4], stage:["New","Assigned","In Progress","Waiting","Resolved"][i%5], age:between(10,240)};
    });

    var beds = Array.from({length:40}, function (_, i) {
      var st = ["Occupied","Occupied","Available","Cleaning","Occupied","Available","Isolation"][i%7];
      return {id:["A","B","C","D"][i%4] + "-" + (101+i), ward:["ICU","General","Cardiology","Pediatrics"][i%4], status:st, patient:(st==="Occupied" || st==="Isolation") ? patients[i%patients.length].name : ""};
    });

    var messages = [
      {name:"Dr. Maya Chen",role:"Cardiology",unread:2,items:[["them","Mahi, can we move the Patel follow-up to 3:30?","09:24"],["me","Yes. I updated the care team.","09:26"],["them","Perfect. I’ll review the ECG before the visit.","09:28"]]},
      {name:"Care Coordination",role:"Operations",unread:1,items:[["them","Referral packet is ready for review.","09:12"],["me","Received. I’ll assign it to the neurology queue.","09:15"]]},
      {name:"Riverside Front Desk",role:"Scheduling",unread:0,items:[["them","The 14:00 slot is now confirmed.","08:52"],["me","Thanks — patient has been notified.","08:55"]]}
    ];

    var invoices = [
      {id:"INV-2408",patient:"Maya Patel",amount:24800,payer:"Insurance",status:"Pending"},
      {id:"INV-2407",patient:"Arjun Rao",amount:12400,payer:"Self pay",status:"Paid"},
      {id:"INV-2406",patient:"Noah Williams",amount:48600,payer:"Insurance",status:"Review"},
      {id:"INV-2405",patient:"Olivia Chen",amount:8900,payer:"Self pay",status:"Paid"}
    ];

    var inventory = [
      {name:"Metformin 500 mg",category:"Oral medication",stock:84,reorder:30,unit:"packs"},
      {name:"Insulin Glargine",category:"Insulin",stock:18,reorder:24,unit:"vials"},
      {name:"Amoxicillin 500 mg",category:"Antibiotic",stock:62,reorder:20,unit:"packs"},
      {name:"Paracetamol 650 mg",category:"Analgesic",stock:120,reorder:40,unit:"packs"}
    ];

    var notifications = [
      {title:"Care queue needs attention",body:"3 urgent follow-ups need assignment.",type:"care",time:"now",unread:true},
      {title:"Laboratory result posted",body:"Troponin result is ready for review.",type:"lab",time:"4 min",unread:true},
      {title:"Emergency capacity",body:"Two patients are waiting for bed allocation.",type:"emergency",time:"7 min",unread:true},
      {title:"Medication threshold",body:"Insulin Glargine is below reorder level.",type:"pharmacy",time:"12 min",unread:true}
    ];

    state.providers=providers; state.patients=patients; state.appointments=appointments; state.tasks=tasks; state.care=care; state.beds=beds; state.messages=messages; state.invoices=invoices; state.inventory=inventory; state.notifications=notifications;
    ["providers","patients","appointments","tasks","care","beds","messages","invoices","inventory","notifications"].forEach(function (k) { DB.set(k, state[k]); });
  }

  function badge(text, tone) {
    return '<span class="status ' + (tone || "info") + '"><i class="dot"></i>' + esc(text) + "</span>";
  }
  function kpi(title, value, detail, tone, iconText) {
    return '<article class="kpi ' + tone + '"><div class="kpi-top"><span>' + esc(title) + '</span><b>' + (iconText || "•") + '</b></div><strong>' + esc(value) + '</strong><small>↗ ' + esc(detail) + "</small></article>";
  }
  function heading(eyebrow, title, sub, actions) {
    return '<div class="page-head"><div><div class="eyebrow"><i class="live-dot"></i>' + esc(eyebrow) + '</div><h1>' + esc(title) + '</h1><p>' + esc(sub) + '</p></div><div class="actions">' + (actions || "") + "</div></div>";
  }
  function lineChart(values, labels) {
    var w=720,h=220,p=18,max=Math.max.apply(Math,values)*1.18;
    var pts=values.map(function (v,i) { return [p+i*(w-p*2)/(values.length-1),h-p-v/max*(h-p*2)]; });
    var path=pts.map(function (pt,i) { return (i ? "L" : "M") + pt[0].toFixed(1) + " " + pt[1].toFixed(1); }).join(" ");
    return '<svg class="chart-svg" viewBox="0 0 '+w+" "+h+'"><defs><linearGradient id="mahiArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--blue)" stop-opacity=".24"/><stop offset="1" stop-color="var(--blue)" stop-opacity="0"/></linearGradient></defs>' + [0,.25,.5,.75,1].map(function (r) { return '<line class="gridline" x1="'+p+'" y1="'+(h-p-r*(h-p*2))+'" x2="'+(w-p)+'" y2="'+(h-p-r*(h-p*2))+'"/>'; }).join("") + '<path class="chart-area" d="' + path + " L " + pts[pts.length-1][0] + " " + (h-p) + " L " + pts[0][0] + " " + (h-p) + ' Z"/><path class="chart-line" d="' + path + '"/>' + labels.map(function (l,i) { return '<text class="axis" x="'+pts[i][0]+'" y="212" text-anchor="middle">'+l+"</text>"; }).join("") + "</svg>";
  }

  function activityFeed() {
    var rows=[["♥","Care Hub","Patient AV-26004 moved to In Progress","now"],["◷","Appointments","New cardiology slot confirmed","2m"],["△","Laboratory","CBC panel uploaded for review","5m"],["▤","Bed Board","B-114 changed to Cleaning","8m"],["◉","Pharmacy","Insulin threshold reached","11m"],["✓","Tasks","Referral review assigned to Mahi","14m"]];
    return rows.map(function (r) { return '<div class="activity-row"><b>'+r[0]+'</b><span><strong>'+esc(r[2])+'</strong><small>'+r[1]+"</small></span><time>"+r[3]+"</time></div>"; }).join("");
  }

  function renderOverview() {
    var t=today(), appts=state.appointments.filter(function (x) { return x.date===t; });
    var occupied=state.beds.filter(function (x) { return x.status==="Occupied" || x.status==="Isolation"; }).length;
    var available=state.beds.filter(function (x) { return x.status==="Available"; }).length;
    var cleaning=state.beds.filter(function (x) { return x.status==="Cleaning"; }).length;
    var occ=Math.round(occupied/state.beds.length*100);

    $("#view-overview").innerHTML =
      heading("MAHI • AVERIS","Care Command Center","Mahi Health operating view for patient flow, capacity, care and hospital services.",'<span class="status ok"><i class="dot"></i>Network nominal</span><button class="btn" data-action="refresh">↻ Sync</button><button class="btn primary" data-action="new-appointment">+ New appointment</button>') +
      '<article class="hero"><div class="hero-backup"></div><img id="heroImage" class="hero-photo" src="'+IMAGE.hero+'" alt=""><div class="hero-overlay"></div><div class="hero-content"><div class="hero-kicker"><i class="live-dot"></i><span id="heroStamp">LIVE • '+new Date().toLocaleString().toUpperCase()+'</span></div><h2>See the hospital clearly.<br>Move care with confidence.</h2><p>Averis gives Mahi one connected workspace for arrivals, appointment demand, emergency pressure, bed capacity, clinical signals and service-line work.</p><div class="hero-actions"><button class="btn primary" data-action="open-ai">✦ Ask AI Copilot</button><button class="btn" data-action="open-emergency">Open emergency</button><button class="btn" data-action="open-queue">View live queue</button></div></div><div class="hero-metrics"><div><span>OPD today</span><strong>'+ (appts.length+176) +'</strong></div><div><span>Bed occupancy</span><strong>'+occ+'%</strong></div><div><span>Available beds</span><strong>'+available+'</strong></div></div></article>' +
      '<div class="attention"><div><i></i><strong>Operational attention</strong><span>2 emergency alerts • 3 urgent care items • 1 pharmacy reorder</span></div><button class="btn sm danger" data-action="open-emergency">Review alerts</button></div>' +
      '<div class="kpi-grid">'+kpi("Patients in network",state.patients.length,"+4.2% vs last week","blue","♙")+kpi("Appointments today",appts.length+176,"93% confirmed","teal","◷")+kpi("Live OPD queue","27","14 min average wait","gold","≡")+kpi("Critical alerts","2","requires action now","red","!")+"</div>" +
      '<div class="grid-2"><article class="card"><div class="card-head"><div><div class="card-title">Patient arrivals & flow</div><div class="card-meta">Rolling 12-hour demand • synthetic portfolio data</div></div>'+badge("Live","ok")+"</div>"+lineChart([32,41,38,54,61,59,73,78,74,87,91,86],["06","07","08","09","10","11","12","13","14","15","16","17"])+'</article><article class="card"><div class="card-head"><div><div class="card-title">Capacity snapshot</div><div class="card-meta">Current bed utilization across Mahi Health</div></div>'+badge("Within plan","ok")+'</div><div class="capacity"><div class="ring"><span>'+occ+'%</span><small>occupied</small></div><div class="metric-list"><div class="metric-row"><span>Available</span><div class="meter"><span style="width:'+(available/state.beds.length*100)+'%"></span></div><strong>'+available+'</strong></div><div class="metric-row"><span>Cleaning</span><div class="meter"><span style="width:'+(cleaning/state.beds.length*100)+'%"></span></div><strong>'+cleaning+'</strong></div></div></div></article></div>' +
      '<div class="grid-2" style="margin-top:14px"><article class="card"><div class="card-head"><div><div class="card-title">Live OPD queue</div><div class="card-meta">Current position by care stage</div></div><button class="btn sm" data-action="open-queue">Open queue</button></div><div class="queue-list">'+state.patients.slice(0,7).map(function (p,i) { return '<div class="queue-row" data-patient="'+p.id+'"><span>'+String(i+1).padStart(2,"0")+'</span><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+p.id+" • "+esc(p.department)+'</small></span></div><em>'+["Waiting","Vitals","Doctor","Review","Waiting","Doctor","Vitals"][i]+'</em><strong>'+ (8+i*3) +'m</strong></div>'; }).join("")+'</div></article><article class="card"><div class="card-head"><div><div class="card-title">Critical alerts</div><div class="card-meta">Signals requiring acknowledgement</div></div>'+badge("2 critical","danger")+'</div><div class="alert-list"><div class="alert-row"><b>!</b><div><strong>ED triage</strong><p>Two high-acuity arrivals are waiting for bed allocation.</p></div><time>2m</time></div><div class="alert-row"><b>!</b><div><strong>Laboratory</strong><p>Troponin result requires acknowledgement.</p></div><time>7m</time></div><div class="alert-row warn"><b>•</b><div><strong>Care Hub</strong><p>Three urgent follow-ups remain unassigned.</p></div><time>12m</time></div><div class="alert-row warn"><b>•</b><div><strong>Pharmacy</strong><p>Insulin Glargine is below reorder threshold.</p></div><time>18m</time></div></div></article></div>' +
      '<div class="service-grid">'+[["Emergency","Triage","96%","danger","emergency"],["Laboratory","Turnaround","41 min","ok","lab"],["Pharmacy","Stock health","92%","ok","pharmacy"],["Appointments","Confirmation","93%","teal","appointments"],["Care Hub","SLA","88%","ok","care"],["Billing","Collections","76%","warn","billing"]].map(function (x) { return '<button class="service-node" data-service="'+x[4]+'"><span><b>'+x[0]+'</b>'+badge(x[2],x[3])+'</span><strong>'+x[1]+'</strong><small>Open module →</small></button>'; }).join("")+'</div>' +
      '<div class="grid-2" style="margin-top:14px"><article class="image-panel"><div class="hero-backup"></div><img class="img" src="'+IMAGE.team+'" alt=""><div class="image-copy"><div class="eyebrow">MAHI HEALTH</div><h3>Keep every handoff visible.</h3><p>Operational context follows a patient across teams and services.</p></div></article><article class="card"><div class="card-head"><div><div class="card-title">Recent activity</div><div class="card-meta">Live updates change only small fields.</div></div>'+badge(state.live?"Streaming":"Paused",state.live?"teal":"warn")+'</div><div id="activityFeed" class="activity-list">'+activityFeed()+"</div></article></div>";

    wire(); bindImages(); bindPatientRows(); bindServices();
  }

  function renderPatients() {
    var q=state.patientQuery.toLowerCase();
    var rows=state.patients.filter(function (p) { return (!q || (p.name+" "+p.id+" "+p.condition+" "+p.department).toLowerCase().indexOf(q)>-1) && (state.patientStatus==="All" || p.status===state.patientStatus); });
    $("#view-patients").innerHTML =
      heading("PATIENT OPERATIONS","Patients","Search Mahi Health synthetic records, surface risk and open a connected Patient 360 view.",'<button class="btn primary" data-action="new-patient">+ New patient</button>') +
      '<div class="toolbar"><input id="patientSearch" class="input" placeholder="Search name, ID, condition or department…" value="'+esc(state.patientQuery)+'"><div class="filters">'+["All","Active","Stable","Needs Attention"].map(function (s) { return '<button class="filter '+(state.patientStatus===s?"active":"")+'" data-status="'+s+'">'+s+"</button>"; }).join("")+'</div><button class="btn sm" data-action="export-patients">Export CSV</button></div>' +
      '<div class="table-wrap card"><table><thead><tr><th>Patient</th><th>Status</th><th>Risk</th><th>Provider</th><th>Last visit</th><th>Next visit</th><th>Attendance</th></tr></thead><tbody>'+rows.map(function (p) { return '<tr data-open-patient="'+p.id+'"><td><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+p.id+" • "+p.age+"y • "+esc(p.condition)+'</small></span></div></td><td>'+badge(p.status,p.status==="Needs Attention"?"warn":"ok")+'</td><td>'+badge(p.risk+" risk",p.risk==="High"?"danger":p.risk==="Medium"?"warn":"ok")+'</td><td>'+esc(p.provider)+'</td><td>'+dateText(p.lastVisit)+'</td><td>'+dateText(p.nextVisit)+'</td><td><strong>'+p.attendance+'%</strong></td></tr>'; }).join("")+'</tbody></table></div>';
    $("#patientSearch").oninput=function (e) { state.patientQuery=e.target.value; renderPatients(); };
    $$("[data-status]").forEach(function (b) { b.onclick=function () { state.patientStatus=b.dataset.status; renderPatients(); }; });
    $$("[data-open-patient]").forEach(function (r) { r.onclick=function () { openPatient(r.dataset.openPatient); }; });
    wire();
  }

  function openPatient(id) {
    state.selectedPatient=id; DB.set("selectedPatient",id); navigate("patient360");
  }

  function renderPatient360() {
    var p=state.patients.filter(function (x) { return x.id===state.selectedPatient; })[0] || state.patients[0];
    $("#view-patient360").innerHTML =
      heading("PATIENT 360","Connected Patient View","Identity, journey, results, medications and follow-up context.",'<button class="btn" data-action="back-patients">← Patients</button><button class="btn primary" data-action="new-task">+ Care task</button>') +
      '<div class="patient-hero"><b class="patient-hero-avatar">'+initials(p.name)+'</b><div><div class="eyebrow">ACTIVE CARE PROFILE</div><h2>'+esc(p.name)+'</h2><p>'+p.id+" • "+p.age+"y • "+esc(p.condition)+" • "+esc(p.department)+'</p></div><div class="patient-hero-tags">'+badge(p.status,"ok")+badge(p.risk+" risk",p.risk==="High"?"danger":"warn")+'</div></div>' +
      '<div class="grid-3"><article class="card"><div class="card-title">Care overview</div><div class="mini-grid"><div class="mini-stat"><span>Attendance</span><strong>'+p.attendance+'%</strong><em>historical</em></div><div class="mini-stat"><span>Next visit</span><strong>'+dateText(p.nextVisit)+'</strong><em>scheduled</em></div></div><div class="section-sub">Primary provider</div><strong>'+esc(p.provider)+'</strong></article><article class="card"><div class="card-title">Latest results</div><div class="activity-list"><div class="activity-row"><b>△</b><span><strong>CBC panel</strong><small>Within expected range</small></span><time>8m</time></div><div class="activity-row"><b>△</b><span><strong>HbA1c</strong><small>Review with provider</small></span><time>14m</time></div></div></article><article class="card"><div class="card-title">Current medications</div><div class="metric-list"><div class="setting-row"><span><strong>Metformin 500 mg</strong><small>Twice daily</small></span>'+badge("Active","teal")+'</div><div class="setting-row"><span><strong>Amlodipine 10 mg</strong><small>Once daily</small></span>'+badge("Active","teal")+'</div></div></article></div>' +
      '<div class="grid-2" style="margin-top:14px"><article class="card"><div class="card-head"><div class="card-title">Patient journey</div><span class="card-meta">Last 30 days</span></div><div class="journey">'+["Registration","Consultation","Lab tests","Care plan","Follow-up"].map(function (x,i) { return '<div class="journey-step '+(i<4?"done":"")+'"><b>'+(i<4?"✓":"")+'</b><strong>'+x+'</strong><small>'+(i<4?"Completed":"Next step")+"</small></div>"; }).join("")+'</div></article><article class="image-panel"><div class="hero-backup"></div><img class="img" src="'+IMAGE.care+'" alt=""><div class="image-copy"><div class="eyebrow">CONNECTED CARE</div><h3>Context follows the patient.</h3><p>One operational view across every touchpoint.</p></div></article></div>';
    wire(); bindImages();
  }

  function simpleTable(title, sub, headCells, rows) {
    return '<div class="card"><div class="card-head"><div><div class="card-title">'+title+'</div><div class="card-meta">'+sub+'</div></div></div><div class="table-wrap"><table><thead><tr>'+headCells.map(function (h) { return "<th>"+h+"</th>"; }).join("")+"</tr></thead><tbody>"+rows.join("")+"</tbody></table></div></div>";
  }

  function renderAppointments() {
    var t=today(), list=state.appointments.filter(function (a) { return a.date>=t; }).sort(function(a,b){return (a.date+a.time).localeCompare(b.date+b.time);}).slice(0,26);
    $("#view-appointments").innerHTML=heading("SCHEDULING","Appointments","Forward schedule, confirmation health and provider demand.",'<button class="btn" data-action="refresh">↻ Sync</button><button class="btn primary" data-action="new-appointment">+ New appointment</button>') +
      '<div class="grid-3"><article class="card"><div class="card-title">Booked today</div><strong class="big-number">'+state.appointments.filter(function(a){return a.date===t;}).length+'</strong>'+badge("Live","ok")+'</article><article class="card"><div class="card-title">Confirmation rate</div><strong class="big-number">93%</strong><div class="meter"><span style="width:93%"></span></div></article><article class="card"><div class="card-title">No-show risk</div><strong class="big-number">8.4%</strong>'+badge("Watch","warn")+'</article></div>' +
      simpleTable("Forward schedule","Today through the next twelve days",["Date","Time","Patient","Provider","Type","Status"],list.map(function(a){return "<tr><td>"+dateText(a.date)+"</td><td><strong>"+a.time+"</strong></td><td>"+esc(a.patient)+"</td><td>"+esc(a.provider)+"</td><td>"+a.type+"</td><td>"+badge(a.status,a.status==="Confirmed"?"ok":"info")+"</td></tr>";}));
    wire();
  }

  function renderQueue() {
    $("#view-queue").innerHTML=heading("PATIENT FLOW","Live OPD Queue","Track wait pressure, care stage and the next patient action.",'<button class="btn" data-action="refresh">↻ Sync queue</button><button class="btn primary" data-action="open-emergency">Emergency</button>') +
      '<div class="kpi-grid">'+kpi("Waiting","27","14 min average","gold","≡")+kpi("Vitals","8","2 rooms available","blue","♥")+kpi("With doctor","11","Steady flow","teal","⚕")+kpi("Review","6","4 ready to close","green","✓")+'</div>' +
      '<div class="grid-2"><article class="card"><div class="card-head"><div><div class="card-title">Current queue</div><div class="card-meta">Priority ordered</div></div>'+badge("LIVE","ok")+'</div><div class="queue-list">'+state.patients.slice(0,12).map(function(p,i){return '<div class="queue-row" data-open="'+p.id+'"><span>'+String(i+1).padStart(2,"0")+'</span><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+p.id+" • "+esc(p.department)+'</small></span></div><em>'+["Waiting","Vitals","Doctor","Review"][i%4]+'</em><strong>'+(8+i*2)+'m</strong></div>';}).join("")+'</div></article><article class="card"><div class="card-head"><div class="card-title">Flow health</div>'+badge("Stable","ok")+'</div><div class="metric-list">'+[["Front desk",82],["Vitals",69],["Consult",76],["Review",58]].map(function(x){return '<div class="metric-row"><span>'+x[0]+'</span><div class="meter"><span style="width:'+x[1]+'%"></span></div><strong>'+x[1]+'%</strong></div>';}).join("")+'</div><div class="card inset"><div class="card-title">Next pressure point</div><p>General Medicine has the highest wait concentration in this portfolio scenario.</p></div></article></div>';
    $$("[data-open]").forEach(function(r){r.onclick=function(){openPatient(r.dataset.open);};});wire();
  }

  function renderEmergency() {
    var rows=state.patients.slice(0,10).map(function(p,i){return '<tr><td><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+p.id+" • "+esc(p.condition)+'</small></span></div></td><td>'+badge(["Critical","High","High","Medium"][i%4],i%4===0?"danger":"warn")+'</td><td><strong>'+(6+i*3)+" min</strong></td><td>"+["ICU","General","Cardiology","Observation"][i%4]+"</td><td>"+badge(["Waiting bed","Doctor ready","Vitals","Assigned"][i%4],i%4===0?"danger":"info")+"</td></tr>";});
    $("#view-emergency").innerHTML=heading("EMERGENCY","Emergency & Triage","High-priority view for acuity, waiting, destination and bed readiness.",'<button class="btn" data-action="refresh">↻ Sync</button><button class="btn primary" data-action="new-emergency">+ Register arrival</button>') +
      '<div class="kpi-grid">'+kpi("Arrivals today","58","+9% vs yesterday","red","⚕")+kpi("High acuity","7","2 critical","red","!")+kpi("Average wait","14 min","3 min improvement","teal","◷")+kpi("Ready beds","11","4 ICU • 7 general","green","▦")+'</div>' +
      simpleTable("Triage board","Highest-acuity synthetic arrivals first",["Patient","Acuity","Wait","Destination","State"],rows);
    wire();
  }

  function renderCare() {
    var stages=["New","Assigned","In Progress","Waiting","Resolved"];
    $("#view-care").innerHTML=heading("CARE COORDINATION","Care Hub","Visible handoffs and follow-up work organized as a simple pipeline.",'<button class="btn primary" data-action="new-care">+ New coordination item</button>') +
      '<div class="grid-4">'+kpi("Open items",state.care.filter(function(x){return x.stage!=="Resolved";}).length,"Across teams","blue","♡")+kpi("Urgent",state.care.filter(function(x){return x.priority==="Urgent";}).length,"Needs assignment","red","!")+kpi("Resolved today","14","+18%","green","✓")+kpi("Median age","3.6h","Target < 6h","gold","◷")+'</div>' +
      '<div class="kanban">'+stages.map(function(s){var cards=state.care.filter(function(c){return c.stage===s;});return '<div class="kanban-col"><div class="kanban-head"><strong>'+s+'</strong><span>'+cards.length+'</span></div>'+cards.slice(0,7).map(function(c){return '<button class="kanban-card"><strong>'+esc(c.issue)+'</strong><span>'+esc(c.patient)+'</span><div class="kanban-foot">'+badge(c.priority,c.priority==="Urgent"?"danger":c.priority==="High"?"warn":"teal")+'<small>'+c.age+'m</small></div></button>';}).join("")+'</div>';}).join("")+'</div>';
    wire();
  }

  function renderClinical() {
    $("#view-clinical").innerHTML=heading("CLINICAL","Clinical Monitor","Simulated telemetry cards for an operations-focused portfolio experience.",'<button class="btn" data-action="refresh">↻ Sync vitals</button>') +
      '<div class="grid-4">'+kpi("Monitored","40","Active beds","blue","♥")+kpi("Stable","33","Within range","green","✓")+kpi("Attention","5","Review queue","gold","!")+kpi("Critical","2","Priority response","red","!")+'</div>' +
      '<div class="monitor-grid">'+state.patients.slice(0,8).map(function(p,i){var bpm=68+Math.round(Math.sin((state.tick+i)*.37)*4),o2=96+i%3,attention=i===4||i===6;return '<article class="vital-card"><div class="vital-head"><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+p.id+" • "+esc(p.department)+'</small></span></div><b class="heart">♥</b></div><strong class="big-number">'+bpm+'</strong><div class="section-sub">BPM • heart rate</div><div class="vital-line"><span style="width:13%"></span><span style="width:18%"></span><span style="width:12%"></span><span style="width:20%"></span><span style="width:17%"></span><span style="width:20%"></span></div><div class="vital-foot"><span>SpO₂ '+o2+'%</span><span>Temp 98.'+(i+1)+'°F</span>'+badge(attention?"Attention":"Stable",attention?"warn":"ok")+'</div></article>';}).join("")+'</div>';
    wire();
  }

  function renderProviders() {
    $("#view-providers").innerHTML=heading("CARE TEAM","Providers","Specialty coverage, appointment load and capacity across the Mahi Health network.",'<button class="btn" data-action="invite-provider">Invite provider</button>') +
      '<div class="grid-3">'+state.providers.map(function(p){var load=Math.min(100,Math.round(p.today/p.capacity*100));return '<article class="card"><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+esc(p.specialty)+" • "+esc(p.location)+'</small></span>'+badge(p.status,load>85?"warn":"ok")+'</div><div class="metric-list provider-metrics"><div class="metric-row"><span>Today</span><div class="meter"><span style="width:'+load+'%"></span></div><strong>'+load+'%</strong></div><div class="metric-row"><span>Panel</span><div class="meter"><span style="width:'+p.load+'%"></span></div><strong>'+p.load+'%</strong></div></div></article>';}).join("")+'</div>';
    wire();
  }

  function renderBeds() {
    var c={Occupied:0,Available:0,Cleaning:0,Isolation:0};state.beds.forEach(function(b){c[b.status]++;});
    $("#view-beds").innerHTML=heading("CAPACITY","Bed Board","Hospital-style occupancy visibility for wards, cleaning and ready capacity.",'<button class="btn" data-action="refresh">↻ Sync beds</button>') +
      '<div class="kpi-grid">'+kpi("Total beds",state.beds.length,"Four wards","blue","▤")+kpi("Occupied",c.Occupied+c.Isolation,"Including isolation","teal","●")+kpi("Available",c.Available,"Ready now","green","✓")+kpi("Cleaning",c.Cleaning,"Turnaround queue","gold","↻")+'</div>' +
      '<div class="card"><div class="card-head"><div class="card-title">Ward board</div>'+badge("Synthetic capacity","info")+'</div><div class="bed-grid">'+state.beds.map(function(b){return '<button class="bed '+b.status.toLowerCase()+'" data-bed="'+b.id+'"><div class="bed-top"><span>'+b.ward+'</span><span>'+(b.status==="Available"?"READY":"LIVE")+'</span></div><div class="bed-id">'+b.id+'</div><div class="bed-patient">'+esc(b.patient||"No patient assigned")+'</div><div class="bed-state">'+b.status+'</div></button>';}).join("")+'</div></div>';
    $$("[data-bed]").forEach(function(b){b.onclick=function(){var x=state.beds.filter(function(v){return v.id===b.dataset.bed;})[0];toast(x.id+" • "+x.status);};});wire();
  }

  function renderLab() {
    $("#view-lab").innerHTML=heading("LABORATORY","Laboratory","Turnaround, critical results and acknowledgement work.",'<button class="btn primary" data-action="new-lab">+ New lab order</button>') +
      '<div class="kpi-grid">'+kpi("Orders today","64","+6%","blue","△")+kpi("Median TAT","41 min","Target < 50 min","teal","◷")+kpi("Critical results","3","Await acknowledgement","red","!")+kpi("Completed","91%","+4 points","green","✓")+'</div>' +
      '<div class="grid-2"><article class="card"><div class="card-head"><div class="card-title">Turnaround trend</div>'+badge("Current day","info")+'</div><div class="simple-bars">'+[43,51,48,56,44,41,39].map(function(v){return '<span style="height:'+v+'%"></span>';}).join("")+'</div></article><article class="card"><div class="card-head"><div class="card-title">Critical queue</div>'+badge("3 pending","danger")+'</div><div class="alert-list"><div class="alert-row"><b>!</b><div><strong>Troponin I</strong><p>Cardiology • acknowledgement pending</p></div><time>7m</time></div><div class="alert-row warn"><b>!</b><div><strong>Potassium</strong><p>Internal Medicine • review requested</p></div><time>14m</time></div><div class="alert-row warn"><b>!</b><div><strong>HbA1c</strong><p>General Medicine • review requested</p></div><time>18m</time></div></div></article></div>';
    wire();
  }

  function renderPharmacy() {
    $("#view-pharmacy").innerHTML=heading("PHARMACY","Medication & Stock","Medication availability, reorder pressure and dispensing throughput.",'<button class="btn primary" data-action="new-stock">+ Add stock entry</button>') +
      '<div class="kpi-grid">'+kpi("Stock health","92%","+2.1%","green","◉")+kpi("Low stock","1","Reorder today","red","!")+kpi("Dispensed today","182","Stable throughput","blue","✓")+kpi("Pending orders","14","Next dispatch","gold","◷")+'</div>' +
      simpleTable("Inventory position","Live synthetic inventory",["Item","Category","Stock","Reorder","Health"],state.inventory.map(function(i){return '<tr><td><strong>'+esc(i.name)+'</strong></td><td>'+esc(i.category)+'</td><td>'+i.stock+" "+i.unit+"</td><td>"+i.reorder+"</td><td>"+badge(i.stock<i.reorder?"Reorder":"Healthy",i.stock<i.reorder?"danger":"ok")+"</td></tr>";}));
    wire();
  }

  function renderBilling() {
    $("#view-billing").innerHTML=heading("REVENUE CYCLE","Billing & Collections","Invoices, payer mix and collection risk.",'<button class="btn primary" data-action="new-invoice">+ New invoice</button>') +
      '<div class="kpi-grid">'+kpi("Collections MTD","₹42.8L","+8.2%","green","₹")+kpi("Outstanding","₹8.6L","12 high-risk accounts","red","!")+kpi("Claims in review","34","Median age 2.8d","gold","▥")+kpi("Collection rate","91.4%","+2.1 pts","blue","↗")+'</div>' +
      '<div class="grid-2"><article class="card"><div class="card-title">Collection trend</div><div class="simple-bars">'+[42,56,48,63,71,66,78].map(function(v){return '<span style="height:'+v+'%"></span>';}).join("")+'</div></article><article class="card"><div class="card-title">Revenue mix</div><div class="metric-list"><div class="metric-row"><span>Insurance</span><div class="meter"><span style="width:62%"></span></div><strong>62%</strong></div><div class="metric-row"><span>Self pay</span><div class="meter"><span style="width:23%"></span></div><strong>23%</strong></div><div class="metric-row"><span>Corporate</span><div class="meter"><span style="width:15%"></span></div><strong>15%</strong></div></div></article></div>' +
      simpleTable("Recent invoices","Current synthetic revenue records",["Invoice","Patient","Amount","Payer","Status"],state.invoices.map(function(i){return '<tr><td><strong>'+i.id+'</strong></td><td>'+esc(i.patient)+'</td><td>₹'+Number(i.amount).toLocaleString("en-IN")+'</td><td>'+i.payer+'</td><td>'+badge(i.status,i.status==="Paid"?"ok":i.status==="Review"?"warn":"info")+'</td></tr>';}) );
    wire();
  }

  function renderMessages() {
    var m=state.messages[state.conversation] || state.messages[0];
    $("#view-messages").innerHTML=heading("COMMUNICATIONS","Messages","Care coordination conversations stay next to operational work.",'<button class="btn primary" data-action="new-message">+ New message</button>') +
      '<div class="message-layout"><div class="conversation-list">'+state.messages.map(function(x,i){return '<button class="conversation '+(i===state.conversation?"active":"")+'" data-conversation="'+i+'"><b class="avatar">'+initials(x.name)+'</b><span><strong>'+esc(x.name)+'</strong><small>'+esc(x.role)+'</small></span>'+(x.unread?badge(x.unread,"danger"):"")+'</button>';}).join("")+'</div><div class="chat"><div class="chat-head"><strong>'+esc(m.name)+'</strong><small>'+esc(m.role)+' • Mahi Health</small></div><div class="chat-body">'+m.items.map(function(v){return '<div class="bubble '+v[0]+'">'+esc(v[1])+'<small>'+v[2]+"</small></div>";}).join("")+'</div><form id="messageForm" class="chat-compose"><input id="messageInput" class="input" placeholder="Write a message…"><button class="btn primary">Send</button></form></div></div>';
    $$("[data-conversation]").forEach(function(b){b.onclick=function(){state.conversation=Number(b.dataset.conversation);renderMessages();};});
    $("#messageForm").onsubmit=function(e){e.preventDefault();var value=$("#messageInput").value.trim();if(!value)return;state.messages[state.conversation].items.push(["me",value,clock().slice(0,5)]);DB.set("messages",state.messages);renderMessages();toast("Message sent");};
  }

  function renderTasks() {
    var list=state.tasks.filter(function(t){return state.taskStatus==="All" || t.status===state.taskStatus;});
    $("#view-tasks").innerHTML=heading("WORK QUEUE","Tasks","Personal and team work with owners, priority and due dates.",'<button class="btn primary" data-action="new-task">+ New task</button>') +
      '<div class="toolbar"><div class="filters">'+["All","To Do","In Progress","Completed"].map(function(s){return '<button class="filter '+(state.taskStatus===s?"active":"")+'" data-task-filter="'+s+'">'+s+"</button>";}).join("")+'</div><button class="btn sm" data-action="export-tasks">Export CSV</button></div>' +
      simpleTable("Mahi work queue","Current operational tasks",["Task","Patient","Priority","Owner","Due","Status"],list.map(function(t){return '<tr><td><strong>'+esc(t.title)+'</strong><small>'+t.id+'</small></td><td>'+esc(t.patient)+'</td><td>'+badge(t.priority,t.priority==="Urgent"?"danger":t.priority==="High"?"warn":"info")+'</td><td>'+esc(t.owner)+'</td><td>'+dateText(t.due)+'</td><td>'+badge(t.status,t.status==="Completed"?"ok":t.status==="In Progress"?"teal":"info")+'</td></tr>';}) );
    $$("[data-task-filter]").forEach(function(b){b.onclick=function(){state.taskStatus=b.dataset.taskFilter;renderTasks();};});wire();
  }

  function renderAnalytics() {
    $("#view-analytics").innerHTML=heading("OPERATIONS INTELLIGENCE","Analytics","A decision layer across demand, capacity, care SLA and service performance.",'<button class="btn" data-action="export-analytics">Export CSV</button>') +
      '<div class="grid-3">'+[["Patient flow","88%","+5.8%"],["Care SLA","91%","+2.4 pts"],["Capacity","71%","−3 pts"],["Provider utilization","78%","+4.1%"],["Lab TAT","41m","−6 min"],["Collections","91.4%","+2.1 pts"]].map(function(x){return '<article class="card"><div class="card-title">'+x[0]+'</div><strong class="big-number">'+x[1]+'</strong><div class="section-sub">'+x[2]+' vs prior period</div></article>';}).join("")+'</div>' +
      '<div class="grid-2" style="margin-top:14px"><article class="card"><div class="card-head"><div class="card-title">Patient demand</div>'+badge("12-hour","info")+'</div>'+lineChart([31,45,42,49,63,58,72,76,71,84,89,86],["06","07","08","09","10","11","12","13","14","15","16","17"])+'</article><article class="card"><div class="card-head"><div class="card-title">Department workload</div>'+badge("Current","info")+'</div><div class="simple-bars">'+[74,82,68,91,57].map(function(v){return '<span style="height:'+v+'%"></span>';}).join("")+'</div></article></div>';
    wire();
  }

  function renderAI() {
    $("#view-ai").innerHTML=heading("DECISION SUPPORT","AI Copilot","Portfolio-safe assistant over synthetic operational data. Not medical advice.",'<button class="btn" data-action="clear-ai">Clear</button>') +
      '<div class="ai-layout"><article class="card prompt-card"><div class="card-title">Suggested prompts</div>'+["Where is the queue pressure?","Which beds need attention?","What needs review in the lab?","Is pharmacy stock healthy?","How should I use Patient 360?"].map(function(p){return '<button class="prompt-btn" data-prompt="'+esc(p)+'">'+esc(p)+"</button>";}).join("")+'</article><article class="card ai-card"><div class="card-head"><div><div class="card-title">Mahi Copilot</div><div class="card-meta">Synthetic-data reasoning</div></div>'+badge("Ready","ok")+'</div><div id="aiMessages" class="ai-messages"><div class="ai-bubble bot">Hi Mahi. Ask about queue, beds, laboratory, pharmacy or patient flow.</div></div><form id="aiForm" class="chat-compose"><input id="aiInput" class="input" placeholder="Ask about queue, beds, lab, pharmacy…"><button class="btn primary">Ask ✦</button></form></article></div>';
    $$("[data-prompt]").forEach(function(b){b.onclick=function(){ $("#aiInput").value=b.dataset.prompt; askAI(); };});
    $("#aiForm").onsubmit=function(e){e.preventDefault();askAI();};wire();
  }
  function askAI(){
    var q=$("#aiInput").value.trim();if(!q)return;var l=q.toLowerCase(),r="Averis is using synthetic portfolio data. I can point you to the right operational module.";
    if(l.indexOf("queue")>-1 || l.indexOf("wait")>-1)r="The OPD queue is showing 27 waiting with an average wait around 14 minutes. General Medicine is the visible pressure point.";
    else if(l.indexOf("bed")>-1)r="Open Bed Board next. The synthetic hospital picture is around 71% occupied, with available and cleaning beds visible by ward.";
    else if(l.indexOf("lab")>-1 || l.indexOf("troponin")>-1)r="Laboratory has three critical acknowledgement items in the simulation. Troponin is the highest-priority review signal.";
    else if(l.indexOf("pharmacy")>-1 || l.indexOf("stock")>-1)r="Pharmacy is healthy overall, but Insulin Glargine is below reorder level.";
    else if(l.indexOf("patient")>-1)r="Use Patients to search, then Patient 360 to see the selected care journey, results and follow-up context.";
    $("#aiMessages").insertAdjacentHTML("beforeend",'<div class="ai-bubble user">'+esc(q)+'</div><div class="ai-bubble bot">'+esc(r)+'<div class="confidence">Portfolio data only • verify before clinical use.</div></div>');
    $("#aiInput").value="";
    $("#aiMessages").scrollTop=$("#aiMessages").scrollHeight;
  }

  function renderReports() {
    var reports=[["Daily Operations","Appointments, patient flow, care load and alerts."],["Care Coordination","Open items and cycle-time signals."],["Capacity & Beds","Occupancy, available beds and cleaning turnaround."],["Provider Workload","Panel size and utilization."],["Laboratory TAT","Turnaround and critical-result queue."],["Medication Inventory","Stock position and reorder pressure."]];
    $("#view-reports").innerHTML=heading("REPORTING","Reports","Exportable operational views generated from synthetic workspace data.",'<button class="btn primary" data-action="export-all">Export current data</button>') +
      '<div class="report-grid">'+reports.map(function(r){return '<article class="card report-card">'+badge("CSV ready","info")+'<h3>'+r[0]+'</h3><p>'+r[1]+'</p><button class="btn sm" data-report="'+esc(r[0])+'">Generate</button></article>';}).join("")+'</div>';
    $("[data-report]").forEach(function(b){b.onclick=function(){var report=b.dataset.report;var rows=[];if(report==="Daily Operations")rows=[{metric:"Patients",value:state.patients.length},{metric:"Appointments",value:state.appointments.length},{metric:"Beds",value:state.beds.length}];else if(report==="Care Coordination")rows=state.care.map(function(x){return {id:x.id,stage:x.stage,priority:x.priority,patient:x.patient};});else if(report==="Capacity & Beds")rows=state.beds.map(function(x){return {id:x.id,ward:x.ward,status:x.status,patient:x.patient};});else if(report==="Provider Workload")rows=state.providers.map(function(x){return {id:x.id,name:x.name,specialty:x.specialty,load:x.load,today:x.today,capacity:x.capacity};});else if(report==="Laboratory TAT")rows=[{median_tat:"41 min",critical_results:3,completed_rate:"91%"}];else rows=state.inventory.map(function(x){return {item:x.name,category:x.category,stock:x.stock,reorder:x.reorder};});exportCsv("mahi-averis-"+report.toLowerCase().replace(/[^a-z0-9]+/g,"-")+".csv",rows);};});wire();
  }

  function renderSettings() {
    var p=currentProfile();
    $("#view-settings").innerHTML=heading("SYSTEM","Mahi Workspace","Profile, theme, live simulation and portfolio data controls.") +
      '<div class="settings-layout"><div class="settings-nav"><div class="settings-tab active">Workspace</div><div class="settings-tab">Appearance</div><div class="settings-tab">Data</div><div class="settings-tab">Access</div></div><article class="card"><div class="card-head"><div><div class="card-title">Workspace identity</div><div class="card-meta">Owned and presented as Mahi’s healthcare portfolio product.</div></div>'+badge("Local profile","info")+'</div><div class="setting-row"><span><strong>Profile name</strong><small>'+esc(p ? p.name : "Mahi")+'</small></span><button class="btn sm" data-action="edit-profile">Edit</button></div><div class="setting-row"><span><strong>Live operations stream</strong><small>Clock and freshness update without hiding page content.</small></span><button id="liveToggle" class="toggle '+(state.live?"on":"")+'"><i></i></button></div><div class="setting-row"><span><strong>Theme</strong><small>Clinical light or deep clinical dark.</small></span><button id="settingsTheme" class="btn sm">'+(state.theme==="dark"?"Use light":"Use dark")+' theme</button></div><div class="setting-row"><span><strong>Data boundary</strong><small>Synthetic records only. No real patient information.</small></span>'+badge("Synthetic","warn")+'</div><div class="setting-row"><span><strong>Sign out</strong><small>End the browser-local session.</small></span><button class="btn danger" data-action="logout">Sign out</button></div></article></div>';
    $("#liveToggle").onclick=function(){state.live=!state.live;DB.set("live",state.live);renderSettings();};
    $("#settingsTheme").onclick=toggleTheme;
    wire();
  }

  function currentProfile(){return DB.get("profile",null);}
  function hashPassword(value){return crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)).then(function(buf){return Array.from(new Uint8Array(buf)).map(function(x){return x.toString(16).padStart(2,"0");}).join("");});}
  function authMode(mode){var create=mode==="create";$$(".auth-tab").forEach(function(b){b.classList.toggle("active",b.dataset.authMode===mode);});$("#signinForm").classList.toggle("hidden",create);$("#createForm").classList.toggle("hidden",!create);$("#authTitle").textContent=create?"Create your Mahi profile":"Enter Averis";$("#authSubtitle").textContent=create?"Your profile stays in this browser.":"Open Mahi’s care operations workspace";}
  function message(id,text,good){var n=$("#"+id);if(n){n.textContent=text;n.classList.toggle("good",!!good);}}
  function showApp(profile){$("#authGate").classList.add("hidden");$("#appShell").classList.remove("hidden");$("#profileName").textContent=profile.name;$("#profileAvatar").textContent=initials(profile.name);$(".top-profile b").textContent=profile.name;$(".workspace-switcher strong").textContent=profile.name+" Health";}
  function showAuth(){document.body.classList.add("app-ready");$("#authGate").classList.remove("hidden");$("#appShell").classList.add("hidden");authMode("signin");}

  function signIn(e){
    e.preventDefault();var email=$("#signinEmail").value.trim().toLowerCase(),pwd=$("#signinPassword").value,p=currentProfile();
    if(!email||!pwd){message("signinMessage","Enter email and password.");return;}
    if(!p||p.email!==email){message("signinMessage","No Mahi profile found for this email.");return;}
    hashPassword(pwd).then(function(hash){if(hash!==p.passwordHash){message("signinMessage","Password does not match this profile.");return;}DB.set("session",{email:p.email});showApp(p);navigate(state.view,true);toast("Welcome back, "+p.name);});
  }

  function createProfile(e){
    e.preventDefault();var name=$("#createName").value.trim(),email=$("#createEmail").value.trim().toLowerCase(),pwd=$("#createPassword").value,confirm=$("#createConfirm").value;
    if(name.length<2){message("createMessage","Enter your name.");return;} if(!/^\S+@\S+\.\S+$/.test(email)){message("createMessage","Enter a valid email.");return;} if(pwd.length<6){message("createMessage","Use at least 6 characters.");return;} if(pwd!==confirm){message("createMessage","Passwords do not match.");return;} if(!$("#createTerms").checked){message("createMessage","Confirm the local portfolio notice.");return;}
    hashPassword(pwd).then(function(hash){var p={name:name,email:email,passwordHash:hash,createdAt:Date.now()};DB.set("profile",p);DB.set("session",{email:email});showApp(p);navigate("overview",true);toast("Mahi profile created");});
  }

  function openCommand(){
    $("#commandRoot").innerHTML='<div class="command-layer" id="commandLayer"><div class="command-box"><input id="commandInput" class="command-input" autofocus placeholder="Search patients, modules, tasks…"><div id="commandResults" class="command-results"></div></div></div>';
    var input=$("#commandInput"),result=$("#commandResults"),items=state.patients.slice(0,12).map(function(p){return {title:p.name,type:"Patient",run:function(){state.selectedPatient=p.id;DB.set("selectedPatient",p.id);closeCommand();navigate("patient360");}};}).concat(NAV.flatMap(function(g){return g[1];}).map(function(v){return {title:v[1],type:"Module",run:function(){closeCommand();navigate(v[0]);}};}));
    function paint(){var q=input.value.toLowerCase(),m=items.filter(function(x){return (x.title+" "+x.type).toLowerCase().indexOf(q)>-1;}).slice(0,18);result.innerHTML=m.map(function(x,i){return '<button class="command-item" data-index="'+i+'"><i>⌕</i><b>'+esc(x.title)+'</b><span>'+x.type+"</span></button>";}).join("");$$("[data-index]",result).forEach(function(b,i){b.onclick=m[i].run;});}
    input.oninput=paint;input.onkeydown=function(e){if(e.key==="Escape")closeCommand();if(e.key==="Enter" && $(".command-item",result))$(".command-item",result).click();};$("#commandLayer").onclick=function(e){if(e.target.id==="commandLayer")closeCommand();};paint();
  }

  function closeCommand(){$("#commandRoot").innerHTML="";}
  function currentRender(){var fn={overview:renderOverview,patients:renderPatients,patient360:renderPatient360,appointments:renderAppointments,queue:renderQueue,emergency:renderEmergency,care:renderCare,clinical:renderClinical,providers:renderProviders,beds:renderBeds,lab:renderLab,pharmacy:renderPharmacy,billing:renderBilling,messages:renderMessages,tasks:renderTasks,analytics:renderAnalytics,ai:renderAI,reports:renderReports,settings:renderSettings}[state.view] || renderOverview;fn();}
  function routeLabel(v){var all=NAV.flatMap(function(g){return g[1];});var match=all.filter(function(x){return x[0]===v;})[0];return match?match[1]:"Command Center";}
  function renderNav(){$("#sideNav").innerHTML=NAV.map(function(g){return '<div class="nav-group">'+g[0]+"</div>"+g[1].map(function(v){return '<button class="nav-link '+(v[0]===state.view?"active":"")+'" data-route="'+v[0]+'"><span class="nav-symbol">'+v[2]+'</span><span>'+v[1]+'</span>'+(v[0]==="queue"?'<em>27</em>':v[0]==="messages"?'<em>6</em>':"")+"</button>";}).join("");}).join("");$$("[data-route]").forEach(function(b){b.onclick=function(){navigate(b.dataset.route);};});}
  function navigate(v,silent){if(!$("#view-"+v))v="overview";state.view=v;if(!silent)history.replaceState(null,"","#"+v);$$(".view").forEach(function(x){x.classList.toggle("active",x.id==="view-"+v);});$("#routeName").textContent=routeLabel(v);renderNav();currentRender();if(innerWidth<961)$("#sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});}
  function bindPatientRows(){$$("[data-patient]").forEach(function(r){r.onclick=function(){openPatient(r.dataset.patient);};});}
  function bindServices(){var map={emergency:"emergency",lab:"lab",pharmacy:"pharmacy",appointments:"appointments",care:"care",billing:"billing"};$$("[data-service]").forEach(function(b){b.onclick=function(){navigate(map[b.dataset.service]||"overview");};});}
  function bindImages(){$$("img").forEach(function(img){if(img.dataset.bound)return;img.dataset.bound="1";img.onerror=function(){img.classList.add("failed");};});}
  function wire(root){$$("[data-action]",root||document).forEach(function(b){b.onclick=function(){action(b.dataset.action);};});}
  function action(a){
    var modalMap={"new-patient":"patient","new-appointment":"appointment","new-task":"task","new-care":"care","new-emergency":"emergency","new-invoice":"invoice","new-stock":"stock","new-lab":"lab","new-message":"message","invite-provider":"provider"};
    if(modalMap[a]){openForm(modalMap[a]);return;}
    if(a==="open-ai")return navigate("ai"); if(a==="open-emergency")return navigate("emergency"); if(a==="open-queue")return navigate("queue"); if(a==="back-patients")return navigate("patients");
    if(a==="refresh"){state.tick++;updateLive();toast("Mahi workspace synchronized");return;}
    if(a==="export-patients")return exportCsv("mahi-averis-patients.csv",state.patients);
    if(a==="export-tasks")return exportCsv("mahi-averis-tasks.csv",state.tasks);
    if(a==="export-invoices")return exportCsv("mahi-averis-invoices.csv",state.invoices);
    if(a==="export-analytics")return exportCsv("mahi-averis-analytics.csv",[{metric:"Patient flow",value:"88%"},{metric:"Care SLA",value:"91%"},{metric:"Capacity",value:"71%"},{metric:"Provider utilization",value:"78%"}]);
    if(a==="export-all")return exportCsv("mahi-averis-summary.csv",[{patients:state.patients.length,appointments:state.appointments.length,beds:state.beds.length,tasks:state.tasks.length,careItems:state.care.length}]);
    if(a==="invite-provider")return toast("Provider invite workspace opened");
    if(a==="logout"){DB.remove("session");location.reload();return;}
    if(a==="edit-profile"){openForm("profile");return;}
    if(a==="clear-ai"){navigate("ai");setTimeout(function(){if($("#aiMessages"))$("#aiMessages").innerHTML='<div class="ai-bubble bot">Hi Mahi. Ask about queue, beds, laboratory, pharmacy or patient flow.</div>';},0);}
  }

  function formFields(type){
    var patientNames=state.patients.map(function(p){return p.name;}), providerNames=state.providers.map(function(p){return p.name;});
    return {
      patient:[["name","Patient name","text","Mahi Patient"],["age","Age","number","30"],["condition","Primary condition","text","Routine review"],["department","Department","select",departments]],
      appointment:[["patient","Patient","select",patientNames],["provider","Provider","select",providerNames],["date","Date","date",today()],["time","Time","time","10:30"],["type","Visit type","select",["Consultation","Follow-up","Screening","Review"]]],
      task:[["title","Task","text",""],["patient","Patient","select",patientNames],["priority","Priority","select",["Low","Medium","High","Urgent"]],["due","Due date","date",today()]],
      care:[["issue","Issue","text",""],["patient","Patient","select",patientNames],["priority","Priority","select",["Normal","High","Urgent"]],["stage","Stage","select",["New","Assigned","In Progress","Waiting"]]],
      emergency:[["name","Patient name","text",""],["acuity","Acuity","select",["Critical","High","Medium","Low"]],["destination","Destination","select",["ICU","General","Cardiology","Observation"]]],
      invoice:[["patient","Patient","select",patientNames],["amount","Amount (₹)","number","10000"],["payer","Payer","select",["Insurance","Self pay","Corporate"]],["status","Status","select",["Pending","Paid","Review"]]],
      stock:[["name","Medication","text",""],["category","Category","text","Medication"],["stock","Stock","number","30"],["reorder","Reorder level","number","20"]],
      lab:[["patient","Patient","select",patientNames],["test","Test","select",["CBC","HbA1c","Troponin I","Lipid profile"]],["priority","Priority","select",["Routine","High","Critical"]]],
      message:[["recipient","Recipient","select",state.messages.map(function(m){return m.name;})],["body","Message","textarea",""]],
      provider:[["name","Provider name","text",""],["specialty","Specialty","select",departments],["location","Location","text","North Tower"]],
      profile:[["name","Profile name","text",currentProfile() ? currentProfile().name : "Mahi"]]
    }[type];
  }

  function openForm(type){
    var titles={patient:"Register patient",appointment:"New appointment",task:"New task",care:"New care item",emergency:"Register emergency arrival",invoice:"New invoice",stock:"Stock entry",lab:"Laboratory order",message:"New message",provider:"Add provider",profile:"Edit Mahi profile"};
    var subs={patient:"Create a synthetic patient record.",appointment:"Add a synthetic appointment to the schedule.",task:"Add an operational work item.",care:"Create a care-coordination handoff.",emergency:"Register a synthetic ED arrival.",invoice:"Create a synthetic revenue record.",stock:"Add a synthetic pharmacy item.",lab:"Create a synthetic lab order.",message:"Prepare a local coordination message.",provider:"Add a synthetic member to the care team.",profile:"Change the local profile name."};
    var fields=formFields(type);
    $("#modalRoot").innerHTML='<div class="modal-layer" id="modalLayer"><form id="modalForm" class="modal-card"><div class="modal-head"><div><div class="modal-title">'+titles[type]+'</div><div class="modal-sub">'+subs[type]+'</div></div><button type="button" class="round-btn" data-close>×</button></div><div class="modal-body"><div class="form-grid">'+fields.map(function(f){if(f[2]==="select")return '<div class="field"><label>'+f[1]+'<select name="'+f[0]+'">'+f[3].map(function(v){return '<option>'+esc(v)+"</option>";}).join("")+"</select></label></div>";if(f[2]==="textarea")return '<div class="field wide"><label>'+f[1]+'<textarea name="'+f[0]+'" placeholder="'+esc(f[3])+'"></textarea></label></div>';return '<div class="field"><label>'+f[1]+'<input required name="'+f[0]+'" type="'+f[2]+'" value="'+esc(f[3])+'"></label></div>';}).join("")+'</div></div><div class="modal-foot"><button type="button" class="btn" data-close>Cancel</button><button type="submit" class="btn primary">Save change</button></div></form></div>';
    $$("[data-close]",$("#modalRoot")).forEach(function(b){b.onclick=closeModal;});
    $("#modalForm").onsubmit=function(e){e.preventDefault();var values=Object.fromEntries(new FormData(e.currentTarget));closeModal();saveForm(type,values);};
  }
  function closeModal(){$("#modalRoot").innerHTML="";}

  function saveForm(type,v){
    if(type==="profile"){var p=currentProfile()||{};p.name=(v.name||"Mahi").trim()||"Mahi";DB.set("profile",p);showApp(p);renderSettings();toast("Mahi profile updated");return;}
    if(type==="patient"){state.patients.unshift({id:"AV-"+between(30000,39999),name:v.name,age:Number(v.age),condition:v.condition,department:v.department,provider:state.providers[0].name,status:"Active",risk:"Low",attendance:100,lastVisit:today(),nextVisit:shift(7)});DB.set("patients",state.patients);toast("Patient added");return navigate("patients");}
    if(type==="appointment"){var p=state.patients.filter(function(x){return x.name===v.patient;})[0]||state.patients[0];state.appointments.push({id:"AP-"+between(8000,9999),date:v.date,time:v.time,patient:p.name,patientId:p.id,provider:v.provider,type:v.type,status:"Scheduled"});DB.set("appointments",state.appointments);toast("Appointment added");return navigate("appointments");}
    if(type==="task"){state.tasks.unshift({id:"TK-"+between(9000,9999),title:v.title,patient:v.patient,priority:v.priority,owner:"Mahi",due:v.due,status:"To Do"});DB.set("tasks",state.tasks);toast("Task added");return navigate("tasks");}
    if(type==="care"){state.care.unshift({id:"CH-"+between(9000,9999),patient:v.patient,issue:v.issue,priority:v.priority,stage:v.stage,age:0});DB.set("care",state.care);toast("Care item created");return navigate("care");}
    if(type==="emergency"){pushNotification("Emergency arrival registered",v.name+" entered synthetic triage.","emergency");toast("Emergency arrival registered");return navigate("emergency");}
    if(type==="invoice"){state.invoices.unshift({id:"INV-"+between(3000,3999),patient:v.patient,amount:Number(v.amount),payer:v.payer,status:v.status});DB.set("invoices",state.invoices);toast("Invoice created");return navigate("billing");}
    if(type==="stock"){state.inventory.unshift({name:v.name,category:v.category,stock:Number(v.stock),reorder:Number(v.reorder),unit:"units"});DB.set("inventory",state.inventory);toast("Inventory entry added");return navigate("pharmacy");}
    if(type==="lab"){pushNotification("Lab order created","A synthetic "+v.test+" order was created.","lab");toast("Lab order created");return navigate("lab");}
    if(type==="message"){var thread=state.messages.filter(function(m){return m.name===v.recipient;})[0];if(thread){thread.items.push(["me",v.body||"Message sent",clock().slice(0,5)]);DB.set("messages",state.messages);}toast("Message sent to "+v.recipient);return navigate("messages");}
    if(type==="provider"){state.providers.push({id:"PR-"+between(500,999),name:v.name,specialty:v.specialty,location:v.location,load:0,today:0,capacity:12,status:"Available"});DB.set("providers",state.providers);toast("Provider added to Mahi Health");return navigate("providers");}
  }

  function updateNotifications(){
    $("#notificationCount").textContent=state.notifications.filter(function(x){return x.unread;}).length;
    $("#notificationPanel").innerHTML=state.notifications.map(function(x){return '<div class="notification '+(x.unread?"unread":"")+'"><b>'+ (x.type==="emergency"?"!":x.type==="lab"?"△":x.type==="pharmacy"?"◉":x.type==="care"?"♡":"●") +'</b><span><strong>'+esc(x.title)+'</strong><small>'+esc(x.body)+'</small></span><time>'+esc(x.time)+'</time></div>';}).join("");
  }
  function pushNotification(title,body,type){state.notifications.unshift({title:title,body:body,type:type,time:"now",unread:true});state.notifications=state.notifications.slice(0,7);DB.set("notifications",state.notifications);updateNotifications();}
  function exportCsv(filename,rows){if(!rows.length)return;var keys=Object.keys(rows[0]).filter(function(k){return typeof rows[0][k]!=="object";}),csv=[keys.join(",")].concat(rows.map(function(r){return keys.map(function(k){return '"'+String(r[k] == null ? "" : r[k]).replace(/"/g,'""')+'"';}).join(",");})).join("\n"),blob=new Blob([csv],{type:"text/csv"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast(filename+" ready");}
  function toast(text){var n=document.createElement("div");n.className="toast";n.innerHTML='<i></i><span>'+esc(text)+"</span>";$("#toastHost").appendChild(n);setTimeout(function(){n.remove();},2400);}
  function toggleTheme(){state.theme=state.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=state.theme;DB.set("theme",state.theme);$("#themeBtn").textContent=state.theme==="dark"?"☀":"◐";toast(state.theme==="dark"?"Dark mode enabled":"Light mode enabled");}
  function updateLive(){if(!state.live)return;$("#liveClock").textContent=clock();var l=between(12,30);$("#latencyValue").textContent=l+" ms";$("#latencyBar").style.width=between(84,98)+"%";$("#syncLabel").textContent=state.tick%6===0?"Synchronized just now":"Synchronized "+state.tick+"s ago";$("#footerStatus").textContent=l<25?"All systems nominal":"Monitoring latency";if($("#heroStamp"))$("#heroStamp").textContent="LIVE • "+new Date().toLocaleString().toUpperCase();if(state.view==="overview"&&state.tick%9===0&&$("#activityFeed"))$("#activityFeed").innerHTML=activityFeed();}
  function bindGlobalImageFallback(){var img=$("#scenePhoto");if(img){img.src=IMAGE.hero;img.onerror=function(){img.classList.add("failed");};}}

  function init(){
    seedData();document.documentElement.dataset.theme=state.theme;$("#themeBtn").textContent=state.theme==="dark"?"☀":"◐";renderNav();
    var profile=currentProfile(),session=DB.get("session",null);if(profile&&session&&session.email===profile.email)showApp(profile);else showAuth();
    $$(".auth-tab").forEach(function(b){b.onclick=function(){authMode(b.dataset.authMode);};});
    $$("[data-password]").forEach(function(b){b.onclick=function(){var i=$("#"+b.dataset.password);i.type=i.type==="password"?"text":"password";b.textContent=i.type==="password"?"Show":"Hide";};});
    $("#signinForm").onsubmit=signIn;$("#createForm").onsubmit=createProfile;
    $("#themeBtn").onclick=toggleTheme;$("#refreshBtn").onclick=function(){state.tick++;updateLive();toast("Mahi workspace synchronized");};$("#globalSearch").onclick=openCommand;
    $("#notificationBtn").onclick=function(){var p=$("#notificationPanel");p.classList.toggle("open");if(p.classList.contains("open")){state.notifications.forEach(function(n){n.unread=false;});DB.set("notifications",state.notifications);updateNotifications();}};
    $("#openSidebar").onclick=function(){$("#sidebar").classList.add("open");};$("#closeSidebar").onclick=function(){$("#sidebar").classList.remove("open");};$("#profileButton").onclick=function(){navigate("settings");};$("#topProfile").onclick=function(){navigate("settings");};
    window.addEventListener("hashchange",function(){var v=location.hash.replace("#","")||"overview";if(v!==state.view)navigate(v,true);});
    document.addEventListener("keydown",function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommand();}if(e.key==="Escape"){closeModal();closeCommand();$("#notificationPanel").classList.remove("open");}});
    document.addEventListener("mousemove",function(e){document.documentElement.style.setProperty("--mx",(e.clientX/innerWidth*100)+"%");document.documentElement.style.setProperty("--my",(e.clientY/innerHeight*100)+"%");},{passive:true});
    bindGlobalImageFallback();updateNotifications();currentRender();updateLive();document.body.classList.add("app-ready");
    setInterval(function(){if(state.live){state.tick++;updateLive();if(state.view==="clinical"&&state.tick%6===0)renderClinical();}},1000);
    setInterval(function(){if(state.live)pushNotification("Live workspace event","Averis received a synthetic operational update.","system");},22000);
  }

  init();
}());
