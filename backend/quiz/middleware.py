import json
import time
import logging
from django.contrib.sessions.models import Session
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class TokenAuthMiddleware:
    """
    🔹 PARCHÉ TEMPORAL: Middleware para autenticación por token en header
    Soluciona problema de cookies cross-domain en iOS móvil
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # 🔹 Si no está autenticado pero hay token en header, intentar autenticar
        if not request.user.is_authenticated:
            auth_token = request.META.get("HTTP_X_AUTH_TOKEN")
            if auth_token:
                try:
                    # El token es el session_key, cargar la sesión
                    session = Session.objects.get(session_key=auth_token)
                    session_data = session.get_decoded()
                    user_id = session_data.get('_auth_user_id')
                    if user_id:
                        user = User.objects.get(pk=user_id)
                        request.user = user
                        # También establecer la sesión en la request
                        request.session = session
                        logger.info(f"[TOKEN_AUTH] Usuario autenticado por token: {user.username}")
                except (Session.DoesNotExist, User.DoesNotExist, KeyError):
                    logger.warning(f"[TOKEN_AUTH] Token inválido: {auth_token[:20]}...")
        
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
                        "has_session_cookie": "sessionid" in request.COOKIES,
                        "has_csrf_cookie": "csrftoken" in request.COOKIES,
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
                        "set_cookies_keys": list(getattr(response, "cookies", {}).keys()) if getattr(response, "cookies", None) else [],
                        "has_session_cookie": "sessionid" in request.COOKIES,
                        "has_csrf_cookie": "csrftoken" in request.COOKIES,
                        "content_snippet": response.content[:200].decode(errors="ignore") if hasattr(response, "content") else None,
                    },
                    "timestamp": int(time.time() * 1000),
                }
                logger.debug(f"[ASIGNATURAS] Salida: {json.dumps(payload, indent=2)}")
            except Exception:
                pass
            # endregion

        return response

