from django.urls import path

from .views.auth import (
    activar_cuenta_api,
    auth_status,
    get_csrf_token,
    login_api,
    logout_api,
    registrar_usuario_api
)

from .views.asignaturas import (
    asignatura_api,
    asignaturas_api,
    exportar_asignatura,
    importar_asignatura
)

from .views.temas import (
    crear_tema_api,
    descargar_tema,
    importar_tema,
    tema_api,
    tema_api_detalle,
    importar_preguntas,
    generar_preguntas
)

from .views.preguntas import (
    pregunta_api,
    crear_pregunta_api,
)

from .views.questionnaire import (
    QuestionnarieView,
    FinalizarTestView
)

urlpatterns = [
    path("registro/", registrar_usuario_api, name="registro_usuario_api"),
    path("activar/<str:token>/", activar_cuenta_api, name="activar_cuenta_api"),
    path("auth/status/", auth_status, name="auth_status"),
    path("logout/", logout_api, name="logout_api"),
    path("login/", login_api, name="login_api"),
    path("csrf/", get_csrf_token, name="csrf_token"),
]

urlpatterns += [
    path("asignaturas/", asignaturas_api, name="asignaturas_api"),
    path("asignaturas/<int:asignatura_id>/", asignatura_api, name="asignatura_api"),
    path("asignaturas/<int:asignatura_id>/importar_tema/", importar_tema, name="importar_tema"),
    path("asignaturas/<int:asignatura_id>/exportar/", exportar_asignatura, name="exportar_asignatura"),
    path("asignaturas/importar/", importar_asignatura, name="importar_asignatura"),
]

urlpatterns += [
    path("temas/<int:tema_id>/", tema_api, name="tema_api"),
    path("temas/<int:tema_id>/detalle/", tema_api_detalle, name="tema_api_detalle"),
    path("temas/crear/", crear_tema_api, name="crear_tema_api"),
    path("temas/<int:tema_id>/descargar/", descargar_tema, name="descargar_tema"),
    path("temas/<int:tema_id>/importar/", importar_preguntas, name='importar_preguntas'),
    path("temas/<int:tema_id>/generar/", generar_preguntas, name='generar_preguntas'),
]

urlpatterns += [
    path("preguntas/crear/", crear_pregunta_api, name="crear_pregunta_api"),
     path("preguntas/<int:pregunta_id>/", pregunta_api, name="pregunta_api"),
]

urlpatterns += [
    path('estudiar/', QuestionnarieView.as_view(), name='api_preguntas'),
    path('finalizar_test/<int:test_id>', FinalizarTestView.as_view(), name='api_finalizar_test'),
]