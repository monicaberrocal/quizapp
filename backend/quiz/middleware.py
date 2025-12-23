import json
import time


class DebugAccessLogMiddleware:
    """
    Middleware de instrumentación temporal para rastrear peticiones a asignaturas
    y confirmar si llega la cookie de sesión/CSRF en móviles.
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
                with open("/home/monica/quizapp/.cursor/debug.log", "a") as f:
                    f.write(json.dumps(payload) + "\n")
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
                with open("/home/monica/quizapp/.cursor/debug.log", "a") as f:
                    f.write(json.dumps(payload) + "\n")
            except Exception:
                pass
            # endregion

        return response

