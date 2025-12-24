import json
import time
import logging
from django.contrib.sessions.models import Session
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import BaseBackend

logger = logging.getLogger(__name__)
User = get_user_model()


class TokenAuthBackend(BaseBackend):
    """
    🔹 PARCHÉ TEMPORAL: Backend de autenticación por token
    """
    
    def authenticate(self, request, token=None):
        if not token:
            return None
        try:
            session = Session.objects.get(session_key=token)
            session_data = session.get_decoded()
            user_id = session_data.get('_auth_user_id')
            if user_id:
                return User.objects.get(pk=user_id)
        except (Session.DoesNotExist, User.DoesNotExist, KeyError):
            pass
        return None


class TokenAuthMiddleware:
    """
    🔹 PARCHÉ TEMPORAL: Middleware para autenticación por token en header
    Soluciona problema de cookies cross-domain en iOS móvil
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.backend = TokenAuthBackend()
    
    def __call__(self, request):
        # 🔹 Si hay token en header, intentar autenticar
        auth_token = request.META.get("HTTP_X_AUTH_TOKEN")
        if auth_token:
            try:
                # Usar el backend para autenticar
                user = self.backend.authenticate(request, token=auth_token)
                if user:
                    # Establecer el usuario en la request
                    request.user = user
                    logger.info(f"[TOKEN_AUTH] Usuario autenticado por token: {user.username}")
                else:
                    logger.warning(f"[TOKEN_AUTH] Token inválido: {auth_token[:20]}...")
            except Exception as e:
                logger.error(f"[TOKEN_AUTH] Error al autenticar: {str(e)}")
        
        response = self.get_response(request)
        return response


class DebugAccessLogMiddleware:
    """
    Middleware de instrumentación temporal para rastrear peticiones a asignaturas
    y confirmar si llega la cookie de sesión/CSRF en móviles.
    Escribe a stdout para que Railway capture los logs.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        is_target = request.path.startswith("/api/asignaturas")

        if is_target:
            # region agent log
            try:
                payload = {
                    "sessionId": "debug-session",
                    "runId": "pre-fix",
                    "hypothesisId": "H1",
                    "location": "quiz/middleware.py:__call__",
                    "message": "entrada peticion asignaturas",
                    "data": {
                        "path": request.path,
                        "method": request.method,
                        "user_is_authenticated": getattr(request, "user", None).is_authenticated if getattr(request, "user", None) else None,
                        "session_key": getattr(getattr(request, "session", None), "session_key", None),
                        "has_auth_token": "HTTP_X_AUTH_TOKEN" in request.META,
                        "origin": request.META.get("HTTP_ORIGIN"),
                        "referer": request.META.get("HTTP_REFERER"),
                        "user_agent": request.META.get("HTTP_USER_AGENT"),
                        "host": request.META.get("HTTP_HOST"),
                    },
                    "timestamp": int(time.time() * 1000),
                }
                logger.debug(f"[ASIGNATURAS] Entrada: {json.dumps(payload, indent=2)}")
            except Exception:
                pass
            # endregion

        response = self.get_response(request)

        if is_target:
            # region agent log
            try:
                payload = {
                    "sessionId": "debug-session",
                    "runId": "pre-fix",
                    "hypothesisId": "H2",
                    "location": "quiz/middleware.py:__call__",
                    "message": "salida peticion asignaturas",
                    "data": {
                        "status_code": getattr(response, "status_code", None),
                        "user_is_authenticated": getattr(request, "user", None).is_authenticated if getattr(request, "user", None) else None,
                        "session_key": getattr(getattr(request, "session", None), "session_key", None),
                        "has_auth_token": "HTTP_X_AUTH_TOKEN" in request.META,
                        "content_snippet": response.content[:200].decode(errors="ignore") if hasattr(response, "content") else None,
                    },
                    "timestamp": int(time.time() * 1000),
                }
                logger.debug(f"[ASIGNATURAS] Salida: {json.dumps(payload, indent=2)}")
            except Exception:
                pass
            # endregion

        return response

