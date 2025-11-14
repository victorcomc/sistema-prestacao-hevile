"""
Django settings for backend_prestacao project.
"""

from pathlib import Path
import os
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', default='django-insecure-fallback-key-para-dev')

DEBUG = 'RENDER' not in os.environ

ALLOWED_HOSTS = []

RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic', 
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'core',
    'storages',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'backend_prestacao.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend_prestacao.wsgi.application'

DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )
}
if 'RENDER' not in os.environ:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173', 
]
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
]

if RENDER_EXTERNAL_HOSTNAME:
    CORS_ALLOWED_ORIGINS.append(f"https{RENDER_EXTERNAL_HOSTNAME}")
    CSRF_TRUSTED_ORIGINS.append(f"https{RENDER_EXTERNAL_HOSTNAME}")

NETLIFY_URL = os.environ.get('NETLIFY_URL')
if NETLIFY_URL:
    CORS_ALLOWED_ORIGINS.append(NETLIFY_URL)
    CSRF_TRUSTED_ORIGINS.append(NETLIFY_URL)

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication', 
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated', 
    ]
}

# --- INÍCIO DA CORREÇÃO (ARMAZENAMENTO DE MÍDIA - SUPABASE S3) ---

# 1. Pega as variáveis de ambiente que você configurou no Render
SUPABASE_PROJECT_ID = os.environ.get('SUPABASE_PROJECT_ID')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

# 2. Define as chaves de acesso para o S3
#    Para o Supabase, a "Access Key" e a "Secret Key" são a MESMA COISA.
AWS_ACCESS_KEY_ID = SUPABASE_SERVICE_KEY
AWS_SECRET_ACCESS_KEY = SUPABASE_SERVICE_KEY

# 3. Define as URLs do Supabase
AWS_STORAGE_BUCKET_NAME = 'uploads'
AWS_S3_ENDPOINT_URL = f'https://{SUPABASE_PROJECT_ID}.supabase.co/storage/v1'
AWS_S3_CUSTOM_DOMAIN = f'{SUPABASE_PROJECT_ID}.supabase.co' # Adicionado

# 4. Define a URL PÚBLICA dos seus arquivos (para o frontend ler)
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/storage/v1/object/public/{AWS_STORAGE_BUCKET_NAME}/'

# 5. Define as configurações do django-storages
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "endpoint_url": AWS_S3_ENDPOINT_URL,
            "aws_access_key_id": AWS_ACCESS_KEY_ID,
            "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
            "bucket_name": AWS_STORAGE_BUCKET_NAME,
            "file_overwrite": False, # Não sobrescrever arquivos com mesmo nome
        },
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
# --- FIM DA CORREÇÃO ---