/* =========================================================
   AVERIS BY MAHI — V11 application
   One storage layer • one event-delegation layer • targeted live updates
   ========================================================= */
(function(){
  "use strict";

  var STORAGE_PREFIX = "MAHI_AVERIS_V11_";
  var APP = {
    product:"Averis",
    brand:"Averis by Mahi",
    owner:"Mahi",
    workspace:"Mahi Health",
    role:"Healthcare Operations"
  };

  var IMAGE = {
    command:"https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg?auto=compress&cs=tinysrgb&w=1800&q=82",
    people:"https://images.pexels.com/photos/6129207/pexels-photo-6129207.jpeg?auto=compress&cs=tinysrgb&w=1800&q=82",
    care:"https://images.pexels.com/photos/8413204/pexels-photo-8413204.jpeg?auto=compress&cs=tinysrgb&w=1800&q=82",
    clinical:"https://images.pexels.com/photos/6129651/pexels-photo-6129651.jpeg?auto=compress&cs=tinysrgb&w=1800&q=82",
    hospital:"https://images.pexels.com/photos/29329917/pexels-photo-29329917.jpeg?auto=compress&cs=tinysrgb&w=1800&q=82"
  };

  var SECTION_IMAGE = {
    overview:IMAGE.command, analytics:IMAGE.command, ai:IMAGE.people,
    patients:IMAGE.people, patient360:IMAGE.care, queue:IMAGE.clinical,
    appointments:IMAGE.people, emergency:IMAGE.hospital, care:IMAGE.care,
    clinical:IMAGE.clinical, providers:IMAGE.people, beds:IMAGE.hospital,
    lab:IMAGE.clinical, pharmacy:IMAGE.hospital, billing:IMAGE.people,
    messages:IMAGE.people, tasks:IMAGE.care, reports:IMAGE.command, settings:IMAGE.people
  };

  var NAV = [
    ["COMMAND",[["overview","Command Center","▦"],["analytics","Analytics","◫"],["ai","AI Copilot","✦"]]],
    ["PATIENT FLOW",[["patients","Patients","♙"],["patient360","Patient 360","◎"],["queue","Live Queue","≡"],["appointments","Appointments","◷"],["emergency","Emergency","⚕"]]],
    ["CLINICAL OPERATIONS",[["care","Care Hub","♡"],["clinical","Clinical Monitor","♥"],["providers","Providers","✚"],["beds","Bed Board","▤"]]],
    ["HOSPITAL SERVICES",[["lab","Laboratory","△"],["pharmacy","Pharmacy","◉"],["billing","Billing","₹"],["messages","Messages","◌"],["tasks","Tasks","✓"],["reports","Reports","▥"]]],
    ["SYSTEM",[["settings","Settings","⚙"]]]
  ];

  var state = {
    view:validRoute(location.hash.slice(1)) ? location.hash.slice(1) : "overview",
    theme:"light",
    live:true,
    profile:null,
    patients:[],
    appointments:[],
    providers:[],
    tasks:[],
    care:[],
    beds:[],
    labOrders:[],
    inventory:[],
    invoices:[],
    messages:[],
    notifications:[],
    selectedPatient:null,
    conversation:0,
    taskFilter:"All",
    patientQuery:"",
    patientStatus:"All",
    tick:0
  };

  var names=["Aarav Sharma","Maya Patel","Noah Williams","Olivia Chen","Arjun Rao","Sophia Bennett","Ethan Brooks","Isabella Martin","Kabir Mehta","Amelia Jones","Rohan Kapoor","Emma Davis","Vihaan Reddy","Mia Wilson","Aditya Nair","Ava Thomas","Reyansh Gupta","Liam Anderson","Anaya Singh","Lucas Brown"];
  var conditions=["Hypertension","Type 2 Diabetes","Asthma","Arrhythmia","Migraine","Arthritis","Recovery","Routine review"];
  var departments=["Cardiology","General Medicine","Neurology","Pediatrics","Orthopedics"];
  var providerSeed=[
    ["Dr. Maya Chen","Cardiology","North Tower"],["Dr. Arjun Rao","General Medicine","Central Campus"],["Dr. Sofia Martinez","Neurology","Riverside"],
    ["Dr. Ethan Lee","Pediatrics","North Tower"],["Dr. Priya Nair","Orthopedics","Central Campus"],["Dr. Daniel Brooks","Oncology","Riverside"],
    ["Dr. Kavya Singh","Dermatology","North Tower"],["Dr. Noah Carter","Radiology","Central Campus"],["Dr. Elena Patel","Internal Medicine","Riverside"]
  ];
  var seed=804;

  function $(s,r){return (r||document).querySelector(s);}
  function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function int(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
  function seededInt(a,b){seed=(seed*1664525+1013904223)>>>0;return Math.floor((seed/4294967296)*(b-a+1))+a;}
  function now(){return new Date();}
  function isoDate(d){return new Date(d).toISOString().slice(0,10);}
  function today(){return isoDate(now());}
  function shift(days){var d=new Date();d.setDate(d.getDate()+days);return isoDate(d);}
  function dateText(v){return new Date(v+"T12:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short"});}
  function clock(){return new Date().toLocaleTimeString([], {hour12:false});}
  function initials(n){return String(n||"Mahi").split(/\s+/).map(function(x){return x[0];}).slice(0,2).join("").toUpperCase();}
  function validRoute(v){return NAV.some(function(g){return g[1].some(function(x){return x[0]===v;});});}
  function routeName(v){var all=[];NAV.forEach(function(g){all=all.concat(g[1]);});var found=all.filter(function(x){return x[0]===v;})[0];return found?found[1]:"Command Center";}

  /* ---------- one storage abstraction ---------- */
  var storage = {
    get:function(key,fallback){
      try{var raw=localStorage.getItem(STORAGE_PREFIX+key);return raw===null?fallback:JSON.parse(raw);}catch(e){return fallback;}
    },
    set:function(key,value){
      try{localStorage.setItem(STORAGE_PREFIX+key,JSON.stringify(value));return true;}catch(e){return false;}
    },
    remove:function(key){
      try{localStorage.removeItem(STORAGE_PREFIX+key);}catch(e){}
    },
    clearSession:function(){this.remove("session");}
  };

  /* ---------- synthetic data ---------- */
  function makeData(){
    if(storage.get("seeded",false)) {
      state.profile=storage.get("profile",null);
      state.theme=storage.get("theme","light");
      state.live=storage.get("live",true);
      state.patients=storage.get("patients",[]);
      state.appointments=storage.get("appointments",[]);
      state.providers=storage.get("providers",[]);
      state.tasks=storage.get("tasks",[]);
      state.care=storage.get("care",[]);
      state.beds=storage.get("beds",[]);
      state.labOrders=storage.get("labOrders",[]);
      state.inventory=storage.get("inventory",[]);
      state.invoices=storage.get("invoices",[]);
      state.messages=storage.get("messages",[]);
      state.notifications=storage.get("notifications",[]);
      state.selectedPatient=storage.get("selectedPatient",null);
      return;
    }

    state.providers=providerSeed.map(function(p,i){
      return {id:"PR-"+(100+i),name:p[0],specialty:p[1],location:p[2],capacity:seededInt(10,18),today:seededInt(5,14),utilization:seededInt(48,94),status:i%4===0?"Busy":"Available"};
    });
    state.patients=names.map(function(name,i){
      var pr=state.providers[i%state.providers.length];
      return {id:"AV-"+(26000+i),name:name,age:seededInt(21,81),condition:conditions[i%conditions.length],department:pr.specialty,provider:pr.name,status:["Active","Stable","Needs Attention","Active"][i%4],risk:["Low","Low","Medium","High"][i%4],attendance:seededInt(80,99),lastVisit:shift(-seededInt(2,42)),nextVisit:shift(seededInt(1,18))};
    });
    state.appointments=Array.from({length:70},function(_,i){
      var p=state.patients[i%state.patients.length],pr=state.providers[i%state.providers.length],d=shift(seededInt(-3,14));
      return {id:"AP-"+(4200+i),date:d,time:["08:30","09:15","10:00","10:45","11:30","12:15","13:30","14:15","15:00"][i%9],patient:p.name,patientId:p.id,provider:pr.name,type:["Consultation","Follow-up","Screening","Review","Telehealth"][i%5],status:d<today()?(i%11===0?"No Show":"Completed"):(i%3===0?"Confirmed":"Scheduled")};
    });
    state.tasks=Array.from({length:34},function(_,i){
      return {id:"TK-"+(7000+i),title:["Call patient about lab result","Review discharge plan","Verify insurance documents","Confirm specialist referral","Medication reconciliation","Prepare handoff note"][i%6],patient:state.patients[i%state.patients.length].name,priority:["Low","Medium","High","Urgent"][i%4],owner:["Mahi","Care Team","Front Desk","Clinical Lead"][i%4],due:shift(seededInt(-2,9)),status:["To Do","To Do","In Progress","Completed"][i%4]};
    });
    state.care=Array.from({length:28},function(_,i){
      return {id:"CH-"+(9000+i),patient:state.patients[i%state.patients.length].name,issue:["Overdue follow-up","Referral pending","Care-plan review","Unresolved result","Discharge coordination"][i%5],priority:["Normal","Normal","High","Urgent"][i%4],stage:["New","Assigned","In Progress","Waiting","Resolved"][i%5],age:seededInt(8,240)};
    });
    state.beds=Array.from({length:48},function(_,i){
      var status=["Occupied","Occupied","Available","Cleaning","Occupied","Available","Isolation"][i%7];
      return {id:["A","B","C","D"][i%4]+"-"+(101+i),ward:["ICU","General","Cardiology","Pediatrics"][i%4],status:status,patient:(status==="Occupied"||status==="Isolation")?state.patients[i%state.patients.length].name:""};
    });
    state.labOrders=Array.from({length:42},function(_,i){
      return {id:"LAB-"+(5000+i),patient:state.patients[i%state.patients.length].name,test:["CBC","HbA1c","Troponin I","Lipid profile"][i%4],priority:["Routine","Routine","High","Critical"][i%4],status:i%3===0?"Awaiting review":"Resulted"};
    });
    state.inventory=[
      {name:"Metformin 500 mg",category:"Oral medication",stock:84,reorder:30,unit:"packs"},
      {name:"Insulin Glargine",category:"Insulin",stock:18,reorder:24,unit:"vials"},
      {name:"Amoxicillin 500 mg",category:"Antibiotic",stock:62,reorder:20,unit:"packs"},
      {name:"Paracetamol 650 mg",category:"Analgesic",stock:120,reorder:40,unit:"packs"},
      {name:"Normal Saline 500 ml",category:"IV fluid",stock:31,reorder:28,unit:"bags"}
    ];
    state.invoices=[
      {id:"INV-2408",patient:"Maya Patel",amount:24800,payer:"Insurance",status:"Pending"},
      {id:"INV-2407",patient:"Arjun Rao",amount:12400,payer:"Self pay",status:"Paid"},
      {id:"INV-2406",patient:"Noah Williams",amount:48600,payer:"Insurance",status:"Review"},
      {id:"INV-2405",patient:"Olivia Chen",amount:8900,payer:"Self pay",status:"Paid"}
    ];
    state.messages=[
      {name:"Dr. Maya Chen",role:"Cardiology",unread:2,items:[["them","Mahi, can we move the Patel follow-up to 3:30?","09:24"],["me","Yes. I updated the care team.","09:26"],["them","Perfect. I’ll review the ECG before the visit.","09:28"]]},
      {name:"Care Coordination",role:"Operations",unread:1,items:[["them","Referral packet is ready for review.","09:12"],["me","Received. I’ll assign it to the neurology queue.","09:15"]]},
      {name:"Riverside Front Desk",role:"Scheduling",unread:0,items:[["them","The 14:00 slot is now confirmed.","08:52"],["me","Thanks — patient has been notified.","08:55"]]}
    ];
    state.notifications=[
      {title:"Care queue needs attention",body:"3 urgent follow-ups need assignment.",type:"care",time:"now",unread:true},
      {title:"Laboratory result posted",body:"Troponin result is ready for review.",type:"lab",time:"4m",unread:true},
      {title:"Emergency capacity",body:"Two patients are waiting for bed allocation.",type:"emergency",time:"7m",unread:true},
      {title:"Medication threshold",body:"Insulin Glargine is below reorder level.",type:"pharmacy",time:"12m",unread:true}
    ];
    state.theme=storage.get("theme","light");
    state.live=storage.get("live",true);
    state.profile=storage.get("profile",null);
    state.selectedPatient=storage.get("selectedPatient",null);
    persistAll();
    storage.set("seeded",true);
  }

  function persistAll(){
    ["patients","appointments","providers","tasks","care","beds","labOrders","inventory","invoices","messages","notifications"].forEach(function(k){storage.set(k,state[k]);});
  }

  /* ---------- auth ---------- */
  function getProfile(){return storage.get("profile",null);}
  function passwordDigest(value){
    if(window.crypto && crypto.subtle){
      return crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)).then(function(buf){return Array.from(new Uint8Array(buf)).map(function(x){return x.toString(16).padStart(2,"0");}).join("");});
    }
    return Promise.resolve(btoa(unescape(encodeURIComponent(value))));
  }
  function setAuthMessage(id,text,good){
    var n=$("#"+id);if(!n)return;n.textContent=text;n.classList.toggle("good",!!good);
  }
  function showAuth(){
    $("#authGate").classList.remove("hidden");$("#appShell").classList.add("hidden");
    document.documentElement.dataset.theme=state.theme;
  }
  function showApp(){
    var p=state.profile||getProfile();if(!p)return showAuth();
    $("#authGate").classList.add("hidden");$("#appShell").classList.remove("hidden");
    $("#profileName").textContent=p.name;$("#profileAvatar").textContent=initials(p.name);$("#topProfileName").textContent=p.name;$("#workspaceName").textContent=p.name+" Health";
  }
  function setAuthMode(mode){
    var create=mode==="create";
    $$(".auth-tab").forEach(function(b){b.classList.toggle("active",b.dataset.authTab===mode);});
    $("#signinForm").classList.toggle("hidden",create);$("#createForm").classList.toggle("hidden",!create);
    $("#authTitle").textContent=create?"Create your Mahi profile":"Enter Averis";
    $("#authSubtitle").textContent=create?"Build the local profile that owns this workspace.":"Sign in to your browser-local care operations workspace.";
  }
  function createProfile(e){
    e.preventDefault();
    var name=$("#createName").value.trim(),email=$("#createEmail").value.trim().toLowerCase(),pwd=$("#createPassword").value,confirm=$("#createConfirm").value;
    if(name.length<2)return setAuthMessage("createMessage","Enter your full name.");
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))return setAuthMessage("createMessage","Enter a valid email.");
    if(pwd.length<6)return setAuthMessage("createMessage","Password must be at least 6 characters.");
    if(pwd!==confirm)return setAuthMessage("createMessage","Passwords do not match.");
    if(!$("#createTerms").checked)return setAuthMessage("createMessage","Confirm the browser-local profile notice.");
    passwordDigest(pwd).then(function(hash){
      state.profile={name:name,email:email,passwordHash:hash,createdAt:Date.now()};
      storage.set("profile",state.profile);
      storage.set("session",{email:email});
      showApp();navigate("overview",true);toast("Mahi profile created");
    });
  }
  function signIn(e){
    e.preventDefault();
    var email=$("#signinEmail").value.trim().toLowerCase(),pwd=$("#signinPassword").value,p=getProfile();
    if(!p)return setAuthMessage("signinMessage","No profile exists yet. Create one or use the demo workspace.");
    if(p.email!==email)return setAuthMessage("signinMessage","That email does not match the saved Mahi profile.");
    passwordDigest(pwd).then(function(hash){
      if(hash!==p.passwordHash)return setAuthMessage("signinMessage","Password does not match.");
      if($("#rememberMe").checked)storage.set("session",{email:p.email});else storage.remove("session");
      state.profile=p;showApp();navigate("overview",true);toast("Welcome back, "+p.name);
    });
  }
  function demoLogin(){
    passwordDigest("mahi-demo-2026").then(function(hash){
      state.profile={name:"Mahi",email:"mahi@averis.app",passwordHash:hash,createdAt:Date.now(),demo:true};
      storage.set("profile",state.profile);storage.set("session",{email:state.profile.email});showApp();navigate("overview",true);toast("Demo Mahi workspace opened");
    });
  }
  function logout(){storage.clearSession();state.profile=null;showAuth();setAuthMode("signin");}

  /* ---------- view frame with actual section image ---------- */
  function frame(view,body){
    var img=SECTION_IMAGE[view]||IMAGE.command;
    return '<div class="section-layer"><div class="section-fallback"></div><img class="section-photo" src="'+img+'" alt="" '+(view==="overview"?'fetchpriority="high"':'loading="lazy')+'><div class="section-wash"></div><div class="section-grid"></div></div><div class="section-content">'+body+"</div>";
  }

  function badge(text,tone){return '<span class="status '+(tone||"info")+'"><i class="dot"></i>'+esc(text)+"</span>";}
  function heading(eyebrow,title,sub,actions){return '<div class="page-head"><div><div class="eyebrow"><i class="status-led"></i>'+esc(eyebrow)+'</div><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></div><div class="actions">'+(actions||"")+"</div></div>";}
  function kpi(title,value,detail,tone,sign){return '<article class="kpi '+tone+'"><div class="kpi-top"><span>'+esc(title)+'</span><b>'+esc(sign||"•")+'</b></div><strong>'+esc(value)+'</strong><small>↗ '+esc(detail)+"</small></article>";}
  function table(title,meta,heads,rows){return '<article class="card"><div class="card-head"><div><div class="card-title">'+esc(title)+'</div><div class="card-meta">'+esc(meta)+'</div></div></div><div class="table-wrap"><table><thead><tr>'+heads.map(function(h){return "<th>"+esc(h)+"</th>";}).join("")+"</tr></thead><tbody>"+rows.join("")+"</tbody></table></div></article>";}
  function chart(values,labels){
    var w=720,h=210,p=18,max=Math.max.apply(Math,values)*1.15,pts=values.map(function(v,i){return [p+i*(w-p*2)/(values.length-1),h-p-v/max*(h-p*2)];}),d=pts.map(function(x,i){return (i?"L":"M")+x[0].toFixed(1)+" "+x[1].toFixed(1);}).join(" ");
    return '<svg class="chart-svg" viewBox="0 0 '+w+" "+h+'"><defs><linearGradient id="areaV11" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--blue)" stop-opacity=".24"/><stop offset="1" stop-color="var(--blue)" stop-opacity="0"/></linearGradient></defs>'+[0,.25,.5,.75,1].map(function(r){return '<line class="gridline" x1="'+p+'" y1="'+(h-p-r*(h-p*2))+'" x2="'+(w-p)+'" y2="'+(h-p-r*(h-p*2))+'"/>';}).join("")+'<path class="chart-area" d="'+d+" L "+pts[pts.length-1][0]+" "+(h-p)+" L "+pts[0][0]+" "+(h-p)+' Z"/><path class="chart-line" d="'+d+'"/>'+labels.map(function(l,i){return '<text class="axis" x="'+pts[i][0]+'" y="205" text-anchor="middle">'+l+"</text>";}).join("")+"</svg>";
  }
  function bars(vals,labels){return '<div class="simple-bars">'+vals.map(function(v,i){return '<div><span style="height:'+v+'%"></span><small>'+labels[i]+"</small></div>";}).join("")+"</div>";}
  function activity(){
    var rows=[["♥","Care Hub","Patient AV-26004 moved to In Progress","now"],["◷","Appointments","Cardiology slot confirmed","2m"],["△","Laboratory","CBC panel uploaded for review","5m"],["▤","Bed Board","B-114 changed to Cleaning","8m"],["◉","Pharmacy","Insulin reorder threshold reached","11m"],["✓","Tasks","Referral review assigned to Mahi","14m"]];
    return rows.map(function(r){return '<div class="activity-row"><b>'+r[0]+'</b><span><strong>'+r[2]+'</strong><small>'+r[1]+'</small></span><time>'+r[3]+"</time></div>";}).join("");
  }

  /* ---------- views ---------- */
  function renderOverview(){
    var apptToday=state.appointments.filter(function(a){return a.date===today();}).length;
    var occupied=state.beds.filter(function(b){return b.status==="Occupied"||b.status==="Isolation";}).length;
    var available=state.beds.filter(function(b){return b.status==="Available";}).length;
    var cleaning=state.beds.filter(function(b){return b.status==="Cleaning";}).length;
    var occupancy=Math.round(occupied/state.beds.length*100);
    var body=heading("MAHI • AVERIS","Care Command Center","Mahi Health operating picture across patient flow, capacity, clinical signals and hospital services.",
      '<span class="status ok"><i class="dot"></i>Network nominal</span><button class="btn" data-action="refresh" type="button">↻ Sync</button><button class="btn primary" data-action="new-appointment" type="button">+ New appointment</button>')+
      '<article class="hero"><div class="hero-backup"></div><img class="hero-photo" src="'+IMAGE.command+'" alt="" fetchpriority="high"><div class="hero-overlay"></div><div class="hero-copy"><div class="hero-kicker"><i class="status-led"></i><span id="heroLive">LIVE • '+new Date().toLocaleString().toUpperCase()+'</span></div><h2>See the hospital clearly.<br>Move care with confidence.</h2><p>A connected operational workspace for Mahi — from the first arrival to care coordination, results, beds and revenue-cycle work.</p><div class="hero-actions"><button class="btn primary" data-action="open-ai" type="button">✦ Ask AI Copilot</button><button class="btn" data-action="open-emergency" type="button">Open Emergency</button><button class="btn" data-action="open-queue" type="button">Live Queue</button></div></div><div class="hero-metrics"><div><span>OPD today</span><strong>'+(176+apptToday)+'</strong></div><div><span>Bed occupancy</span><strong>'+occupancy+'%</strong></div><div><span>Available beds</span><strong>'+available+'</strong></div></div></article>'+
      '<div class="attention"><div><i></i><strong>Operational attention</strong><span>2 emergency alerts • 3 urgent care items • 1 pharmacy reorder</span></div><button class="btn sm danger" data-action="open-emergency" type="button">Review alerts</button></div>'+
      '<div class="kpi-grid">'+kpi("Patients in network",state.patients.length,"+4.2% vs last week","blue","♙")+kpi("Appointments today",176+apptToday,"93% confirmed","teal","◷")+kpi("Live OPD queue","27","14 min average wait","gold","≡")+kpi("Critical alerts","2","Requires action now","red","!")+'</div>'+
      '<div class="grid-2"><article class="card"><div class="card-head"><div><div class="card-title">Patient arrivals & flow</div><div class="card-meta">Rolling demand • synthetic portfolio data</div></div>'+badge("Live","ok")+'</div>'+chart([32,41,38,54,61,59,73,78,74,87,91,86],["06","07","08","09","10","11","12","13","14","15","16","17"])+'</article>'+
      '<article class="card"><div class="card-head"><div><div class="card-title">Capacity snapshot</div><div class="card-meta">Current Mahi Health bed state</div></div>'+badge("Within plan","ok")+'</div><div class="capacity"><div class="ring"><strong>'+occupancy+'%</strong><small>occupied</small></div><div class="metric-list"><div class="metric-row"><span>Available</span><div class="meter"><span style="width:'+(available/state.beds.length*100)+'%"></span></div><strong>'+available+'</strong></div><div class="metric-row"><span>Cleaning</span><div class="meter"><span style="width:'+(cleaning/state.beds.length*100)+'%"></span></div><strong>'+cleaning+'</strong></div><div class="metric-row"><span>Isolation</span><div class="meter"><span style="width:'+(state.beds.filter(function(b){return b.status==="Isolation";}).length/state.beds.length*100)+'%"></span></div><strong>'+state.beds.filter(function(b){return b.status==="Isolation";}).length+'</strong></div></div></div></article></div>'+
      '<div class="grid-2" style="margin-top:13px"><article class="card"><div class="card-head"><div><div class="card-title">Live OPD queue</div><div class="card-meta">Priority-ordered care stages</div></div><button class="btn sm" data-action="open-queue" type="button">Open queue</button></div><div class="queue-list">'+state.patients.slice(0,7).map(function(p,i){return '<div class="queue-row" data-open-patient="'+p.id+'"><span>'+String(i+1).padStart(2,"0")+'</span><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+p.id+" • "+esc(p.department)+'</small></span></div><em>'+["Waiting","Vitals","Doctor","Review","Waiting","Doctor","Vitals"][i]+'</em><strong>'+(8+i*3)+'m</strong></div>';}).join("")+'</div></article>'+
      '<article class="card"><div class="card-head"><div><div class="card-title">Critical alerts</div><div class="card-meta">Signals requiring acknowledgement</div></div>'+badge("2 critical","danger")+'</div><div class="alert-list"><div class="alert-row"><b>!</b><div><strong>ED triage</strong><p>Two high-acuity arrivals are waiting for bed allocation.</p></div><time>2m</time></div><div class="alert-row"><b>!</b><div><strong>Laboratory</strong><p>Troponin result requires acknowledgement.</p></div><time>7m</time></div><div class="alert-row warn"><b>•</b><div><strong>Care Hub</strong><p>Three urgent follow-ups remain unassigned.</p></div><time>12m</time></div><div class="alert-row warn"><b>•</b><div><strong>Pharmacy</strong><p>Insulin Glargine is below reorder threshold.</p></div><time>18m</time></div></div></article></div>'+
      '<div class="service-grid">'+[["Emergency","Triage","96%","danger","emergency"],["Laboratory","Turnaround","41 min","ok","lab"],["Pharmacy","Stock health","92%","ok","pharmacy"],["Appointments","Confirmation","93%","teal","appointments"],["Care Hub","SLA","88%","ok","care"],["Billing","Collections","76%","warn","billing"]].map(function(x){return '<button class="service-node" data-service="'+x[4]+'" type="button"><span><b>'+x[0]+'</b>'+badge(x[2],x[3])+'</span><strong>'+x[1]+'</strong><small>Open module →</small></button>';}).join("")+'</div>'+
      '<div class="grid-2" style="margin-top:13px"><article class="image-panel"><div class="hero-backup"></div><img class="img" src="'+IMAGE.people+'" alt="" loading="lazy"><div class="image-copy"><div class="eyebrow">MAHI HEALTH</div><h3>Keep every handoff visible.</h3><p>Operational context follows the patient across teams and services.</p></div></article><article class="card"><div class="card-head"><div><div class="card-title">Recent activity</div><div class="card-meta">Live updates change only small fields.</div></div>'+badge(state.live?"Streaming":"Paused",state.live?"teal":"warn")+'</div><div id="activityFeed" class="activity-list">'+activity()+"</div></article></div>";
    $("#view-overview").innerHTML=frame("overview",body);bindImages();
  }

  function renderPatients(){
    var q=state.patientQuery.toLowerCase();
    var rows=state.patients.filter(function(p){return (!q||(p.name+" "+p.id+" "+p.condition+" "+p.department).toLowerCase().indexOf(q)>-1)&&(state.patientStatus==="All"||p.status===state.patientStatus);});
    var body=heading("PATIENT OPERATIONS","Patients","Search synthetic Mahi Health records and open a connected Patient 360 profile.",'<button class="btn primary" data-action="new-patient" type="button">+ New patient</button>')+
      '<div class="toolbar"><input class="input" id="patientSearch" value="'+esc(state.patientQuery)+'" placeholder="Search name, ID, condition or department…"><div class="filters">'+["All","Active","Stable","Needs Attention"].map(function(s){return '<button class="filter '+(state.patientStatus===s?"active":"")+'" data-patient-filter="'+s+'" type="button">'+s+"</button>";}).join("")+'</div><button class="btn sm" data-action="export-patients" type="button">Export CSV</button></div>'+
      table("Patient register","Click any patient row to open Patient 360",["Patient","Status","Risk","Provider","Last visit","Next visit","Attendance"],rows.map(function(p){return '<tr data-open-patient="'+p.id+'"><td><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+p.id+" • "+p.age+"y • "+esc(p.condition)+'</small></span></div></td><td>'+badge(p.status,p.status==="Needs Attention"?"warn":"ok")+'</td><td>'+badge(p.risk+" risk",p.risk==="High"?"danger":p.risk==="Medium"?"warn":"ok")+'</td><td>'+esc(p.provider)+'</td><td>'+dateText(p.lastVisit)+'</td><td>'+dateText(p.nextVisit)+'</td><td><strong>'+p.attendance+'%</strong></td></tr>';}).join(""));
    $("#view-patients").innerHTML=frame("patients",body);bindImages();
  }

  function renderPatient360(){
    var p=state.patients.filter(function(x){return x.id===state.selectedPatient;})[0]||state.patients[0];
    if(!p){state.selectedPatient=null;return renderPatients();}
    var body=heading("PATIENT 360","Connected Patient View","Identity, journey, results, medication and coordination context for the selected patient.",'<button class="btn" data-action="back-patients" type="button">← Patients</button><button class="btn primary" data-action="new-task" type="button">+ Care task</button>')+
      '<div class="patient-hero"><b class="patient-hero-avatar">'+initials(p.name)+'</b><div><div class="eyebrow">ACTIVE CARE PROFILE</div><h2>'+esc(p.name)+'</h2><p>'+p.id+" • "+p.age+"y • "+esc(p.condition)+" • "+esc(p.department)+'</p></div><div class="patient-hero-tags">'+badge(p.status,p.status==="Needs Attention"?"warn":"ok")+badge(p.risk+" risk",p.risk==="High"?"danger":"warn")+'</div></div>'+
      '<div class="grid-3"><article class="card"><div class="card-title">Care overview</div><div class="mini-grid"><div class="mini-stat"><span>Attendance</span><strong>'+p.attendance+'%</strong><em>historical</em></div><div class="mini-stat"><span>Next visit</span><strong>'+dateText(p.nextVisit)+'</strong><em>scheduled</em></div></div><p class="section-sub">Primary provider</p><strong>'+esc(p.provider)+'</strong></article><article class="card"><div class="card-title">Latest results</div><div class="activity-list"><div class="activity-row"><b>△</b><span><strong>CBC panel</strong><small>Within expected range</small></span><time>8m</time></div><div class="activity-row"><b>△</b><span><strong>HbA1c</strong><small>Review with provider</small></span><time>14m</time></div></div></article><article class="card"><div class="card-title">Current medications</div><div class="metric-list"><div class="setting-row"><span><strong>Metformin 500 mg</strong><small>Twice daily</small></span>'+badge("Active","teal")+'</div><div class="setting-row"><span><strong>Amlodipine 10 mg</strong><small>Once daily</small></span>'+badge("Active","teal")+'</div></div></article></div>'+
      '<div class="grid-2" style="margin-top:13px"><article class="card"><div class="card-head"><div class="card-title">Patient journey</div><span class="card-meta">Last 30 days</span></div><div class="journey">'+["Registration","Consultation","Lab","Care Plan","Follow-up"].map(function(x,i){return '<div class="journey-step '+(i<4?"done":"")+'"><b>'+(i<4?"✓":"")+'</b><strong>'+x+'</strong><small>'+(i<4?"Completed":"Next step")+"</small></div>";}).join("")+'</div></article><article class="image-panel"><div class="hero-backup"></div><img class="img" src="'+IMAGE.care+'" alt="" loading="lazy"><div class="image-copy"><div class="eyebrow">CONNECTED CARE</div><h3>Context follows the patient.</h3><p>One operational view across every touchpoint.</p></div></article></div>';
    $("#view-patient360").innerHTML=frame("patient360",body);bindImages();
  }

  function renderQueue(){
    var body=heading("PATIENT FLOW","Live OPD Queue","Track wait pressure, current stage and the next patient action.",'<button class="btn" data-action="refresh" type="button">↻ Sync queue</button><button class="btn primary" data-action="open-emergency" type="button">Emergency</button>')+
      '<div class="kpi-grid">'+kpi("Waiting","27","14 min average","gold","≡")+kpi("Vitals","8","2 rooms available","blue","♥")+kpi("With doctor","11","Steady flow","teal","⚕")+kpi("Review","6","4 ready to close","green","✓")+'</div>'+
      '<div class="grid-2"><article class="card"><div class="card-head"><div><div class="card-title">Current queue</div><div class="card-meta">Priority ordered for Mahi Health operations</div></div>'+badge("LIVE","ok")+'</div><div class="queue-list">'+state.patients.slice(0,13).map(function(p,i){return '<div class="queue-row" data-open-patient="'+p.id+'"><span>'+String(i+1).padStart(2,"0")+'</span><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+p.id+" • "+esc(p.department)+'</small></span></div><em>'+["Waiting","Vitals","Doctor","Review"][i%4]+'</em><strong>'+(8+i*2)+'m</strong></div>';}).join("")+'</div></article><article class="card"><div class="card-head"><div class="card-title">Flow health</div>'+badge("Stable","ok")+'</div><div class="metric-list">'+[["Front desk",82],["Vitals",69],["Consult",76],["Review",58]].map(function(x){return '<div class="metric-row"><span>'+x[0]+'</span><div class="meter"><span style="width:'+x[1]+'%"></span></div><strong>'+x[1]+'%</strong></div>';}).join("")+'</div><div class="card inset"><div class="card-title">Next pressure point</div><p>General Medicine currently has the highest wait concentration in this portfolio scenario.</p></div></article></div>';
    $("#view-queue").innerHTML=frame("queue",body);bindImages();
  }

  function renderAppointments(){
    var list=state.appointments.filter(function(a){return a.date>=today();}).sort(function(a,b){return (a.date+a.time).localeCompare(b.date+b.time);}).slice(0,26);
    var body=heading("SCHEDULING","Appointments","Forward schedule, confirmation health and provider demand.",'<button class="btn" data-action="refresh" type="button">↻ Sync</button><button class="btn primary" data-action="new-appointment" type="button">+ New appointment</button>')+
      '<div class="grid-3"><article class="card"><div class="card-title">Booked today</div><strong class="big-number">'+state.appointments.filter(function(a){return a.date===today();}).length+'</strong>'+badge("Live","ok")+'</article><article class="card"><div class="card-title">Confirmation rate</div><strong class="big-number">93%</strong><div class="meter"><span style="width:93%"></span></div></article><article class="card"><div class="card-title">No-show risk</div><strong class="big-number">8.4%</strong>'+badge("Watch","warn")+'</article></div>'+
      '<div style="margin-top:13px">'+table("Forward schedule","Today through the next twelve days",["Date","Time","Patient","Provider","Type","Status"],list.map(function(a){return "<tr><td>"+dateText(a.date)+"</td><td><strong>"+a.time+"</strong></td><td>"+esc(a.patient)+"</td><td>"+esc(a.provider)+"</td><td>"+a.type+"</td><td>"+badge(a.status,a.status==="Confirmed"?"ok":"info")+"</td></tr>";}).join(""))+"</div>";
    $("#view-appointments").innerHTML=frame("appointments",body);bindImages();
  }

  function renderEmergency(){
    var rows=state.patients.slice(0,10).map(function(p,i){return '<tr><td><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+p.id+" • "+esc(p.condition)+'</small></span></div></td><td>'+badge(["Critical","High","High","Medium"][i%4],i%4===0?"danger":"warn")+'</td><td><strong>'+(6+i*3)+' min</strong></td><td>'+["ICU","General","Cardiology","Observation"][i%4]+'</td><td>'+badge(["Waiting bed","Doctor ready","Vitals","Assigned"][i%4],i%4===0?"danger":"info")+"</td></tr>";});
    var body=heading("EMERGENCY","Emergency & Triage","High-priority view for acuity, waiting, destination and bed readiness.",'<button class="btn" data-action="refresh" type="button">↻ Sync</button><button class="btn primary" data-action="new-emergency" type="button">+ Register arrival</button>')+
      '<div class="kpi-grid">'+kpi("Arrivals today","58","+9% vs yesterday","red","⚕")+kpi("High acuity","7","2 critical","red","!")+kpi("Average wait","14 min","3 min improvement","teal","◷")+kpi("Ready beds","11","4 ICU • 7 general","green","▦")+'</div>'+
      '<div style="margin-top:13px">'+table("Triage board","Highest-acuity synthetic arrivals first",["Patient","Acuity","Wait","Destination","State"],rows)+"</div>";
    $("#view-emergency").innerHTML=frame("emergency",body);bindImages();
  }

  function renderCare(){
    var stages=["New","Assigned","In Progress","Waiting","Resolved"];
    var body=heading("CARE COORDINATION","Care Hub","Visible handoffs and follow-up work in a simple operational pipeline.",'<button class="btn primary" data-action="new-care" type="button">+ New care item</button>')+
      '<div class="grid-4">'+kpi("Open items",state.care.filter(function(c){return c.stage!=="Resolved";}).length,"Across teams","blue","♡")+kpi("Urgent",state.care.filter(function(c){return c.priority==="Urgent";}).length,"Needs assignment","red","!")+kpi("Resolved today","14","+18%","green","✓")+kpi("Median age","3.6h","Target < 6h","gold","◷")+'</div>'+
      '<div class="kanban">'+stages.map(function(stage){var cards=state.care.filter(function(c){return c.stage===stage;});return '<div class="kanban-col"><div class="kanban-head"><strong>'+stage+'</strong><span>'+cards.length+'</span></div>'+cards.slice(0,7).map(function(c){return '<button class="kanban-card" type="button" data-care-id="'+c.id+'"><strong>'+esc(c.issue)+'</strong><span>'+esc(c.patient)+'</span><div class="kanban-foot">'+badge(c.priority,c.priority==="Urgent"?"danger":c.priority==="High"?"warn":"teal")+'<small>'+c.age+'m</small></div></button>';}).join("")+'</div>';}).join("")+'</div>';
    $("#view-care").innerHTML=frame("care",body);bindImages();
  }

  function renderClinical(){
    var body=heading("CLINICAL","Clinical Monitor","Simulated portfolio telemetry for operational monitoring. Values are synthetic.",'<button class="btn" data-action="refresh" type="button">↻ Sync vitals</button>')+
      '<div class="grid-4">'+kpi("Monitored","48","Active beds","blue","♥")+kpi("Stable","41","Within range","green","✓")+kpi("Attention","5","Nurse review","gold","!")+kpi("Critical","2","Priority response","red","!")+'</div>'+
      '<div class="monitor-grid" style="margin-top:13px">'+state.patients.slice(0,8).map(function(p,i){var bpm=68+Math.round(Math.sin((state.tick+i)*.36)*4),o2=96+i%3,attention=i===4||i===6;return '<article class="vital-card" data-vital-card="'+i+'"><div class="vital-head"><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+p.id+" • "+esc(p.department)+'</small></span></div><b class="heart">♥</b></div><strong class="big-number" data-vital-bpm>'+bpm+'</strong><div class="section-sub">BPM • heart rate</div><div class="vital-line" data-wave>'+Array.from({length:7},function(_,j){return '<i style="width:'+(8+(j%3)*5)+'%"></i>';}).join("")+'</div><div class="vital-foot"><span data-vital-o2>SpO₂ '+o2+'%</span><span>Temp 98.'+(i+1)+'°F</span>'+badge(attention?"Attention":"Stable",attention?"warn":"ok")+'</div></article>';}).join("")+'</div>';
    $("#view-clinical").innerHTML=frame("clinical",body);bindImages();
  }

  function renderProviders(){
    var body=heading("CARE TEAM","Providers","Specialty coverage, appointment load and capacity across Mahi Health.",'<button class="btn primary" data-action="invite-provider" type="button">+ Invite provider</button>')+
      '<div class="grid-3">'+state.providers.map(function(p){var load=Math.min(100,Math.round(p.today/p.capacity*100));return '<article class="card"><div class="person"><b class="avatar">'+initials(p.name)+'</b><span><strong>'+esc(p.name)+'</strong><small>'+esc(p.specialty)+" • "+esc(p.location)+'</small></span>'+badge(p.status,load>85?"warn":"ok")+'</div><div class="metric-list provider-metrics"><div class="metric-row"><span>Today</span><div class="meter"><span style="width:'+load+'%"></span></div><strong>'+load+'%</strong></div><div class="metric-row"><span>Panel</span><div class="meter"><span style="width:'+p.utilization+'%"></span></div><strong>'+p.utilization+'%</strong></div></div><div class="section-sub">'+p.today+' scheduled • capacity '+p.capacity+"</div></article>";}).join("")+'</div>';
    $("#view-providers").innerHTML=frame("providers",body);bindImages();
  }

  function renderBeds(){
    var c={Occupied:0,Available:0,Cleaning:0,Isolation:0,Maintenance:0};state.beds.forEach(function(b){c[b.status]=(c[b.status]||0)+1;});
    var body=heading("CAPACITY","Bed Board","Ward occupancy, cleaning turnaround and ready capacity.",'<button class="btn" data-action="refresh" type="button">↻ Sync beds</button>')+
      '<div class="kpi-grid">'+kpi("Total beds",state.beds.length,"Across four wards","blue","▤")+kpi("Occupied",c.Occupied+c.Isolation,"Including isolation","teal","●")+kpi("Available",c.Available,"Ready now","green","✓")+kpi("Cleaning",c.Cleaning,"Turnaround queue","gold","↻")+'</div>'+
      '<article class="card"><div class="card-head"><div><div class="card-title">Ward board</div><div class="card-meta">Select any bed to inspect its assignment.</div></div>'+badge("Synthetic capacity","info")+'</div><div class="bed-grid">'+state.beds.map(function(b){return '<button class="bed '+b.status.toLowerCase()+'" type="button" data-bed="'+b.id+'"><div class="bed-top"><span>'+b.ward+'</span><span>'+(b.status==="Available"?"READY":"LIVE")+'</span></div><div class="bed-id">'+b.id+'</div><div class="bed-patient">'+esc(b.patient||"No patient assigned")+'</div><div class="bed-state">'+b.status+'</div></button>';}).join("")+'</div></article>';
    $("#view-beds").innerHTML=frame("beds",body);bindImages();
  }

  function renderLab(){
    var body=heading("LABORATORY","Laboratory","Turnaround, critical results and acknowledgement work.",'<button class="btn primary" data-action="new-lab" type="button">+ New lab order</button>')+
      '<div class="kpi-grid">'+kpi("Orders today","64","+6%","blue","△")+kpi("Median TAT","41 min","Target < 50 min","teal","◷")+kpi("Critical results","3","Await acknowledgement","red","!")+kpi("Completed","91%","+4 points","green","✓")+'</div>'+
      '<div class="grid-2"><article class="card"><div class="card-head"><div class="card-title">Turnaround trend</div>'+badge("Current day","info")+'</div>'+bars([43,51,48,56,44,41,39],["M","T","W","T","F","S","S"])+'</article><article class="card"><div class="card-head"><div class="card-title">Critical queue</div>'+badge("3 pending","danger")+'</div><div class="alert-list"><div class="alert-row"><b>!</b><div><strong>Troponin I</strong><p>Cardiology • acknowledgement pending</p></div><time>7m</time></div><div class="alert-row warn"><b>!</b><div><strong>Potassium</strong><p>Internal Medicine • review requested</p></div><time>14m</time></div><div class="alert-row warn"><b>!</b><div><strong>HbA1c</strong><p>General Medicine • review requested</p></div><time>18m</time></div></div></article></div>';
    $("#view-lab").innerHTML=frame("lab",body);bindImages();
  }

  function renderPharmacy(){
    var body=heading("PHARMACY","Medication & Stock","Medication availability, reorder pressure and dispensing throughput.",'<button class="btn primary" data-action="new-stock" type="button">+ Add stock entry</button>')+
      '<div class="kpi-grid">'+kpi("Stock health","92%","+2.1%","green","◉")+kpi("Low stock","1","Reorder today","red","!")+kpi("Dispensed today","182","Stable throughput","blue","✓")+kpi("Pending orders","14","Next dispatch","gold","◷")+'</div>'+
      table("Inventory position","Live synthetic inventory",["Item","Category","Stock","Reorder","Health"],state.inventory.map(function(i){return '<tr><td><strong>'+esc(i.name)+'</strong></td><td>'+esc(i.category)+'</td><td>'+i.stock+" "+i.unit+"</td><td>"+i.reorder+"</td><td>"+badge(i.stock<i.reorder?"Reorder":"Healthy",i.stock<i.reorder?"danger":"ok")+"</td></tr>";}).join(""));
    $("#view-pharmacy").innerHTML=frame("pharmacy",body);bindImages();
  }

  function renderBilling(){
    var body=heading("REVENUE CYCLE","Billing & Collections","Invoices, payer mix and collection risk.",'<button class="btn primary" data-action="new-invoice" type="button">+ New invoice</button>')+
      '<div class="kpi-grid">'+kpi("Collections MTD","₹42.8L","+8.2%","green","₹")+kpi("Outstanding","₹8.6L","12 high-risk accounts","red","!")+kpi("Claims in review","34","Median age 2.8d","gold","▥")+kpi("Collection rate","91.4%","+2.1 pts","blue","↗")+'</div>'+
      '<div class="grid-2"><article class="card"><div class="card-title">Collection trend</div>'+bars([42,56,48,63,71,66,78],["M","T","W","T","F","S","S"])+'</article><article class="card"><div class="card-title">Revenue mix</div><div class="metric-list"><div class="metric-row"><span>Insurance</span><div class="meter"><span style="width:62%"></span></div><strong>62%</strong></div><div class="metric-row"><span>Self pay</span><div class="meter"><span style="width:23%"></span></div><strong>23%</strong></div><div class="metric-row"><span>Corporate</span><div class="meter"><span style="width:15%"></span></div><strong>15%</strong></div></div></article></div>'+
      '<div style="margin-top:13px">'+table("Recent invoices","Current synthetic revenue records",["Invoice","Patient","Amount","Payer","Status"],state.invoices.map(function(i){return '<tr><td><strong>'+i.id+'</strong></td><td>'+esc(i.patient)+'</td><td>₹'+Number(i.amount).toLocaleString("en-IN")+'</td><td>'+i.payer+'</td><td>'+badge(i.status,i.status==="Paid"?"ok":i.status==="Review"?"warn":"info")+'</td></tr>';}).join(""))+"</div>";
    $("#view-billing").innerHTML=frame("billing",body);bindImages();
  }

  function renderMessages(){
    var m=state.messages[state.conversation]||state.messages[0];
    var body=heading("COMMUNICATIONS","Messages","Care-team conversations next to operational work.",'<button class="btn primary" data-action="new-message" type="button">+ New message</button>')+
      '<div class="message-layout"><div class="conversation-list">'+state.messages.map(function(x,i){return '<button class="conversation '+(i===state.conversation?"active":"")+'" data-conversation="'+i+'" type="button"><b class="avatar">'+initials(x.name)+'</b><span><strong>'+esc(x.name)+'</strong><small>'+esc(x.role)+'</small></span>'+(x.unread?badge(x.unread,"danger"):"")+'</button>';}).join("")+'</div><div class="chat"><div class="chat-head"><strong>'+esc(m.name)+'</strong><small>'+esc(m.role)+' • Mahi Health</small></div><div class="chat-body">'+m.items.map(function(v){return '<div class="bubble '+v[0]+'">'+esc(v[1])+'<small>'+v[2]+"</small></div>";}).join("")+'</div><form id="messageForm" class="chat-compose"><input class="input" name="body" placeholder="Write a message…" required><button class="btn primary" type="submit">Send</button></form></div></div>';
    $("#view-messages").innerHTML=frame("messages",body);bindImages();
  }

  function renderTasks(){
    var list=state.tasks.filter(function(t){return state.taskFilter==="All"||t.status===state.taskFilter;});
    var body=heading("WORK QUEUE","Tasks","Personal and team work with owners, priority and due dates.",'<button class="btn primary" data-action="new-task" type="button">+ New task</button>')+
      '<div class="toolbar"><div class="filters">'+["All","To Do","In Progress","Completed"].map(function(s){return '<button class="filter '+(state.taskFilter===s?"active":"")+'" data-task-filter="'+s+'" type="button">'+s+"</button>";}).join("")+'</div><button class="btn sm" data-action="export-tasks" type="button">Export CSV</button></div>'+
      table("Mahi work queue","Current operational tasks",["Task","Patient","Priority","Owner","Due","Status"],list.map(function(t){return '<tr><td><strong>'+esc(t.title)+'</strong><small>'+t.id+'</small></td><td>'+esc(t.patient)+'</td><td>'+badge(t.priority,t.priority==="Urgent"?"danger":t.priority==="High"?"warn":"info")+'</td><td>'+esc(t.owner)+'</td><td>'+dateText(t.due)+'</td><td>'+badge(t.status,t.status==="Completed"?"ok":t.status==="In Progress"?"teal":"info")+'</td></tr>';}).join(""));
    $("#view-tasks").innerHTML=frame("tasks",body);bindImages();
  }

  function renderAnalytics(){
    var body=heading("OPERATIONS INTELLIGENCE","Analytics","Demand, capacity, care SLA and service-line performance.",'<button class="btn" data-action="export-analytics" type="button">Export CSV</button>')+
      '<div class="grid-3">'+[["Patient flow","88%","+5.8%"],["Care SLA","91%","+2.4 pts"],["Capacity","71%","−3 pts"],["Provider utilization","78%","+4.1%"],["Lab TAT","41m","−6 min"],["Collections","91.4%","+2.1 pts"]].map(function(x){return '<article class="card"><div class="card-title">'+x[0]+'</div><strong class="big-number">'+x[1]+'</strong><div class="section-sub">'+x[2]+' vs prior period</div></article>';}).join("")+'</div>'+
      '<div class="grid-2" style="margin-top:13px"><article class="card"><div class="card-head"><div class="card-title">Patient demand</div>'+badge("12-hour","info")+'</div>'+chart([31,45,42,49,63,58,72,76,71,84,89,86],["06","07","08","09","10","11","12","13","14","15","16","17"])+'</article><article class="card"><div class="card-head"><div class="card-title">Department workload</div>'+badge("Current","info")+'</div>'+bars([74,82,68,91,57],["Card","GenMed","Neuro","Ortho","Peds"])+'</article></div>';
    $("#view-analytics").innerHTML=frame("analytics",body);bindImages();
  }

  function renderAI(){
    var body=heading("DECISION SUPPORT","AI Copilot","Portfolio-safe assistant over synthetic operational data. Not medical advice.",'<button class="btn" data-action="clear-ai" type="button">Clear</button>')+
      '<div class="ai-layout"><article class="card prompt-card"><div class="card-title">Suggested prompts</div>'+["Where is the queue pressure?","Which beds need attention?","What needs review in the lab?","Is pharmacy stock healthy?","How should I use Patient 360?"].map(function(p){return '<button class="prompt-btn" data-prompt="'+esc(p)+'" type="button">'+esc(p)+"</button>";}).join("")+'</article><article class="card ai-card"><div class="card-head"><div><div class="card-title">Mahi Copilot</div><div class="card-meta">Synthetic-data reasoning</div></div>'+badge("Ready","ok")+'</div><div id="aiMessages" class="ai-messages"><div class="ai-bubble bot">Hi Mahi. Ask about queue, beds, laboratory, pharmacy or patient flow.</div></div><form id="aiForm" class="chat-compose"><input id="aiInput" class="input" name="question" placeholder="Ask about queue, beds, lab, pharmacy…" required><button class="btn primary" type="submit">Ask ✦</button></form></article></div>';
    $("#view-ai").innerHTML=frame("ai",body);bindImages();
  }

  function renderReports(){
    var body=heading("REPORTING","Reports","Exportable operational views from current synthetic workspace data.",'<button class="btn primary" data-action="export-all" type="button">Export current data</button>')+
      '<div class="report-grid">'+[["Daily Operations","Appointments, patient flow, care load and alerts.","daily"],["Care Coordination","Open items, urgency and cycle time.","care"],["Capacity & Beds","Occupancy, available and cleaning status.","beds"],["Provider Workload","Panel size, appointments and utilization.","providers"],["Laboratory TAT","Turnaround and critical-result queue.","lab"],["Medication Inventory","Stock position and reorder pressure.","pharmacy"]].map(function(r){return '<article class="card report-card">'+badge("CSV","info")+'<h3>'+r[0]+'</h3><p>'+r[1]+'</p><button class="btn sm" data-report="'+r[2]+'" type="button">Generate</button></article>';}).join("")+'</div>';
    $("#view-reports").innerHTML=frame("reports",body);bindImages();
  }

  function renderSettings(){
    var p=getProfile()||{name:"Mahi",email:"Local workspace"};
    var body=heading("SYSTEM","Mahi Workspace","Profile, theme, local simulation and portfolio data controls.",'')+
      '<div class="settings-layout"><div class="settings-nav"><div class="settings-tab active">Workspace</div><div class="settings-tab">Appearance</div><div class="settings-tab">Data</div><div class="settings-tab">Access</div></div><article class="card"><div class="card-head"><div><div class="card-title">Workspace identity</div><div class="card-meta">Averis is presented as Mahi’s healthcare portfolio product.</div></div>'+badge("Local profile","info")+'</div><div class="setting-row"><span><strong>Profile name</strong><small>'+esc(p.name)+'</small></span><button class="btn sm" data-action="edit-profile" type="button">Edit</button></div><div class="setting-row"><span><strong>Email</strong><small>'+esc(p.email)+'</small></span>'+badge("Stored locally","ok")+'</div><div class="setting-row"><span><strong>Live operations stream</strong><small>Clock and telemetry update without rebuilding the whole page.</small></span><button class="toggle '+(state.live?"on":"")+'" data-action="toggle-live" type="button"><i></i></button></div><div class="setting-row"><span><strong>Theme</strong><small>Clinical light or deep clinical dark.</small></span><button class="btn sm" data-action="toggle-theme" type="button">'+(state.theme==="dark"?"Use light":"Use dark")+' theme</button></div><div class="setting-row"><span><strong>Data boundary</strong><small>All records in the public portfolio are synthetic.</small></span>'+badge("Synthetic","warn")+'</div><div class="setting-row"><span><strong>Sign out</strong><small>Ends this browser session. Your profile remains available for the next sign-in.</small></span><button class="btn danger" data-action="logout" type="button">Sign out</button></div></article></div>';
    $("#view-settings").innerHTML=frame("settings",body);bindImages();
  }

  /* ---------- forms ---------- */
  function fieldHtml(f){
    if(f.type==="select")return '<div class="field"><label>'+esc(f.label)+'<select name="'+f.name+'">'+f.options.map(function(v){return '<option>'+esc(v)+"</option>";}).join("")+"</select></label></div>";
    if(f.type==="textarea")return '<div class="field wide"><label>'+esc(f.label)+'<textarea name="'+f.name+'" placeholder="'+esc(f.placeholder||"")+'"></textarea></label></div>';
    return '<div class="field"><label>'+esc(f.label)+'<input name="'+f.name+'" type="'+f.type+'" '+(f.value!=null?'value="'+esc(f.value)+'"':"")+' '+(f.required===false?"":"required")+'></label></div>';
  }
  function formConfig(type){
    var patients=state.patients.map(function(p){return p.name;}),providers=state.providers.map(function(p){return p.name;});
    return {
      patient:{title:"Register patient",sub:"Create a synthetic Mahi Health patient record.",fields:[{name:"name",label:"Full name",type:"text",value:"",},{name:"age",label:"Age",type:"number",value:30},{name:"condition",label:"Primary condition",type:"text",value:"Routine review"},{name:"department",label:"Department",type:"select",options:departments}]},
      appointment:{title:"New appointment",sub:"Add a synthetic appointment to the schedule.",fields:[{name:"patient",label:"Patient",type:"select",options:patients},{name:"provider",label:"Provider",type:"select",options:providers},{name:"date",label:"Date",type:"date",value:today()},{name:"time",label:"Time",type:"time",value:"10:30"},{name:"type",label:"Visit type",type:"select",options:["Consultation","Follow-up","Screening","Review","Telehealth"]}]},
      task:{title:"New task",sub:"Add an operational work item to Mahi's queue.",fields:[{name:"title",label:"Task",type:"text",value:""},{name:"patient",label:"Patient",type:"select",options:patients},{name:"priority",label:"Priority",type:"select",options:["Low","Medium","High","Urgent"]},{name:"due",label:"Due date",type:"date",value:today()}]},
      care:{title:"New care item",sub:"Create a synthetic care-coordination handoff.",fields:[{name:"issue",label:"Issue",type:"text",value:""},{name:"patient",label:"Patient",type:"select",options:patients},{name:"priority",label:"Priority",type:"select",options:["Normal","High","Urgent"]},{name:"stage",label:"Stage",type:"select",options:["New","Assigned","In Progress","Waiting"]}]},
      emergency:{title:"Register emergency arrival",sub:"Add a synthetic ED arrival to the triage picture.",fields:[{name:"name",label:"Patient name",type:"text",value:""},{name:"acuity",label:"Acuity",type:"select",options:["Critical","High","Medium","Low"]},{name:"destination",label:"Destination",type:"select",options:["ICU","General","Cardiology","Observation"]}]},
      provider:{title:"Add provider",sub:"Add a synthetic member to the Mahi Health care team.",fields:[{name:"name",label:"Provider name",type:"text",value:"Dr. "},{name:"specialty",label:"Specialty",type:"select",options:departments},{name:"location",label:"Location",type:"text",value:"North Tower"}]},
      invoice:{title:"New invoice",sub:"Create a synthetic revenue-cycle record.",fields:[{name:"patient",label:"Patient",type:"select",options:patients},{name:"amount",label:"Amount (₹)",type:"number",value:10000},{name:"payer",label:"Payer",type:"select",options:["Insurance","Self pay","Corporate"]},{name:"status",label:"Status",type:"select",options:["Pending","Paid","Review"]}]},
      stock:{title:"Add stock entry",sub:"Add a synthetic pharmacy inventory item.",fields:[{name:"name",label:"Medication",type:"text",value:""},{name:"category",label:"Category",type:"text",value:"Medication"},{name:"stock",label:"Stock quantity",type:"number",value:30},{name:"reorder",label:"Reorder level",type:"number",value:20}]},
      lab:{title:"New lab order",sub:"Create a synthetic laboratory order.",fields:[{name:"patient",label:"Patient",type:"select",options:patients},{name:"test",label:"Test",type:"select",options:["CBC","HbA1c","Troponin I","Lipid profile"]},{name:"priority",label:"Priority",type:"select",options:["Routine","High","Critical"]}]},
      message:{title:"New message",sub:"Start a local care-team conversation.",fields:[{name:"recipient",label:"Recipient",type:"select",options:state.messages.map(function(m){return m.name;})},{name:"body",label:"Message",type:"textarea",placeholder:"Write your message…"}]},
      profile:{title:"Edit Mahi profile",sub:"Change the browser-local profile name.",fields:[{name:"name",label:"Profile name",type:"text",value:(getProfile()||{name:"Mahi"}).name}]}
    }[type];
  }
  function openModal(type){
    var cfg=formConfig(type);if(!cfg)return;
    $("#modalRoot").innerHTML='<div class="modal-layer" id="modalLayer"><form id="modalForm" class="modal-card" data-modal-type="'+type+'"><div class="modal-head"><div><div class="modal-title">'+cfg.title+'</div><div class="modal-sub">'+cfg.sub+'</div></div><button class="icon-btn" data-close-modal type="button">×</button></div><div class="modal-body"><div class="form-grid">'+cfg.fields.map(fieldHtml).join("")+'</div></div><div class="modal-foot"><button class="btn" data-close-modal type="button">Cancel</button><button class="btn primary" type="submit">Save change</button></div></form></div>';
  }
  function closeModal(){$("#modalRoot").innerHTML="";}
  function saveModal(type,data){
    if(type==="profile"){var pr=getProfile()||{};pr.name=(data.name||"Mahi").trim()||"Mahi";storage.set("profile",pr);state.profile=pr;showApp();renderSettings();toast("Profile updated");return;}
    if(type==="patient"){var p={id:"AV-"+int(30000,39999),name:data.name,age:Number(data.age||30),condition:data.condition,department:data.department,provider:state.providers[0].name,status:"Active",risk:"Low",attendance:100,lastVisit:today(),nextVisit:shift(7)};state.patients.unshift(p);state.selectedPatient=p.id;persistAll();toast("Patient added");navigate("patients");return;}
    if(type==="appointment"){var ap=state.patients.filter(function(x){return x.name===data.patient;})[0]||state.patients[0];state.appointments.push({id:"AP-"+int(8000,9999),date:data.date,time:data.time,patient:ap.name,patientId:ap.id,provider:data.provider,type:data.type,status:"Scheduled"});storage.set("appointments",state.appointments);toast("Appointment added");navigate("appointments");return;}
    if(type==="task"){state.tasks.unshift({id:"TK-"+int(9000,9999),title:data.title,patient:data.patient,priority:data.priority,owner:"Mahi",due:data.due,status:"To Do"});storage.set("tasks",state.tasks);toast("Task added");navigate("tasks");return;}
    if(type==="care"){state.care.unshift({id:"CH-"+int(9000,9999),issue:data.issue,patient:data.patient,priority:data.priority,stage:data.stage,age:0});storage.set("care",state.care);toast("Care item created");navigate("care");return;}
    if(type==="emergency"){pushNotification("Emergency arrival registered",(data.name||"New arrival")+" entered synthetic triage.","emergency");toast("Emergency arrival registered");navigate("emergency");return;}
    if(type==="provider"){state.providers.push({id:"PR-"+int(500,999),name:data.name,specialty:data.specialty,location:data.location,capacity:12,today:0,utilization:0,status:"Available"});storage.set("providers",state.providers);toast("Provider added");navigate("providers");return;}
    if(type==="invoice"){state.invoices.unshift({id:"INV-"+int(3000,3999),patient:data.patient,amount:Number(data.amount||0),payer:data.payer,status:data.status});storage.set("invoices",state.invoices);toast("Invoice created");navigate("billing");return;}
    if(type==="stock"){state.inventory.unshift({name:data.name,category:data.category,stock:Number(data.stock||0),reorder:Number(data.reorder||0),unit:"units"});storage.set("inventory",state.inventory);toast("Inventory entry added");navigate("pharmacy");return;}
    if(type==="lab"){state.labOrders.unshift({id:"LAB-"+int(7000,8999),patient:data.patient,test:data.test,priority:data.priority,status:"Awaiting review"});storage.set("labOrders",state.labOrders);pushNotification("Lab order created","A synthetic "+data.test+" order was created.","lab");toast("Lab order created");navigate("lab");return;}
    if(type==="message"){var thread=state.messages.filter(function(m){return m.name===data.recipient;})[0];if(thread){thread.items.push(["me",data.body||"Message sent",clock().slice(0,5)]);thread.unread=0;storage.set("messages",state.messages);}toast("Message sent");navigate("messages");}
  }

  /* ---------- global interactions ---------- */
  function handleAction(action){
    var modal={
      "new-patient":"patient","new-appointment":"appointment","new-task":"task","new-care":"care",
      "new-emergency":"emergency","invite-provider":"provider","new-invoice":"invoice",
      "new-stock":"stock","new-lab":"lab","new-message":"message","edit-profile":"profile"
    };
    if(modal[action])return openModal(modal[action]);
    if(action==="open-ai")return navigate("ai");
    if(action==="open-emergency")return navigate("emergency");
    if(action==="open-queue")return navigate("queue");
    if(action==="back-patients")return navigate("patients");
    if(action==="refresh"){state.tick++;updateLive(true);toast("Mahi workspace synchronized");return;}
    if(action==="toggle-theme")return toggleTheme();
    if(action==="toggle-live"){state.live=!state.live;storage.set("live",state.live);renderSettings();toast(state.live?"Live stream enabled":"Live stream paused");return;}
    if(action==="logout")return logout();
    if(action==="demo-login")return demoLogin();
    if(action==="clear-ai"){renderAI();return;}
    if(action==="export-patients")return exportCsv("mahi-averis-patients.csv",state.patients);
    if(action==="export-tasks")return exportCsv("mahi-averis-tasks.csv",state.tasks);
    if(action==="export-analytics")return exportCsv("mahi-averis-analytics.csv",[{metric:"Patient flow",value:"88%"},{metric:"Care SLA",value:"91%"},{metric:"Capacity",value:"71%"},{metric:"Provider utilization",value:"78%"},{metric:"Lab TAT",value:"41 min"},{metric:"Collections",value:"91.4%"}]);
    if(action==="export-all")return exportCsv("mahi-averis-summary.csv",[{patients:state.patients.length,appointments:state.appointments.length,beds:state.beds.length,tasks:state.tasks.length,careItems:state.care.length,labOrders:state.labOrders.length}]);
  }

  function exportCsv(filename,rows){
    if(!rows || !rows.length)return toast("Nothing to export");
    var keys=Object.keys(rows[0]),csv=[keys.join(",")].concat(rows.map(function(row){return keys.map(function(k){return '"'+String(row[k]==null?"":row[k]).replace(/"/g,'""')+'"';}).join(",");})).join("\\n");
    var blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast(filename+" ready");
  }
  function toast(text){var t=document.createElement("div");t.className="toast";t.innerHTML="<i></i><span>"+esc(text)+"</span>";$("#toastHost").appendChild(t);setTimeout(function(){t.remove();},2400);}
  function toggleTheme(){state.theme=state.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=state.theme;storage.set("theme",state.theme);$("#themeButton").textContent=state.theme==="dark"?"☀":"◐";}
  function updateNotifications(){$("#notificationCount").textContent=state.notifications.filter(function(n){return n.unread;}).length;$("#notificationPanel").innerHTML=state.notifications.map(function(n){return '<div class="notification '+(n.unread?"unread":"")+'"><b>'+ (n.type==="emergency"?"!":n.type==="lab"?"△":n.type==="pharmacy"?"◉":n.type==="care"?"♡":"●")+'</b><span><strong>'+esc(n.title)+'</strong><small>'+esc(n.body)+'</small></span><time>'+n.time+"</time></div>";}).join("");}
  function pushNotification(title,body,type){state.notifications.unshift({title:title,body:body,type:type,time:"now",unread:true});state.notifications=state.notifications.slice(0,8);storage.set("notifications",state.notifications);updateNotifications();}

  function bindImages(){$$("img.section-photo,img.hero-photo,img.img").forEach(function(img){if(img.dataset.bound)return;img.dataset.bound="1";img.addEventListener("error",function(){img.classList.add("failed");},{once:true});});}

  function renderNav(){$("#sideNav").innerHTML=NAV.map(function(g){return '<div class="nav-group">'+g[0]+"</div>"+g[1].map(function(v){return '<button class="nav-link '+(state.view===v[0]?"active":"")+'" data-route="'+v[0]+'" type="button"><span class="nav-symbol">'+v[2]+"</span><span>"+v[1]+"</span>"+(v[0]==="queue"?'<em>27</em>':v[0]==="messages"?'<em>6</em>':"")+"</button>";}).join("");}).join("");}
  function navigate(v,silent){
    if(!validRoute(v))v="overview";
    state.view=v;
    if(!silent)history.replaceState(null,"","#"+v);
    $$(".view").forEach(function(x){x.classList.toggle("active",x.id==="view-"+v);});
    $("#routeTitle").textContent=routeName(v);
    renderNav();
    var renderer={overview:renderOverview,analytics:renderAnalytics,ai:renderAI,patients:renderPatients,patient360:renderPatient360,queue:renderQueue,appointments:renderAppointments,emergency:renderEmergency,care:renderCare,clinical:renderClinical,providers:renderProviders,beds:renderBeds,lab:renderLab,pharmacy:renderPharmacy,billing:renderBilling,messages:renderMessages,tasks:renderTasks,reports:renderReports,settings:renderSettings}[v]||renderOverview;
    renderer();
    if(window.innerWidth<961)$("#sidebar").classList.remove("open");
    window.scrollTo(0,0);
  }

  function updateLive(force){
    if(!state.live && !force)return;
    $("#liveClock").textContent=clock();
    var latency=int(12,31);$("#latencyText").textContent=latency+" ms";$("#latencyBar").style.width=int(84,98)+"%";$("#syncText").textContent=state.live?"Synchronized just now":"Live stream paused";$("#footerStatus").textContent=state.live?(latency<25?"All systems nominal":"Monitoring latency"):"Live stream paused";
    var hs=$("#heroLive");if(hs)hs.textContent="LIVE • "+new Date().toLocaleString().toUpperCase();
    if(state.view==="clinical")$$("[data-vital-card]").forEach(function(card,i){var bpm=68+Math.round(Math.sin((state.tick+i)*.36)*4);var o2=96+i%3;var b=$("[data-vital-bpm]",card),s=$("[data-vital-o2]",card);if(b)b.textContent=bpm;if(s)s.textContent="SpO₂ "+o2+"%";});
    if(state.view==="overview" && state.tick%9===0){var feed=$("#activityFeed");if(feed)feed.innerHTML=activity();}
  }

  function openCommand(){
    var items=state.patients.slice(0,15).map(function(p){return {title:p.name,meta:"Patient",run:function(){openPatient(p.id);closeCommand();}};}).concat(NAV.reduce(function(acc,g){return acc.concat(g[1].map(function(v){return {title:v[1],meta:"Module",run:function(){closeCommand();navigate(v[0]);}};}));},[]));
    $("#commandRoot").innerHTML='<div class="command-layer" id="commandLayer"><div class="command-box"><input id="commandInput" class="command-input" placeholder="Search patients, modules and tasks…" autofocus><div id="commandResults" class="command-results"></div></div></div>';
    var input=$("#commandInput"),results=$("#commandResults");
    function paint(){var q=input.value.toLowerCase(),matches=items.filter(function(x){return (x.title+" "+x.meta).toLowerCase().indexOf(q)>-1;}).slice(0,20);results.innerHTML=matches.map(function(x,i){return '<button class="command-item" data-command="'+i+'" type="button"><i>⌕</i><b>'+esc(x.title)+'</b><span>'+x.meta+"</span></button>";}).join("");$$("[data-command]",results).forEach(function(b,i){b.onclick=matches[i].run;});}
    input.oninput=paint;input.onkeydown=function(e){if(e.key==="Escape")closeCommand();if(e.key==="Enter" && $(".command-item",results))$(".command-item",results).click();};paint();
  }
  function closeCommand(){$("#commandRoot").innerHTML="";}
  function openPatient(id){state.selectedPatient=id;storage.set("selectedPatient",id);navigate("patient360");}

  function saveMessageForm(form){var body=new FormData(form).get("body");if(!body)return;var m=state.messages[state.conversation];m.items.push(["me",String(body),clock().slice(0,5)]);m.unread=0;storage.set("messages",state.messages);renderMessages();toast("Message sent");}
  function saveAIForm(form){var q=String(new FormData(form).get("question")||"").trim();if(!q)return;var l=q.toLowerCase(),answer="Averis is reading synthetic portfolio data. Ask about queue, beds, laboratory, pharmacy or Patient 360.";if(l.indexOf("queue")>-1||l.indexOf("wait")>-1)answer="The OPD queue shows 27 waiting with roughly 14 minutes average wait. General Medicine is the visible pressure point.";else if(l.indexOf("bed")>-1)answer="Bed Board shows a roughly 71% occupancy picture with available and cleaning capacity visible by ward.";else if(l.indexOf("lab")>-1||l.indexOf("troponin")>-1)answer="Laboratory has three critical acknowledgement items in the simulation. Troponin is the highest-priority review signal.";else if(l.indexOf("pharmacy")>-1||l.indexOf("stock")>-1)answer="Pharmacy is healthy overall, but Insulin Glargine is below reorder level.";else if(l.indexOf("patient")>-1)answer="Use Patients to search, then Patient 360 for the selected journey, results and follow-up context.";$("#aiMessages").insertAdjacentHTML("beforeend",'<div class="ai-bubble user">'+esc(q)+'</div><div class="ai-bubble bot">'+esc(answer)+'<div class="confidence">Synthetic portfolio data • verify before clinical use.</div></div>');form.reset();$("#aiMessages").scrollTop=$("#aiMessages").scrollHeight;}

  function handleClick(e){
    var route=e.target.closest("[data-route]");if(route){navigate(route.dataset.route);return;}
    var actionBtn=e.target.closest("[data-action]");if(actionBtn){handleAction(actionBtn.dataset.action);return;}
    var service=e.target.closest("[data-service]");if(service){navigate(service.dataset.service);return;}
    var patient=e.target.closest("[data-open-patient]");if(patient){openPatient(patient.dataset.openPatient);return;}
    var patientFilter=e.target.closest("[data-patient-filter]");if(patientFilter){state.patientStatus=patientFilter.dataset.patientFilter;renderPatients();return;}
    var taskFilter=e.target.closest("[data-task-filter]");if(taskFilter){state.taskFilter=taskFilter.dataset.taskFilter;renderTasks();return;}
    var conversation=e.target.closest("[data-conversation]");if(conversation){state.conversation=Number(conversation.dataset.conversation);state.messages[state.conversation].unread=0;storage.set("messages",state.messages);renderMessages();updateNotifications();return;}
    var prompt=e.target.closest("[data-prompt]");if(prompt){navigate("ai");setTimeout(function(){var input=$("#aiInput");if(input){input.value=prompt.dataset.prompt;input.focus();}},0);return;}
    var bed=e.target.closest("[data-bed]");if(bed){var item=state.beds.filter(function(x){return x.id===bed.dataset.bed;})[0];if(item)toast(item.id+" • "+item.status+(item.patient?" • "+item.patient:""));return;}
    var report=e.target.closest("[data-report]");if(report){generateReport(report.dataset.report);return;}
    if(e.target.closest("[data-close-modal]")){closeModal();return;}
    if(e.target.id==="modalLayer")closeModal();
    if(e.target.id==="commandLayer")closeCommand();
  }

  function generateReport(type){
    var rows={daily:[{metric:"Patients",value:state.patients.length},{metric:"Appointments",value:state.appointments.length},{metric:"Beds",value:state.beds.length}],care:state.care,beds:state.beds,providers:state.providers,lab:state.labOrders,pharmacy:state.inventory}[type]||[];
    exportCsv("mahi-averis-"+type+".csv",rows);
  }

  function handleInput(e){if(e.target.id==="patientSearch"){state.patientQuery=e.target.value;renderPatients();}}

  function init(){
    try{
      makeData();
      document.documentElement.dataset.theme=state.theme;
      renderNav();
      var profile=getProfile(),session=storage.get("session",null);
      state.profile=profile;
      if(profile && session && session.email===profile.email){showApp();navigate(state.view,true);}else{showAuth();}
      $("#signinForm").addEventListener("submit",signIn);$("#createForm").addEventListener("submit",createProfile);
      $$(".auth-tab").forEach(function(b){b.addEventListener("click",function(){setAuthMode(b.dataset.authTab);});});
      $$("[data-password-toggle]").forEach(function(b){b.addEventListener("click",function(){var input=$("#"+b.dataset.passwordToggle);input.type=input.type==="password"?"text":"password";b.textContent=input.type==="password"?"Show":"Hide";});});
      $("#openSidebar").addEventListener("click",function(){$("#sidebar").classList.add("open");});
      $("#closeSidebar").addEventListener("click",function(){$("#sidebar").classList.remove("open");});
      $("#globalSearch").addEventListener("click",openCommand);
      $("#refreshButton").addEventListener("click",function(){state.tick++;updateLive(true);toast("Mahi workspace synchronized");});
      $("#themeButton").addEventListener("click",toggleTheme);
      $("#profileButton").addEventListener("click",function(){navigate("settings");});
      $("#topProfile").addEventListener("click",function(){navigate("settings");});
      $("#notificationButton").addEventListener("click",function(){var panel=$("#notificationPanel");panel.classList.toggle("open");if(panel.classList.contains("open")){state.notifications.forEach(function(n){n.unread=false;});storage.set("notifications",state.notifications);updateNotifications();}});
      document.addEventListener("click",handleClick);
      document.addEventListener("input",handleInput);
      document.addEventListener("submit",function(e){if(e.target.id==="modalForm"){e.preventDefault();var data=Object.fromEntries(new FormData(e.target).entries());var type=e.target.dataset.modalType;closeModal();saveModal(type,data);}else if(e.target.id==="messageForm"){e.preventDefault();saveMessageForm(e.target);}else if(e.target.id==="aiForm"){e.preventDefault();saveAIForm(e.target);}});
      document.addEventListener("keydown",function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommand();}if(e.key==="Escape"){closeModal();closeCommand();$("#notificationPanel").classList.remove("open");}});
      window.addEventListener("hashchange",function(){navigate(location.hash.slice(1)||"overview",true);});
      updateNotifications();updateLive(true);bindImages();
      setInterval(function(){if(!state.live)return;state.tick++;updateLive(false);},1000);
      setInterval(function(){if(state.live)pushNotification("Live workspace event","Averis received a new synthetic operational update.","system");},22000);
    }catch(error){
      console.error("Averis startup error:",error);
      $("#authGate").classList.add("hidden");$("#appShell").classList.remove("hidden");
      var target=$("#view-overview");target.classList.add("active");
      target.innerHTML='<div class="section-content"><article class="card" style="max-width:760px;margin:70px auto"><div class="eyebrow">MAHI • AVERIS</div><h1>Workspace could not finish loading.</h1><p class="section-sub">A startup error was caught so Averis does not become a blank page. Refresh once to retry.</p><button class="btn primary" type="button" onclick="location.reload()">Reload Averis</button></article></div>';
      document.body.setAttribute("data-startup-error",String(error.message||error));
    }
    document.documentElement.dataset.theme=state.theme;
  }

  init();
}());