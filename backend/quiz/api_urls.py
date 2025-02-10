from django.urls import path
from .views import registrar_usuario_api, activar_cuenta_api, auth_status, logout_api, login_api, asignatura_api, get_csrf_token, eliminar_asignatura, eliminar_tema

urlpatterns = [
    path("registro/", registrar_usuario_api, name="registro_usuario_api"),
    path("activar/<str:token>/", activar_cuenta_api, name="activar_cuenta_api"),
    path("auth/status/", auth_status, name="auth_status"),
    path("logout/", logout_api, name="logout_api"),
    path("login/", login_api, name="login_api"),
    path("asignaturas/", asignatura_api, name="asignatura_api"),
    path("csrf/", get_csrf_token, name="csrf_token"),
    path("asignaturas/<int:asignatura_id>/", eliminar_asignatura, name="eliminar_asignatura"),
    path("temas/<int:tema_id>/", eliminar_tema, name="eliminar_tema"),
]
