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
    'storages', # <<< 1. ADICIONADO
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

# Bloco original para colar de volta
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

# --- Arquivos Estáticos (CSS do Admin) ---
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# --- Arquivos de Mídia (Uploads de Usuário) ---
# (MEDIA_ROOT foi REMOVIDO)

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173', 
]
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
]

if RENDER_EXTERNAL_HOSTNAME:
    CORS_ALLOWED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")

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

# --- INÍCIO DA MUDANÇA (ARMAZENAMENTO DE MÍDIA - SUPABASE S3) ---

# 1. Configurações de chaves (lidas do Render)
AWS_ACCESS_KEY_ID = os.environ.get('SUPABASE_PROJECT_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

# 2. Configurações do Bucket
AWS_STORAGE_BUCKET_NAME = 'uploads' # O nome do bucket que você criou
AWS_S3_CUSTOM_DOMAIN = f'{AWS_ACCESS_KEY_ID}.supabase.co' # O host do seu Supabase
AWS_S3_ENDPOINT_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/storage/v1'

# 3. Configuração do Django Storages
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "endpoint_url": AWS_S3_ENDPOINT_URL,
            "access_key": AWS_ACCESS_KEY_ID,
            "secret_key": AWS_SECRET_ACCESS_KEY,
            "bucket_name": AWS_STORAGE_BUCKET_NAME,
        },
    },
    "staticfiles": { # (Mantemos o whitenoise para os estáticos)
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# 4. URL de Mídia (para onde as imagens vão apontar)
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/storage/v1/object/public/{AWS_STORAGE_BUCKET_NAME}/'
# --- FIM DA MUDANÇA ---