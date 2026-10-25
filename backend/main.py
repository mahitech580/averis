"""AVERIS shared SaaS API. Synthetic operational records only; not a clinical system."""
from __future__ import annotations
import hashlib, json, os, re, secrets, uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Generator
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from pwdlib import PasswordHash
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, create_engine, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker
from backend.services.prioritization import prioritize_inventory

APP_ENV=os.getenv("APP_ENV","development").lower()
COOKIE="averis_session"
SESSION_TTL=604800
MAX_BYTES=1_500_000
PASSWORD_HASHER=PasswordHash.recommended()
raw_url=os.getenv("DATABASE_URL","sqlite:///./averis.db").strip()
if APP_ENV=="production" and raw_url.startswith("sqlite"):
    raise RuntimeError("APP_ENV=production requires a persistent DATABASE_URL; SQLite on ephemeral hosting is unsafe.")
if raw_url.startswith("postgres://"): DB_URL=raw_url.replace("postgres://","postgresql+psycopg://",1)
elif raw_url.startswith("postgresql://"): DB_URL=raw_url.replace("postgresql://","postgresql+psycopg://",1)
elif raw_url.startswith("mysql://"): DB_URL=raw_url.replace("mysql://","mysql+pymysql://",1)
else: DB_URL=raw_url
engine_args={"pool_pre_ping":True}
if DB_URL.startswith("sqlite"): engine_args["connect_args"]={"check_same_thread":False,"timeout":10}
else: engine_args["pool_recycle"]=1800
engine=create_engine(DB_URL,**engine_args)
SessionLocal=sessionmaker(bind=engine,autoflush=False,autocommit=False,expire_on_commit=False)

def utcnow(): return datetime.now(timezone.utc).replace(tzinfo=None,microsecond=0)
def iso(v): return v.replace(tzinfo=timezone.utc).isoformat().replace("+00:00","Z") if v else None
class Base(DeclarativeBase): pass

class Organization(Base):
    __tablename__="organizations"
    id: Mapped[str]=mapped_column(String(36),primary_key=True,default=lambda:str(uuid.uuid4()))
    name: Mapped[str]=mapped_column(String(120),nullable=False)
    slug: Mapped[str]=mapped_column(String(160),unique=True,index=True,nullable=False)
    invite_code: Mapped[str]=mapped_column(String(48),unique=True,index=True,nullable=False)
    created_at: Mapped[datetime]=mapped_column(DateTime,default=utcnow,nullable=False)
    users: Mapped[list["User"]]=relationship(back_populates="organization")

class User(Base):
    __tablename__="users"
    id: Mapped[str]=mapped_column(String(36),primary_key=True,default=lambda:str(uuid.uuid4()))
    organization_id: Mapped[str]=mapped_column(ForeignKey("organizations.id"),index=True,nullable=False)
    full_name: Mapped[str]=mapped_column(String(100),nullable=False)
    email: Mapped[str]=mapped_column(String(254),unique=True,index=True,nullable=False)
    password_hash: Mapped[str]=mapped_column(String(512),nullable=False)
    role: Mapped[str]=mapped_column(String(20),default="owner",nullable=False)
    is_active: Mapped[bool]=mapped_column(Boolean,default=True,nullable=False)
    created_at: Mapped[datetime]=mapped_column(DateTime,default=utcnow,nullable=False)
    organization: Mapped[Organization]=relationship(back_populates="users")

class AuthSession(Base):
    __tablename__="auth_sessions"
    token_hash: Mapped[str]=mapped_column(String(64),primary_key=True)
    user_id: Mapped[str]=mapped_column(ForeignKey("users.id"),index=True,nullable=False)
    created_at: Mapped[datetime]=mapped_column(DateTime,default=utcnow,nullable=False)
    expires_at: Mapped[datetime]=mapped_column(DateTime,index=True,nullable=False)
    revoked_at: Mapped[datetime|None]=mapped_column(DateTime,nullable=True)

