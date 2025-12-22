# Scripts de Desarrollo Local

Scripts para facilitar el desarrollo y pruebas locales, especialmente para probar desde dispositivos móviles sin necesidad de desplegar.

## 🚀 Inicio Rápido

### 1. Configuración Inicial (solo la primera vez)

```bash
./scripts/setup-dev.sh
```

Este script:
- Crea archivos `.env.local` con configuraciones de desarrollo
- Instala dependencias de Python y Node.js
- Ejecuta migraciones de base de datos

### 2. Iniciar Servidores de Desarrollo

```bash
./scripts/dev-local.sh
```

Este script:
- Inicia el backend Django en `http://0.0.0.0:8000`
- Inicia el frontend Vite en `http://0.0.0.0:5173`
- Si tienes ngrok instalado, expone el frontend públicamente
- Muestra la IP local para acceso desde la misma red WiFi

## 📱 Acceso desde Móvil

Tienes dos opciones:

### Opción 1: Misma Red WiFi (más rápido)

1. Asegúrate de que tu móvil y tu ordenador están en la misma red WiFi
2. El script mostrará tu IP local (ej: `192.168.1.100`)
3. Accede desde el móvil a: `http://TU_IP_LOCAL:5173`
4. **Importante**: Edita `frontend/.env.local` y cambia:
   ```
   VITE_API_BASE_URL=http://TU_IP_LOCAL:8000/api/
   ```

### Opción 2: Ngrok (acceso público, funciona desde cualquier red)

1. Instala ngrok: https://ngrok.com/
2. Configura tu token: `ngrok config add-authtoken YOUR_TOKEN`
3. El script detectará ngrok automáticamente y mostrará una URL pública
4. Accede desde el móvil a esa URL
5. **Importante**: Edita `backend/.env.local` y agrega la URL de ngrok a:
   ```
   CORS_ALLOWED_ORIGINS=http://localhost:5173,https://TU_URL_NGROK
   CSRF_TRUSTED_ORIGINS=http://localhost:5173,https://TU_URL_NGROK
   ```

## ⚙️ Configuración

### Backend (.env.local)

Edita `backend/.env.local` para configurar:

- `CORS_ALLOWED_ORIGINS`: Agrega las URLs desde las que accederás (IP local o ngrok)
- `CSRF_TRUSTED_ORIGINS`: Mismas URLs que CORS_ALLOWED_ORIGINS
- `DATABASE_URL`: Usa SQLite para desarrollo rápido o PostgreSQL
- `DEBUG=True`: Siempre True en desarrollo local

### Frontend (.env.local)

Edita `frontend/.env.local` para configurar:

- `VITE_API_BASE_URL`: URL del backend (IP local o ngrok)

## 🔍 Ver Logs

Mientras los servidores están corriendo, puedes ver los logs en:

```bash
# Backend
tail -f /tmp/django-dev.log

# Frontend
tail -f /tmp/vite-dev.log

# Ngrok (si está activo)
tail -f /tmp/ngrok-frontend.log
```

## 🛠️ Solución de Problemas

### Las cookies no funcionan en móvil

1. Asegúrate de usar HTTPS con ngrok (ngrok proporciona HTTPS automáticamente)
2. O configura `SESSION_COOKIE_SECURE=False` en desarrollo local (solo para desarrollo)
3. Verifica que `CORS_ALLOWED_ORIGINS` incluya la URL desde la que accedes

### No puedo acceder desde el móvil

1. Verifica que el firewall permita conexiones en los puertos 8000 y 5173
2. Asegúrate de estar en la misma red WiFi (si usas IP local)
3. Verifica que la IP mostrada sea correcta

### Ngrok no funciona

1. Verifica que ngrok esté instalado: `ngrok version`
2. Verifica que tengas un token configurado: `ngrok config check`
3. Revisa los logs: `tail -f /tmp/ngrok-frontend.log`

## 📝 Notas

- Los archivos `.env.local` están en `.gitignore` y no se subirán al repositorio
- En desarrollo local, puedes usar SQLite para no necesitar PostgreSQL
- Los cambios en el código se reflejan automáticamente (hot reload)
- Para detener los servidores, presiona `Ctrl+C`
