#!/bin/bash

# Script rápido para probar cambios sin levantar servidores completos
# Útil para pruebas rápidas de API o lógica

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🧪 Modo de prueba rápida${NC}"
echo ""

# Opciones disponibles
echo -e "${GREEN}Opciones disponibles:${NC}"
echo "1. Solo backend (puerto 8000)"
echo "2. Solo frontend (puerto 5173)"
echo "3. Backend + Frontend"
echo "4. Ejecutar tests del backend"
echo "5. Verificar sintaxis de código"
echo ""
read -p "Selecciona una opción (1-5): " option

case $option in
    1)
        echo -e "${BLUE}🔧 Iniciando solo backend...${NC}"
        cd backend
        if [ -d "venv" ]; then
            source venv/bin/activate
        fi
        if [ -f ".env.local" ]; then
            export $(cat .env.local | grep -v '^#' | xargs)
        fi
        python manage.py runserver 0.0.0.0:8000
        ;;
    2)
        echo -e "${BLUE}⚛️  Iniciando solo frontend...${NC}"
        cd frontend
        if [ -f ".env.local" ]; then
            export $(cat .env.local | grep -v '^#' | xargs)
        fi
        npm run dev -- --host 0.0.0.0
        ;;
    3)
        echo -e "${BLUE}🚀 Iniciando backend y frontend...${NC}"
        ./scripts/dev-local.sh
        ;;
    4)
        echo -e "${BLUE}🧪 Ejecutando tests...${NC}"
        cd backend
        if [ -d "venv" ]; then
            source venv/bin/activate
        fi
        python manage.py test
        ;;
    5)
        echo -e "${BLUE}🔍 Verificando sintaxis...${NC}"
        echo "Backend (Python)..."
        cd backend
        python -m py_compile **/*.py 2>&1 | head -20 || echo "✅ Sin errores de sintaxis"
        cd ..
        echo ""
        echo "Frontend (ESLint)..."
        cd frontend
        npm run lint 2>&1 | head -20 || echo "✅ Sin errores de lint"
        cd ..
        ;;
    *)
        echo -e "${YELLOW}Opción inválida${NC}"
        exit 1
        ;;
esac
