from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils.timezone import now
from django.utils import timezone
from datetime import timedelta

MAX_CHARACTERS_PER_MONTH = 200_000

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
    respondida = models.IntegerField(default=0)
    ayuda = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.texto
    
class Respuesta(models.Model):
    pregunta = models.ForeignKey(Pregunta, related_name='respuestas', on_delete=models.CASCADE)
    texto = models.TextField()

    def __str__(self):
        return self.texto
    
def default_expiration():
    return now() + timedelta(minutes=10)

class CodigoActivacion(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name="codigo_activacion")
    token_activacion = models.UUIDField(default=uuid.uuid4, unique=True)
    token_expira = models.DateTimeField(default=default_expiration)

class OpenAIUsage(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="openai_usage")
    character_count = models.IntegerField(default=0)
    last_reset = models.DateTimeField(auto_now_add=True)

    def reset_if_needed(self):
        now = timezone.now()
        if now - self.last_reset > timedelta(days=30):
            self.character_count = 0
            self.last_reset = now
            self.save()

    def can_use(self, characters):
        self.reset_if_needed()
        return (self.character_count + characters) <= MAX_CHARACTERS_PER_MONTH
    
    def left_use(self):
        return MAX_CHARACTERS_PER_MONTH - self.character_count

    def add_characters(self, characters):
        self.character_count += characters
        self.save()

from django.db import models
from django.contrib.auth.models import User

class ProgresoTest(models.Model):
    class TipoChoices(models.TextChoices):
        ESTUDIAR = 'estudiar', 'Estudiar'
        REPASAR = 'repasar', 'Repasar'

    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=20, choices=TipoChoices.choices)
    filtro = models.IntegerField()
    pregunta_actual = models.IntegerField(default=0)
    preguntas_id = models.JSONField()
    respuestas_correctas = models.IntegerField(default=0)
    respondidas = models.JSONField(default=list)
    completado = models.BooleanField(default=False)
    finalizado_en = models.DateTimeField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.tipo} ({self.filtro}){' ✅' if self.completado else ''}"
