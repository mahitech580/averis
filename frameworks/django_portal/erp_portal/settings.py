import os
from pathlib import Path
BASE_DIR=Path(__file__).resolve().parent
SECRET_KEY=os.environ.get("DJANGO_SECRET_KEY","local-only-change-before-sharing")
DEBUG=os.environ.get("DJANGO_DEBUG","false").lower()=="true"
ALLOWED_HOSTS=["localhost","127.0.0.1"]
ROOT_URLCONF="erp_portal.urls"
INSTALLED_APPS=["django.contrib.contenttypes","django.contrib.sessions","django.contrib.messages","erp_portal"]
MIDDLEWARE=["django.middleware.security.SecurityMiddleware","django.contrib.sessions.middleware.SessionMiddleware","django.middleware.common.CommonMiddleware","django.middleware.csrf.CsrfViewMiddleware","django.contrib.messages.middleware.MessageMiddleware","django.middleware.clickjacking.XFrameOptionsMiddleware"]
TEMPLATES=[{"BACKEND":"django.template.backends.django.DjangoTemplates","DIRS":[BASE_DIR/"templates"],"APP_DIRS":True,"OPTIONS":{"context_processors":["django.template.context_processors.request","django.contrib.messages.context_processors.messages"]}}]
WSGI_APPLICATION="erp_portal.wsgi.application"
DATABASES={"default":{"ENGINE":"django.db.backends.sqlite3","NAME":BASE_DIR/"portal.sqlite3"}}
SESSION_ENGINE="django.contrib.sessions.backends.signed_cookies"
DEFAULT_AUTO_FIELD="django.db.models.BigAutoField"
LANGUAGE_CODE="en-us";TIME_ZONE="UTC";USE_I18N=True;USE_TZ=True
