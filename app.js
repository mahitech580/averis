(() => {
  "use strict";

  const KEY = "MAHI_AVERIS_NEXUS_2026_";
  const VERSION = "nexus-1.0.0";
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
  const uid = (p) => p + Math.random().toString(36).slice(2,9);
  const now = () => new Date();
  const fmtTime = d => new Intl.DateTimeFormat("en-IN",{hour:"2-digit",minute:"2-digit"}).format(d);
  const fmtDate = d => new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(d);
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));

  const store = {
    get(k, fallback=null) { try { const raw=localStorage.getItem(KEY+k); return raw==null?fallback:JSON.parse(raw); } catch { return fallback; } },
    set(k,v) { localStorage.setItem(KEY+k,JSON.stringify(v)); },
    del(k) { localStorage.removeItem(KEY+k); },
    wipe() { Object.keys(localStorage).filter(k=>k.startsWith(KEY)).forEach(k=>localStorage.removeItem(k)); }
  };

  const icons = {
    grid:"▦", patients:"◉", flow:"⇄", heart:"♡", calendar:"□", bed:"▥", lab:"⌁", pharmacy:"⌬",
    wallet:"◫", msg:"◌", tasks:"✓", analytics:"⌁", ai:"✦", incident:"!", settings:"⚙", search:"⌕",
    bell:"◔", plus:"+", arrow:"→", pulse:"⌁", users:"◍", shield:"◇"
  };

  const state = {
    route: "home", theme: store.get("theme","dark"), sidebar:true, command:false,
    profile: store.get("profile",{name:"Mahi",role:"Operations Director"}), notificationsOpen:false,
    search:"", selectedPatient:null, selectedIncident:null, modal:null, focus:false
  };

  const seed = {
    patients: [
      ["P-1042","Aarav Menon","29","M","General Medicine","Stable","Bay A-12","Dr. Iyer",92,"BP 118/76"],
      ["P-1043","Diya Rao","42","F","Cardiology","Watch","CCU-04","Dr. Shah",84,"BP 142/90"],
      ["P-1044","Kabir Nair","61","M","Neurology","Critical","ICU-03","Dr. Thomas",96,"SpO₂ 89%"],
      ["P-1045","Anaya Kapoor","35","F","Orthopedics","Stable","Ward 6-18","Dr. Reddy",73,"Pain 4/10"],
      ["P-1046","Rohan Das","53","M","Pulmonology","Watch","Ward 4-02","Dr. Bose",81,"SpO₂ 94%"],
      ["P-1047","Ishita Verma","24","F","Dermatology","Stable","OPD-21","Dr. Mehta",67,"Temp 98.4°F"],
      ["P-1048","Vihaan Singh","48","M","Endocrinology","Watch","Ward 2-11","Dr. Joshi",78,"Glucose 168"],
      ["P-1049","Meera Patel","70","F","Nephrology","Critical","ICU-07","Dr. Menon",97,"Cr 2.6 mg/dL"],
      ["P-1050","Arjun Rao","31","M","General Medicine","Stable","OPD-08","Dr. Iyer",58,"BP 122/78"],
      ["P-1051","Nisha Khan","46","F","Oncology","Watch","Daycare-03","Dr. Varma",89,"ANC 1.1"]
    ].map((p,i)=>({id:p[0],name:p[1],age:+p[2],sex:p[3],service:p[4],status:p[5],location:p[6],doctor:p[7],acuity:p[8],signal:p[9],updated: i<3 ? "just now" : i+3+" min ago"})),
    appointments: [
      ["09:10","Aarav Menon","General Medicine","Arrived"],
      ["09:25","Ritu Sethi","Cardiology","Checked in"],
      ["09:40","Meera Patel","Nephrology","In room"],
      ["10:15","Ishita Verma","Dermatology","Waiting"],
      ["10:30","Arjun Rao","General Medicine","Confirmed"],
      ["10:50","Nisha Khan","Oncology","Confirmed"],
      ["11:20","Vihaan Singh","Endocrinology","Waiting"],
      ["11:45","Diya Rao","Cardiology","Confirmed"]
    ].map((x,i)=>({id:"APT-"+(210+i),time:x[0],patient:x[1],service:x[2],status:x[3],mode:i%3===0?"Virtual":"In clinic"})),
    providers: [
      ["Dr. Iyer","General Medicine","On duty",87],["Dr. Shah","Cardiology","On duty",74],["Dr. Thomas","Neurology","In procedure",62],
      ["Dr. Reddy","Orthopedics","On duty",91],["Dr. Bose","Pulmonology","Break",48],["Dr. Mehta","Dermatology","On duty",66],
      ["Dr. Joshi","Endocrinology","On duty",81],["Dr. Menon","Nephrology","On duty",95],["Dr. Varma","Oncology","On duty",88]
    ].map((x,i)=>({id:"DOC-"+(31+i),name:x[0],specialty:x[1],status:x[2],load:x[3]})),
    beds: Array.from({length:24},(_,i)=>({id:"B-"+String(i+1).padStart(2,"0"),unit:["ICU","CCU","Ward A","Ward B"][i%4],state:i%7===0?"Clean":i%5===0?"Blocked":"Occupied",patient:i%7===0?null:["Aarav Menon","Diya Rao","Kabir Nair","Rohan Das","Meera Patel","Nisha Khan"][i%6]})),
    tasks: [
      ["Escalate ICU-03 telemetry alert","Critical","Clinical Ops"],
      ["Approve discharge bundle • P-1045","High","Care Coordination"],
      ["Resolve missing lab result • P-1048","High","Laboratory"],
      ["Confirm oncology day-care slots","Medium","Scheduling"],
      ["Review pharmacy stock variance","Medium","Pharmacy"],
      ["Close yesterday's revenue exceptions","Low","Finance"]
    ].map((x,i)=>({id:"TASK-"+(501+i),title:x[0],priority:x[1],team:x[2],done:i===5})),
    incidents: [
      ["INC-701","ICU telemetry drift","Clinical","P-1044","Critical","Open"],
      ["INC-702","Bed turnover delay • Ward A","Capacity","—","High","Investigating"],
      ["INC-703","Lab interface latency","Digital","—","Medium","Monitoring"]
    ].map(x=>({id:x[0],title:x[1],type:x[2],subject:x[3],severity:x[4],status:x[5],time:fmtTime(new Date(Date.now()-Math.random()*50*60000))})),
    messages: [
      ["Dr. Shah","Can we hold CCU-04 for 20 minutes?","6 min"],
      ["Pharmacy","Warfarin stock variance needs review.","14 min"],
      ["Care Desk","P-1045 discharge packet is ready.","21 min"],
      ["Lab","Critical potassium result posted.","32 min"]
    ].map((x,i)=>({id:"MSG-"+(i+1),from:x[0],text:x[1],ago:x[2],read:i>1}))
  };

  const data = {
    patients: store.get("patients", seed.patients),
    appointments: store.get("appointments", seed.appointments),
    providers: store.get("providers", seed.providers),
    beds: store.get("beds", seed.beds),
    tasks: store.get("tasks", seed.tasks),
    incidents: store.get("incidents", seed.incidents),
    messages: store.get("messages", seed.messages),
    orders: store.get("orders",[
      {id:"LAB-801",patient:"Kabir Nair",test:"Troponin I",status:"Critical",value:"0.42 ng/mL"},
      {id:"LAB-802",patient:"Meera Patel",test:"Creatinine",status:"High",value:"2.6 mg/dL"},
      {id:"LAB-803",patient:"Rohan Das",test:"CBC",status:"Ready",value:"Validated"},
      {id:"LAB-804",patient:"Nisha Khan",test:"CBC",status:"Pending",value:"Awaiting analyzer"}
    ]),
    inventory: store.get("inventory",[
      {name:"Ceftriaxone 1g",stock:72,min:40,unit:"vials",risk:"Normal"},
      {name:"Insulin glargine",stock:18,min:24,unit:"pens",risk:"Low"},
      {name:"Heparin 5,000 IU",stock:44,min:30,unit:"vials",risk:"Normal"},
      {name:"IV cannula 20G",stock:114,min:90,unit:"units",risk:"Normal"},
      {name:"Piperacillin/Tazo",stock:11,min:20,unit:"vials",risk:"Low"}
    ]),
    now: Date.now()
  };

  function persist(){
    ["patients","appointments","providers","beds","tasks","incidents","messages","orders","inventory"].forEach(k=>store.set(k,data[k]));
    store.set("theme",state.theme); store.set("profile",state.profile);
  }

  const nav = [
    {id:"home",label:"Command Center",icon:icons.grid,group:"Core"},
    {id:"patients",label:"Patients",icon:icons.patients,group:"Care"},
    {id:"patient360",label:"Patient 360",icon:icons.heart,group:"Care"},
    {id:"flow",label:"Flow & Triage",icon:icons.flow,group:"Care"},
    {id:"appointments",label:"Appointments",icon:icons.calendar,group:"Care"},
    {id:"capacity",label:"Capacity",icon:icons.bed,group:"Operations"},
    {id:"providers",label:"Providers",icon:icons.users,group:"Operations"},
    {id:"lab",label:"Laboratory",icon:icons.lab,group:"Operations"},
    {id:"pharmacy",label:"Pharmacy",icon:icons.pharmacy,group:"Operations"},
    {id:"finance",label:"Revenue",icon:icons.wallet,group:"Operations"},
    {id:"messages",label:"Messages",icon:icons.msg,group:"Work"},
    {id:"tasks",label:"Work Queue",icon:icons.tasks,group:"Work"},
    {id:"incidents",label:"Incident Command",icon:icons.incident,group:"Work"},
    {id:"analytics",label:"Analytics",icon:icons.analytics,group:"Intelligence"},
    {id:"copilot",label:"AI Copilot",icon:icons.ai,group:"Intelligence"},
    {id:"settings",label:"Workspace",icon:icons.settings,group:"System"}
  ];

  const routes = Object.fromEntries(nav.map(n=>[n.id,n]));
  const titles = Object.fromEntries(nav.map(n=>[n.id,n.label]));

  function toast(msg, type="info"){
    const host=$("#toast"), el=document.createElement("div");
    el.className="toast "+type; el.innerHTML="<span>"+(type==="success"?"✓":type==="danger"?"!":"•")+"</span><div>"+esc(msg)+"</div>";
    host.appendChild(el); setTimeout(()=>el.classList.add("out"),2600); setTimeout(()=>el.remove(),3000);
  }

  function openModal(title, body, foot=""){
    $("#modal").innerHTML='<div class="modal-backdrop" data-close-modal><section class="modal-card" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><header class="modal-head"><div><span class="eyebrow">Averis workflow</span><h2>'+esc(title)+'</h2></div><button class="icon-btn" data-close-modal aria-label="Close">×</button></header><div class="modal-body">'+body+'</div>'+(foot?'<footer class="modal-foot">'+foot+'</footer>':"")+"</section></div>";
    $("#modal").setAttribute("aria-hidden","false");
  }
  function closeModal(){ $("#modal").innerHTML=""; $("#modal").setAttribute("aria-hidden","true"); }

  function metric(label,value,delta,kind="up"){
    return '<article class="metric"><div class="metric-top"><span>'+esc(label)+'</span><span class="metric-dot"></span></div><strong>'+esc(value)+'</strong><div class="metric-bottom"><span class="'+kind+'">'+esc(delta)+'</span><span>vs 7d avg</span></div></article>';
  }

  function progress(v,label){
    return '<div class="prog"><div><span>'+esc(label)+'</span><b>'+v+'%</b></div><div class="track"><i style="width:'+clamp(v,0,100)+'%"></i></div></div>';
  }

  function shell(){
    const route=titles[state.route]||"Command Center";
    const unread=data.messages.filter(m=>!m.read).length;
    $("#app").innerHTML=
      '<div class="app-shell '+(state.sidebar?"":"collapsed")+' '+(state.focus?"focus-mode":"")+'">'+
      '<aside class="sidebar"><div class="brand"><div class="brand-mark"><img src="assets/averis-mark.svg" alt=""></div><div><strong>Averis</strong><small>by Mahi • NEXUS</small></div></div>'+
      '<div class="workspace"><span class="status-live"></span><div><b>MAHI HEALTH GRID</b><small>Simulation environment</small></div><span class="chev">⌄</span></div>'+
      '<nav id="nav"></nav>'+
      '<div class="sidebar-foot"><div class="mini-health"><div><span>Node health</span><b>99.94%</b></div><div class="tiny-track"><i style="width:99.94%"></i></div><small>Local-first • no cloud dependency</small></div><div class="user-mini"><div class="avatar">M</div><div><b>'+esc(state.profile.name||"Mahi")+'</b><small>'+esc(state.profile.role||"Operations Director")+'</small></div><button class="icon-btn" data-route="settings">⚙</button></div></div></aside>'+
      '<main class="main"><header class="topbar"><button class="icon-btn menu" data-toggle-sidebar>☰</button><div class="crumbs"><span>NEXUS</span><b>/</b><strong>'+esc(route)+'</strong></div><div class="top-actions"><button class="search-pill" data-command><span>⌕</span><span>Search anything</span><kbd>⌘ K</kbd></button><button class="icon-btn '+(unread?"has-dot":"")+'" data-notifications aria-label="Notifications">◔</button><button class="icon-btn" data-theme aria-label="Theme">'+(state.theme==="dark"?"☼":"☾")+'</button><button class="profile-pill" data-route="settings"><span class="avatar sm">M</span><span class="hide-sm">'+esc(state.profile.name||"Mahi")+'</span></button></div></header><div id="content"></div></main></div>';
    renderNav();
  }

  function renderNav(){
    const grouped={}; nav.forEach(n=>(grouped[n.group]??=[]).push(n));
    $("#nav").innerHTML=Object.entries(grouped).map(([g,items])=>'<div class="nav-group"><label>'+esc(g)+'</label>'+items.map(n=>'<button class="nav-item '+(state.route===n.id?"active":"")+'" data-route="'+n.id+'"><span class="nav-icon">'+n.icon+'</span><span>'+esc(n.label)+'</span>'+(n.id==="messages"&&data.messages.some(m=>!m.read)?'<em>'+data.messages.filter(m=>!m.read).length+'</em>':"")+'</button>').join("")+'</div>').join("");
  }

  function frame(eyebrow,title,copy,actions,body,accent="blue"){
    return '<section class="page" data-accent="'+accent+'"><div class="page-orbit"></div><div class="page-head"><div><span class="eyebrow">'+esc(eyebrow)+'</span><h1>'+esc(title)+'</h1><p>'+esc(copy)+'</p></div><div class="page-actions">'+(actions||"")+'</div></div>'+body+'</section>';
  }

  function btn(label,action,cls="secondary"){ return '<button class="btn '+cls+'" data-action="'+action+'">'+esc(label)+'</button>'; }

  function renderHome(){
    const critical=data.patients.filter(p=>p.status==="Critical").length;
    const occupied=data.beds.filter(b=>b.state==="Occupied").length;
    const fill=Math.round(occupied/data.beds.length*100);
    const queue=data.appointments.filter(a=>a.status==="Waiting").length+4;
    const taskOpen=data.tasks.filter(t=>!t.done).length;
    const bars=[54,68,61,72,79,74,83,88,80,92,84,77];
    return frame("LIVE OPERATIONS","Good morning, Mahi.","A unified view of patient flow, capacity, care risk and work that needs attention now.",btn("New patient","new-patient","primary")+btn("Run huddle","run-huddle"),
      '<div class="hero-grid"><article class="hero-card"><div class="hero-copy"><span class="chip live">● LIVE NETWORK</span><h2>Care is moving.<br><em>See what changes next.</em></h2><p>Track today’s operating picture across triage, capacity, clinicians, diagnostics and revenue signals without leaving the command surface.</p><div class="hero-meta"><span><b>14</b> care transitions due</span><span><b>6</b> risks need review</span><span><b>4m</b> median queue</span></div></div><div class="hero-visual"><div class="orbit o1"></div><div class="orbit o2"></div><div class="core"><span>HEALTH<br>GRID</span><b>99.94</b><small>system health</small></div><i class="node n1">ICU</i><i class="node n2">LAB</i><i class="node n3">OPD</i><i class="node n4">BED</i></div></article><div class="metric-grid">'+metric("Patients in care",String(data.patients.length),"8.4%","up")+metric("Bed utilization",fill+"%","2.1%","up")+metric("Critical watch",String(critical),"Needs review","warn")+metric("Open work",String(taskOpen),"3 due now","warn")+'</div></div>'+
      '<div class="grid-2"><article class="panel span-2"><div class="panel-head"><div><span class="eyebrow">Flow signal</span><h3>Patient demand • today</h3></div><span class="tag">Rolling 12h</span></div><div class="chart-wrap"><div class="ylabels"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div class="bars">'+bars.map((b,i)=>'<i style="height:'+b+'%"><span>'+((i+8)%12||12)+':00</span></i>').join("")+'</div></div></article><article class="panel"><div class="panel-head"><div><span class="eyebrow">Attention</span><h3>Now</h3></div>'+btn("Open flow","flow","ghost")+'</div><div class="attention-list">'+data.incidents.slice(0,3).map(x=>'<button class="attention" data-incident="'+x.id+'"><span class="sev '+x.severity.toLowerCase()+'"></span><div><b>'+esc(x.title)+'</b><small>'+esc(x.type)+' • '+esc(x.status)+'</small></div><strong>→</strong></button>').join("")+'</div></article></div>'+
      '<div class="grid-3"><article class="panel"><div class="panel-head"><div><span class="eyebrow">Capacity</span><h3>Unit utilization</h3></div><span class="ring"><b>'+fill+'%</b></span></div>'+["ICU", "CCU", "Ward A", "Ward B"].map((u,i)=>progress([86,78,91,63][i],u)).join("")+'</article><article class="panel"><div class="panel-head"><div><span class="eyebrow">Queue</span><h3>Front door</h3></div><span class="big-number">'+queue+'</span></div><div class="queue-line"><span class="queue-dot red"></span><b>2 urgent</b><small>triage lane</small></div><div class="queue-line"><span class="queue-dot gold"></span><b>5 standard</b><small>OPD wait</small></div><div class="queue-line"><span class="queue-dot blue"></span><b>3 virtual</b><small>telecare</small></div>'+btn("Manage queue","flow","ghost")+'</article><article class="panel highlight"><div class="panel-head"><div><span class="eyebrow">Copilot signal</span><h3>Suggested next move</h3></div><span class="ai-badge">✦ AI</span></div><p class="quote">“Shift one monitored bed to Ward B before the 12:00 demand spike. Staffing allows the move.”</p><div class="confidence"><span>Confidence</span><b>87%</b></div>'+btn("Review rationale","copilot","primary")+'</article></div>'+
      '<div class="ticker"><span class="pulse-dot"></span><b>Live stream</b><span>Bed B-19 cleaned</span><span>•</span><span>Troponin posted for P-1044</span><span>•</span><span>Provider load recalculated</span><span>•</span><span>Revenue exceptions +2</span></div>'
    );
  }

  function patientTable(rows=data.patients){
    return '<div class="table-shell"><table><thead><tr><th>Patient</th><th>Service</th><th>State</th><th>Location</th><th>Lead</th><th>Signal</th><th></th></tr></thead><tbody>'+rows.map(p=>'<tr><td><button class="link-btn" data-patient="'+p.id+'"><span class="patient-avatar">'+p.name.split(" ").map(x=>x[0]).join("").slice(0,2)+'</span><span><b>'+esc(p.name)+'</b><small>'+esc(p.id)+' • '+p.age+'y '+p.sex+'</small></span></button></td><td>'+esc(p.service)+'</td><td><span class="state '+p.status.toLowerCase()+'">'+esc(p.status)+'</span></td><td>'+esc(p.location)+'</td><td>'+esc(p.doctor)+'</td><td><b>'+esc(p.signal)+'</b><small>'+esc(p.updated)+'</small></td><td><button class="icon-btn" data-patient="'+p.id+'">→</button></td></tr>').join("")+'</tbody></table></div>';
  }

  function renderPatients(){
    return frame("CARE REGISTRY","Patients","A live operational registry with search, acuity, location and care-team context.",btn("New patient","new-patient","primary")+btn("Export view","export-patients"),
      '<div class="filterbar"><div class="search-box"><span>⌕</span><input id="patientSearch" placeholder="Search name, ID, service..." value="'+esc(state.search)+'"></div><select id="patientStatus"><option value="">All states</option><option>Stable</option><option>Watch</option><option>Critical</option></select><select id="patientService"><option value="">All services</option>'+[...new Set(data.patients.map(p=>p.service))].map(s=>'<option>'+esc(s)+'</option>').join("")+'</select><button class="btn ghost" data-action="clear-filters">Reset</button></div><div class="section-kpis">'+metric("Registry",String(data.patients.length),"Live","up")+metric("Critical",String(data.patients.filter(p=>p.status==="Critical").length),"Immediate","warn")+metric("Watch",String(data.patients.filter(p=>p.status==="Watch").length),"Monitored","warn")+metric("Stable",String(data.patients.filter(p=>p.status==="Stable").length),"No escalation","up")+'</div><div class="panel">'+patientTable()+'</div>'
    );
  }

  function render360(){
    const p=data.patients.find(x=>x.id===state.selectedPatient)||data.patients[1];
    const labs=data.orders.filter(o=>o.patient===p.name);
    return frame("PATIENT 360",p.name,"A connected operational snapshot for one care episode — context first, action second.",btn("Back to patients","patients")+btn("Add care note","care-note","primary"),
      '<div class="identity-card"><div class="big-avatar">'+p.name.split(" ").map(x=>x[0]).join("").slice(0,2)+'</div><div class="identity-main"><div><h2>'+esc(p.name)+'</h2><span>'+esc(p.id)+' • '+p.age+'y • '+p.sex+' • '+esc(p.service)+'</span></div><span class="state '+p.status.toLowerCase()+'">'+esc(p.status)+'</span></div><div class="identity-fact"><small>Location</small><b>'+esc(p.location)+'</b></div><div class="identity-fact"><small>Lead</small><b>'+esc(p.doctor)+'</b></div><div class="identity-fact"><small>Acuity</small><b>'+p.acuity+'/100</b></div></div>'+
      '<div class="grid-3"><article class="panel"><div class="panel-head"><div><span class="eyebrow">Signals</span><h3>Current observations</h3></div><span class="chip live">LIVE</span></div><div class="vital-grid"><div><small>Pulse</small><b>'+((68+p.acuity)%35+65)+'</b><span>bpm</span></div><div><small>SpO₂</small><b>'+(p.status==="Critical"?89:94)+'</b><span>%</span></div><div><small>Temp</small><b>98.6</b><span>°F</span></div><div><small>Risk</small><b>'+clamp(p.acuity-8,5,99)+'</b><span>/100</span></div></div></article><article class="panel"><div class="panel-head"><div><span class="eyebrow">Diagnostics</span><h3>Latest results</h3></div><button class="btn ghost" data-route="lab">Lab</button></div><div class="result-list">'+(labs.length?labs.map(l=>'<div class="result"><span class="status-icon '+l.status.toLowerCase()+'">•</span><div><b>'+esc(l.test)+'</b><small>'+esc(l.id)+' • '+esc(l.value)+'</small></div><em>'+esc(l.status)+'</em></div>').join(""):'<div class="empty">No matching lab results in demo dataset.</div>')+'</div></article><article class="panel"><div class="panel-head"><div><span class="eyebrow">Care plan</span><h3>Today</h3></div>'+btn("Add task","new-task","ghost")+'</div><div class="timeline"><div><i></i><span><b>08:30</b> Safety review completed</span></div><div><i></i><span><b>10:15</b> Consultant round</span></div><div><i></i><span><b>12:00</b> Next reassessment</span></div><div><i></i><span><b>16:00</b> Disposition checkpoint</span></div></div></article></div>'+
      '<article class="panel"><div class="panel-head"><div><span class="eyebrow">Operational context</span><h3>What changed</h3></div><span class="tag">last 60 min</span></div><div class="change-grid"><div><small>Queue position</small><b>#3</b><em>improved by 2</em></div><div><small>Care tasks</small><b>4</b><em>1 due in 40m</em></div><div><small>Bed dependency</small><b>'+esc(p.location)+'</b><em>confirmed</em></div><div><small>Communication</small><b>2</b><em>messages unread</em></div></div></article>'
    );
  }

  function renderFlow(){
    const lanes={Emergency:[],Urgent:[],Standard:[],Virtual:[]};
    data.appointments.forEach((a,i)=>lanes[i%4===0?"Emergency":i%4===1?"Urgent":i%4===2?"Standard":"Virtual"].push(a));
    const card=(a)=>'<button class="flow-card" data-appointment="'+a.id+'"><div><span class="chip '+(a.status==="Waiting"?"warn":"")+"\">"+esc(a.status)+"</span><small>"+esc(a.time)+" • "+esc(a.mode)+"</small></div><b>'+esc(a.patient)+'</b><span>'+esc(a.service)+'</span><strong>Open →</strong></button>';
    return frame("FRONT DOOR","Flow & triage","Move arrivals through the right lane with a live queue, acuity and next-action view.",btn("Add arrival","new-arrival","primary"),
      '<div class="flow-summary"><div>'+metric("Waiting","7","12%","up")+'</div><div>'+metric("Median wait","14m","2m","up")+'</div><div>'+metric("Urgent","2","Needs room","warn")+'</div><div>'+metric("Virtual","3","Across 2 services","up")+'</div></div><div class="kanban">'+Object.entries(lanes).map(([lane,items])=>'<section class="lane"><header><div><span class="lane-dot '+lane.toLowerCase()+'"></span><b>'+lane+'</b></div><span>'+items.length+'</span></header>'+items.map(card).join("")+'</section>').join("")+'</div>'
    );
  }

  function renderAppointments(){
    return frame("SCHEDULING","Appointments","Coordinate rooms, providers and patient arrival patterns in one operational timeline.",btn("New appointment","new-appointment","primary")+btn("Auto-balance","auto-balance"),
      '<div class="schedule-grid"><article class="panel schedule-main"><div class="panel-head"><div><span class="eyebrow">Today</span><h3>Appointment board</h3></div><span class="tag">'+data.appointments.length+' slots</span></div><div class="agenda">'+data.appointments.map(a=>'<button class="agenda-row" data-appointment="'+a.id+'"><time>'+esc(a.time)+'</time><span class="agenda-bar '+a.status.toLowerCase().replaceAll(" ","-")+'"></span><div><b>'+esc(a.patient)+'</b><small>'+esc(a.service)+' • '+esc(a.mode)+'</small></div><span class="state">'+esc(a.status)+'</span><span>→</span></button>').join("")+'</div></article><article class="panel"><div class="panel-head"><div><span class="eyebrow">Utilization</span><h3>Session mix</h3></div></div>'+progress(82,"General Medicine")+progress(74,"Cardiology")+progress(68,"Specialty")+progress(61,"Virtual care")+'<div class="mini-callout"><b>12:00</b><span>Highest demand window</span></div></article></div>'
    );
  }

  function renderCapacity(){
    const occupied=data.beds.filter(b=>b.state==="Occupied").length;
    const clean=data.beds.filter(b=>b.state==="Clean").length;
    return frame("RESOURCE ORCHESTRATION","Capacity board","Beds are a flow problem, not a static inventory. See state, ownership and turnover at a glance.",btn("Add bed","new-bed","primary")+btn("Start turnover","turnover"),
      '<div class="capacity-head"><div class="capacity-score"><span>Network occupancy</span><strong>'+Math.round(occupied/data.beds.length*100)+'%</strong><small>'+occupied+' occupied • '+clean+' clean • '+data.beds.length+' total</small></div><div class="capacity-stats"><div><b>3</b><span>turnovers</span></div><div><b>2</b><span>blocked</span></div><div><b>6</b><span>forecast opens</span></div></div></div><div class="bed-grid">'+data.beds.map(b=>'<button class="bed-card '+b.state.toLowerCase()+'" data-bed="'+b.id+'"><span>'+esc(b.id)+'</span><b>'+esc(b.state)+'</b><small>'+esc(b.patient||"Ready")+'</small><em>'+esc(b.unit)+'</em></button>').join("")+'</div>'
    );
  }

  function renderProviders(){
    return frame("CARE TEAM","Providers","A skills-aware staffing view that makes workload, availability and handoffs visible.",btn("Add provider","new-provider","primary"),
      '<div class="provider-grid">'+data.providers.map(p=>'<button class="provider-card" data-provider="'+p.id+'"><div class="provider-top"><div class="provider-avatar">'+p.name.replace("Dr. ","").split(" ").map(x=>x[0]).join("").slice(0,2)+'</div><span class="state '+p.status.toLowerCase().replaceAll(" ","-")+'">'+esc(p.status)+'</span></div><h3>'+esc(p.name)+'</h3><p>'+esc(p.specialty)+'</p>'+progress(p.load,"Current load")+'<div class="provider-foot"><span>8 hrs</span><span>3 handoffs</span></div></button>').join("")+'</div>'
    );
  }

  function renderLab(){
    return frame("DIAGNOSTICS","Laboratory control","Track turnaround, critical results and the diagnostic work queue.",btn("New order","new-lab","primary")+btn("Refresh feed","refresh"),
      '<div class="section-kpis">'+metric("Open orders",String(data.orders.length),"4 critical","warn")+metric("Median TAT","39m","6m faster","up")+metric("Analyzer uptime","99.7%","stable","up")+metric("Critical",String(data.orders.filter(x=>x.status==="Critical").length),"Immediate","warn")+'</div><div class="panel table-panel"><div class="panel-head"><div><span class="eyebrow">Workbench</span><h3>Diagnostic queue</h3></div></div><div class="table-shell"><table><thead><tr><th>Order</th><th>Patient</th><th>Test</th><th>State</th><th>Value</th><th></th></tr></thead><tbody>'+data.orders.map(o=>'<tr><td><b>'+esc(o.id)+'</b></td><td>'+esc(o.patient)+'</td><td>'+esc(o.test)+'</td><td><span class="state '+o.status.toLowerCase()+'">'+esc(o.status)+'</span></td><td>'+esc(o.value)+'</td><td><button class="icon-btn" data-order="'+o.id+'">→</button></td></tr>').join("")+'</tbody></table></div></div>'
    );
  }

  function renderPharmacy(){
    return frame("MEDICATIONS","Pharmacy","Inventory risk and fulfillment signals designed for proactive operations.",btn("Add stock","new-stock","primary")+btn("Create pick list","pick-list"),
      '<div class="inventory-grid">'+data.inventory.map(x=>'<article class="inventory-card '+x.risk.toLowerCase()+'"><div class="inventory-top"><span>'+esc(x.risk)+'</span><b>'+x.stock+'</b></div><h3>'+esc(x.name)+'</h3><p>'+x.unit+' available • reorder at '+x.min+'</p><div class="inventory-meter"><i style="width:'+clamp(x.stock/x.min*50,12,100)+'%"></i></div><button class="btn ghost" data-inventory="'+esc(x.name)+'">Open item</button></article>').join("")+'</div>'
    );
  }

  function renderFinance(){
    return frame("REVENUE","Revenue control","A portfolio-grade revenue surface connecting throughput, exceptions and cash signals.",btn("New invoice","new-invoice","primary")+btn("Run reconciliation","reconcile"),
      '<div class="finance-hero"><div><span class="eyebrow">Today</span><h2>₹ 18.42L</h2><p>Gross captured value</p></div><div class="finance-spark">'+[32,44,39,51,45,58,64,61,72,68,81,78].map(v=>'<i style="height:'+v+'%"></i>').join("")+'</div><div class="finance-kpis"><div><b>96.8%</b><span>clean claims</span></div><div><b>₹ 1.12L</b><span>exceptions</span></div><div><b>3.4d</b><span>avg aging</span></div></div></div><div class="grid-2"><article class="panel"><div class="panel-head"><div><span class="eyebrow">Payers</span><h3>Collection mix</h3></div></div>'+progress(74,"Private insurance")+progress(58,"Corporate")+progress(43,"Government")+progress(86,"Self pay")+'</article><article class="panel"><div class="panel-head"><div><span class="eyebrow">Exceptions</span><h3>Need attention</h3></div></div><div class="alert-card"><b>7 claims</b><span>missing authorization</span><strong>Review →</strong></div><div class="alert-card"><b>3 bills</b><span>coding mismatch</span><strong>Review →</strong></div><div class="alert-card"><b>2 refunds</b><span>pending approval</span><strong>Review →</strong></div></article></div>'
    );
  }

  function renderMessages(){
    return frame("COLLABORATION","Messages","Keep clinical, pharmacy, laboratory and care coordination threads inside the operating picture.",btn("New message","new-message","primary"),
      '<div class="messages-layout"><aside class="thread-list">'+data.messages.map((m,i)=>'<button class="thread '+(i===0?"active":"")+'"><span class="thread-avatar">'+m.from[0]+'</span><div><b>'+esc(m.from)+'</b><p>'+esc(m.text)+'</p></div><time>'+esc(m.ago)+'</time></button>').join("")+'</aside><article class="message-room"><header><div><span class="eyebrow">Operations thread</span><h3>Clinical coordination</h3></div><span class="chip live">Encrypted demo</span></header><div class="bubbles"><div class="bubble"><small>Dr. Shah • 10:18</small><p>CCU-04 is ready. Do we need the bed reserved through noon?</p></div><div class="bubble mine"><small>You • 10:20</small><p>Hold for 20 minutes. I’ll re-check the flow forecast first.</p></div><div class="bubble"><small>Care Desk • 10:22</small><p>Forecast is +2 arrivals. Reservation is sensible.</p></div></div><form id="messageForm" class="composer"><input name="text" required placeholder="Write a care-ops message..."><button class="btn primary" type="submit">Send</button></form></article></div>'
    );
  }

  function renderTasks(){
    const cols={Critical:[],High:[],Medium:[],Low:[]}; data.tasks.forEach(t=>cols[t.priority].push(t));
    return frame("WORK QUEUE","Tasks & handoffs","Turn signals into owned work with explicit priority, team and completion state.",btn("New task","new-task","primary")+btn("Focus mode","focus"),
      '<div class="kanban task-kanban">'+Object.entries(cols).map(([k,items])=>'<section class="lane"><header><div><span class="lane-dot '+k.toLowerCase()+'"></span><b>'+k+'</b></div><span>'+items.length+'</span></header>'+items.map(t=>'<article class="task-card '+(t.done?"done":"")+'"><button class="check" data-task="'+t.id+'">'+(t.done?"✓":"")+'</button><div><b>'+esc(t.title)+'</b><small>'+esc(t.team)+'</small></div><button class="icon-btn" data-task-detail="'+t.id+'">→</button></article>').join("")+'</section>').join("")+'</div>'
    );
  }

  function renderIncidents(){
    return frame("INCIDENT COMMAND","Incident center","A dedicated surface for operational interruptions, owners, severity and containment.",btn("Declare incident","new-incident","primary")+btn("Drill mode","drill"),
      '<div class="incident-banner"><div><span class="chip danger">ACTIVE</span><h2>'+data.incidents.filter(x=>x.status!=="Monitoring").length+' active operational signals</h2><p>Review ownership before escalation thresholds are crossed.</p></div><div class="incident-radar"><span></span><i></i><b>3</b></div></div><div class="panel table-panel"><div class="table-shell"><table><thead><tr><th>Incident</th><th>Type</th><th>Subject</th><th>Severity</th><th>Status</th><th>Opened</th><th></th></tr></thead><tbody>'+data.incidents.map(x=>'<tr><td><button class="link-btn" data-incident="'+x.id+'"><b>'+esc(x.id)+'</b><span>'+esc(x.title)+'</span></button></td><td>'+esc(x.type)+'</td><td>'+esc(x.subject)+'</td><td><span class="sev-pill '+x.severity.toLowerCase()+'">'+esc(x.severity)+'</span></td><td>'+esc(x.status)+'</td><td>'+esc(x.time)+'</td><td><button class="icon-btn" data-incident="'+x.id+'">→</button></td></tr>').join("")+'</tbody></table></div></div>'
    );
  }

  function renderAnalytics(){
    return frame("INTELLIGENCE","Analytics","Operational signals across access, care, capacity, staffing and revenue — designed for decisions, not decoration.",btn("Export board","export-analytics","primary")+btn("Compare week","compare-week"),
      '<div class="analytics-top"><div class="score-card"><span>Operating index</span><strong>87.4</strong><small>+4.8% from last week</small><div class="score-ring"><b>87</b></div></div><div class="panel"><div class="panel-head"><div><span class="eyebrow">Flow</span><h3>Throughput</h3></div><span class="tag">7 day</span></div><div class="area-chart"><svg viewBox="0 0 720 210" preserveAspectRatio="none"><defs><linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#63e6d5" stop-opacity=".35"/><stop offset="1" stop-color="#63e6d5" stop-opacity="0"/></linearGradient></defs><path d="M0 167L80 142L160 155L240 118L320 134L400 81L480 96L560 58L640 76L720 30V210H0Z" fill="url(#ag)"/><path d="M0 167L80 142L160 155L240 118L320 134L400 81L480 96L560 58L640 76L720 30" fill="none" stroke="#63e6d5" stroke-width="3"/></svg></div></div></div><div class="grid-3"><article class="panel"><div class="panel-head"><div><span class="eyebrow">Access</span><h3>Front door</h3></div></div>'+progress(91,"Appointment kept")+progress(76,"Digital intake")+progress(83,"Virtual completion")+'</article><article class="panel"><div class="panel-head"><div><span class="eyebrow">Care</span><h3>Reliability</h3></div></div>'+progress(94,"Critical response")+progress(88,"Medication timing")+progress(72,"Discharge readiness")+'</article><article class="panel"><div class="panel-head"><div><span class="eyebrow">Finance</span><h3>Clean revenue</h3></div></div>'+progress(97,"Claim integrity")+progress(89,"Coding confidence")+progress(81,"Collection velocity")+'</article></div>'
    );
  }

  function renderCopilot(){
    return frame("INTELLIGENCE LAYER","AI Copilot","A transparent portfolio simulation: recommendations are local, inspectable and never presented as clinical truth.",btn("Clear session","clear-ai"),"accent",
      '<div class="copilot-grid"><article class="copilot-main"><div class="ai-head"><span class="ai-orbit">✦</span><div><span class="eyebrow">NEXUS REASONER</span><h2>Ask the operating picture.</h2><p>Try “What needs attention in the next hour?”</p></div></div><form id="aiForm" class="ai-form"><input name="prompt" id="aiPrompt" placeholder="Ask about flow, capacity, staffing, lab, pharmacy..."><button class="btn primary" type="submit">Run analysis</button></form><div id="aiReply" class="ai-reply"><div class="empty">No analysis yet. Use the prompt box to create a simulated operating brief.</div></div></article><aside class="panel prompt-panel"><span class="eyebrow">Suggested prompts</span><button data-ai="What needs attention in the next hour?">Next-hour risk</button><button data-ai="Where is capacity tightening?">Capacity pressure</button><button data-ai="Which patients need a closer operational review?">Patient review</button><button data-ai="Summarize the current command center.">Shift brief</button></aside></div>'
    );
  }

  function aiAnswer(prompt){
    const lower=prompt.toLowerCase();
    if(lower.includes("capacity")||lower.includes("bed")) return "Capacity is tightening in Ward A and ICU. Current demo occupancy is "+Math.round(data.beds.filter(b=>b.state==="Occupied").length/data.beds.length*100)+"%. Recommend reviewing two turnover candidates before the noon arrival window.";
    if(lower.includes("patient")||lower.includes("review")) return "Highest operational acuity is concentrated around Kabir Nair, Meera Patel and Diya Rao. Review the critical pair first, then clear the oldest watch-state task.";
    if(lower.includes("hour")||lower.includes("risk")) return "Three things deserve attention: ICU-03 telemetry drift, the Ward A turnover delay, and one critical lab result. The fastest reversible action is confirming a monitored bed and closing the lab acknowledgement loop.";
    return "The command picture is stable but active: "+data.patients.length+" patients, "+data.tasks.filter(t=>!t.done).length+" open tasks, "+data.incidents.length+" incidents and "+data.orders.length+" diagnostic orders in the synthetic dataset. Use the source views to inspect the underlying records.";
  }

  function renderSettings(){
    return frame("WORKSPACE","Workspace settings","Tune the local simulation, visual mode and portfolio identity.",btn("Reset demo data","reset-demo","danger"),
      '<div class="settings-grid"><article class="panel settings-profile"><div class="panel-head"><div><span class="eyebrow">Identity</span><h3>Portfolio operator</h3></div><span class="chip live">LOCAL</span></div><form id="profileForm" class="form-grid"><label>Display name<input name="name" value="'+esc(state.profile.name||"Mahi")+'"></label><label>Role<input name="role" value="'+esc(state.profile.role||"Operations Director")+'"></label><label>Workspace<input name="workspace" value="Mahi Health Grid" disabled></label><label>Version<input value="'+VERSION+'" disabled></label><button class="btn primary" type="submit">Save profile</button></form></article><article class="panel"><div class="panel-head"><div><span class="eyebrow">Appearance</span><h3>Interface</h3></div></div><div class="setting-row"><div><b>Theme</b><small>Dark or light operational canvas</small></div><button class="toggle '+(state.theme==="dark"?"on":"")+'" data-theme-toggle><i></i></button></div><div class="setting-row"><div><b>Command keyboard</b><small>⌘K / Ctrl+K opens search</small></div><kbd>⌘ K</kbd></div><div class="setting-row"><div><b>Data mode</b><small>Deterministic browser-local demo</small></div><span class="tag">LOCAL-FIRST</span></div></article><article class="panel"><div class="panel-head"><div><span class="eyebrow">Safety</span><h3>Portfolio boundaries</h3></div></div><div class="safety"><span>◇</span><p>This project contains synthetic records only. It does not authenticate clinicians, prescribe treatment, or connect to hospital systems.</p></div></article></div>'
    );
  }

  function renderRoute(){
    shell();
    const renderers={home:renderHome,patients:renderPatients,patient360:render360,flow:renderFlow,appointments:renderAppointments,capacity:renderCapacity,providers:renderProviders,lab:renderLab,pharmacy:renderPharmacy,finance:renderFinance,messages:renderMessages,tasks:renderTasks,incidents:renderIncidents,analytics:renderAnalytics,copilot:renderCopilot,settings:renderSettings};
    $("#content").innerHTML=(renderers[state.route]||renderHome)();
  }

  function navigate(route){
    if(!routes[route]) route="home";
    state.route=route; state.search=""; history.replaceState(null,"","#"+route); renderRoute(); window.scrollTo({top:0,behavior:"smooth"});
  }

  function filteredPatients(){
    const q=(state.search||"").toLowerCase();
    const st=$("#patientStatus")?.value||"";
    const sv=$("#patientService")?.value||"";
    return data.patients.filter(p=>(!q||[p.name,p.id,p.service,p.doctor,p.location].join(" ").toLowerCase().includes(q))&&(!st||p.status===st)&&(!sv||p.service===sv));
  }

  function updatePatientList(){
    const table=$(".table-shell tbody"); if(!table) return;
    table.innerHTML=filteredPatients().map(p=>'<tr><td><button class="link-btn" data-patient="'+p.id+'"><span class="patient-avatar">'+p.name.split(" ").map(x=>x[0]).join("").slice(0,2)+'</span><span><b>'+esc(p.name)+'</b><small>'+esc(p.id)+' • '+p.age+'y '+p.sex+'</small></span></button></td><td>'+esc(p.service)+'</td><td><span class="state '+p.status.toLowerCase()+'">'+esc(p.status)+'</span></td><td>'+esc(p.location)+'</td><td>'+esc(p.doctor)+'</td><td><b>'+esc(p.signal)+'</b><small>'+esc(p.updated)+'</small></td><td><button class="icon-btn" data-patient="'+p.id+'">→</button></td></tr>').join("");
  }

  function patientForm(){
    return '<form id="patientForm" class="form-grid"><label>Full name<input name="name" required placeholder="Enter synthetic patient name"></label><label>Age<input name="age" type="number" min="0" max="120" value="38"></label><label>Service<select name="service">'+[...new Set(data.patients.map(p=>p.service))].map(x=>'<option>'+esc(x)+'</option>').join("")+'</select></label><label>State<select name="status"><option>Stable</option><option>Watch</option><option>Critical</option></select></label><label>Location<input name="location" value="OPD-New"></label><label>Lead provider<select name="doctor">'+data.providers.map(p=>'<option>'+esc(p.name)+'</option>').join("")+'</select></label><label class="full">Signal<input name="signal" value="BP 120/80"></label><button class="btn primary" type="submit">Create patient</button></form>';
  }
  function simpleForm(id,fields,submit,label){
    return '<form id="'+id+'" class="form-grid">'+fields.map(f=>'<label '+(f.full?"class=\"full\"":"")+'>'+esc(f.label)+(f.type==="select"?'<select name="'+f.name+'">'+f.options.map(o=>'<option>'+esc(o)+'</option>').join("")+'</select>':'<input name="'+f.name+'" '+(f.required===false?"":"required")+' '+(f.type?"type=\""+f.type+"\"":"")+' value="'+esc(f.value||"")+'" placeholder="'+esc(f.placeholder||"")+'">')+'</label>').join("")+'<button class="btn primary" type="submit">'+esc(label||submit)+'</button></form>';
  }

  function openPatient(id){ state.selectedPatient=id; navigate("patient360"); }

  function perform(action){
    switch(action){
      case "new-patient": openModal("Create synthetic patient",patientForm()); break;
      case "new-task": openModal("Create work item",simpleForm("taskForm",[{name:"title",label:"Task",placeholder:"What needs to happen?"},{name:"priority",label:"Priority",type:"select",options:["Critical","High","Medium","Low"]},{name:"team",label:"Owning team",value:"Clinical Ops"}],"Create task")); break;
      case "new-appointment": openModal("New appointment",simpleForm("appointmentForm",[{name:"patient",label:"Patient",placeholder:"Synthetic patient name"},{name:"time",label:"Time",value:"12:15"},{name:"service",label:"Service",type:"select",options:[...new Set(data.patients.map(p=>p.service))]},{name:"mode",label:"Mode",type:"select",options:["In clinic","Virtual"]}],"Create appointment")); break;
      case "new-arrival": openModal("Register arrival",simpleForm("arrivalForm",[{name:"patient",label:"Patient",placeholder:"Synthetic patient name"},{name:"acuity",label:"Acuity",type:"select",options:["Emergency","Urgent","Standard","Virtual"]},{name:"service",label:"Service",type:"select",options:[...new Set(data.patients.map(p=>p.service))]}],"Register arrival")); break;
      case "new-provider": openModal("Add provider",simpleForm("providerForm",[{name:"name",label:"Provider name",placeholder:"Dr. Example"},{name:"specialty",label:"Specialty",type:"select",options:[...new Set(data.patients.map(p=>p.service))]},{name:"load",label:"Starting load",type:"number",value:"54"}],"Add provider")); break;
      case "new-lab": openModal("Create lab order",simpleForm("labForm",[{name:"patient",label:"Patient",placeholder:"Synthetic patient name"},{name:"test",label:"Test",placeholder:"CBC / Troponin / etc."},{name:"status",label:"Status",type:"select",options:["Pending","Ready","Critical"]},{name:"value",label:"Result value",value:"Awaiting"}],"Create order")); break;
      case "new-stock": openModal("Add inventory item",simpleForm("stockForm",[{name:"name",label:"Item",placeholder:"Medication / supply"},{name:"stock",label:"Stock",type:"number",value:"50"},{name:"min",label:"Reorder level",type:"number",value:"25"},{name:"unit",label:"Unit",value:"units"}],"Add item")); break;
      case "new-invoice": openModal("Create invoice",simpleForm("invoiceForm",[{name:"patient",label:"Account",placeholder:"Synthetic patient"},{name:"amount",label:"Amount",type:"number",value:"12500"},{name:"status",label:"Status",type:"select",options:["Draft","Submitted","Paid"]}],"Create invoice")); break;
      case "new-message": openModal("New operations message",simpleForm("newMessageForm",[{name:"from",label:"Recipient",value:"Care Desk"},{name:"text",label:"Message",placeholder:"Write a short operational message.",full:true}],"Send message")); break;
      case "new-incident": openModal("Declare incident",simpleForm("incidentForm",[{name:"title",label:"Incident",placeholder:"Describe the operational issue."},{name:"type",label:"Type",type:"select",options:["Clinical","Capacity","Digital","Staffing"]},{name:"subject",label:"Subject",value:"—"},{name:"severity",label:"Severity",type:"select",options:["Critical","High","Medium","Low"]}],"Declare incident")); break;
      case "care-note": openModal("Care note",simpleForm("careForm",[{name:"note",label:"Operational note",placeholder:"Add a synthetic care coordination note.",full:true}],"Save note")); break;
      case "run-huddle": toast("Huddle started — 4 attention items grouped for review.","success"); navigate("incidents"); break;
      case "turnover": toast("Turnover workflow opened for the next clean bed.","success"); break;
      case "auto-balance": toast("Scheduling rebalance simulation complete — 3 slots moved.","success"); break;
      case "pick-list": toast("Pharmacy pick list compiled for 8 synthetic orders.","success"); break;
      case "reconcile": toast("Revenue reconciliation simulation completed — 2 exceptions remain.","success"); break;
      case "export-patients": downloadCSV(data.patients,"averis-patients.csv"); break;
      case "export-analytics": toast("Analytics board prepared as a portfolio export.","success"); break;
      case "compare-week": toast("Weekly comparison: operating index +4.8%.","success"); break;
      case "refresh": state.now=Date.now(); toast("Live operational feed refreshed.","success"); break;
      case "focus": state.focus=!state.focus; renderRoute(); toast(state.focus?"Focus mode enabled":"Focus mode disabled","success"); break;
      case "drill": toast("Incident drill mode armed. No production actions are performed.","success"); break;
      case "clear-filters": state.search=""; renderRoute(); break;
      case "clear-ai": if($("#aiReply")) $("#aiReply").innerHTML='<div class="empty">Analysis cleared.</div>'; break;
      case "reset-demo": if(confirm("Reset all Averis Nexus demo data?")) { store.wipe(); location.reload(); } break;
      default: toast(action+" completed in simulation.","success");
    }
  }

  function downloadCSV(rows,name){
    const keys=Object.keys(rows[0]||{});
    const csv=[keys.join(","),...rows.map(r=>keys.map(k=>'"'+String(r[k]??"").replaceAll('"','""')+'"').join(","))].join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download=name; a.click(); URL.revokeObjectURL(a.href);
  }

  function submitForm(form){
    const fd=new FormData(form), x=Object.fromEntries(fd.entries());
    if(form.id==="patientForm"){
      const p={id:"P-"+Math.floor(2000+Math.random()*7000),name:x.name,age:+x.age||38,sex:"U",service:x.service,status:x.status,location:x.location,doctor:x.doctor,acuity:x.status==="Critical"?95:x.status==="Watch"?78:61,signal:x.signal,updated:"just now"};
      data.patients.unshift(p); persist(); closeModal(); toast("Patient "+p.id+" created in demo registry.","success"); renderRoute(); return;
    }
    if(form.id==="taskForm"){
      data.tasks.unshift({id:uid("TASK-"),title:x.title,priority:x.priority,team:x.team,done:false}); persist(); closeModal(); toast("Work item created.","success"); renderRoute(); return;
    }
    if(form.id==="appointmentForm"){
      data.appointments.push({id:uid("APT-"),time:x.time,patient:x.patient,service:x.service,status:"Confirmed",mode:x.mode}); persist(); closeModal(); toast("Appointment added to today's board.","success"); renderRoute(); return;
    }
    if(form.id==="arrivalForm"){ toast("Arrival "+x.patient+" added to "+x.acuity+" lane.","success"); closeModal(); renderRoute(); return; }
    if(form.id==="providerForm"){ data.providers.push({id:uid("DOC-"),name:x.name,specialty:x.specialty,status:"On duty",load:+x.load||50}); persist(); closeModal(); toast("Provider added.","success"); renderRoute(); return; }
    if(form.id==="labForm"){ const o={id:uid("LAB-"),patient:x.patient,test:x.test,status:x.status,value:x.value}; data.orders.unshift(o); persist(); closeModal(); toast("Lab order created.","success"); renderRoute(); return; }
    if(form.id==="stockForm"){ data.inventory.push({name:x.name,stock:+x.stock||0,min:+x.min||0,unit:x.unit,risk:(+x.stock||0)<(+x.min||0)?"Low":"Normal"}); persist(); closeModal(); toast("Inventory item added.","success"); renderRoute(); return; }
    if(form.id==="invoiceForm"){ closeModal(); toast("Invoice created for ₹"+x.amount+".","success"); return; }
    if(form.id==="newMessageForm"){ data.messages.unshift({id:uid("MSG-"),from:x.from,text:x.text,ago:"now",read:true}); persist(); closeModal(); toast("Message sent.","success"); renderRoute(); return; }
    if(form.id==="incidentForm"){ data.incidents.unshift({id:uid("INC-"),title:x.title,type:x.type,subject:x.subject,severity:x.severity,status:"Open",time:fmtTime(now())}); persist(); closeModal(); toast("Incident declared.","danger"); renderRoute(); return; }
    if(form.id==="careForm"){ closeModal(); toast("Care note saved to the local simulation.","success"); return; }
    if(form.id==="profileForm"){ state.profile.name=x.name||"Mahi"; state.profile.role=x.role||"Operations Director"; persist(); toast("Workspace profile saved.","success"); renderRoute(); return; }
  }

  function patientDetail(id){
    const p=data.patients.find(x=>x.id===id); if(!p) return;
    openModal(p.name,'<div class="detail-grid"><div><small>Patient ID</small><b>'+esc(p.id)+'</b></div><div><small>State</small><b>'+esc(p.status)+'</b></div><div><small>Service</small><b>'+esc(p.service)+'</b></div><div><small>Location</small><b>'+esc(p.location)+'</b></div><div><small>Lead</small><b>'+esc(p.doctor)+'</b></div><div><small>Signal</small><b>'+esc(p.signal)+'</b></div></div>','<button class="btn secondary" data-close-modal>Close</button><button class="btn primary" data-modal-route="patient360" data-id="'+esc(p.id)+'">Open Patient 360</button>');
  }

  function incidentDetail(id){
    const x=data.incidents.find(i=>i.id===id); if(!x) return;
    openModal(x.id,'<div class="detail-grid"><div><small>Incident</small><b>'+esc(x.title)+'</b></div><div><small>Type</small><b>'+esc(x.type)+'</b></div><div><small>Subject</small><b>'+esc(x.subject)+'</b></div><div><small>Severity</small><b>'+esc(x.severity)+'</b></div><div><small>Status</small><b>'+esc(x.status)+'</b></div><div><small>Opened</small><b>'+esc(x.time)+'</b></div></div>','<button class="btn secondary" data-close-modal>Close</button><button class="btn primary" data-resolve="'+esc(x.id)+'">Mark contained</button>');
  }

  function command(){
    const items=[...nav.map(n=>({type:"route",id:n.id,label:n.label})),...data.patients.map(p=>({type:"patient",id:p.id,label:p.name+" • "+p.service}))];
    openModal("Command search",'<div class="search-box big"><span>⌕</span><input id="commandInput" autofocus placeholder="Search modules or patients..."></div><div class="command-results" id="commandResults">'+items.slice(0,8).map(i=>'<button data-command-item="'+i.type+'" data-id="'+i.id+'"><span>'+esc(i.type==="route"?"◈":"◉")+'</span><b>'+esc(i.label)+'</b><small>'+esc(i.id)+'</small></button>').join("")+'</div>');
    setTimeout(()=>$("#commandInput")?.focus(),20);
  }

  function bind(){
    document.addEventListener("click",e=>{
      const route=e.target.closest("[data-route]")?.dataset.route; if(route){closeModal();navigate(route);return;}
      if(e.target.closest("[data-close-modal]")){closeModal();return;}
      if(e.target.closest("[data-toggle-sidebar]")){state.sidebar=!state.sidebar;$(".app-shell").classList.toggle("collapsed",!state.sidebar);return;}
      if(e.target.closest("[data-theme], [data-theme-toggle]")){state.theme=state.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=state.theme;persist();renderRoute();return;}
      if(e.target.closest("[data-notifications]")){toast(data.messages.filter(m=>!m.read).length?data.messages.filter(m=>!m.read).length+" unread messages":"No new unread messages");data.messages.forEach(m=>m.read=true);persist();renderNav();return;}
      if(e.target.closest("[data-command]")){command();return;}
      const act=e.target.closest("[data-action]")?.dataset.action; if(act){perform(act);return;}
      const p=e.target.closest("[data-patient]")?.dataset.patient; if(p){patientDetail(p);return;}
      const inc=e.target.closest("[data-incident]")?.dataset.incident; if(inc){incidentDetail(inc);return;}
      const task=e.target.closest("[data-task]")?.dataset.task; if(task){const t=data.tasks.find(x=>x.id===task);if(t){t.done=!t.done;persist();renderRoute();toast(t.done?"Task completed":"Task reopened","success");}return;}
      const appointment=e.target.closest("[data-appointment]")?.dataset.appointment; if(appointment){const a=data.appointments.find(x=>x.id===appointment);if(a) openModal("Appointment detail",'<div class="detail-grid"><div><small>Time</small><b>'+esc(a.time)+'</b></div><div><small>Patient</small><b>'+esc(a.patient)+'</b></div><div><small>Service</small><b>'+esc(a.service)+'</b></div><div><small>Mode</small><b>'+esc(a.mode)+'</b></div><div><small>Status</small><b>'+esc(a.status)+'</b></div></div>');return;}
      const bed=e.target.closest("[data-bed]")?.dataset.bed; if(bed){const b=data.beds.find(x=>x.id===bed);openModal(b.id,'<div class="detail-grid"><div><small>Unit</small><b>'+esc(b.unit)+'</b></div><div><small>State</small><b>'+esc(b.state)+'</b></div><div><small>Patient</small><b>'+esc(b.patient||"Ready")+'</b></div></div>','<button class="btn primary" data-bed-action="'+esc(b.id)+'">Cycle state</button>');return;}
      const provider=e.target.closest("[data-provider]")?.dataset.provider; if(provider){const p=data.providers.find(x=>x.id===provider);openModal(p.name,'<div class="detail-grid"><div><small>Specialty</small><b>'+esc(p.specialty)+'</b></div><div><small>Status</small><b>'+esc(p.status)+'</b></div><div><small>Load</small><b>'+p.load+'%</b></div><div><small>Handoffs</small><b>3</b></div></div>');return;}
      const order=e.target.closest("[data-order]")?.dataset.order; if(order){const o=data.orders.find(x=>x.id===order);openModal(o.id,'<div class="detail-grid"><div><small>Patient</small><b>'+esc(o.patient)+'</b></div><div><small>Test</small><b>'+esc(o.test)+'</b></div><div><small>State</small><b>'+esc(o.status)+'</b></div><div><small>Result</small><b>'+esc(o.value)+'</b></div></div>');return;}
      const inv=e.target.closest("[data-inventory]")?.dataset.inventory; if(inv){const x=data.inventory.find(i=>i.name===inv);openModal(x.name,'<div class="detail-grid"><div><small>Stock</small><b>'+x.stock+' '+esc(x.unit)+'</b></div><div><small>Reorder at</small><b>'+x.min+'</b></div><div><small>Risk</small><b>'+esc(x.risk)+'</b></div></div>');return;}
      const ai=e.target.closest("[data-ai]")?.dataset.ai; if(ai){$("#aiPrompt").value=ai;$("#aiForm")?.requestSubmit();return;}
      const resolve=e.target.closest("[data-resolve]")?.dataset.resolve; if(resolve){const x=data.incidents.find(i=>i.id===resolve);if(x){x.status="Contained";persist();closeModal();renderRoute();toast("Incident marked contained.","success");}return;}
      const bedAction=e.target.closest("[data-bed-action]")?.dataset.bedAction; if(bedAction){const b=data.beds.find(x=>x.id===bedAction);const states=["Occupied","Clean","Blocked"];b.state=states[(states.indexOf(b.state)+1)%states.length];persist();closeModal();renderRoute();toast(b.id+" moved to "+b.state,"success");return;}
      const cmdItem=e.target.closest("[data-command-item]"); if(cmdItem){closeModal();cmdItem.dataset.type==="patient"?openPatient(cmdItem.dataset.id):navigate(cmdItem.dataset.id);return;}
      const mr=e.target.closest("[data-modal-route]"); if(mr){const id=mr.dataset.id;closeModal();openPatient(id);return;}
    });

    document.addEventListener("input",e=>{
      if(e.target.id==="patientSearch"){state.search=e.target.value;updatePatientList();}
      if(e.target.id==="commandInput"){const q=e.target.value.toLowerCase();const res=$("#commandResults");if(res){const all=[...nav.map(n=>({type:"route",id:n.id,label:n.label})),...data.patients.map(p=>({type:"patient",id:p.id,label:p.name+" • "+p.service}))].filter(x=>(x.label+" "+x.id).toLowerCase().includes(q)).slice(0,10);res.innerHTML=all.map(i=>'<button data-command-item="'+i.type+'" data-id="'+i.id+'"><span>'+esc(i.type==="route"?"◈":"◉")+'</span><b>'+esc(i.label)+'</b><small>'+esc(i.id)+'</small></button>').join("")||'<div class="empty">No matching result.</div>';}}
    });

    document.addEventListener("change",e=>{ if(e.target.id==="patientStatus"||e.target.id==="patientService"){const t=$(".table-shell tbody");if(t)t.innerHTML=patientTable(filteredPatients()).replace(/^.*<tbody>|<\/tbody>.*$/gs,"");}});
    document.addEventListener("submit",e=>{e.preventDefault();if(e.target.id==="aiForm"){const prompt=$("#aiPrompt").value.trim();if(!prompt)return;$("#aiReply").innerHTML='<div class="ai-loading"><span></span><span></span><span></span> Analyzing local operating state…</div>';setTimeout(()=>{const answer=aiAnswer(prompt);$("#aiReply").innerHTML='<div class="ai-answer"><div class="ai-answer-top"><span class="ai-badge">✦ SIMULATED</span><span>Generated now</span></div><p>'+esc(answer)+'</p><div class="ai-citations"><span>Source: patients</span><span>Source: capacity</span><span>Source: work queue</span></div></div>';},420);return;}submitForm(e.target);});
    document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();command();}if(e.key==="Escape")closeModal();});
  }

  function init(){
    document.documentElement.dataset.theme=state.theme;
    bind();
    let hash=location.hash.replace("#","");
    if(!routes[hash]) hash="home";
    navigate(hash);
    if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }

  init();
})();