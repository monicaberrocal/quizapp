#!/bin/bash

# Script de configuración inicial para desarrollo local

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 Configurando entorno de desarrollo local${NC}"

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}❌ Python 3 no está instalado${NC}"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js no está instalado${NC}"
    exit 1
fi

# Crear archivo .env de desarrollo si no existe
if [ ! -f "backend/.env.local" ]; then
    echo -e "${BLUE}📝 Creando backend/.env.local...${NC}"
    cat > backend/.env.local << 'EOF'
# Configuración de desarrollo local
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# CORS - Agrega tu IP local o usa ngrok URL
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# CSRF - Agrega tu IP local o usa ngrok URL
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Base de datos - Usa SQLite para desarrollo local o configura PostgreSQL
DATABASE_URL=sqlite:///db.sqlite3

# Redis - Opcional para desarrollo local
REDIS_URL=redis://localhost:6379/0

# Email - Configuración de desarrollo (usa console backend)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password

# OpenAI - Agrega tu clave si la necesitas
OPENAI_API_KEY=your-openai-key
EOF
    echo -e "${GREEN}✅ Creado backend/.env.local${NC}"
    echo -e "${YELLOW}⚠️  Edita backend/.env.local con tus configuraciones${NC}"
fi

# Crear archivo .env para frontend si no existe
if [ ! -f "frontend/.env.local" ]; then
    echo -e "${BLUE}📝 Creando frontend/.env.local...${NC}"
    cat > frontend/.env.local << 'EOF'
# API Base URL para desarrollo local
VITE_API_BASE_URL=http://localhost:8000/api/
EOF
    echo -e "${GREEN}✅ Creado frontend/.env.local${NC}"
fi

# Instalar dependencias del backend
if [ ! -d "backend/venv" ]; then
    echo -e "${BLUE}🐍 Creando entorno virtual de Python...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✅ Dependencias de Python instaladas${NC}"
else
    echo -e "${GREEN}✅ Entorno virtual ya existe${NC}"
fi

# Instalar dependencias del frontend
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependencias de Node.js...${NC}"
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✅ Dependencias de Node.js instaladas${NC}"
else
    echo -e "${GREEN}✅ Dependencias de Node.js ya instaladas${NC}"
fi

# Migraciones de base de datos
echo -e "${BLUE}🗄️  Ejecutando migraciones...${NC}"
cd backend
source venv/bin/activate
python manage.py migrate
cd ..

echo ""
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo -e "${BLUE}📋 Próximos pasos:${NC}"
echo -e "1. Edita backend/.env.local con tus configuraciones"
echo -e "2. Edita frontend/.env.local si necesitas cambiar la URL del API"
echo -e "3. Ejecuta: ./scripts/dev-local.sh"
echo ""
echo -e "${YELLOW}💡 Para usar ngrok (acceso público desde móvil):${NC}"
echo -e "   - Instala ngrok: https://ngrok.com/"
echo -e "   - Configura tu token: ngrok config add-authtoken YOUR_TOKEN"
echo ""
