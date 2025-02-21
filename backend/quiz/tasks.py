import base64
from celery import shared_task
from .models import Tema

@shared_task
def procesar_archivo_task(tema_id, archivo_base64, extension):
    try:
        tema = Tema.objects.get(id=tema_id)
        
        # Decodificar el archivo desde base64
        archivo_data = base64.b64decode(archivo_base64)
        
        if extension == ".pdf":
            print("Procesando PDF...")
            # Aquí podrías guardar el archivo temporalmente o procesarlo directamente
        elif extension in [".doc", ".docx"]:
            print("Procesando documento de Word...")
        
        print("Llamando a la API de OpenAI para generar preguntas...")
        
    except Tema.DoesNotExist:
        print("Tema no encontrado")
