from django.urls import path
from .views import registrar_usuario_api

urlpatterns = [
    path("registro/", registrar_usuario_api, name="registro_usuario_api"),
]
