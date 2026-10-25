import os,requests
from django.contrib import messages
from django.shortcuts import redirect,render
from django.views.decorators.http import require_http_methods
API=os.environ.get("AVERIS_API_URL","http://127.0.0.1:8000/api").rstrip("/")
def call(path,request,method="GET",body=None):
 token=request.COOKIES.get("averis_session")
 return requests.request(method,API+path,json=body,cookies={"averis_session":token} if token else {},timeout=12)
def dashboard(request):
 health={};user=None;summary={};products=[]
 try:
  health=call("/health",request).json()
  if request.COOKIES.get("averis_session"):
   me=call("/auth/me",request)
   if me.ok:
    user=me.json()["user"];s=call("/erp/summary",request);p=call("/erp/products?limit=50",request)
    summary=s.json() if s.ok else {};products=p.json().get("items",[]) if p.ok else []
 except requests.RequestException: messages.warning(request,"FastAPI API unavailable.")
 return render(request,"portal.html",{"health":health,"user":user,"summary":summary,"products":products})
@require_http_methods(["GET","POST"])
def login_view(request):
 if request.method=="GET": return redirect("dashboard")
 try:
  r=requests.post(API+"/auth/login",json={"email":request.POST.get("email",""),"password":request.POST.get("password","")},timeout=12)
  if not r.ok: messages.error(request,r.json().get("detail","Login failed"));return redirect("dashboard")
  out=redirect("dashboard");token=r.cookies.get("averis_session")
  if token: out.set_cookie("averis_session",token,httponly=True,secure=request.is_secure(),samesite="Lax",max_age=604800,path="/")
  return out
 except requests.RequestException: messages.error(request,"FastAPI API unavailable.");return redirect("dashboard")
@require_http_methods(["POST"])
def logout_view(request):
 try: call("/auth/logout",request,"POST",{})
 except requests.RequestException: pass
 out=redirect("dashboard");out.delete_cookie("averis_session",path="/");return out
