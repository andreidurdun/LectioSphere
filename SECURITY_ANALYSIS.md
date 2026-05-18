# Analiza Riscurilor de Securitate - LectioSphere

## 1. Privire Generală

Acest document analizează riscurile de securitate identificate în aplicația LectioSphere (backend Django + frontend React Native) și prezintă tactici concrete pentru adresarea lor.

---

## 2. Riscuri Identificate și Tactici de Remediere

### 2.1 Expunerea Secretelor și Credențialelor

#### Riscuri:
- **Clientul secret Google expus în repository** (`client_secret_*.json` vizibil în root)
- Chei API stocate în plaintext
- Credențiale de bază de date în `settings.py`
- Token-uri de acces în localStorage pe frontend

#### Tactici de Adresare:

**Backend (Django):**
```python
# ✓ Folosiți variabile de mediu
from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
    }
}
```

**Acțiuni necesare:**
1. Adăugați `client_secret*.json` în `.gitignore`
2. Creați `.env.example` cu placeholder-uri
3. Instalați `python-decouple`: `pip install python-decouple`
4. Migrați toate secretele în variabile de mediu
5. Regenerați OAuth credențiale Google după ștergerea din repo

**Frontend (React Native):**
```javascript
// ✓ Stocați token-urile în Secure Storage, nu localStorage
import * as SecureStore from 'expo-secure-store';

export const saveToken = async (token) => {
  await SecureStore.setItemAsync('access_token', token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync('access_token');
};
```

---

### 2.2 Autentificare și Autorizare Slabă

#### Riscuri:
- JWT token-uri fără expirare
- Lipsă de implementare a refresh token flow
- Acces la alte profiluri de utilizatori fără validare
- Nicio rate limiting pe endpoint-uri de autentificare

#### Tactici de Adresare:

**Backend (settings.py):**
```python
# ✓ Configurare JWT cu expirare
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '5/minute',
    }
}
```

**Views Protection:**
```python
# ✓ Validare pe endpoint-uri sensibile
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

@permission_classes([IsAuthenticated])
def get_user_profile(request, user_id):
    # Permiteti doar utilizatorului autentificat sa vada propriul profil
    # SAU utilizatorii care au permisiune explicita
    if request.user.id != user_id:
        # Verificati daca e follow public
        if not User.objects.filter(id=user_id, is_public=True).exists():
            return Response({'detail': 'Forbidden'}, status=403)
    
    user = get_object_or_404(User, id=user_id)
    serializer = UserSerializer(user)
    return Response(serializer.data)
```

**Rate Limiting:**
```bash
pip install djangorestframework-throttling django-ratelimit
```

---

### 2.3 SQL Injection și ORM Misuse

#### Riscuri:
- Potențiale query-uri raw nevalidate
- Input validation insuficientă
- Lipsă de parameterized queries

#### Tactici de Adresare:

```python
# ✗ RISCANT - SQL Injection
user = User.objects.raw(f"SELECT * FROM accounts_user WHERE email = '{email}'")

# ✓ SIGUR - Folositi ORM
user = User.objects.filter(email=email).first()

# ✓ SIGUR - Raw queries cu parametri
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT * FROM accounts_user WHERE email = %s", [email])
    user = cursor.fetchone()
```

**Validare Input:**
```python
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True, validators=[
        UniqueValidator(queryset=User.objects.all())
    ])
    
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name']
        extra_kwargs = {
            'username': {'min_length': 3, 'max_length': 150},
            'first_name': {'max_length': 30},
        }
```

---

### 2.4 Cross-Site Request Forgery (CSRF)

#### Riscuri:
- CSRF token validation potențial dezactivată
- Frontend fără verificare CSRF la mutații API

#### Tactici de Adresare:

**Backend (settings.py):**
```python
# ✓ CSRF Middleware activ
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    # ... alte middleware
]

# ✓ CSRF Settings
CSRF_COOKIE_SECURE = True  # Doar HTTPS
CSRF_COOKIE_HTTPONLY = False  # JavaScript trebuie sa citeasca
CSRF_TRUSTED_ORIGINS = ['https://yourdomain.com']
```

**Frontend (React Native):**
```javascript
// ✓ Includeti CSRF token in requesturi
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Adaugati CSRF token din cookies
api.interceptors.request.use((config) => {
  const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
  if (csrftoken) {
    config.headers['X-CSRFToken'] = csrftoken;
  }
  return config;
});
```