class WorkspaceSnapshot(Base):
    __tablename__="workspace_snapshots"
    organization_id: Mapped[str]=mapped_column(ForeignKey("organizations.id"),primary_key=True)
    data: Mapped[dict[str,Any]]=mapped_column(JSON,nullable=False,default=dict)
    revision: Mapped[int]=mapped_column(Integer,default=0,nullable=False)
    updated_at: Mapped[datetime]=mapped_column(DateTime,default=utcnow,nullable=False)
    updated_by: Mapped[str]=mapped_column(ForeignKey("users.id"),nullable=False)

class AuditEvent(Base):
    __tablename__="server_audit_events"
    id: Mapped[int]=mapped_column(Integer,primary_key=True,autoincrement=True)
    organization_id: Mapped[str]=mapped_column(ForeignKey("organizations.id"),index=True,nullable=False)
    actor_id: Mapped[str]=mapped_column(ForeignKey("users.id"),nullable=False)
    action: Mapped[str]=mapped_column(String(80),nullable=False)
    details: Mapped[dict[str,Any]]=mapped_column(JSON,nullable=False,default=dict)
    created_at: Mapped[datetime]=mapped_column(DateTime,default=utcnow,nullable=False)


class BusinessRecord(Base):
    """Tenant-scoped JSON entity for the unified ERP domain."""
    __tablename__ = "erp_business_records"
    __table_args__ = (UniqueConstraint("organization_id", "collection", "record_key", name="uq_erp_org_collection_key"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), index=True, nullable=False)
    collection: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    record_key: Mapped[str] = mapped_column(String(80), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)

COLLECTIONS={"people","tasks","appointments","resources","workforce","messages","incidents","diagnostics","pharmacy","finance","reports","audit"}
PREFERENCES={"compact","focus","notifications","theme"}
ALLOWED_ORIGINS={x.strip().rstrip("/") for x in os.getenv("ALLOWED_ORIGINS","https://averis-saas.netlify.app,https://mahitech580.github.io,http://localhost:5500,http://127.0.0.1:5500").split(",") if x.strip()}
app=FastAPI(title="AVERIS Workspace API",version="1.0.0",description="Tenant-scoped shared JSON workspaces. Synthetic operational data only.",docs_url="/api/docs",openapi_url="/api/openapi.json")
app.add_middleware(CORSMiddleware,allow_origins=sorted(ALLOWED_ORIGINS),allow_credentials=True,allow_methods=["GET","POST","PUT","DELETE","OPTIONS"],allow_headers=["Content-Type","X-Averis-Request"])

@app.middleware("http")
async def request_safety(request:Request,call_next):
    if request.url.path.startswith("/api/") and request.method in {"POST","PUT","PATCH","DELETE"}:
        origin=request.headers.get("origin")
        if origin and origin.rstrip("/") not in ALLOWED_ORIGINS and origin.rstrip("/")!=str(request.base_url).rstrip("/"):
            return JSONResponse(status_code=403,content={"detail":"Origin is not allowed."})
    response=await call_next(request)
    response.headers.setdefault("X-Content-Type-Options","nosniff")
    response.headers.setdefault("Referrer-Policy","strict-origin-when-cross-origin")
    response.headers.setdefault("X-Frame-Options","DENY")
    response.headers.setdefault("Permissions-Policy","camera=(), microphone=(), geolocation=()")
    if request.url.path.startswith("/api/auth") or request.url.path.startswith("/api/workspace"): response.headers["Cache-Control"]="no-store"
    return response

@app.on_event("startup")
def create_schema(): Base.metadata.create_all(bind=engine)

def get_db()->Generator[Session,None,None]:
    db=SessionLocal()
    try: yield db
    finally: db.close()

def digest(token:str)->str: return hashlib.sha256(token.encode("utf-8")).hexdigest()
def slugify(value:str)->str: return (re.sub(r"[^a-z0-9]+","-",value.lower()).strip("-")[:90] or "averis-workspace")
def public_user(user:User)->dict[str,Any]:
    return {"id":user.id,"name":user.full_name,"email":user.email,"role":user.role,"organization_id":user.organization_id}
