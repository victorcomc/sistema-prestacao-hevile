"""
Django settings for backend_prestacao project.
"""

from pathlib import Path
import os
import dj_database_url # <<< 1. IMPORTADO

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# --- INÍCIO DAS MUDANÇAS (Produção) ---

# SECURITY WARNING: keep the secret key used in production secret!
# Vamos ler a chave do ambiente que o Render vai fornecer.
SECRET_KEY = os.environ.get('SECRET_KEY', default='django-insecure-fallback-key-para-dev')

# SECURITY WARNING: don't run with debug turned on in production!
# O Render vai definir a variável 'RENDER' automaticamente.
# Se 'RENDER' existir, DEBUG = False.
DEBUG = 'RENDER' not in os.environ

ALLOWED_HOSTS = []

# Adiciona o host do Render à lista de hosts permitidos
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# --- FIM DAS MUDANÇAS ---


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    # --- INÍCIO DA MUDANÇA (Whitenoise) ---
    'whitenoise.runserver_nostatic', # Adicionado para servir estáticos
    # --- FIM DA MUDANÇA ---
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # --- INÍCIO DA MUDANÇA (Whitenoise) ---
    'whitenoise.middleware.WhiteNoiseMiddleware', # Adicionado
    # --- FIM DA MUDANÇA ---
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # Movido para cima
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware', # (Corretamente comentado)
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


# --- INÍCIO DAS MUDANÇAS (Banco de Dados Supabase) ---
# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': dj_database_url.config(
        # Você vai colar sua URL do Supabase em uma variável de ambiente no Render
        # chamada 'DATABASE_URL'
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )
}
# Se estivermos em desenvolvimento local (sem RENDER), ainda usamos o SQLite
if 'RENDER' not in os.environ:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
# --- FIM DAS MUDANÇAS ---


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
# --- INÍCIO DA MUDANÇA (Produção) ---
# Onde o 'collectstatic' vai colocar todos os arquivos estáticos
STATIC_ROOT = BASE_DIR / 'staticfiles'
# Armazenamento de estáticos do Whitenoise
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
# --- FIM DA MUDANÇA ---

# Mídia (Uploads de Usuário)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- INÍCIO DAS MUDANÇAS (CORS) ---
# Substitua 'https://SEU_SITE_NETLIFY.netlify.app' pela URL real
# que o Netlify lhe dará na Fase 3.
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173', # Para seu desenvolvimento local
    'https://SEU_SITE_NETLIFY.netlify.app', # Para produção
]
# Se você quiser ser menos restrito (mas ainda seguro):
# CORS_ALLOWED_ORIGIN_REGEXES = [
#     r"^https://.*\.netlify\.app$",
# ]
# --- FIM DAS MUDANÇAS ---

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication', 
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated', 
    ]
}