---

### 2.5 Data Exposure - Profile Pics și Assets

#### Riscuri:
- Directoare `profile_pics/` și `posts_pics/` accesibile direct
- Nicio validare a tipului de fișier
- Path traversal vulnerabilities
- Fără limite de dimensiune

#### Tactici de Adresare:

**Backend (settings.py):**
```python
import os
from django.conf import settings

# ✓ Upload directory în afara webroot
MEDIA_ROOT = os.path.join(BASE_DIR, 'secure_media')
MEDIA_URL = '/media/'  # Served de django view, nu nginx

# ✓ Validare upload
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
```

**Custom File Upload Validator:**
```python
from django.core.files.uploadedfile import UploadedFile
from django.core.exceptions import ValidationError

def validate_image_file(file):
    import magic
    
    allowed_types = ['image/jpeg', 'image/png', 'image/gif']
    mime = magic.from_buffer(file.read(1024), mime=True)
    file.seek(0)
    
    if mime not in allowed_types:
        raise ValidationError('Invalid image type')
    
    if file.size > 5 * 1024 * 1024:
        raise ValidationError('File too large (max 5MB)')

# In model
class UserProfile(models.Model):
    profile_pic = models.ImageField(
        upload_to='profile_pics/%Y/%m/%d/',
        validators=[validate_image_file],
        null=True
    )
```

**Serving Secure Media:**
```python
# urls.py
from django.views.static import serve
from django.http import FileResponse
from django.core.exceptions import PermissionDenied

def serve_user_media(request, file_path):
    # Verificati permisiunile
    if not request.user.is_authenticated:
        raise PermissionDenied
    
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    
    # Prevent path traversal
    if '..' in file_path or not full_path.startswith(settings.MEDIA_ROOT):
        raise PermissionDenied
    
    return FileResponse(open(full_path, 'rb'))
```

---

### 2.6 Insecure Direct Object References (IDOR)

#### Riscuri:
- Predicțid IDs secvențiali (1, 2, 3...)
- Nicio validare de proprietate înainte de modificare
- Acces la resurse bazat doar pe ID

#### Tactici de Adresare:

```python
# ✗ RISCANT - Oricine poate accesa orice reading sheet
@api_view(['GET'])
def get_reading_sheet(request, sheet_id):
    sheet = ReadingSheet.objects.get(id=sheet_id)
    return Response(ReadingSheetSerializer(sheet).data)

# ✓ SIGUR - Validare de proprietate
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reading_sheet(request, sheet_id):
    try:
        sheet = ReadingSheet.objects.get(id=sheet_id, user=request.user)
    except ReadingSheet.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    
    return Response(ReadingSheetSerializer(sheet).data)

# ✓ SIGUR - Folositi UUIDs în loc de IDs secvențiali
from django.db import models
import uuid

class ReadingSheet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
```

---

### 2.7 Injection Vulnerabilities - Serialization

#### Riscuri:
- Pickle deserialization din untrusted sources
- JSON injection în response-uri
- Template injection potențială

#### Tactici de Adresare:

```python
# ✗ RISCANT - Pickle
import pickle
data = pickle.loads(request.data)  # DANGEROUS!

# ✓ SIGUR - JSON
import json
from django.core.serializers import deserialize
data = json.loads(request.body)

# ✓ SIGUR - Django Serializers
serializer = BookSerializer(data=request.data)
if serializer.is_valid():
    serializer.save()
```

---

### 2.8 Cross-Site Scripting (XSS)

#### Riscuri:
- Output neescaped în components React Native
- Linturi HTML nevalidate în postări
- Comentarii cu HTML/Script injection

#### Tactici de Adresare:

**React Native:**
```javascript
// ✗ RISCANT - Rendering HTML direct
<Text dangerouslySetInnerHTML={{__html: post.content}} />

// ✓ SIGUR - Text plain
<Text>{post.content}</Text>

// ✓ SIGUR - Librarie pentru Markdown
import Markdown from 'react-native-markdown-display';
<Markdown>{post.content}</Markdown>
```

**Backend - Sanitize Output:**
```python
from django.utils.html import escape
from html import escape as html_escape

class Post(models.Model):
    content = models.TextField()
    
    def get_safe_content(self):
        return html_escape(self.content)

# In serializer
class PostSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()
    
    def get_content(self, obj):
        return escape(obj.content)
```

