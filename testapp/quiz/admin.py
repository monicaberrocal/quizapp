from django.contrib import admin
from .models import Asignatura, Tema, Pregunta, Respuesta

admin.site.register(Asignatura)
admin.site.register(Tema)
admin.site.register(Pregunta)
admin.site.register(Respuesta)