def identity(user:User)->dict[str,Any]:
    return {"user":public_user(user),"organization":{"id":user.organization.id,"name":user.organization.name,"slug":user.organization.slug}}
def issue_cookie(response:Response,request:Request,db:Session,user:User):
    token=secrets.token_urlsafe(40)
    db.add(AuthSession(token_hash=digest(token),user_id=user.id,created_at=utcnow(),expires_at=utcnow()+timedelta(seconds=SESSION_TTL)))
    db.commit()
    response.set_cookie(COOKIE,token,max_age=SESSION_TTL,httponly=True,secure=(APP_ENV=="production" or request.url.scheme=="https"),samesite="lax",path="/")

def current_user(request:Request,db:Session=Depends(get_db))->User:
    token=request.cookies.get(COOKIE)
    if not token: raise HTTPException(401,"Sign in required.")
    row=db.get(AuthSession,digest(token))
    if row is None or row.revoked_at is not None or row.expires_at<=utcnow(): raise HTTPException(401,"Session expired. Sign in again.")
    user=db.get(User,row.user_id)
    if user is None or not user.is_active: raise HTTPException(401,"Account is unavailable.")
    return user

class RegisterInput(BaseModel):
    full_name:str=Field(min_length=2,max_length=100)
    email:str=Field(min_length=5,max_length=254)
    password:str=Field(min_length=12,max_length=128)
    organization_name:str=Field(min_length=2,max_length=120)
    @field_validator("full_name","organization_name")
    @classmethod
    def clean_names(cls,v:str)->str:
        v=v.strip()
        if len(v)<2: raise ValueError("Enter at least two characters.")
        return v
    @field_validator("email")
    @classmethod
    def clean_email(cls,v:str)->str:
        v=v.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+",v): raise ValueError("Enter a valid email address.")
        return v

class LoginInput(BaseModel):
    email:str=Field(min_length=5,max_length=254)
    password:str=Field(min_length=1,max_length=128)
    @field_validator("email")
    @classmethod
    def clean_email(cls,v:str)->str: return v.strip().lower()

class ProfileInput(BaseModel):
    full_name:str=Field(min_length=2,max_length=100)
    @field_validator("full_name")
    @classmethod
    def clean_name(cls,v:str)->str:
        v=v.strip()
        if len(v)<2: raise ValueError("Enter at least two characters.")
        return v

class JoinInput(BaseModel):
    invite_code:str=Field(min_length=6,max_length=48)
    @field_validator("invite_code")
    @classmethod
    def clean_code(cls,v:str)->str: return v.strip()

class WorkspaceInput(BaseModel):
    revision:int=Field(ge=0)
    data:dict[str,Any]

def sanitize_workspace(data:dict[str,Any])->dict[str,Any]:
    out={}
    for key in COLLECTIONS:
        if key not in data: continue
        items=data[key]
        if not isinstance(items,list): raise HTTPException(422,f"{key} must be a list.")
        if len(items)>4000: raise HTTPException(413,f"{key} has too many records.")
        if any(not isinstance(item,dict) for item in items): raise HTTPException(422,f"Each {key} item must be an object.")
        out[key]=items
    for key in PREFERENCES:
        if key in data:
            value=data[key]
            if key in {"compact","focus","notifications"} and not isinstance(value,bool): raise HTTPException(422,f"{key} must be a boolean.")
            if key=="theme" and value not in {"dark","light"}: raise HTTPException(422,"theme must be dark or light.")
            out[key]=value
    try: encoded=json.dumps(out,ensure_ascii=False,separators=(",",":"),allow_nan=False)
    except (ValueError,TypeError) as exc: raise HTTPException(422,"Workspace must contain JSON-compatible values.") from exc
    if len(encoded.encode("utf-8"))>MAX_BYTES: raise HTTPException(413,"Workspace JSON exceeds the 1.5 MB limit.")
    return json.loads(encoded)

def audit(db:Session,org_id:str,user_id:str,action:str,details:dict[str,Any]|None=None):
    db.add(AuditEvent(organization_id=org_id,actor_id=user_id,action=action,details=details or {},created_at=utcnow()))

