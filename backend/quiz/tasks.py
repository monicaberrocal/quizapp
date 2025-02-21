from celery import shared_task
from .models import Tema
import os

@shared_task
def procesar_archivo_task(tema_id, archivo_path, extension):
    try:
        tema = Tema.objects.get(id=tema_id)
        
        if extension == ".pdf":
            # Lógica para procesar el PDF
            print("Procesando PDF...")
        elif extension in [".doc", ".docx"]:
            # Lógica para procesar el documento de Word
            print("Procesando documento de Word...")
        
        # Aquí vendría la llamada a la API de OpenAI y la generación de preguntas
        print("Llamando a la API de OpenAI para generar preguntas...")
        
    except Tema.DoesNotExist:
        print("Tema no encontrado")
