from celery import shared_task
from .models import Tema
import os

@shared_task
def procesar_archivo_task(tema_id, archivo_path, extension):
    try:
        tema = Tema.objects.get(id=tema_id)
        
        if os.path.exists(archivo_path):
            print(f"✅ El archivo existe en: {archivo_path}")
        else:
            print(f"❌ El archivo NO existe en: {archivo_path}")
        
        if extension == ".pdf":
            print("Procesando PDF...")
            # Aquí agregarías la lógica para leer el archivo PDF y llamar a la API de OpenAI
        elif extension in [".doc", ".docx"]:
            print("Procesando documento de Word...")
        
        print("Llamando a la API de OpenAI para generar preguntas...")
        
    except Tema.DoesNotExist:
        print("Tema no encontrado")