from django.urls import path
from .views import registrar_usuario_api, activar_cuenta_api, auth_status, logout_api, login_api, asignaturas_api, get_csrf_token, eliminar_asignatura, tema_api, crear_pregunta_api

urlpatterns = [
    path("registro/", registrar_usuario_api, name="registro_usuario_api"),
    path("activar/<str:token>/", activar_cuenta_api, name="activar_cuenta_api"),
    path("auth/status/", auth_status, name="auth_status"),
    path("logout/", logout_api, name="logout_api"),
    path("login/", login_api, name="login_api"),
    path("asignaturas/", asignaturas_api, name="asignaturas_api"),
    path("csrf/", get_csrf_token, name="csrf_token"),
    path("asignaturas/<int:asignatura_id>/", eliminar_asignatura, name="eliminar_asignatura"),
    path("temas/<int:tema_id>/", tema_api, name="tema_api"),
    path("preguntas/crear/", crear_pregunta_api, name="crear_pregunta_api"),
]