def organization_info(db:Session,user:User)->dict[str,Any]:
    org=db.get(Organization,user.organization_id)
    if org is None: raise HTTPException(404,"Workspace not found.")
    members=db.scalars(select(User).where(User.organization_id==org.id,User.is_active.is_(True)).order_by(User.created_at)).all()
    return {"id":org.id,"name":org.name,"slug":org.slug,"invite_code":org.invite_code,"role":user.role,"member_count":len(members),"members":[{"id":m.id,"name":m.full_name,"email":m.email,"role":m.role,"created_at":iso(m.created_at)} for m in members]}

@app.get("/api/health")
def health(db:Session=Depends(get_db)):
    try: db.execute(text("SELECT 1"))
    except Exception as exc: raise HTTPException(503,"Database is unavailable.") from exc
    driver=engine.dialect.name
    return {"status":"ok","service":"AVERIS Workspace API","database":{"sqlite":"SQLite","mysql":"MySQL","postgresql":"PostgreSQL"}.get(driver,driver),"database_driver":driver,"persistence":"server","live_sync_seconds":5,"timestamp":iso(utcnow()),"synthetic_data_only":True}

@app.post("/api/auth/register",status_code=201)
def register(payload:RegisterInput,request:Request,response:Response,db:Session=Depends(get_db)):
    if db.scalar(select(User.id).where(User.email==payload.email)) is not None: raise HTTPException(409,"An account with this email already exists.")
    org=Organization(name=payload.organization_name,slug=f"{slugify(payload.organization_name)}-{secrets.token_hex(3)}",invite_code=secrets.token_urlsafe(12),created_at=utcnow())
    user=User(organization=org,full_name=payload.full_name,email=payload.email,password_hash=PASSWORD_HASHER.hash(payload.password),role="owner",is_active=True,created_at=utcnow())
    db.add_all([org,user])
    try: db.commit();db.refresh(user)
    except IntegrityError as exc: db.rollback();raise HTTPException(409,"An account with this email already exists.") from exc
    audit(db,org.id,user.id,"account.registered");db.commit();issue_cookie(response,request,db,user)
    return identity(user)

@app.post("/api/auth/login")
def login(payload:LoginInput,request:Request,response:Response,db:Session=Depends(get_db)):
    user=db.scalar(select(User).where(User.email==payload.email))
    if user is None or not user.is_active or not PASSWORD_HASHER.verify(payload.password,user.password_hash): raise HTTPException(401,"Email or password is incorrect.")
    audit(db,user.organization_id,user.id,"account.signed_in");db.commit();issue_cookie(response,request,db,user)
    return identity(user)

@app.get("/api/auth/me")
def me(user:User=Depends(current_user)): return identity(user)

@app.put("/api/auth/profile")
def update_profile(payload:ProfileInput,db:Session=Depends(get_db),user:User=Depends(current_user)):
    user.full_name=payload.full_name;db.add(user);audit(db,user.organization_id,user.id,"account.profile_updated");db.commit();db.refresh(user)
    return identity(user)

@app.post("/api/auth/logout")
def logout(request:Request,response:Response,db:Session=Depends(get_db)):
    token=request.cookies.get(COOKIE)
    if token:
        row=db.get(AuthSession,digest(token))
        if row is not None and row.revoked_at is None: row.revoked_at=utcnow();db.add(row);db.commit()
    response.delete_cookie(COOKIE,path="/",httponly=True,secure=(APP_ENV=="production" or request.url.scheme=="https"),samesite="lax")
    return {"ok":True}

@app.get("/api/organization")
def get_org(db:Session=Depends(get_db),user:User=Depends(current_user)): return organization_info(db,user)

@app.post("/api/organization/join")
def join_org(payload:JoinInput,db:Session=Depends(get_db),user:User=Depends(current_user)):
    org=db.scalar(select(Organization).where(Organization.invite_code==payload.invite_code))
    if org is None: raise HTTPException(404,"Invite code not found.")
    if user.organization_id==org.id: return organization_info(db,user)
    user.organization_id=org.id;user.role="member";db.add(user);audit(db,org.id,user.id,"organization.member_joined");db.commit();db.refresh(user)
    return organization_info(db,user)