---

### 2.9 Insecure OAuth Implementation

#### Riscuri:
- Client secret expus în frontend
- State parameter nu este validat
- Nicio validare PKCE
- Nicio validare redirect URI

#### Tactici de Adresare:

**Backend - OAuth View (in lugar de frontend):**
```python
# ✓ Backend handles OAuth redirect
from google.auth.transport import requests
from google.oauth2.id_token import verify_oauth2_token

@api_view(['POST'])
def google_auth(request):
    token = request.data.get('id_token')
    
    try:
        idinfo = verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)
        
        # Verify origin
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
        
        user, created = User.objects.get_or_create(
            email=idinfo['email'],
            defaults={'username': idinfo['email'].split('@')[0]}
        )
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    except ValueError:
        return Response({'detail': 'Invalid token'}, status=400)

# settings.py
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET')  # NOT in frontend
```

---

### 2.10 Lipsă de HTTPS Enforcement

#### Riscuri:
- Man-in-the-Middle attacks
- Credențiale interceptate
- Sesiuni compromise

#### Tactici de Adresare:

**Backend (settings.py):**
```python
# ✓ HTTPS Enforcement
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

**Nginx Configuration:**
```nginx
# ✓ Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
}
```

---

### 2.11 Insufficient Logging & Monitoring

#### Riscuri:
- Nicio logare a tentativelor de acces neautorizat
- Nicio alertare la activități suspicioase
- Lipsa auditului de modificări de date

#### Tactici de Adresare:

**Backend - Security Logging:**
```python
import logging
from django.contrib.auth.signals import user_login_failed

security_logger = logging.getLogger('security')

def log_failed_login(sender, credentials, request, **kwargs):
    ip_address = get_client_ip(request)
    security_logger.warning(
        f"Failed login attempt for {credentials.get('username')} from {ip_address}"
    )
    
    # Alert daca prea multe tentative
    attempts = cache.get(f"failed_login_{ip_address}", 0)
    if attempts > 5:
        send_alert_email(f"Multiple failed login attempts from {ip_address}")

user_login_failed.connect(log_failed_login)

# Audit Trail
class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    resource = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    changes = models.JSONField(null=True)

# In views
def log_action(user, action, resource, ip_address, changes=None):
    AuditLog.objects.create(
        user=user,
        action=action,
        resource=resource,
        ip_address=ip_address,
        changes=changes
    )
```

---

### 2.12 Dependency Vulnerabilities

#### Riscuri:
- Packages outdated cu vulnerabilities cunoscute
- Nicio verificare regulată a dependențelor

#### Tactici de Adresare:

**Backend:**
```bash
# Verificati vulnerabilities
pip install safety
safety check

# Update packages
pip install --upgrade pip
pip install -U -r requirements.txt

# Folositi requirements-pin
pip freeze > requirements.lock
```

**Frontend:**
```bash
# Verificati vulnerabilities
npm audit
npm audit fix

# Sau
yarn audit
yarn audit --fix
```

**CI/CD Integration:**
```yaml
# .github/workflows/security.yml
name: Security Checks
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run safety check
        run: |
          pip install safety
          safety check
      - name: npm audit
        run: npm audit --audit-level=moderate
```

---

## 3. Checklist de Implementare

- [ ] Mutați `client_secret*.json` în env vars
- [ ] Implementați JWT cu expirare
- [ ] Adăugați rate limiting
- [ ] Implementați Refresh Token flow
- [ ] Validări pe CRUD operations
- [ ] Secure image upload
- [ ] Adăugați HTTPS enforcement
- [ ] Implementați security logging
- [ ] Setup monitoring & alerts
- [ ] Regular dependency audits
- [ ] Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] CORS Configuration strict
- [ ] Database encryption at rest
- [ ] Backup strategy
- [ ] Incident response plan

---

## 4. Security Headers Minime Necesare

```python
# settings.py
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_SECURITY_POLICY = {
    "default-src": ("'self'",),
    "script-src": ("'self'", "'unsafe-inline'"),
    "style-src": ("'self'", "'unsafe-inline'"),
    "img-src": ("'self'", "data:", "https:"),
}
```

---

## 5. Resurse Suplimentare

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [React Native Security Best Practices](https://reactnative.dev/docs/security)
- [API Security Checklist](https://github.com/shieldfy/API-Security-Checklist)

---

**Actualizare: 31 Ianuarie 2026**
