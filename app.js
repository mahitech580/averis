/* =========================================================
   AVERIS — live healthcare operations application
   Static/PWA implementation with a browser-side live simulation.
   No clinical or real patient data is used.
   ========================================================= */

(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem("averis_v2_" + k); return v === null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(k, v) {
      try { localStorage.setItem("averis_v2_" + k, JSON.stringify(v)); } catch {}
    }
  };

  const PROFILE = {name:"Mahi", role:"Healthcare Operations", initials:"M"};

  const IMG = {
    team: "https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg?cs=srgb&dl=pexels-rdne-6129507.jpg&fm=jpg",
    care: "https://images.pexels.com/photos/6129651/pexels-photo-6129651.jpeg?cs=srgb&dl=pexels-rdne-6129651.jpg&fm=jpg",
    hospital: "https://images.pexels.com/photos/29329917/pexels-photo-29329917.jpeg?cs=srgb&dl=pexels-hermaion-29329917.jpg&fm=jpg"
  };

  const NAV = [
    {section:"COMMAND", items:[
      ["overview","Command Center","⌂"],["analytics","Analytics","◫"],["ai","AI Copilot","✦"]
    ]},
    {section:"PATIENT FLOW", items:[
      ["patients","Patients","♙"],["patient360","Patient 360","◎"],["queue","Live Queue","≡"],
      ["appointments","Appointments","◷"],["emergency","Emergency","⚕"]
    ]},
    {section:"CLINICAL OPERATIONS", items:[
      ["care","Care Hub","♡"],["clinical","Clinical Monitor","♥"],["providers","Providers","✚"],["beds","Bed Board","▦"]
    ]},
    {section:"SERVICES", items:[
      ["lab","Laboratory","△"],["pharmacy","Pharmacy","◉"],["billing","Billing","₹"],
      ["messages","Messages","◌"],["tasks","Tasks","✓"],["reports","Reports","▤"]
    ]},
    {section:"SYSTEM", items:[["settings","Settings","⚙"]]}
  ];

  const state = {
    view: location.hash.replace("#","") || "overview",
    theme: store.get("theme","light"),
    patients: store.get("patients", null),
    appointments: store.get("appointments", null),
    providers: store.get("providers", null),
    tasks: store.get("tasks", null),
    care: store.get("care", null),
    beds: store.get("beds", null),
    messages: store.get("messages", null),
    notifications: store.get("notifications", null),
    live: store.get("live", true),
    liveTick: 0,
    selectedPatient: null,
    conversation: 0,
    patientFilter: "",
    patientStatus: "All",
    taskFilter: "All",
    reportFilter: "All"
  };

  const names = [
    "Aarav Sharma","Maya Patel","Noah Williams","Olivia Chen","Arjun Rao","Sophia Bennett",
    "Ethan Brooks","Isabella Martin","Kabir Mehta","Amelia Jones","Rohan Kapoor","Emma Davis",
    "Vihaan Reddy","Mia Wilson","Aditya Nair","Ava Thomas","Reyansh Gupta","Liam Anderson",
    "Anaya Singh","Lucas Brown","Ishaan Verma","Ella Clark","Saanvi Iyer","James Miller"
  ];
  const specialties = ["Cardiology","Internal Medicine","Neurology","Pediatrics","Orthopedics","Oncology","Dermatology","Radiology"];
  const departments = ["Cardiology","General Medicine","Neurology","Pediatrics","Orthopedics"];
  const stages = ["New","Assigned","In Progress","Waiting","Resolved"];

  function hashCode(s){ let h=0; for(let i=0;i<s.length;i++) h=((h<<5)-h)+s.charCodeAt(i)|0; return Math.abs(h); }
  function seeded(n=42){ return function(){ n=(n*1664525+1013904223)>>>0; return n/4294967296; }; }
  const rnd = seeded(804);
  const choice = a => a[Math.floor(rnd()*a.length)];
  const int = (a,b) => Math.floor(rnd()*(b-a+1))+a;
  const dateShift = d => { const x=new Date(); x.setDate(x.getDate()+d); return x; };
  const iso = d => { const x=new Date(d); return x.toISOString().slice(0,10); };
  const prettyDate = d => new Date(d+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"});
  const liveStamp = d => new Date(d).toLocaleString(undefined,{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).toUpperCase();
  const initials = n => n.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase();
  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));

  function seed(){
    if(state.patients && state.appointments && state.providers) return;
    const providers = Array.from({length:12},(_,i)=>({
      id:"PR"+(100+i), name:["Dr. Maya Chen","Dr. Arjun Rao","Dr. Sofia Martinez","Dr. Ethan Lee","Dr. Priya Nair","Dr. Daniel Brooks","Dr. Kavya Singh","Dr. Noah Carter","Dr. Elena Patel","Dr. Vikram Shah","Dr. Nina Thomas","Dr. Lucas Green"][i],
      specialty: specialties[i%specialties.length], department: departments[i%departments.length],
      location: ["North Tower","Riverside","Central Campus"][i%3],
      active: int(18,62), tasks:int(2,12), today:int(3,14), capacity:int(10,18), status:i%5===0?"Busy":"Available"
    }));
    const patients = names.map((name,i)=>({
      id:"AV-"+(20000+i), name, age:int(18,82), gender:i%2?"Female":"Male",
      provider:providers[i%providers.length].name, department:providers[i%providers.length].department,
      status:["Active","Active","Stable","Needs Attention"][i%4], risk:["Low","Low","Medium","High"][i%4],
      attendance:int(76,99), lastVisit:iso(dateShift(-int(2,42))), nextVisit:iso(dateShift(int(1,21))),
      condition:["Hypertension","Type 2 Diabetes","Asthma","Arrhythmia","Migraine","Arthritis","Recovery","Routine review"][i%8]
    }));
    const appointments = Array.from({length:48},(_,i)=>{
      const dt=dateShift(int(-5,10)); const patient=patients[i%patients.length]; const provider=providers[i%providers.length];
      return {id:"AP"+(500+i),date:iso(dt),time:["08:30","09:15","10:00","10:45","11:30","13:00","14:00","15:00","16:15"][i%9],
        patient:patient.name,patientId:patient.id,provider:provider.name,department:provider.department,
        type:["Follow-up","Consultation","Check-up","Screening","Telehealth"][i%5],
        status:new Date(dt)<new Date() ? (i%9===0?"No Show":i%11===0?"Cancelled":"Completed") : (i%4===0?"Confirmed":"Scheduled")};
    });
    const tasks = Array.from({length:30},(_,i)=>({
      id:"TK"+(700+i),title:["Call patient about lab results","Review discharge plan","Confirm referral","Verify insurance documents","Medication reconciliation","Prepare care-team handoff","Follow up on missed appointment"][i%7],
      patient:patients[i%patients.length].name,priority:["Low","Medium","High","Urgent"][i%4],due:iso(dateShift(int(-2,8))),
      status:["To Do","To Do","In Progress","Completed"][i%4],owner:["Care Team","Front Desk","Dr. Rao","Dr. Chen"][i%4]
    }));
    const care = Array.from({length:25},(_,i)=>({
      id:"CH"+(900+i),patient:patients[i%patients.length].name,
      issue:["Overdue follow-up","Referral pending","Care plan review","Unresolved lab query","Discharge coordination","Medication reconciliation"][i%6],
      stage:stages[i%stages.length],priority:["Normal","Normal","High","Urgent"][i%4],updated:int(1,54)+" min ago"
    }));
    const beds = Array.from({length:36},(_,i)=>{
      const wing=["A","B","C"][i%3];
      const state=["Occupied","Occupied","Available","Cleaning","Occupied","Available"][i%6];
      return {id:`${wing}-${101+i}`,wing,state,patient:state==="Occupied"?patients[i%patients.length].name:null,department:departments[i%departments.length]};
    });
    const messages = [
      {name:"Dr. Maya Chen",role:"Cardiology",unread:2,preview:"Can we move the Patel follow-up to 3:30?",items:[
        ["them","Can we move the Patel follow-up to 3:30?","09:24"],["me","Yes. I’ve held the slot and updated the care team.","09:26"],["them","Perfect. I’ll review the ECG before the visit.","09:28"]
      ]},
      {name:"Care Coordination",role:"Operations",unread:1,preview:"Referral packet is ready for review.",items:[
        ["them","Referral packet is ready for review.","09:12"],["me","Received. I’ll assign it to the neurology queue.","09:15"]
      ]},
      {name:"Front Desk — Riverside",role:"Scheduling",unread:0,preview:"The 14:00 slot is now confirmed.",items:[
        ["them","The 14:00 slot is now confirmed.","08:52"],["me","Thanks — patient has been notified.","08:55"]
      ]},
      {name:"Dr. Priya Nair",role:"Internal Medicine",unread:3,preview:"Patient AV-20018 needs a same-day follow-up.",items:[
        ["them","Patient AV-20018 needs a same-day follow-up.","08:31"],["me","I’ll place the coordination task now.","08:34"]
      ]}
    ];
    const notifications = [
      {title:"Care coordination alert",body:"3 high-priority follow-ups need assignment.",type:"care",time:"now",unread:true},
      {title:"Schedule update",body:"A new cardiology appointment was confirmed.",type:"appt",time:"2 min",unread:true},
      {title:"Lab result posted",body:"CBC panel is ready for clinical review.",type:"lab",time:"7 min",unread:true},
      {title:"Bed movement",body:"B-114 changed to Cleaning status.",type:"bed",time:"11 min",unread:true},
      {title:"System health",body:"All connected workspace modules are responding normally.",type:"system",time:"18 min",unread:false}
    ];
    state.providers=providers;state.patients=patients;state.appointments=appointments;state.tasks=tasks;
    state.care=care;state.beds=beds;state.messages=messages;state.notifications=notifications;
    ["providers","patients","appointments","tasks","care","beds","messages","notifications"].forEach(k=>store.set(k,state[k]));
  }

  function applyTheme(){
    document.documentElement.dataset.theme=state.theme;
    store.set("theme",state.theme);
    $("#themeToggle").textContent=state.theme==="dark"?"☀":"◐";
  }
  function setTheme(){ state.theme=state.theme==="dark"?"light":"dark";applyTheme();toast("Theme updated"); }

  function iconSvg(name){
    const paths = {
      overview:'<path d="M4 4h6v6H4zM14 4h6v9h-6zM4 14h6v6H4zM14 17h6v3h-6z"/>',
      patients:'<circle cx="9" cy="8" r="3"/><path d="M3.5 20c.5-3.5 2.8-5.5 5.5-5.5s5 2 5.5 5.5"/><circle cx="17.5" cy="8" r="2.4"/><path d="M15.5 14.7c2.4.4 4 2 4.7 5.3"/>',
      appointments:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 14l2 2 4-4"/>',
      care:'<path d="M12 20s-7-4.6-9.2-8.8C1.2 8.1 3.4 4.5 7 4.5c2.1 0 3.8 1.2 5 3.1 1.2-1.9 2.9-3.1 5-3.1 3.6 0 5.8 3.6 4.2 6.7C19 15.4 12 20 12 20z"/>',
      clinical:'<path d="M3 12h4l2.2-6 4.1 12 2.4-6H21"/><path d="M12 3v2M12 19v2"/>',
      providers:'<circle cx="12" cy="7" r="3"/><path d="M5 20c.7-4.1 3-6.2 7-6.2s6.3 2.1 7 6.2"/><path d="M3 9h4M17 9h4"/>',
      pharmacy:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h3"/>',
      lab:'<path d="M9 3v6l-5 8.5A2.5 2.5 0 006.2 21h11.6a2.5 2.5 0 002.2-3.5L15 9V3"/><path d="M8 12h8"/>',
      beds:'<path d="M4 16v4M20 16v4M5 15h14v3H5zM7 12h4a2 2 0 012 2v1H7zM4 9v6"/>',
      messages:'<path d="M4 5h16v11H8l-4 4V5z"/><path d="M8 9h8M8 12h5"/>',
      tasks:'<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 12l2.5 2.5L16 9"/>',
      analytics:'<path d="M4 20V11M10 20V6M16 20V9M22 20V4"/>',
      ai:'<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
      reports:'<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h4M9 12h6M9 16h6"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="M19 13.5l1.3 1-1.8 3.1-1.6-.6a7.5 7.5 0 01-1.8 1l-.3 1.7h-3.6l-.3-1.7a7.5 7.5 0 01-1.8-1l-1.6.6-1.8-3.1 1.3-1a7.4 7.4 0 010-3L4 9.5l1.8-3.1 1.6.6a7.5 7.5 0 011.8-1L9.5 4h3.6l.3 2a7.5 7.5 0 011.8 1l1.6-.6 1.8 3.1-1.3 1a7.4 7.4 0 010 3z"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.overview}</svg>`;
  }

  function renderNav(){
    const nav=$("#nav");nav.innerHTML="";
    NAV.forEach(group=>{
      const sec=document.createElement("div");sec.className="nav-section";sec.textContent=group.section;nav.appendChild(sec);
      group.items.forEach(([id,label])=>{
        const b=document.createElement("button");b.className="nav-item"+(state.view===id?" active":"");b.dataset.view=id;
        b.innerHTML=`<span class="nav-icon">${iconSvg(id)}</span><span class="nav-label-text">${label}</span>${id==="messages"?'<span class="nav-count">6</span>':id==="care"?'<span class="nav-count">7</span>':""}`;
        b.onclick=()=>navigate(id);nav.appendChild(b);
      });
    });
  }

  function navigate(view){
    state.view=view;history.replaceState(null,"","#"+view);
    $$(".view").forEach(v=>v.classList.remove("active"));
    const target=$("#view-"+view);if(target)target.classList.add("active");
    $("#crumbView").textContent=NAV.flatMap(x=>x.items).find(x=>x[0]===view)?.[1]||"Command Center";
    renderNav();renderCurrent();
    if(innerWidth<961)$("#sidebar").classList.remove("open");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function badge(label, tone="info"){
    const cls={ok:"ok",success:"ok",info:"info",warn:"warn",danger:"danger",teal:"teal"}[tone]||"info";
    return `<span class="status ${cls}"><i class="dot"></i>${esc(label)}</span>`;
  }

  function kpi(label,value,detail,tone="blue",icon="•"){
    return `<article class="kpi ${tone}"><div class="kpi-head"><span class="kpi-label">${label}</span><span class="kpi-icon" style="background:var(--${tone}-soft);color:var(--${tone})">${icon}</span></div><div class="kpi-value" data-count="${String(value).replace(/[^0-9.]/g,"")}">${esc(value)}</div><div class="kpi-foot trend-up">↗ <span>${esc(detail)}</span></div></article>`;
  }

  function header(eyebrow,title,sub,actions=""){
    return `<div class="page-head reveal"><div><div class="eyebrow"><span class="pulse-dot"></span>${eyebrow}</div><h1 class="page-title">${title}</h1><p class="page-sub">${sub}</p></div><div class="actions">${actions}</div></div>`;
  }

  function lineChart(values,labels=[]){
    const w=700,h=205,p=18,min=0,max=Math.max(...values)*1.15||1;
    const pts=values.map((v,i)=>[p+i*(w-p*2)/(values.length-1),h-p-(v/max)*(h-p*2)]);
    const d=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");
    const area=d+` L ${pts[pts.length-1][0].toFixed(1)} ${h-p} L ${pts[0][0].toFixed(1)} ${h-p} Z`;
    const grid=[0,.25,.5,.75,1].map(r=>`<line class="gridline" x1="${p}" y1="${h-p-r*(h-p*2)}" x2="${w-p}" y2="${h-p-r*(h-p*2)}"/>`).join("");
    const labs=labels.map((l,i)=>`<text class="axis" x="${pts[i][0]}" y="${h-4}" text-anchor="middle">${l}</text>`).join("");
    return `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="blueArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--blue)" stop-opacity=".22"/><stop offset="1" stop-color="var(--blue)" stop-opacity="0"/></linearGradient></defs>${grid}<path class="chart-area" d="${area}"/><path class="chart-line" d="${d}"/>${labs}</svg>`;
  }
  function bars(values,labels){
    const w=700,h=205,p=20,slot=(w-p*2)/values.length,bw=slot*.48,max=Math.max(...values)||1;
    return `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${values.map((v,i)=>{const bh=(v/max)*145,x=p+i*slot+(slot-bw)/2,y=164-bh;return `<rect class="bar ${i%2?"alt":""}" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="5"/><text class="axis" x="${x+bw/2}" y="186" text-anchor="middle">${labels[i]}</text><text class="axis" x="${x+bw/2}" y="${y-5}" text-anchor="middle">${v}</text>`}).join("")}</svg>`;
  }

  function activityRows(count=6){
    const actions=[
      ["clinical","Patient AV-20018 moved to In Progress","Care Hub"],
      ["appt","New appointment confirmed for Maya Patel","Appointments"],
      ["lab","CBC result uploaded for Noah Williams","Laboratory"],
      ["task","Referral review task assigned to Dr. Rao","Tasks"],
      ["bed","B-114 changed to Cleaning","Bed Board"],
      ["msg","Care coordination message received","Messages"],
      ["pharmacy","Low stock alert: Metformin 500mg","Pharmacy"]
    ];
    return actions.slice(0,count).map((a,i)=>`<div class="activity"><div class="activity-icon">${a[0]==="clinical"?"♥":a[0]==="appt"?"◷":a[0]==="lab"?"△":a[0]==="task"?"✓":a[0]==="bed"?"▦":a[0]==="msg"?"◌":"◉"}</div><div class="activity-body"><strong>${a[1]}</strong><span>${a[2]} • live event stream</span></div><time class="activity-time">${i===0?"now":(i*2+1)+" min"}</time></div>`).join("");
  }

  function renderOverview(){
    const today=iso(new Date());
    const todays=state.appointments.filter(a=>a.date===today);
    const noShows=state.appointments.filter(a=>a.status==="No Show").length;
    const active=state.patients.filter(p=>p.status!=="Archived").length;
    const openTasks=state.tasks.filter(t=>t.status!=="Completed").length;
    const openCare=state.care.filter(c=>c.stage!=="Resolved").length;
    const occupied=state.beds.filter(b=>b.state==="Occupied").length;
    const available=state.beds.filter(b=>b.state==="Available").length;
    const rate=Math.round((noShows/Math.max(state.appointments.length,1))*100);

    const queuePatients=state.patients.slice(0,7);
    const alerts=[
      ["ED triage","2 critical patients waiting for bed allocation","2 min ago","danger"],
      ["Laboratory","Troponin result requires acknowledgement","7 min ago","danger"],
      ["Care Hub","3 urgent follow-ups are unassigned","12 min ago","warn"],
      ["Pharmacy","Insulin Glargine below reorder threshold","18 min ago","warn"]
    ];

    $("#view-overview").innerHTML=`
      <div class="page-head reveal">
        <div><div class="eyebrow"><span class="pulse-dot"></span>HOSPITAL COMMAND CENTER</div><h1 class="page-title">Averis Care Operations</h1><p class="page-sub">One live operating picture across patient flow, care delivery and hospital capacity.</p></div>
        <div class="actions"><span class="status ok"><i class="dot"></i>Network nominal</span><button class="btn" data-action="refresh">↻ Sync now</button><button class="btn primary" data-action="new-appointment">+ New appointment</button></div>
      </div>

      <div class="hero command-hero reveal">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="hero-kicker"><span class="pulse-dot"></span><span id="overviewLiveTime">LIVE • ${liveStamp(new Date())}</span></div>
          <h2 class="hero-title">See the whole hospital.<br>Act on what matters.</h2>
          <p class="hero-copy">Averis connects patient movement, appointment demand, capacity, care coordination and service-line signals so operational teams can respond before a bottleneck becomes a delay.</p>
          <div class="hero-actions">
            <button class="btn primary" data-action="open-ai">✦ Ask AI Copilot</button>
            <button class="btn" data-action="open-emergency">Open emergency</button>
            <button class="btn" data-action="open-queue">View OPD queue</button>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><span>OPD today</span><strong>${todays.length+184}</strong></div>
          <div class="hero-stat"><span>Bed occupancy</span><strong>${Math.round(occupied/state.beds.length*100)}%</strong></div>
          <div class="hero-stat"><span>Available beds</span><strong>${available}</strong></div>
        </div>
      </div>

      <div class="alert-strip reveal"><div class="alert-strip-main"><span class="alert-pulse"></span><strong>Operational attention</strong><span>2 emergency alerts • 3 urgent care items • 1 pharmacy reorder</span></div><button class="btn sm" data-action="open-emergency">Review alerts</button></div>

      <div class="kpi-grid">
        ${kpi("Patients in network",active,"+4.2% vs last week","blue","♙")}
        ${kpi("Appointments today",todays.length+184,"92% confirmed","teal","◷")}
        ${kpi("Live OPD queue","27","avg. wait 14 min","gold","≡")}
        ${kpi("Critical alerts","2","requires action now","red","!")}
      </div>

      <div class="grid-2">
        <article class="card reveal"><div class="card-head"><div><div class="card-title">Patient arrivals & flow</div><div class="card-meta">Rolling 12 hours • admissions, OPD and discharges</div></div><span class="status info"><i class="dot"></i>Real-time view</span></div>${lineChart([31,45,39,52,64,61,72,81,77,86,91,88],["06","07","08","09","10","11","12","13","14","15","16","17"])}</article>
        <article class="card reveal"><div class="card-head"><div><div class="card-title">Capacity snapshot</div><div class="card-meta">Current hospital utilization</div></div><span class="status ok"><i class="dot"></i>Within plan</span></div>
          <div class="capacity-orbit"><div class="orbit-ring"><span>${Math.round(occupied/state.beds.length*100)}%</span><small>occupied</small></div><div class="capacity-list"><div><span>Available</span><strong>${available}</strong></div><div><span>Cleaning</span><strong>${state.beds.filter(b=>b.state==="Cleaning").length}</strong></div><div><span>Isolation</span><strong>${state.beds.filter(b=>b.state==="Isolation").length}</strong></div></div></div>
        </article>
      </div>

      <div class="grid-2" style="margin-top:14px">
        <article class="card reveal"><div class="card-head"><div><div class="card-title">Live OPD queue</div><div class="card-meta">Patients waiting by current care stage</div></div><button class="btn sm" data-action="open-queue">Open queue</button></div>
          <div class="queue-list">${queuePatients.map((p,i)=>`<div class="queue-row"><span class="queue-rank">${String(i+1).padStart(2,"0")}</span><div class="person"><span class="avatar" style="background:linear-gradient(145deg,var(--blue-2),var(--teal))">${initials(p.name)}</span><span class="person-text"><strong>${esc(p.name)}</strong><small>${p.id} • ${p.department}</small></span></div><span class="queue-stage">${["Waiting","Vitals","Doctor","Review","Waiting","Doctor","Vitals"][i]}</span><strong class="queue-time">${7+i*4} min</strong></div>`).join("")}</div>
        </article>
        <article class="card reveal"><div class="card-head"><div><div class="card-title">Critical alerts</div><div class="card-meta">Priority events that need acknowledgement</div></div><span class="status danger"><i class="dot"></i>2 critical</span></div>
          <div class="alert-list">${alerts.map(a=>`<div class="alert-row"><div class="alert-severity ${a[3]}">${a[3]==="danger"?"!":"•"}</div><div><strong>${a[0]}</strong><p>${a[1]}</p></div><time>${a[2]}</time></div>`).join("")}</div>
        </article>
      </div>

      <div class="service-strip reveal">
        ${[["Emergency","Triage","96%","danger"],["Laboratory","Turnaround","41 min","ok"],["Pharmacy","Stock health","92%","ok"],["Appointments","Confirmation","93%","teal"],["Care Hub","SLA","88%","ok"],["Billing","Collections","76%","warn"]].map(x=>`<button class="service-node" data-service="${x[0]}"><span class="service-node-top"><span>${x[0]}</span>${badge(x[2],x[3])}</span><strong>${x[1]}</strong><small>live operational signal</small></button>`).join("")}
      </div>

      <div class="grid-2" style="margin-top:14px">
        <article class="image-card reveal"><div class="image-bg" style="background-image:url('${IMG.team}')"></div><div class="image-content"><div class="eyebrow" style="color:#fff">CARE TEAMS</div><h3>Coordinate every handoff.</h3><p>Patients move through departments. Averis keeps the operational context connected.</p></div></article>
        <article class="card reveal"><div class="card-head"><div><div class="card-title">Recent activity</div><div class="card-meta">The event stream updates while you work</div></div><span class="status teal"><i class="dot"></i>${state.live?"Streaming":"Paused"}</span></div><div class="activity-list" id="liveActivity">${activityRows(7)}</div></article>
      </div>`;
    wireViewActions();
    const serviceMap={Emergency:"emergency",Laboratory:"lab",Pharmacy:"pharmacy",Appointments:"appointments","Care Hub":"care",Billing:"billing"};
    $("[data-service]").forEach(b=>b.onclick=()=>navigate(serviceMap[b.dataset.service]||"overview"));
  }
  function renderEmergency(){
    const emergencyPatients=state.patients.slice(0,10);
    $("#view-emergency").innerHTML=header("EMERGENCY & TRIAGE","Emergency Command","Live triage board for ED intake, acuity, wait time and bed readiness.",'<button class="btn primary" data-action="new-emergency">+ Register arrival</button>')
      +`<div class="kpi-grid">${kpi("Arrivals today","58","+9% vs yesterday","red","⚕")}${kpi("High acuity","7","2 critical","red","!")}${kpi("Avg. wait","14 min","−3 min","teal","◷")}${kpi("Ready beds","11","4 ICU • 7 general","green","▦")}</div>`
      +`<div class="grid-2"><article class="card reveal"><div class="card-head"><div><div class="card-title">Triage queue</div><div class="card-meta">Highest acuity patients first</div></div><span class="status danger"><i class="dot"></i>Live</span></div><div class="table-wrap"><table><thead><tr><th>Patient</th><th>Acuity</th><th>Wait</th><th>Destination</th><th>State</th></tr></thead><tbody>${emergencyPatients.map((p,i)=>`<tr><td><div class="person"><span class="avatar">${initials(p.name)}</span><span class="person-text"><strong>${esc(p.name)}</strong><small>${p.id}</small></span></div></td><td>${badge(i<2?"Critical":i<5?"High":"Moderate",i<2?"danger":i<5?"warn":"info")}</td><td>${8+i*3} min</td><td>${i<3?"ICU":i<6?"Cardiology":"General Ward"}</td><td>${badge(i%3===0?"Waiting":"Under review",i%3===0?"danger":"teal")}</td></tr>`).join("")}</tbody></table></div></article>`
      +`<article class="card reveal"><div class="card-head"><div class="card-title">Emergency flow</div><span class="card-meta">Current shift</span></div>${bars([18,14,11,8,5],["00","04","08","12","16"])}<div class="mini-grid" style="margin-top:12px"><div class="mini-stat"><span>Ambulances inbound</span><strong>3</strong><em>next 18 min</em></div><div class="mini-stat"><span>Team readiness</span><strong style="color:var(--green)">94%</strong><em>green</em></div></div></article></div>`;
    wireViewActions();
  }

  function renderQueue(){
    const queue=state.patients.slice(0,16);
    $("#view-queue").innerHTML=header("PATIENT FLOW","Live OPD Queue","Track waiting patients from registration through consultation.",'<button class="btn primary" data-action="refresh">↻ Refresh queue</button>')
      +`<div class="grid-4" style="margin-bottom:14px">${[["Waiting","27","avg 14 min","gold"],["Vitals","11","avg 6 min","teal"],["Doctor","19","avg 11 min","blue"],["Completed","86","today","green"]].map(x=>`<article class="card"><div class="mini-stat"><span>${x[0]}</span><strong style="color:var(--${x[3]})">${x[1]}</strong><em>${x[2]}</em></div></article>`).join("")}</div>`
      +`<div class="card reveal"><div class="card-head"><div><div class="card-title">Live queue</div><div class="card-meta">Sort by wait, acuity or provider</div></div><div class="filters"><button class="filter active">All</button><button class="filter">Waiting</button><button class="filter">Doctor</button><button class="filter">Vitals</button></div></div><div class="queue-list queue-large">${queue.map((p,i)=>`<div class="queue-row"><span class="queue-rank">${String(i+1).padStart(2,"0")}</span><div class="person"><span class="avatar" style="background:linear-gradient(145deg,var(--blue-2),var(--teal))">${initials(p.name)}</span><span class="person-text"><strong>${esc(p.name)}</strong><small>${p.id} • ${p.condition} • ${p.provider}</small></span></div><span class="queue-stage">${["Waiting","Vitals","Doctor","Review"][i%4]}</span><strong class="queue-time">${7+i*2} min</strong><button class="btn sm" data-patient="${p.id}">Open</button></div>`).join("")}</div></div>`;
    $$("[data-patient]").forEach(b=>b.onclick=()=>openPatient(b.dataset.patient));wireViewActions();
  }

  function renderPatient360(){
    const p=state.patients[0];
    $("#view-patient360").innerHTML=header("PATIENT 360","Patient 360","A connected view of identity, visits, care plan, results and coordination.",'<button class="btn primary" data-action="new-task">+ Care task</button>')
      +`<div class="patient360-top reveal"><div class="patient360-avatar">${initials(p.name)}</div><div><div class="eyebrow">ACTIVE CARE PROFILE</div><h2>${esc(p.name)}</h2><p>${p.id} • ${p.age}y • ${p.condition}</p></div><div class="patient360-tags">${badge(p.status,"ok")}${badge(p.risk+" risk",p.risk==="High"?"danger":"warn")}</div></div>`
      +`<div class="grid-3"><article class="card reveal"><div class="card-head"><div class="card-title">Care overview</div>${badge("Active","ok")}</div><div class="mini-grid"><div class="mini-stat"><span>Attendance</span><strong>${p.attendance}%</strong><em>historical</em></div><div class="mini-stat"><span>Next visit</span><strong>${prettyDate(p.nextVisit)}</strong><em>scheduled</em></div></div><div class="section-sub" style="margin-top:12px">Primary provider</div><strong style="display:block;margin-top:3px;font-size:11px">${esc(p.provider)}</strong></article>
      <article class="card reveal"><div class="card-head"><div class="card-title">Latest results</div>${badge("2 new","info")}</div><div class="activity-list"><div class="activity"><div class="activity-icon">△</div><div class="activity-body"><strong>CBC panel</strong><span>Within expected range</span></div><time class="activity-time">8 min</time></div><div class="activity"><div class="activity-icon">△</div><div class="activity-body"><strong>HbA1c</strong><span>Review with provider</span></div><time class="activity-time">14 min</time></div></div></article>
      <article class="card reveal"><div class="card-head"><div class="card-title">Current medications</div>${badge("Verified","ok")}</div><div class="metric-list"><div class="setting-row" style="padding:7px 0"><div class="setting-copy"><strong>Metformin 500 mg</strong><span>Twice daily</span></div>${badge("Active","teal")}</div><div class="setting-row" style="padding:7px 0"><div class="setting-copy"><strong>Amlodipine 10 mg</strong><span>Once daily</span></div>${badge("Active","teal")}</div></div></article></div>`
      +`<div class="grid-2" style="margin-top:14px"><article class="card reveal"><div class="card-head"><div class="card-title">Patient journey</div><span class="card-meta">Last 30 days</span></div><div class="journey">${["Registration","Consultation","Lab tests","Care plan","Follow-up"].map((x,i)=>`<div class="journey-step ${i<4?"done":""}"><span class="journey-dot">${i<4?"✓":""}</span><div><strong>${x}</strong><small>${i<4?"Completed":"Next step"}</small></div></div>`).join("")}</div></article><article class="image-card reveal"><div class="image-bg" style="background-image:url('${IMG.care}')"></div><div class="image-content"><div class="eyebrow" style="color:#fff">CONNECTED CARE</div><h3>Context follows the patient.</h3><p>One operational view across every touchpoint.</p></div></article></div>`;
    wireViewActions();
  }

  function renderBilling(){
    const invoices=[["INV-1042","Maya Patel","₹24,800","Insurance","Pending"],["INV-1041","Arjun Rao","₹12,400","Self pay","Paid"],["INV-1040","Noah Williams","₹48,600","Insurance","Review"],["INV-1039","Olivia Chen","₹8,900","Self pay","Paid"],["INV-1038","Sophia Bennett","₹31,200","Insurance","Pending"]];
    $("#view-billing").innerHTML=header("REVENUE CYCLE","Billing & Collections","Operational view of charges, claims, payments and collection risk.",'<button class="btn primary" data-action="new-invoice">+ New invoice</button>')
      +`<div class="kpi-grid">${kpi("Collections MTD","₹42.8L","+8.2%","green","₹")}${kpi("Outstanding","₹8.6L","12 high-risk accounts","red","!")}${kpi("Claims in review","34","median age 2.8d","gold","▤")}${kpi("Collection rate","91.4%","+2.1 pts","blue","↗")}</div>`
      +`<div class="grid-2"><article class="card reveal"><div class="card-head"><div class="card-title">Collection trend</div><span class="card-meta">Last 7 days</span></div>${bars([42,56,48,63,71,66,78],["M","T","W","T","F","S","S"])}</article><article class="card reveal"><div class="card-head"><div class="card-title">Revenue mix</div>${badge("Current month","info")}</div><div class="metric-list"><div class="metric-row"><span>Insurance</span><div class="meter"><span style="width:62%"></span></div><strong>62%</strong></div><div class="metric-row"><span>Self pay</span><div class="meter"><span style="width:23%"></span></div><strong>23%</strong></div><div class="metric-row"><span>Corporate</span><div class="meter"><span style="width:15%"></span></div><strong>15%</strong></div></div></article></div>`
      +`<div class="card reveal" style="margin-top:14px"><div class="card-head"><div class="card-title">Recent invoices</div><button class="btn sm" data-action="export-report">Export</button></div><div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Patient</th><th>Amount</th><th>Payer</th><th>Status</th></tr></thead><tbody>${invoices.map(x=>`<tr><td><strong>${x[0]}</strong></td><td>${x[1]}</td><td>${x[2]}</td><td>${x[3]}</td><td>${badge(x[4],x[4]==="Paid"?"ok":x[4]==="Review"?"warn":"info")}</td></tr>`).join("")}</tbody></table></div></div>`;
    wireViewActions();
  }

  function renderPatients(){
    const filtered=state.patients.filter(p=>(!state.patientFilter || (p.name+" "+p.id+" "+p.condition).toLowerCase().includes(state.patientFilter.toLowerCase()))&&(state.patientStatus==="All"||p.status===state.patientStatus));
    $("#view-patients").innerHTML=header("PATIENT OPERATIONS","Patients","Manage care context, risk and follow-up in one clinical workspace.",'<button class="btn primary" data-action="new-patient">+ New patient</button>')
      + `<div class="toolbar"><input class="input" id="patientSearch" placeholder="Search name, ID or condition…" value="${esc(state.patientFilter)}"><div class="filters">${["All","Active","Stable","Needs Attention"].map(x=>`<button class="filter ${state.patientStatus===x?"active":""}" data-pstatus="${x}">${x}</button>`).join("")}</div><button class="btn sm" data-action="export-patients">Export CSV</button></div>`
      + `<div class="table-wrap card reveal"><table><thead><tr><th>Patient</th><th>Status</th><th>Risk</th><th>Provider</th><th>Last visit</th><th>Next visit</th><th>Attendance</th></tr></thead><tbody>${filtered.map(p=>`<tr data-patient="${p.id}"><td><div class="person"><span class="avatar" style="background:linear-gradient(145deg,var(--blue-2),var(--teal))">${initials(p.name)}</span><span class="person-text"><strong>${esc(p.name)}</strong><small>${p.id} • ${p.age}y • ${p.condition}</small></span></div></td><td>${badge(p.status,p.status==="Needs Attention"?"warn":"ok")}</td><td>${badge(p.risk+" risk",p.risk==="High"?"danger":p.risk==="Medium"?"warn":"ok")}</td><td class="subtext">${esc(p.provider)}</td><td>${prettyDate(p.lastVisit)}</td><td>${prettyDate(p.nextVisit)}</td><td><strong>${p.attendance}%</strong></td></tr>`).join("")}</tbody></table></div>`;
    $("#patientSearch").oninput=e=>{state.patientFilter=e.target.value;renderPatients()};
    $$("[data-pstatus]").forEach(b=>b.onclick=()=>{state.patientStatus=b.dataset.pstatus;renderPatients()});
    $$("[data-patient]").forEach(tr=>tr.onclick=()=>openPatient(tr.dataset.patient));
    wireViewActions();
  }

  function renderAppointments(){
    const grouped={};
    const today=iso(new Date());
    state.appointments.filter(a=>a.date>=iso(dateShift(-1))&&a.date<=iso(dateShift(7))).forEach(a=>(grouped[a.date]??=[]).push(a));
    $("#view-appointments").innerHTML=header("SCHEDULING","Appointments","Live schedule, attendance and provider capacity.",'<button class="btn primary" data-action="new-appointment">+ New appointment</button>')
      + `<div class="grid-3"><article class="card"><div class="card-head"><div class="card-title">Today</div>${badge("Live","ok")}</div><div class="mini-grid"><div class="mini-stat"><span>Booked</span><strong>${state.appointments.filter(a=>a.date===iso(new Date())).length}</strong></div><div class="mini-stat"><span>Checked in</span><strong>7</strong></div></div></article><article class="card"><div class="card-head"><div class="card-title">Confirmation rate</div>${badge("Healthy","ok")}</div><div class="vital-value" style="font-size:25px">93%</div><div class="meter"><span style="width:93%"></span></div></article><article class="card"><div class="card-head"><div class="card-title">No-show risk</div>${badge("Watch","warn")}</div><div class="vital-value" style="font-size:25px">8.4%</div><div class="section-sub">2 departments above target</div></article></div>`
      + `<div class="card reveal" style="margin-top:14px"><div class="card-head"><div><div class="card-title">Rolling schedule</div><div class="card-meta">Next 7 days</div></div><button class="btn sm" data-action="refresh">Live refresh</button></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Provider</th><th>Type</th><th>Status</th></tr></thead><tbody>${state.appointments.filter(a=>a.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,24).map(a=>`<tr><td>${prettyDate(a.date)}</td><td><strong>${a.time}</strong></td><td>${esc(a.patient)}</td><td>${esc(a.provider)}</td><td>${esc(a.type)}</td><td>${badge(a.status,a.status==="Confirmed"?"ok":a.status==="Scheduled"?"info":"warn")}</td></tr>`).join("")}</tbody></table></div></div>`;
    wireViewActions();
  }

  function renderCare(){
    const cols=stages.map(stage=>{
      const cards=state.care.filter(c=>c.stage===stage);
      return `<div class="kanban-col"><div class="kanban-head"><strong>${stage}</strong><span>${cards.length}</span></div>${cards.slice(0,6).map(c=>`<div class="kcard" draggable="true" data-care="${c.id}"><strong>${esc(c.issue)}</strong><span>${esc(c.patient)}</span><div class="kfoot">${badge(c.priority,c.priority==="Urgent"?"danger":c.priority==="High"?"warn":"teal")}<small style="font-size:7.5px;color:var(--faint)">${c.updated}</small></div></div>`).join("")}</div>`;
    }).join("");
    $("#view-care").innerHTML=header("CARE COORDINATION","Care Hub","Move work through a visible care-coordination pipeline.",'<button class="btn primary" data-action="new-care">+ New coordination item</button>')+`<div class="grid-4" style="margin-bottom:14px"><article class="card"><div class="mini-stat"><span>Open items</span><strong>${state.care.filter(c=>c.stage!=="Resolved").length}</strong><em>care queue</em></div></article><article class="card"><div class="mini-stat"><span>Urgent</span><strong style="color:var(--red)">${state.care.filter(c=>c.priority==="Urgent"&&c.stage!=="Resolved").length}</strong><em>needs assignment</em></div></article><article class="card"><div class="mini-stat"><span>Resolved today</span><strong>14</strong><em>+18% vs yesterday</em></div></article><article class="card"><div class="mini-stat"><span>Median age</span><strong>3.6h</strong><em>target &lt; 6h</em></div></article></div><div class="kanban">${cols}</div>`;
    $$("[data-care]").forEach(c=>c.onclick=()=>toast("Care item opened: "+c.textContent.trim().split("\n")[0]));
    wireViewActions();
  }

  function vitalPath(seedVal){
    const pts=[];for(let i=0;i<28;i++)pts.push(35+Math.sin(i*.66+seedVal)*8+rnd()*6);
    const min=20,max=52;const d=pts.map((v,i)=>`${i===0?"M":"L"} ${(i/(pts.length-1))*100} ${100-((v-min)/(max-min))*85}`).join(" ");
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="var(--red)" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  }

  function renderClinical(){
    const chosen=state.patients.slice(0,8);
    $("#view-clinical").innerHTML=header("CLINICAL OPERATIONS","Clinical Monitor","Live-looking patient signal cards for operational triage. All values are simulated portfolio data.",'<button class="btn" data-action="refresh">Sync vitals</button>')
      + `<div class="grid-4" style="margin-bottom:14px"><article class="card"><div class="mini-stat"><span>Monitored</span><strong>48</strong><em>active beds</em></div></article><article class="card"><div class="mini-stat"><span>Stable</span><strong style="color:var(--green)">41</strong><em>within range</em></div></article><article class="card"><div class="mini-stat"><span>Attention</span><strong style="color:var(--gold-2)">5</strong><em>nurse review</em></div></article><article class="card"><div class="mini-stat"><span>Critical</span><strong style="color:var(--red)">2</strong><em>priority</em></div></article></div>`
      + `<div class="monitor-grid">${chosen.map((p,i)=>{const bpm=68+Math.round(Math.sin((state.liveTick+i)*.45)*4)+i;const o2=96+(i%3);const status=i===5||i===6?"Attention":"Stable";return `<article class="patient-vital reveal"><div class="vital-head"><div class="person"><span class="avatar">${initials(p.name)}</span><span class="person-text"><strong>${esc(p.name)}</strong><small>${p.id} • ${p.department}</small></span></div><span class="heart">♥</span></div><div class="vital-value">${bpm}</div><div class="vital-unit">BPM • heart rate</div><div class="vital-line">${vitalPath(i+state.liveTick)}</div><div class="vital-range"><span>SpO₂ ${o2}%</span><span>Temp 98.${i+1}°F</span><span>${badge(status,status==="Attention"?"warn":"ok")}</span></div></article>`}).join("")}</div>`;
    wireViewActions();
  }

  function renderProviders(){
    $("#view-providers").innerHTML=header("CARE TEAM","Providers","Capacity, workload and specialty coverage across the network.",'<button class="btn" data-action="invite-provider">Invite provider</button>')
      + `<div class="grid-3">${state.providers.map(p=>{const load=Math.round((p.today/Math.max(p.capacity,1))*100);const tone=load>88?"danger":load>70?"warn":"ok";return `<article class="card reveal"><div class="person"><span class="avatar" style="background:linear-gradient(145deg,var(--teal-2),var(--blue-2))">${initials(p.name)}</span><span class="person-text"><strong>${esc(p.name)}</strong><small>${p.specialty} • ${p.location}</small></span></div><div class="metric-list" style="margin-top:14px"><div class="metric-row"><span>Today</span><div class="meter"><span style="width:${Math.min(load,100)}%"></span></div><strong>${p.today}/${p.capacity}</strong></div><div class="metric-row"><span>Patients</span><div class="meter"><span style="width:${Math.min(p.active/70*100,100)}%"></span></div><strong>${p.active}</strong></div><div class="metric-row"><span>Tasks</span><div class="meter"><span style="width:${Math.min(p.tasks/14*100,100)}%"></span></div><strong>${p.tasks}</strong></div></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:13px">${badge(load>88?"Overloaded":load>70?"Busy":"Available",tone)}<span class="card-meta">updated live</span></div></article>`}).join("")}</div>`;
    wireViewActions();
  }

  function renderPharmacy(){
    const meds=[
      ["Metformin 500 mg","Antidiabetic","18 packs","Low","32%"],["Amoxicillin 500 mg","Antibiotic","61 packs","Healthy","78%"],
      ["Atorvastatin 20 mg","Statin","42 packs","Healthy","63%"],["Insulin Glargine","Insulin","9 pens","Critical","18%"],
      ["Amlodipine 10 mg","Antihypertensive","27 packs","Watch","48%"],["Salbutamol inhaler","Respiratory","35 units","Healthy","71%"]
    ];
    $("#view-pharmacy").innerHTML=header("PHARMACY","Medication Operations","Inventory, low-stock signals and fulfillment throughput.",'<button class="btn primary" data-action="new-stock">+ Add stock</button>')
      + `<div class="grid-3"><article class="card"><div class="card-head"><div class="card-title">Inventory value</div>${badge("Live","ok")}</div><div class="vital-value" style="font-size:25px">$284.6K</div><div class="section-sub">+3.8% month over month</div></article><article class="card"><div class="card-head"><div class="card-title">Dispensing today</div>${badge("On target","ok")}</div><div class="vital-value" style="font-size:25px">186</div><div class="section-sub">94% fulfilled within SLA</div></article><article class="card"><div class="card-head"><div class="card-title">Low stock</div>${badge("Needs action","warn")}</div><div class="vital-value" style="font-size:25px;color:var(--gold-2)">8</div><div class="section-sub">2 items are critical</div></article></div>`
      + `<div class="card reveal" style="margin-top:14px"><div class="card-head"><div><div class="card-title">Inventory monitor</div><div class="card-meta">Minimum stock thresholds</div></div><button class="btn sm" data-action="export-pharmacy">Export</button></div><div class="table-wrap"><table><thead><tr><th>Medication</th><th>Category</th><th>Stock</th><th>Status</th><th>Level</th></tr></thead><tbody>${meds.map(m=>`<tr><td><strong>${m[0]}</strong></td><td>${m[1]}</td><td>${m[2]}</td><td>${badge(m[3],m[3]==="Critical"?"danger":m[3]==="Low"||m[3]==="Watch"?"warn":"ok")}</td><td><div class="meter" style="width:120px"><span style="width:${m[4]}"></span></div></td></tr>`).join("")}</tbody></table></div></div>`;
    wireViewActions();
  }

  function renderLab(){
    const results=[
      ["CBC","Maya Patel","Normal","8 min ago"],["HbA1c","Arjun Rao","Review","14 min ago"],["Lipid panel","Noah Williams","Normal","19 min ago"],
      ["Troponin","Olivia Chen","Critical","23 min ago"],["TSH","Sophia Bennett","Normal","27 min ago"],["BMP","Ethan Brooks","Review","31 min ago"]
    ];
    $("#view-lab").innerHTML=header("LABORATORY","Laboratory","Result flow, turnaround time and critical-result visibility.",'<button class="btn primary" data-action="new-lab">+ Order test</button>')
      + `<div class="grid-3"><article class="card"><div class="card-head"><div class="card-title">Tests in process</div>${badge("Streaming","teal")}</div><div class="vital-value" style="font-size:25px">37</div><div class="section-sub">Across 6 departments</div></article><article class="card"><div class="card-head"><div class="card-title">Median TAT</div>${badge("Improving","ok")}</div><div class="vital-value" style="font-size:25px">41 min</div><div class="section-sub">−8 min from last week</div></article><article class="card"><div class="card-head"><div class="card-title">Critical results</div>${badge("Immediate","danger")}</div><div class="vital-value" style="font-size:25px;color:var(--red)">2</div><div class="section-sub">Requires acknowledgement</div></article></div>`
      + `<div class="grid-2" style="margin-top:14px"><article class="card reveal"><div class="card-head"><div class="card-title">Turnaround trend</div><span class="card-meta">7 days</span></div>${bars([54,49,47,46,43,41,40],["M","T","W","T","F","S","S"])}</article><article class="card reveal"><div class="card-head"><div class="card-title">Latest results</div><span class="card-meta">Auto-refresh</span></div><div class="activity-list">${results.map(r=>`<div class="activity"><div class="activity-icon">△</div><div class="activity-body"><strong>${r[0]} • ${r[1]}</strong><span>${r[3]}</span></div><div>${badge(r[2],r[2]==="Critical"?"danger":r[2]==="Review"?"warn":"ok")}</div></div>`).join("")}</div></article></div>`;
    wireViewActions();
  }

  function renderBeds(){
    const counts=["Occupied","Available","Cleaning","Isolation"].map(s=>[s,s==="Isolation"?2:state.beds.filter(b=>b.state===s).length]);
    $("#view-beds").innerHTML=header("BED BOARD","Bed Board","Live capacity across wards and operational movement.",'<button class="btn" data-action="bed-refresh">Refresh board</button>')
      + `<div class="grid-4" style="margin-bottom:14px">${counts.map(([x,n],i)=>`<article class="card"><div class="mini-stat"><span>${x}</span><strong style="color:var(--${i===0?"blue":i===1?"green":i===2?"gold-2":"red"})">${n}</strong><em>current state</em></div></article>`).join("")}</div>`
      + `<div class="card reveal"><div class="card-head"><div><div class="card-title">All beds</div><div class="card-meta">Click a bed for room details</div></div><span class="status info"><i class="dot"></i>Live board</span></div><div class="beds">${state.beds.map(b=>`<div class="bed ${b.state.toLowerCase()}" data-bed="${b.id}"><div class="bed-top"><span>${b.wing} Wing</span><span>${b.department}</span></div><div class="bed-num">${b.id}</div><div class="bed-name">${b.patient||"Ready for next patient"}</div><div class="bed-state">● ${b.state}</div></div>`).join("")}</div></div>`;
    $$("[data-bed]").forEach(b=>b.onclick=()=>{const x=state.beds.find(y=>y.id===b.dataset.bed);toast(x.id+" • "+x.state+(x.patient?" • "+x.patient:""))});
    wireViewActions();
  }

  function renderMessages(){
    const c=state.messages[state.conversation]||state.messages[0];
    $("#view-messages").innerHTML=header("COLLABORATION","Messages","Fast, focused communication between operational and clinical teams.","<button class=\"btn\" data-action=\"new-message\">New message</button>")
      + `<div class="messages reveal"><div class="conversation-list">${state.messages.map((m,i)=>`<div class="conversation ${i===state.conversation?"active":""}" data-convo="${i}"><span class="avatar">${initials(m.name)}</span><span class="conversation-main"><strong>${esc(m.name)}</strong><span>${esc(m.preview)}</span></span><span class="conversation-time">${m.unread?m.unread+" new":"today"}</span></div>`).join("")}</div><div class="thread"><div class="thread-head"><div><strong>${esc(c.name)}</strong><div style="color:var(--muted);font-size:8.5px;margin-top:2px">${c.role} • internal workspace</div></div>${badge("Encrypted workspace","ok")}</div><div class="thread-body">${c.items.map(m=>`<div class="bubble ${m[0]}">${esc(m[1])}<small>${m[2]}</small></div>`).join("")}</div><div class="composer"><input class="input" id="messageInput" placeholder="Write a message…"><button class="btn primary" id="sendMessage">Send</button></div></div></div>`;
    $$("[data-convo]").forEach(x=>x.onclick=()=>{state.conversation=+x.dataset.convo;renderMessages()});
    $("#sendMessage").onclick=()=>{const input=$("#messageInput");if(!input.value.trim())return; c.items.push(["me",input.value.trim(),"now"]);c.preview=input.value.trim();input.value="";renderMessages();toast("Message sent")};
  }

  function renderTasks(){
    const filtered=state.tasks.filter(t=>state.taskFilter==="All"||t.status===state.taskFilter);
    $("#view-tasks").innerHTML=header("WORK QUEUE","Tasks","Prioritised operational work with due-date visibility.",'<button class="btn primary" data-action="new-task">+ New task</button>')
      + `<div class="toolbar"><div class="filters">${["All","To Do","In Progress","Completed"].map(x=>`<button class="filter ${state.taskFilter===x?"active":""}" data-tfilter="${x}">${x}</button>`).join("")}</div><button class="btn sm" data-action="export-tasks">Export CSV</button></div><div class="table-wrap card reveal"><table><thead><tr><th>Task</th><th>Patient</th><th>Priority</th><th>Due</th><th>Owner</th><th>Status</th></tr></thead><tbody>${filtered.map(t=>`<tr data-task="${t.id}"><td><strong>${esc(t.title)}</strong></td><td>${esc(t.patient)}</td><td>${badge(t.priority,t.priority==="Urgent"?"danger":t.priority==="High"?"warn":"info")}</td><td>${prettyDate(t.due)}</td><td class="subtext">${t.owner}</td><td>${badge(t.status,t.status==="Completed"?"ok":t.status==="In Progress"?"teal":"info")}</td></tr>`).join("")}</tbody></table></div>`;
    $$("[data-tfilter]").forEach(b=>b.onclick=()=>{state.taskFilter=b.dataset.tfilter;renderTasks()});
    $$("[data-task]").forEach(tr=>tr.onclick=()=>cycleTask(tr.dataset.task));
    wireViewActions();
  }

  function cycleTask(id){
    const t=state.tasks.find(x=>x.id===id);if(!t)return;
    const next=t.status==="To Do"?"In Progress":t.status==="In Progress"?"Completed":"To Do";t.status=next;store.set("tasks",state.tasks);renderTasks();toast("Task moved to "+next);
  }

  function renderAnalytics(){
    $("#view-analytics").innerHTML=header("ANALYTICS","Operational Intelligence","Metrics that help the care team see capacity, flow and service quality.")
      + `<div class="kpi-grid">${kpi("Completion rate","91%","+3.6% this month","green","✓")}${kpi("No-show rate","8.4%","−1.2 pts","blue","◷")}${kpi("Referral closure","67%","+5.1%","teal","↗")}${kpi("Avg. wait","12 min","−4 min","gold","◫")}</div>`
      + `<div class="grid-2"><article class="card reveal"><div class="card-head"><div><div class="card-title">Visits by department</div><div class="card-meta">Completed appointments, rolling week</div></div>${badge("Live","ok")}</div>${bars([72,58,45,39,31],["Card","Gen","Neuro","Peds","Ortho"])}</article><article class="card reveal"><div class="card-head"><div><div class="card-title">Care cycle time</div><div class="card-meta">Median hours to resolution</div></div>${badge("Improving","ok")}</div>${lineChart([11.2,10.5,10.2,9.6,8.8,8.4,7.8],["M","T","W","T","F","S","S"])}</article></div>`
      + `<div class="grid-3" style="margin-top:14px"><article class="image-card reveal"><div class="image-bg" style="background-image:url('${IMG.team}')"></div><div class="image-content"><h3>Team capacity</h3><p>Workload signals are visible before queues become bottlenecks.</p></div></article><article class="card reveal"><div class="card-head"><div class="card-title">SLA performance</div>${badge("92%","ok")}</div><div class="metric-list"><div class="metric-row"><span>Appointments</span><div class="meter"><span style="width:96%"></span></div><strong>96%</strong></div><div class="metric-row"><span>Labs</span><div class="meter"><span style="width:92%"></span></div><strong>92%</strong></div><div class="metric-row"><span>Referrals</span><div class="meter"><span style="width:73%"></span></div><strong>73%</strong></div></div></article><article class="card reveal"><div class="card-head"><div class="card-title">Signal quality</div>${badge("Reliable","ok")}</div><p class="section-sub">Data freshness, completeness and event consistency across the workspace.</p><div class="vital-value" style="font-size:28px;color:var(--teal)">98.7%</div><div class="section-sub">Last checked <span id="analyticsFreshness">just now</span></div></article></div>`;
    wireViewActions();
  }

  function aiAnswer(q){
    const s=q.toLowerCase();
    const openCare=state.care.filter(c=>c.stage!=="Resolved").length;
    const overdue=state.care.filter(c=>c.issue.toLowerCase().includes("overdue")&&c.stage!=="Resolved").length;
    const busy=state.providers.filter(p=>(p.today/p.capacity)>0.78).length;
    const noShow=state.appointments.filter(a=>a.status==="No Show").length;
    if(s.includes("provider")||s.includes("workload"))return {answer:`${busy} providers are above 78% of today's planned capacity. Dr. Maya Chen and Dr. Vikram Shah are the first places I would rebalance.`,action:"Move two flexible follow-ups to the next available normal-capacity provider.",confidence:88};
    if(s.includes("no-show")||s.includes("attendance"))return {answer:`The current synthetic schedule has ${noShow} recorded no-shows. The signal is highest in afternoon follow-ups where lead time is longer.`,action:"Prioritise same-day reminders for the next 24-hour follow-up cohort.",confidence:84};
    if(s.includes("care")||s.includes("follow"))return {answer:`There are ${openCare} open care items and ${overdue} explicitly overdue follow-ups. The queue is manageable, but urgent items should be assigned first.`,action:"Assign the oldest urgent items before adding new low-priority work.",confidence:92};
    if(s.includes("bed")||s.includes("capacity")){const occ=state.beds.filter(b=>b.state==="Occupied").length;return {answer:`Bed occupancy is ${Math.round(occ/state.beds.length*100)}% in the simulated live board. ${state.beds.filter(b=>b.state==="Available").length} beds are currently available.`,action:"Watch the cleaning queue so available capacity does not get stranded.",confidence:86};}
    return {answer:"I can read the current Averis operational state and return a concise operational recommendation from the simulated workspace.",action:"Ask about provider workload, no-shows, care follow-ups or bed capacity.",confidence:79};
  }

  function renderAI(){
    $("#view-ai").innerHTML=header("AI COPILOT","Operations Copilot","A deterministic, explainable assistant over the current Averis workspace.",'<span class="status teal"><i class="dot"></i>Local reasoning</span>')
      + `<div class="ai-layout"><article class="card ai-chat reveal"><div class="ai-messages" id="aiMessages"><div class="ai-bubble bot">I’m watching the operational picture. Ask me where the team is overloaded, which follow-ups need attention, or how capacity is trending.<div class="confidence">Confidence • 79%</div></div></div><div class="prompt-chips">${["Where are providers overloaded?","Which follow-ups need attention?","How is bed capacity?","What is driving no-shows?"].map(x=>`<button class="chip" data-prompt="${esc(x)}">${esc(x)}</button>`).join("")}</div><div class="ai-input"><input class="input" id="aiInput" placeholder="Ask an operations question…"><button class="btn primary" id="aiSend">Ask</button></div></article><aside class="card reveal"><div class="card-head"><div class="card-title">Insight engine</div>${badge("Grounded","ok")}</div><div class="metric-list"><div class="metric-row"><span>Schedule</span><div class="meter"><span style="width:93%"></span></div><strong>93%</strong></div><div class="metric-row"><span>Care</span><div class="meter"><span style="width:87%"></span></div><strong>87%</strong></div><div class="metric-row"><span>Capacity</span><div class="meter"><span style="width:81%"></span></div><strong>81%</strong></div><div class="metric-row"><span>Data quality</span><div class="meter"><span style="width:99%"></span></div><strong>99%</strong></div></div><div class="image-card" style="min-height:190px;margin-top:14px"><div class="image-bg" style="background-image:url('${IMG.care}')"></div><div class="image-content"><h3>Human decisions, better signals.</h3><p>AI should expose the reasoning, not hide it.</p></div></div></aside></div>`;
    const ask=()=>{const input=$("#aiInput");const q=input.value.trim();if(!q)return;const a=aiAnswer(q);const box=$("#aiMessages");box.insertAdjacentHTML("beforeend",`<div class="ai-bubble user">${esc(q)}</div><div class="ai-bubble bot">${esc(a.answer)}<div class="confidence">Action • ${esc(a.action)}<br>Confidence • ${a.confidence}%</div></div>`);input.value="";box.scrollTop=box.scrollHeight};
    $("#aiSend").onclick=ask;$("#aiInput").onkeydown=e=>{if(e.key==="Enter")ask()};$$("[data-prompt]").forEach(b=>b.onclick=()=>{$("#aiInput").value=b.dataset.prompt;ask()});
  }

  function renderReports(){
    const reports=[
      ["Daily Operations","Appointments, patient flow, cancellations and follow-up volume.","PDF / CSV","Operations"],
      ["Care Coordination","Open care items, priority queues and cycle-time indicators.","PDF","Clinical"],
      ["Capacity & Beds","Occupancy, cleaning queue and available capacity.","CSV","Operations"],
      ["Provider Workload","Appointments, active panel, task load and utilisation.","CSV","People"],
      ["Laboratory TAT","Turnaround distribution and critical-result acknowledgement.","PDF / CSV","Clinical"],
      ["Medication Inventory","Stock position, low-stock items and dispensing throughput.","CSV","Services"]
    ];
    $("#view-reports").innerHTML=header("REPORTING","Reports","Ready-to-export operational views built from the current workspace.",'<button class="btn primary" data-action="export-report">Export current view</button>')
      +`<div class="report-grid">${reports.map(r=>`<article class="card report-card reveal"><div class="eyebrow">${r[3]}</div><h3>${r[0]}</h3><p>${r[1]}</p><div class="report-foot"><span class="format">${r[2]}</span><button class="btn sm" data-report="${esc(r[0])}">Generate</button></div></article>`).join("")}</div>`;
    $$("[data-report]").forEach(b=>b.onclick=()=>generateReport(b.dataset.report));wireViewActions();
  }

  function renderSettings(){
    $("#view-settings").innerHTML=header("SYSTEM","Settings","Workspace appearance, live simulation and product preferences.")
      + `<div class="settings"><div class="settings-nav"><div class="settings-tab active">Workspace</div><div class="settings-tab">Appearance</div><div class="settings-tab">Notifications</div><div class="settings-tab">Access</div></div><article class="card reveal"><div class="card-head"><div><div class="card-title">Workspace controls</div><div class="card-meta">Averis Care Command</div></div>${badge("Healthy","ok")}</div><div class="setting-row"><div class="setting-copy"><strong>Live operations stream</strong><span>Animate timestamps, event activity and simulated clinical telemetry.</span></div><button class="toggle ${state.live?"on":""}" id="liveToggle"><i></i></button></div><div class="setting-row"><div class="setting-copy"><strong>Reduced motion</strong><span>Respect your browser's motion preference for animated surfaces.</span></div><button class="toggle on"><i></i></button></div><div class="setting-row"><div class="setting-copy"><strong>Show image atmosphere</strong><span>Use healthcare photography in hero and feature surfaces.</span></div><button class="toggle on"><i></i></button></div><div class="setting-row"><div class="setting-copy"><strong>Data mode</strong><span>This GitHub Pages build uses synthetic data only; no live patient records are connected.</span></div>${badge("Simulation","warn")}</div><div class="setting-row"><div class="setting-copy"><strong>Theme</strong><span>Switch the command center between clinical light and clinical dark.</span></div><button class="btn" id="settingsTheme">${state.theme==="dark"?"Switch to light":"Switch to dark"}</button></div></article></div>`;
    $("#liveToggle").onclick=()=>{state.live=!state.live;store.set("live",state.live);renderSettings();toast(state.live?"Live simulation enabled":"Live simulation paused")};
    $("#settingsTheme").onclick=()=>{setTheme();renderSettings()};
  }

  function renderCurrent(){
    const fns={overview:renderOverview,patients:renderPatients,patient360:renderPatient360,queue:renderQueue,appointments:renderAppointments,emergency:renderEmergency,care:renderCare,clinical:renderClinical,providers:renderProviders,beds:renderBeds,pharmacy:renderPharmacy,lab:renderLab,billing:renderBilling,messages:renderMessages,tasks:renderTasks,analytics:renderAnalytics,ai:renderAI,reports:renderReports,settings:renderSettings};
    (fns[state.view]||renderOverview)();
    setupReveal();
  }

  function setupReveal(){
    const els=$$(".reveal:not(.in)");
    if(!("IntersectionObserver" in window)){els.forEach(x=>x.classList.add("in"));return}
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.08});
    els.forEach(x=>io.observe(x));
  }

  function wireViewActions(){
    $$("[data-action]").forEach(b=>b.onclick=()=>handleAction(b.dataset.action));
  }
  function handleAction(action){
    const messages={
      "new-appointment":["Scheduling workspace opened","primary"],"new-patient":["Patient intake workspace opened","primary"],
      "new-care":["Care coordination form opened","primary"],"invite-provider":["Provider invite flow opened","primary"],
      "new-stock":["Inventory entry flow opened","primary"],"new-lab":["Lab order form opened","primary"],"new-message":["New message composer ready","primary"],
      "new-task":["Task composer ready","primary"]
    };
    if(action==="open-ai"){navigate("ai");return}
    if(action==="open-emergency"){navigate("emergency");return}
    if(action==="open-queue"){navigate("queue");return}
    if(action==="refresh"||action==="bed-refresh"){state.liveTick++;renderCurrent();toast("Live workspace synchronised")}
    else if(action==="export-patients"){exportCsv("averis-patients.csv",state.patients)}
    else if(action==="export-tasks"){exportCsv("averis-tasks.csv",state.tasks)}
    else if(action==="export-pharmacy"){toast("Pharmacy export prepared")}
    else if(action==="export-report"){generateReport("Daily Operations")}
    else if(messages[action])toast(messages[action][0]);
  }

  function openPatient(id){
    const p=state.patients.find(x=>x.id===id);if(!p)return;state.selectedPatient=id;
    const modal=$("#modalLayer");modal.className="modal-layer open";modal.innerHTML=`<div class="modal-card"><div class="modal-head"><div><div class="modal-title">Patient profile</div><div class="modal-sub">${p.id} • operational care context</div></div><button class="icon-btn" data-close>×</button></div><div class="modal-body"><div class="patient-modal"><div class="patient-hero"><div class="patient-hero-bg"></div><div class="patient-hero-content"><strong>${esc(p.name)}</strong><p>${p.age}y • ${p.gender} • ${p.condition}</p></div></div><div><div class="detail-grid"><div class="detail"><span>Care status</span><strong>${p.status}</strong></div><div class="detail"><span>Risk</span><strong>${p.risk}</strong></div><div class="detail"><span>Assigned provider</span><strong>${esc(p.provider)}</strong></div><div class="detail"><span>Department</span><strong>${p.department}</strong></div><div class="detail"><span>Last visit</span><strong>${prettyDate(p.lastVisit)}</strong></div><div class="detail"><span>Next visit</span><strong>${prettyDate(p.nextVisit)}</strong></div><div class="detail"><span>Attendance</span><strong>${p.attendance}%</strong></div><div class="detail"><span>Patient ID</span><strong>${p.id}</strong></div></div><div class="card" style="margin-top:10px"><div class="card-head"><div class="card-title">Care signal</div>${badge(p.risk+" risk",p.risk==="High"?"danger":"warn")}</div><p class="section-sub">Follow-up and operational context is surfaced here before the next care touchpoint.</p><div class="metric-list" style="margin-top:10px"><div class="metric-row"><span>Plan progress</span><div class="meter"><span style="width:${int(54,92)}%"></span></div><strong>${int(54,92)}%</strong></div></div></div></div></div></div><div class="modal-foot"><button class="btn" data-close>Close</button><button class="btn primary" data-action-modal="task">Create follow-up task</button></div></div>`;
    $$("[data-close]",modal).forEach(b=>b.onclick=closeModal);$$("[data-action-modal]",modal).forEach(b=>b.onclick=()=>{closeModal();toast("Follow-up task created")});
  }
  function closeModal(){const m=$("#modalLayer");m.className="modal-layer";m.innerHTML=""}

  function openCommand(){
    const overlay=document.createElement("div");overlay.className="command-overlay open";overlay.id="commandOverlay";
    overlay.innerHTML=`<div class="command-box"><input class="command-input" id="commandInput" autofocus placeholder="Search patients, modules, tasks…"><div class="command-results" id="commandResults"></div></div>`;
    document.body.appendChild(overlay);
    const results=$("#commandResults"),input=$("#commandInput");
    const items=[
      ...state.patients.slice(0,12).map(p=>({t:p.name,s:"Patient",action:()=>{closeCommand();openPatient(p.id)}})),
      ...NAV.flatMap(n=>n.items).map(x=>({t:x[1],s:"Module",action:()=>{closeCommand();navigate(x[0])}})),
      ...state.tasks.slice(0,8).map(t=>({t:t.title,s:"Task",action:()=>{closeCommand();navigate("tasks")}}))
    ];
    const render=()=>{const q=input.value.toLowerCase();results.innerHTML=items.filter(x=>x.t.toLowerCase().includes(q)||x.s.toLowerCase().includes(q)).slice(0,18).map((x,i)=>`<div class="command-item" data-ci="${i}"><i>⌕</i><b>${esc(x.t)}</b><span>${x.s}</span></div>`).join("");$$("[data-ci]",results).forEach((el,i)=>el.onclick=()=>items.filter(x=>x.t.toLowerCase().includes(q)||x.s.toLowerCase().includes(q)).slice(0,18)[i].action())};
    input.oninput=render;render();
    overlay.onclick=e=>{if(e.target===overlay)closeCommand()};input.onkeydown=e=>{if(e.key==="Escape")closeCommand();if(e.key==="Enter")$(".command-item",results)?.click()};
  }
  function closeCommand(){$("#commandOverlay")?.remove()}
  window.addEventListener("hashchange",()=>{const v=location.hash.replace("#","");if(v&&v!==state.view){state.view=v;renderNav();renderCurrent()}});

  function renderNotifications(){
    const p=$("#notificationsPopover"),unread=state.notifications.filter(n=>n.unread).length;
    $("#notifCount").textContent=unread;
    p.innerHTML=state.notifications.map(n=>`<div class="notification ${n.unread?"unread":""}"><div class="notification-icon">${n.type==="lab"?"△":n.type==="appt"?"◷":n.type==="bed"?"▦":n.type==="care"?"♡":"●"}</div><div><strong>${esc(n.title)}</strong><span>${esc(n.body)}</span></div><time>${n.time}</time></div>`).join("");
  }

  function toast(msg){const n=document.createElement("div");n.className="toast";n.innerHTML=`<span class="toast-dot"></span><span>${esc(msg)}</span>`;$("#toastHost").appendChild(n);setTimeout(()=>n.remove(),2600)}

  function exportCsv(filename,rows){
    if(!rows.length)return;
    const cols=Object.keys(rows[0]).filter(k=>typeof rows[0][k]!=="object");const csv=[cols.join(","),...rows.map(r=>cols.map(c=>`"${String(r[c]??"").replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob=new Blob([csv],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href);toast("Export ready");
  }
  function generateReport(name){toast(name+" report generated");}

  function liveTick(){
    if(!state.live)return;
    state.liveTick++;
    const latency=int(12,32);$("#systemLatency").textContent=latency+" ms";
    $("#systemBarFill").style.width=int(84,97)+"%";
    $("#syncText").textContent="Synchronized "+(state.liveTick%6===0?"just now":state.liveTick+"s ago");
    $("#liveTime").textContent=new Date().toLocaleTimeString([], {hour12:false});
    $("#footerStatus").textContent=latency<26?"All systems nominal":"Monitoring latency";
    if(state.view==="clinical"&&state.liveTick%2===0)renderClinical();
    if(state.view==="overview"){
      const liveNode=$("#overviewLiveTime");
      if(liveNode) liveNode.textContent="LIVE • "+liveStamp(new Date());
      if(state.liveTick%9===0&&$("#liveActivity")) $("#liveActivity").innerHTML=activityRows(7);
    }
  }

  function init(){
    seed();applyTheme();renderNav();renderCurrent();renderNotifications();
    $("#themeToggle").onclick=setTheme;
    $("#openCommand").onclick=openCommand;
    $("#refreshLive").onclick=()=>{state.liveTick++;renderCurrent();toast("Live data synchronised")};
    $("#notifButton").onclick=()=>$("#notificationsPopover").classList.toggle("open");
    $("#openSidebar").onclick=()=>$("#sidebar").classList.add("open");
    $("#closeSidebar").onclick=()=>$("#sidebar").classList.remove("open");
    const topProfile=$("#topProfileButton");
    if(topProfile) topProfile.onclick=()=>navigate("settings");

    const profile=$("#profileButton");
    if(profile){
      const nameNode=profile.querySelector("strong");
      const roleNode=profile.querySelector("small");
      const avatar=profile.querySelector(".avatar");
      if(nameNode) nameNode.textContent=PROFILE.name;
      if(roleNode) roleNode.textContent=PROFILE.role;
      if(avatar) avatar.textContent=PROFILE.initials;
      profile.onclick=()=>navigate("settings");
    }
    $("#modalLayer").onclick=e=>{if(e.target.id==="modalLayer")closeModal()};
    const backdrop=$("#backdropPhoto");
    if(backdrop){
      backdrop.addEventListener("error",()=>backdrop.classList.add("failed"),{once:true});
      backdrop.addEventListener("load",()=>backdrop.classList.add("ready"),{once:true});
    }
    document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommand()}if(e.key==="Escape"){closeCommand();closeModal()}});
    document.addEventListener("mousemove",e=>{document.documentElement.style.setProperty("--mx",(e.clientX/window.innerWidth*100)+"%");document.documentElement.style.setProperty("--my",(e.clientY/window.innerHeight*100)+"%")});
    const scrollBar=$(".scroll-progress span");
    const glow=$("#cursorGlow");
    let chromeFrame=0;
    const paintChrome=()=>{
      chromeFrame=0;
      const doc=document.documentElement, max=doc.scrollHeight-doc.clientHeight, y=window.scrollY||0;
      if(scrollBar) scrollBar.style.width=(max>0?Math.min(100,Math.max(0,(y/max)*100)):0)+"%";
    };
    const scheduleChrome=()=>{if(chromeFrame)return;chromeFrame=requestAnimationFrame(paintChrome)};
    window.addEventListener("scroll",scheduleChrome,{passive:true});
    window.addEventListener("resize",scheduleChrome,{passive:true});
    scheduleChrome();
    if(glow&&!window.matchMedia("(pointer: coarse)").matches){
      glow.style.opacity="1";
      window.addEventListener("pointermove",e=>{glow.style.left=e.clientX+"px";glow.style.top=e.clientY+"px"},{passive:true});
      window.addEventListener("pointerleave",()=>glow.style.opacity="0");
      window.addEventListener("pointerenter",()=>glow.style.opacity="1");
    }

    setInterval(liveTick,1000);
    setInterval(()=>{if(state.live){state.notifications.unshift({title:"Live workspace update",body:"Averis received a new operational event.",type:"system",time:"now",unread:true});state.notifications=state.notifications.slice(0,6);store.set("notifications",state.notifications);renderNotifications()}},15000);
    setInterval(()=>{if(state.live&&state.view==="overview"&&$("#liveActivity"))$("#liveActivity").innerHTML=activityRows(6)},9000);
  }
  init();
})();