@app.post("/api/organization/rotate-invite")
def rotate_invite(db:Session=Depends(get_db),user:User=Depends(current_user)):
    if user.role!="owner": raise HTTPException(403,"Only workspace owners can rotate invite codes.")
    org=db.get(Organization,user.organization_id)
    if org is None: raise HTTPException(404,"Workspace not found.")
    org.invite_code=secrets.token_urlsafe(12);db.add(org);audit(db,org.id,user.id,"organization.invite_rotated");db.commit();db.refresh(org)
    return organization_info(db,user)

@app.get("/api/workspace")
def get_workspace(db:Session=Depends(get_db),user:User=Depends(current_user)):
    row=db.get(WorkspaceSnapshot,user.organization_id)
    if row is None: return {"data":None,"revision":0,"updated_at":None,"updated_by":None}
    return {"data":row.data,"revision":row.revision,"updated_at":iso(row.updated_at),"updated_by":row.updated_by}

@app.put("/api/workspace")
def put_workspace(payload:WorkspaceInput,db:Session=Depends(get_db),user:User=Depends(current_user)):
    data=sanitize_workspace(payload.data)
    row=db.get(WorkspaceSnapshot,user.organization_id)
    current=row.revision if row else 0
    if payload.revision!=current:
        return JSONResponse(status_code=409,content={"detail":"Workspace changed in another session.","data":row.data if row else None,"revision":current,"updated_at":iso(row.updated_at) if row else None})
    revision=current+1;now=utcnow()
    if row is None: row=WorkspaceSnapshot(organization_id=user.organization_id,data=data,revision=revision,updated_at=now,updated_by=user.id)
    else: row.data=data;row.revision=revision;row.updated_at=now;row.updated_by=user.id
    db.add(row);audit(db,user.organization_id,user.id,"workspace.snapshot_saved",{"revision":revision,"collections":{k:len(v) for k,v in data.items() if isinstance(v,list)}});db.commit()
    return {"data":data,"revision":revision,"updated_at":iso(now),"updated_by":user.id}

@app.get("/api/activity")
def activity(limit:int=30,db:Session=Depends(get_db),user:User=Depends(current_user)):
    rows=db.scalars(select(AuditEvent).where(AuditEvent.organization_id==user.organization_id).order_by(AuditEvent.created_at.desc()).limit(max(1,min(limit,100)))).all()
    return {"items":[{"id":r.id,"action":r.action,"actor_id":r.actor_id,"details":r.details,"created_at":iso(r.created_at)} for r in rows]}


