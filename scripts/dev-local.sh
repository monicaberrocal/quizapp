#!/bin/bash

# Script para desarrollo local con acceso desde móvil
# Requiere: ngrok (https://ngrok.com/) o usar la IP local

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando entorno de desarrollo local${NC}"

# Verificar que estamos en el directorio raíz
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

# Cargar variables de entorno locales si existen
if [ -f "backend/.env.local" ]; then
    export $(cat backend/.env.local | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ Cargado backend/.env.local${NC}"
fi

if [ -f "frontend/.env.local" ]; then
    export $(cat frontend/.env.local | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ Cargado frontend/.env.local${NC}"
fi

# Función para obtener la IP local
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ipconfig getifaddr en0 || ipconfig getifaddr en1
    else
        # Linux
        hostname -I | awk '{print $1}' || ip route get 8.8.8.8 | awk '{print $7}' | head -1
    fi
}

LOCAL_IP=$(get_local_ip)
BACKEND_PORT=8000
FRONTEND_PORT=5173

echo -e "${GREEN}📱 Tu IP local es: ${LOCAL_IP}${NC}"
echo -e "${GREEN}🔧 Backend en: http://${LOCAL_IP}:${BACKEND_PORT}${NC}"
echo -e "${GREEN}🌐 Frontend en: http://${LOCAL_IP}:${FRONTEND_PORT}${NC}"
echo ""

# Verificar si ngrok está instalado
if command -v ngrok &> /dev/null; then
    echo -e "${BLUE}💡 Usando ngrok para acceso público${NC}"
    echo -e "${YELLOW}⚠️  Asegúrate de tener ngrok configurado con tu token${NC}"
    echo ""
    
    # Iniciar ngrok para el frontend en segundo plano
    echo -e "${BLUE}🌐 Iniciando ngrok para frontend (puerto ${FRONTEND_PORT})...${NC}"
    ngrok http $FRONTEND_PORT > /tmp/ngrok-frontend.log 2>&1 &
    NGROK_PID=$!
    sleep 3
    
    # Obtener la URL pública de ngrok
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$NGROK_URL" ]; then
        echo -e "${GREEN}✅ Ngrok iniciado: ${NGROK_URL}${NC}"
        echo -e "${YELLOW}📱 Accede desde tu móvil a: ${NGROK_URL}${NC}"
    else
        echo -e "${YELLOW}⚠️  No se pudo obtener la URL de ngrok. Usa la IP local: http://${LOCAL_IP}:${FRONTEND_PORT}${NC}"
    fi
else
    echo -e "${YELLOW}💡 ngrok no está instalado. Instálalo desde: https://ngrok.com/${NC}"
    echo -e "${YELLOW}   O usa la IP local en la misma red WiFi: http://${LOCAL_IP}:${FRONTEND_PORT}${NC}"
    echo ""
fi

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo -e "${BLUE}🧹 Limpiando procesos...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill $NGROK_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar backend
echo -e "${BLUE}🔧 Iniciando backend Django...${NC}"
cd backend

# Activar entorno virtual si existe
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Usar .env.local si existe, sino .env
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

python manage.py runserver 0.0.0.0:$BACKEND_PORT > /tmp/django-dev.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar a que el backend esté listo
sleep 2

# Iniciar frontend
echo -e "${BLUE}⚛️  Iniciando frontend React...${NC}"
cd frontend
npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT > /tmp/vite-dev.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ Servidores iniciados${NC}"
echo -e "${GREEN}📝 Logs del backend: tail -f /tmp/django-dev.log${NC}"
echo -e "${GREEN}📝 Logs del frontend: tail -f /tmp/vite-dev.log${NC}"
if [ -n "$NGROK_PID" ]; then
    echo -e "${GREEN}📝 Logs de ngrok: tail -f /tmp/ngrok-frontend.log${NC}"
fi
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"

# Esperar a que los procesos terminen
wait
