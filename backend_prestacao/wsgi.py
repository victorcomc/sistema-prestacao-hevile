"""
WSGI config for backend_prestacao project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_prestacao.settings')

application = get_wsgi_application()