# ERP module catalogue: one authenticated REST API for every department.
ERP_FIELDS: dict[str, dict[str, str]] = {
    "products": {"name":"text","sku":"text","category":"text","unit":"text","quantity":"number","reorder_level":"number","unit_cost":"number","selling_price":"number","location":"text","status":"text"},
    "suppliers": {"name":"text","company":"text","email":"email","phone":"text","city":"text","payment_terms":"text","status":"text"},
    "purchase_orders": {"po_number":"text","supplier":"text","order_date":"date","expected_date":"date","items_count":"number","total":"number","status":"text"},
    "customers": {"name":"text","company":"text","email":"email","phone":"text","segment":"text","city":"text","lifetime_value":"number","status":"text"},
    "sales_orders": {"so_number":"text","customer":"text","order_date":"date","due_date":"date","items_count":"number","total":"number","status":"text"},
    "invoices": {"invoice_number":"text","party":"text","direction":"text","issue_date":"date","due_date":"date","amount":"number","paid_amount":"number","status":"text"},
    "employees": {"name":"text","email":"email","department":"text","job_title":"text","manager":"text","employment_type":"text","start_date":"date","salary":"number","status":"text"},
    "leads": {"name":"text","company":"text","email":"email","source":"text","owner":"text","stage":"text","value":"number","next_activity":"date"},
    "projects": {"name":"text","client":"text","owner":"text","start_date":"date","due_date":"date","budget":"number","status":"text","progress":"number"},
    "assets": {"name":"text","asset_tag":"text","category":"text","assigned_to":"text","purchase_date":"date","value":"number","condition":"text","status":"text"},
    "journal_entries": {"entry_number":"text","date":"date","description":"text","debit_account":"text","credit_account":"text","amount":"number","status":"text"},
    "support_tickets": {"subject":"text","customer":"text","priority":"text","assignee":"text","created_date":"date","status":"text"},
    "production_orders": {"order_number":"text","product":"text","quantity":"number","due_date":"date","work_center":"text","status":"text"},
    "stock_movements": {"movement_date":"date","sku":"text","product":"text","movement_type":"text","quantity":"number","reference":"text"},
    "quality_checks": {"reference":"text","item":"text","check_type":"text","result":"text","inspector":"text","check_date":"date","status":"text"},
}
ERP_LABELS = {
    "products":"Inventory", "suppliers":"Suppliers", "purchase_orders":"Purchasing",
    "customers":"Customers", "sales_orders":"Sales", "invoices":"Invoices & Finance",
    "employees":"HR & Employees", "leads":"CRM", "projects":"Projects",
    "assets":"Assets", "journal_entries":"Accounting", "support_tickets":"Support",
    "production_orders":"Manufacturing", "stock_movements":"Stock Ledger", "quality_checks":"Quality",
}
ERP_REQUIRED = {
    "products":["name","sku"], "suppliers":["name"], "purchase_orders":["po_number","supplier"],
    "customers":["name"], "sales_orders":["so_number","customer"], "invoices":["invoice_number","party","amount"],
    "employees":["name","email"], "leads":["name"], "projects":["name"], "assets":["name","asset_tag"],
    "journal_entries":["entry_number","date","amount"], "support_tickets":["subject"],
    "production_orders":["order_number","product","quantity"], "stock_movements":["movement_date","sku","quantity"],
    "quality_checks":["reference","item","result"],
}
ERP_PREFIX = {
    "products":"PRD", "suppliers":"SUP", "purchase_orders":"PO", "customers":"CUS",
    "sales_orders":"SO", "invoices":"INV", "employees":"EMP", "leads":"LEAD",
    "projects":"PROJ", "assets":"AST", "journal_entries":"JRN", "support_tickets":"TKT",
    "production_orders":"MFG", "stock_movements":"MOV", "quality_checks":"QC",
}

def validate_erp_collection(collection: str) -> dict[str, str]:
    fields = ERP_FIELDS.get(collection)
    if fields is None:
        raise HTTPException(404, "ERP module not found.")
    return fields

def clean_erp_payload(collection: str, raw: dict[str, Any], record_key: str | None = None) -> dict[str, Any]:
    fields = validate_erp_collection(collection)
    unknown = sorted(set(raw) - set(fields) - {"id", "created_at", "updated_at"})
    if unknown:
        raise HTTPException(422, "Unsupported field(s): " + ", ".join(unknown))
    cleaned: dict[str, Any] = {}
    for key, kind in fields.items():
        if key not in raw:
            continue
        value = raw[key]
        if value is None or (isinstance(value, str) and not value.strip()):
            cleaned[key] = None if kind == "number" else ""
            continue
        if kind == "number":
            if isinstance(value, bool):
                raise HTTPException(422, f"{key} must be numeric.")
            try:
                number = float(value)
            except (TypeError, ValueError) as exc:
                raise HTTPException(422, f"{key} must be numeric.") from exc
            if not __import__("math").isfinite(number):
                raise HTTPException(422, f"{key} must be finite.")
            if number < 0:
                raise HTTPException(422, f"{key} cannot be negative.")
            if key in {"quantity", "reorder_level", "items_count", "progress"} and not number.is_integer():
                raise HTTPException(422, f"{key} must be a whole number.")
            if key == "progress" and number > 100:
                raise HTTPException(422, "progress must be between 0 and 100.")
            cleaned[key] = int(number) if number.is_integer() else number
        else:
            if not isinstance(value, str):
                raise HTTPException(422, f"{key} must be text.")
            value = value.strip()
            if len(value) > 500:
                raise HTTPException(422, f"{key} exceeds 500 characters.")
            if kind == "date" and value:
                try:
                    date.fromisoformat(value)
                except ValueError as exc:
                    raise HTTPException(422, f"{key} must use YYYY-MM-DD format.") from exc
            if kind == "email" and value and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
                raise HTTPException(422, f"{key} must be a valid email address.")
            cleaned[key] = value
    missing = [
        field for field in ERP_REQUIRED[collection]
        if cleaned.get(field) is None or not str(cleaned.get(field, "")).strip()
    ]
    if missing:
        raise HTTPException(422, "Required field(s): " + ", ".join(missing))
    if collection == "products" and "sku" in cleaned:
        cleaned["sku"] = cleaned["sku"].upper()
    if record_key:
        cleaned["id"] = record_key
    return cleaned

