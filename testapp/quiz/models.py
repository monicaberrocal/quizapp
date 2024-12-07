from django.db import models
from django.contrib.auth.models import User

class Asignatura(models.Model):
    nombre = models.CharField(max_length=100)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='asignaturas')

    def __str__(self):
        return self.nombre
    
class Tema(models.Model):
    asignatura = models.ForeignKey(Asignatura, related_name='temas', on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre
    
class Pregunta(models.Model):
    tema = models.ForeignKey(Tema, related_name='preguntas', on_delete=models.CASCADE)
    texto = models.TextField()
    respuesta_correcta = models.ForeignKey('Respuesta', related_name='preguntas_correctas', on_delete=models.CASCADE, null=True)
    fallos = models.IntegerField(default=0)
    ayuda = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.texto
    
class Respuesta(models.Model):
    pregunta = models.ForeignKey(Pregunta, related_name='respuestas', on_delete=models.CASCADE)
    texto = models.TextField()

    def __str__(self):
        return self.texto