from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import CodigoActivacion

@receiver(post_save, sender=User)
def crear_codigo_activacion(sender, instance, created, **kwargs):
    if created:
        CodigoActivacion.objects.create(usuario=instance)
