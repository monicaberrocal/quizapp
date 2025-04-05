import base64
import os
from celery import shared_task
from .models import Tema
from .celery.pdf_process import *
import openai
from django.conf import settings
from .utils import send_email
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
import traceback

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")  # 🔹 Variable de entorno para la URL de React

@shared_task
def procesar_archivo_task(tema_id, archivo_base64, extension, email):
    try:
        tema = Tema.objects.get(id=tema_id)
        
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        model = 'gpt-3.5-turbo'
        
        # Decodificar el archivo desde base64
        archivo_data = base64.b64decode(archivo_base64)
        
        if extension == ".pdf":
            print("Procesando PDF...")
            procesar_pdf(tema, archivo_data, client, model)
        elif extension in [".doc", ".docx"]:
            print("Procesando documento de Word...")
        
        print("ADIOS")
        send_success_email(tema, email)
        
    except Tema.DoesNotExist:
        print("Tema no encontrado")
        
    except Exception as e:
        error_message = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
        print(error_message)
        send_log_email(error_message)
        send_error_email(tema.nombre, email)

def send_error_email(tema, email):
    html_content = render_to_string("quiz/error_questions_generation.html", {
        "tema": tema
    })

    subject = "❌ Error al generar preguntas"

    send_email(subject, html_content, [email])
    
def send_success_email(tema, email):
    link = f"{FRONTEND_URL}/temas/{tema.id}"
    
    html_content = render_to_string("quiz/success_questions_generation.html", {
        "tema": tema.nombre,
        "link_cuestionario": link
    })

    subject = "✅ ¡Tus preguntas están listas!"

    send_email(subject, html_content, [email])
    
    
def send_log_email(message):
    EmailMultiAlternatives(
        subject="Error en una ejecución",
        body=message,
        from_email="gemastudiesapp@gmail.com",
        to=["gemastudiesapp@gmail.com"],
    ).send()