.PHONY: back front

back:
	@echo "Iniciando servidor Django..."
	@bash -c "source backend/venv/bin/activate && python3 backend/manage.py runserver"

front:
	@echo "Iniciando servidor de desarrollo frontend..."
	@bash -c "cd frontend && npm run dev"

celery:
	@echo "Iniciando servidor de celery"
	@bash -c "cd backend && celery -A testapp worker --loglevel=info"