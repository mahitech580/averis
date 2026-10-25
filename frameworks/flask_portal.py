import os,requests
from flask import Flask,request,redirect,render_template_string,flash
app=Flask(__name__);app.secret_key=os.environ.get("FLASK_SECRET_KEY","local-only-change-before-sharing")
API=os.environ.get("AVERIS_API_URL","http://127.0.0.1:8000/api").rstrip("/")
HTML="""<!doctype html><html><head><meta name=viewport content="width=device-width,initial-scale=1"><title>AVERIS Flask ERP</title><link href=https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css rel=stylesheet><style>body{background:#07111f;color:#eaf2fb}.card{background:#0c1d2e;color:#eaf2fb;border-color:#20364a}</style></head><body><main class='container py-4'><h1>AVERIS ERP · Flask</h1><p>Flask/Jinja companion → shared FastAPI REST data</p>{% for m in get_flashed_messages() %}<div class=alert>{{m}}</div>{% endfor %}{% if not user %}<form method=post action=/login class='card card-body gap-2'><input class=form-control name=email type=email required placeholder=Email><input class=form-control name=password type=password required placeholder=Password><button class='btn btn-primary'>Sign in</button></form>{% else %}<p>{{user.name}} · {{user.email}}</p><form method=post action=/logout><button class='btn btn-outline-light'>Sign out</button></form><h2 class='h4 mt-4'>Create product</h2><form method=post action=/products class='card card-body gap-2'><input class=form-control name=name required placeholder=Name><input class=form-control name=sku required placeholder=SKU><input class=form-control name=quantity type=number min=0 value=0><input class=form-control name=reorder_level type=number min=0 value=5><button class='btn btn-success'>Create</button></form><h2 class='h4 mt-4'>Inventory · {{products|length}}</h2><div class=table-responsive><table class='table table-dark'><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Reorder</th></tr>{% for p in products %}<tr><td>{{p.sku}}</td><td>{{p.name}}</td><td>{{p.quantity}}</td><td>{{p.reorder_level}}</td></tr>{% endfor %}</table></div>{% endif %}</main></body></html>"""
def api(path,method="GET",body=None):
 t=request.cookies.get("averis_session")
 return requests.request(method,API+path,json=body,cookies={"averis_session":t} if t else {},timeout=12)
@app.get("/")
def home():
 user=None;products=[]
 try:
  if request.cookies.get("averis_session"):
   r=api("/auth/me")
   if r.ok:
    user=r.json()["user"];p=api("/erp/products?limit=50");products=p.json().get("items",[]) if p.ok else []
 except requests.RequestException: flash("FastAPI API unavailable")
 return render_template_string(HTML,user=user,products=products)
@app.post("/login")
def login():
 try:
  r=requests.post(API+"/auth/login",json={"email":request.form.get("email",""),"password":request.form.get("password","")},timeout=12)
  if not r.ok: flash(r.json().get("detail","Login failed"));return redirect("/")
  out=redirect("/");token=r.cookies.get("averis_session")
  if token: out.set_cookie("averis_session",token,httponly=True,secure=request.is_secure,samesite="Lax",max_age=604800,path="/")
  return out
 except requests.RequestException: flash("FastAPI API unavailable");return redirect("/")
@app.post("/logout")
def logout():
 try: api("/auth/logout","POST",{})
 except requests.RequestException: pass
 out=redirect("/");out.delete_cookie("averis_session",path="/");return out
@app.post("/products")
def product():
 payload={k:request.form.get(k,"") for k in ["name","sku","quantity","reorder_level"]}
 try:
  r=api("/erp/products","POST",payload);flash("Product created" if r.ok else r.json().get("detail","Create failed"))
 except requests.RequestException: flash("FastAPI API unavailable")
 return redirect("/")
if __name__=="__main__": app.run("127.0.0.1",port=int(os.environ.get("FLASK_PORT","5001")),debug=False)