def public_erp_record(row: BusinessRecord) -> dict[str, Any]:
    payload = dict(row.payload)
    payload["id"] = row.record_key
    payload["created_at"] = iso(row.created_at)
    payload["updated_at"] = iso(row.updated_at)
    return payload

@app.get("/api/erp/modules")
def erp_modules(user: User = Depends(current_user)):
    return {"modules":[{"key":key,"label":ERP_LABELS[key],"fields":ERP_FIELDS[key],"required":ERP_REQUIRED[key]} for key in ERP_FIELDS]}

@app.get("/api/erp/summary")
def erp_summary(db: Session = Depends(get_db), user: User = Depends(current_user)):
    counts = {}
    for collection in ERP_FIELDS:
        counts[collection] = len(db.scalars(select(BusinessRecord.id).where(
            BusinessRecord.organization_id == user.organization_id,
            BusinessRecord.collection == collection
        )).all())
    products = db.scalars(select(BusinessRecord).where(
        BusinessRecord.organization_id == user.organization_id,
        BusinessRecord.collection == "products"
    )).all()
    low_stock = sum(1 for row in products if int(row.payload.get("quantity") or 0) <= int(row.payload.get("reorder_level") or 0))
    reorder_alerts = prioritize_inventory([dict(row.payload, id=row.record_key) for row in products], limit=6)
    invoices = db.scalars(select(BusinessRecord).where(
        BusinessRecord.organization_id == user.organization_id,
        BusinessRecord.collection == "invoices"
    )).all()
    receivables = 0.0
    payables = 0.0
    for row in invoices:
        payload = row.payload
        outstanding = max(0.0, float(payload.get("amount") or 0) - float(payload.get("paid_amount") or 0))
        if str(payload.get("status","")).lower() not in {"paid","void","cancelled"}:
            if str(payload.get("direction","receivable")).lower() in {"payable","outgoing","purchase"}:
                payables += outstanding
            else:
                receivables += outstanding
    return {
        "counts": counts,
        "low_stock": low_stock,
        "reorder_alerts": reorder_alerts,
        "outstanding_receivables": round(receivables, 2),
        "outstanding_payables": round(payables, 2),
        "generated_at": iso(utcnow()),
        "synthetic_data_only": True,
    }

@app.get("/api/erp/search")
def search_erp_records(q: str="", limit: int=20, db: Session=Depends(get_db), user: User=Depends(current_user)):
    query=q.strip().lower()
    if not query:
        return {"items":[],"count":0}
    bounded=max(1,min(limit,50))
    rows=db.scalars(select(BusinessRecord).where(
        BusinessRecord.organization_id==user.organization_id
    ).order_by(BusinessRecord.updated_at.desc()).limit(1000)).all()
    matches=[]
    for row in rows:
        payload=public_erp_record(row)
        if query not in json.dumps(payload,ensure_ascii=False,default=str).lower():
            continue
        label=(payload.get("name") or payload.get("company") or payload.get("sku")
               or payload.get("subject") or payload.get("invoice_number")
               or payload.get("po_number") or payload.get("so_number")
               or payload.get("order_number") or payload.get("id"))
        matches.append({"id":row.record_key,"collection":row.collection,
                        "module_label":ERP_LABELS[row.collection],"label":str(label),"record":payload})
        if len(matches)>=bounded:
            break
    return {"items":matches,"count":len(matches)}

