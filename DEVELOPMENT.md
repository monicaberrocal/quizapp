# 🚀 Guía de Desarrollo Local

Esta guía te ayudará a configurar un entorno de desarrollo local para probar cambios rápidamente sin necesidad de desplegar a staging o producción.

## 📋 Requisitos Previos

- Python 3.8+
- Node.js 16+
- npm o yarn
- (Opcional) ngrok para acceso público desde móvil

## 🎯 Inicio Rápido

### 1. Configuración Inicial (solo la primera vez)

```bash
./scripts/setup-dev.sh
```

Este script configura todo automáticamente:
- Crea archivos `.env.local` con configuraciones de desarrollo
- Instala dependencias de Python y Node.js
- Ejecuta migraciones de base de datos

### 2. Iniciar Servidores

```bash
./scripts/dev-local.sh
```

Esto iniciará:
- Backend Django en `http://0.0.0.0:8000`
- Frontend React en `http://0.0.0.0:5173`
- (Opcional) ngrok si está instalado

## 📱 Acceso desde Móvil

### Opción 1: Misma Red WiFi (Recomendado para desarrollo rápido)

1. El script mostrará tu IP local (ej: `192.168.1.100`)
2. Edita `frontend/.env.local` y configura:
   ```env
   VITE_API_BASE_URL=http://TU_IP_LOCAL:8000/api/
   ```
3. Accede desde el móvil a: `http://TU_IP_LOCAL:5173`
4. Edita `backend/.env.local` y agrega tu IP a:
   ```env
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://TU_IP_LOCAL:5173
   CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://TU_IP_LOCAL:5173
   ```

### Opción 2: Ngrok (Para acceso desde cualquier red)

1. Instala ngrok: https://ngrok.com/
2. Configura tu token: `ngrok config add-authtoken YOUR_TOKEN`
3. El script detectará ngrok automáticamente
4. Copia la URL pública que muestra ngrok
5. Edita `backend/.env.local`:
   ```env
   CORS_ALLOWED_ORIGINS=http://localhost:5173,https://TU_URL_NGROK
   CSRF_TRUSTED_ORIGINS=http://localhost:5173,https://TU_URL_NGROK
   ```
6. Edita `frontend/.env.local`:
   ```env
   VITE_API_BASE_URL=https://TU_URL_NGROK_BACKEND/api/
   ```
   (Nota: Necesitarás un segundo túnel ngrok para el backend en el puerto 8000)

## ⚙️ Configuración Detallada

### Backend (`backend/.env.local`)

```env
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,TU_IP_LOCAL

# CORS - Agrega todas las URLs desde las que accederás
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://TU_IP_LOCAL:5173

# CSRF - Mismas URLs que CORS
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://TU_IP_LOCAL:5173

# Base de datos - SQLite para desarrollo rápido
DATABASE_URL=sqlite:///db.sqlite3

# Redis - Opcional, puedes usar una instancia local
REDIS_URL=redis://localhost:6379/0

# Email - Console backend para desarrollo
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# OpenAI - Solo si necesitas generar preguntas
OPENAI_API_KEY=your-key-here
```

### Frontend (`frontend/.env.local`)

```env
# URL del backend - Cambia según tu configuración
VITE_API_BASE_URL=http://localhost:8000/api/
# O si usas IP local:
# VITE_API_BASE_URL=http://TU_IP_LOCAL:8000/api/
# O si usas ngrok:
# VITE_API_BASE_URL=https://TU_URL_NGROK/api/
```

## 🛠️ Scripts Disponibles

### `scripts/setup-dev.sh`
Configuración inicial del entorno de desarrollo.

### `scripts/dev-local.sh`
Inicia backend y frontend con acceso desde la red local o ngrok.

### `scripts/quick-test.sh`
Menú interactivo para pruebas rápidas:
- Solo backend
- Solo frontend
- Ambos
- Ejecutar tests
- Verificar sintaxis

## 🔍 Ver Logs

Mientras los servidores están corriendo:

```bash
# Backend Django
tail -f /tmp/django-dev.log

# Frontend Vite
tail -f /tmp/vite-dev.log

# Ngrok (si está activo)
tail -f /tmp/ngrok-frontend.log
```

## 🐛 Solución de Problemas

### Las cookies no funcionan en móvil

**Problema**: El 403 persiste incluso después de hacer login.

**Solución**:
1. Si usas IP local (HTTP), configura en `backend/.env.local`:
   ```env
   SESSION_COOKIE_SECURE=False  # Solo para desarrollo local
   CSRF_COOKIE_SECURE=False      # Solo para desarrollo local
   ```
2. Si usas ngrok (HTTPS), asegúrate de que las cookies tengan `Secure=True` (ya configurado en el código)

### No puedo acceder desde el móvil

**Problema**: El móvil no puede conectarse al servidor.

**Soluciones**:
1. Verifica que ambos dispositivos estén en la misma red WiFi
2. Verifica el firewall de tu ordenador (permite puertos 8000 y 5173)
3. Usa ngrok para acceso público
4. Verifica que la IP mostrada sea correcta

### CORS errors

**Problema**: Errores de CORS en la consola del navegador.

**Solución**:
1. Asegúrate de agregar la URL exacta a `CORS_ALLOWED_ORIGINS` en `backend/.env.local`
2. Incluye el protocolo (`http://` o `https://`)
3. Incluye el puerto si es necesario
4. Reinicia el servidor backend después de cambiar `.env.local`

### Ngrok no funciona

**Problema**: Ngrok no inicia o no muestra URL.

**Soluciones**:
1. Verifica instalación: `ngrok version`
2. Verifica token: `ngrok config check`
3. Revisa logs: `tail -f /tmp/ngrok-frontend.log`
4. Verifica que el puerto 4040 esté libre (ngrok dashboard)

## 💡 Tips

- Los archivos `.env.local` están en `.gitignore` y no se subirán al repositorio
- Puedes usar SQLite en desarrollo para no necesitar PostgreSQL
- Los cambios en el código se reflejan automáticamente (hot reload)
- Para detener los servidores, presiona `Ctrl+C`
- Si cambias `.env.local`, reinicia los servidores

## 📚 Recursos Adicionales

- [Documentación de Django](https://docs.djangoproject.com/)
- [Documentación de Vite](https://vitejs.dev/)
- [Documentación de ngrok](https://ngrok.com/docs)
- [Guía de CORS en Django](https://pypi.org/project/django-cors-headers/)
