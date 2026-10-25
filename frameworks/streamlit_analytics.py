import os,requests,streamlit as st,pandas as pd,numpy as np,matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
API=os.environ.get("AVERIS_API_URL","http://127.0.0.1:8000/api").rstrip("/")
st.set_page_config(page_title="AVERIS ERP Analytics",page_icon="◎",layout="wide");st.title("AVERIS ERP Analytics")
st.caption("Streamlit + Pandas + NumPy + Matplotlib + scikit-learn · synthetic data only")
if "api_session" not in st.session_state: st.session_state.api_session=requests.Session()
s=st.session_state.api_session
with st.sidebar:
 st.code(API)
 with st.form("login"):
  email=st.text_input("Email");password=st.text_input("Password",type="password");submitted=st.form_submit_button("Connect")
 if submitted:
  try:
   r=s.post(API+"/auth/login",json={"email":email,"password":password},timeout=10)
   if r.ok: st.session_state.erp_user=r.json()["user"];st.success("Connected")
   else: st.error(r.json().get("detail","Login failed"))
  except requests.RequestException as e: st.error(str(e))
if not st.session_state.get("erp_user"): st.info("Sign in with an account from the main website.");st.stop()
try:
 summary=s.get(API+"/erp/summary",timeout=10);summary.raise_for_status();summary=summary.json()
 p=s.get(API+"/erp/products?limit=500",timeout=10);p.raise_for_status();products=p.json().get("items",[])
 o=s.get(API+"/erp/sales_orders?limit=500",timeout=10);o.raise_for_status();orders=o.json().get("items",[])
except requests.RequestException as e: st.error(f"API error: {e}");st.stop()
c=st.columns(4);c[0].metric("Products",summary["counts"].get("products",0));c[1].metric("Reorder alerts",summary["low_stock"]);c[2].metric("Receivables",f'₹{summary["outstanding_receivables"]:,.0f}');c[3].metric("Payables",f'₹{summary["outstanding_payables"]:,.0f}')
frame=pd.DataFrame(products);st.subheader("Inventory");st.dataframe(frame,use_container_width=True,hide_index=True)
if not frame.empty and "sku" in frame and "quantity" in frame: st.bar_chart(frame.set_index("sku")["quantity"])
sales=pd.DataFrame(orders);st.subheader("Illustrative sales trend")
if "total" in sales and len(sales)>=2:
 totals=pd.to_numeric(sales.total,errors="coerce").fillna(0).to_numpy(dtype=float);x=np.arange(len(totals)).reshape(-1,1);model=LinearRegression().fit(x,totals)
 future=model.predict(np.arange(len(totals),len(totals)+3).reshape(-1,1));fig,ax=plt.subplots(figsize=(9,3));ax.plot(totals,marker="o");ax.plot(np.arange(len(totals),len(totals)+3),future,marker="x",linestyle="--");ax.grid(alpha=.2);st.pyplot(fig);plt.close(fig)
 st.caption("Index-based illustration only, not a financial forecast.")
with st.expander("Inventory reorder priorities"): st.json(summary.get("reorder_alerts",[]))
