from django.urls import path
from django.contrib.auth import views as auth_views
from .views import crear_pregunta_con_respuestas, crear_asignatura, crear_tema, editar_asignatura, editar_tema, exportar_asignatura, exportar_asignaturas, exportar_tema, finalizar_test, mostrar_pregunta, mostrar_respuesta, procesar_respuesta, registrar_usuario, vista_asignatura, eliminar_asignatura, vista_tema, eliminar_tema, eliminar_tema_asignatura, pregunta_vista, eliminar_pregunta, estudiar_asignatura, repasar_asignatura, estudiar_tema, repasar_tema
from django.conf.urls import handler404, handler403
from .views import mi_error_404, mi_error_403

handler404 = mi_error_404
handler403 = mi_error_403

urlpatterns = [
    path('crear-pregunta/', crear_pregunta_con_respuestas, name='crear_pregunta_con_respuestas'),
    path('crear-asignatura/', crear_asignatura, name='crear_asignatura'),
    path('crear-tema/', crear_tema, name='crear_tema'),
    path('registrar/', registrar_usuario, name='registrar_usuario'),
    path('login/', auth_views.LoginView.as_view(template_name='quiz/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('asignatura/<int:id>/', vista_asignatura, name='vista_asignatura'),
    path('asignatura/eliminar/<int:id>/', eliminar_asignatura, name='eliminar_asignatura'),
    path('tema/<int:id>/', vista_tema, name='vista_tema'),
    path('tema/eliminar/<int:id>/', eliminar_tema, name='eliminar_tema'),
    path('tema/eliminar/<int:tema_id>/<int:asignatura_id>/', eliminar_tema_asignatura, name='eliminar_tema_asignatura'),
    path('asignatura/<int:id>/editar/', editar_asignatura, name='editar_asignatura'),
    path('tema/<int:id>/editar/', editar_tema, name='editar_tema'),
    path('pregunta/<int:id>/', pregunta_vista, name='pregunta_vista'),
    path('pregunta/eliminar/<int:pregunta_id>/<int:tema_id>/', eliminar_pregunta, name='eliminar_pregunta'),
    path('asignatura/estudiar/<int:id>/', estudiar_asignatura, name='estudiar_asignatura'),
    path('asignatura/repasar/<int:id>/', repasar_asignatura, name='repasar_asignatura'),
    path('tema/estudiar/<int:id>/', estudiar_tema, name='estudiar_tema'),
    path('tema/repasar/<int:id>/', repasar_tema, name='repasar_tema'),
    path('mostrar_pregunta/', mostrar_pregunta, name='mostrar_pregunta'),
    path('procesar_respuesta/', procesar_respuesta, name='procesar_respuesta'),
    path('mostrar_respuesta/', mostrar_respuesta, name='mostrar_respuesta'),
    path('finalizar_test/', finalizar_test, name='finalizar_test'),
    path('exportar_asignaturas/', exportar_asignaturas, name='exportar_asignaturas'),
    path('exportar_asignatura/<int:id>/', exportar_asignatura, name='exportar_asignatura'),
    path('exportar_tema/<int:id>/', exportar_tema, name='exportar_tema')
]