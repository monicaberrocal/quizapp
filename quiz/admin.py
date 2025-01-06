from django.contrib import admin
from .models import Asignatura, Tema, Pregunta, Respuesta

@admin.register(Asignatura)
class AsignaturaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'usuario')
    list_filter = ('usuario',)
    search_fields = ('nombre',) 
    ordering = ('usuario', 'nombre')
    
@admin.register(Tema)
class TemaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'asignatura', 'usuario')
    list_filter = ('asignatura__usuario', 'asignatura')
    search_fields = ('nombre', 'asignatura__nombre', 'asignatura__usuario__username')
    ordering = ('asignatura__usuario', 'asignatura', 'nombre')

    def usuario(self, obj):
        return obj.asignatura.usuario
    
    usuario.admin_order_field = 'asignatura__usuario'
    usuario.short_description = 'Usuario'

@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    list_display = ('texto', 'tema', 'asignatura', 'usuario', 'fallos', 'respondida')
    list_filter = ('tema__asignatura__usuario', 'tema__asignatura', 'tema')
    search_fields = ('texto', 'tema__nombre', 'tema__asignatura__nombre', 'tema__asignatura__usuario__username')
    ordering = ('tema__asignatura__usuario', 'tema__asignatura', 'tema', 'texto')

    def asignatura(self, obj):
        return obj.tema.asignatura
    asignatura.admin_order_field = 'tema__asignatura'
    asignatura.short_description = 'Asignatura'

    def usuario(self, obj):
        return obj.tema.asignatura.usuario
    usuario.admin_order_field = 'tema__asignatura__usuario'
    usuario.short_description = 'Usuario'

admin.site.register(Respuesta)