@app.get("/api/erp/{collection}")
def list_erp_records(
    collection: str,
    q: str = "",
    status_filter: str = "",
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    validate_erp_collection(collection)
    bounded = max(1, min(limit, 500))
    rows = db.scalars(select(BusinessRecord).where(
        BusinessRecord.organization_id == user.organization_id,
        BusinessRecord.collection == collection
    ).order_by(BusinessRecord.updated_at.desc()).limit(1000)).all()
    query = q.strip().lower()
    items = [public_erp_record(row) for row in rows]
    if query:
        items = [item for item in items if query in json.dumps(item, ensure_ascii=False, default=str).lower()]
    if status_filter:
        items = [item for item in items if str(item.get("status","")).lower() == status_filter.strip().lower()]
    return {"items": items[:bounded], "count": len(items), "collection": collection, "limit": bounded}

@app.post("/api/erp/{collection}", status_code=201)
def create_erp_record(
    collection: str,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    validate_erp_collection(collection)
    clean = clean_erp_payload(collection, payload)
    if collection == "products":
        existing_products = db.scalars(select(BusinessRecord).where(
            BusinessRecord.organization_id == user.organization_id,
            BusinessRecord.collection == "products"
        )).all()
        if any(str(row.payload.get("sku", "")).upper() == str(clean.get("sku", "")).upper() for row in existing_products):
            raise HTTPException(409, "A product with this SKU already exists in your organization.")
    now = utcnow()
    key = ERP_PREFIX[collection] + "-" + uuid.uuid4().hex[:10].upper()
    clean["id"] = key
    row = BusinessRecord(
        organization_id=user.organization_id, collection=collection, record_key=key,
        payload=clean, created_at=now, updated_at=now, created_by=user.id, updated_by=user.id
    )
    db.add(row)
    audit(db, user.organization_id, user.id, "erp.record_created", {"collection": collection, "record_key": key})
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "A record with this key already exists.") from exc
    db.refresh(row)
    return {"item": public_erp_record(row)}

@app.put("/api/erp/{collection}/{record_key}")
def update_erp_record(
    collection: str,
    record_key: str,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    validate_erp_collection(collection)
    row = db.scalar(select(BusinessRecord).where(
        BusinessRecord.organization_id == user.organization_id,
        BusinessRecord.collection == collection,
        BusinessRecord.record_key == record_key
    ))
    if row is None:
        raise HTTPException(404, "ERP record not found.")
    clean = clean_erp_payload(collection, payload, record_key=record_key)
    if collection == "products":
        existing_products = db.scalars(select(BusinessRecord).where(
            BusinessRecord.organization_id == user.organization_id,
            BusinessRecord.collection == "products"
        )).all()
        if any(
            product.record_key != record_key
            and str(product.payload.get("sku", "")).upper() == str(clean.get("sku", "")).upper()
            for product in existing_products
        ):
            raise HTTPException(409, "A product with this SKU already exists in your organization.")
    row.payload = clean
    row.updated_at = utcnow()
    row.updated_by = user.id
    db.add(row)
    audit(db, user.organization_id, user.id, "erp.record_updated", {"collection": collection, "record_key": record_key})
    db.commit()
    db.refresh(row)
    return {"item": public_erp_record(row)}

@app.delete("/api/erp/{collection}/{record_key}")
def delete_erp_record(
    collection: str,
    record_key: str,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    validate_erp_collection(collection)
    row = db.scalar(select(BusinessRecord).where(
        BusinessRecord.organization_id == user.organization_id,
        BusinessRecord.collection == collection,
        BusinessRecord.record_key == record_key
    ))
    if row is None:
        raise HTTPException(404, "ERP record not found.")
    db.delete(row)
    audit(db, user.organization_id, user.id, "erp.record_deleted", {"collection": collection, "record_key": record_key})
    db.commit()
    return {"ok": True, "id": record_key, "collection": collection}
