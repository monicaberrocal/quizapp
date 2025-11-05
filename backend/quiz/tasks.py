import base64
import traceback
import logging

from celery import shared_task
from django.conf import settings

import openai

from .models import Tema
from .celery.pdf_process import process_pdf
from .utils_email import send_log_email, send_success_email, send_error_email

logger = logging.getLogger(__name__)

@shared_task
def process_uploaded_file_task(tema_id, file_base64, extension, user_email):
    try:
        tema = Tema.objects.get(id=tema_id)

        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        model = "gpt-3.5-turbo"

        file_data = base64.b64decode(file_base64)

        if extension == ".pdf":
            logger.info("Processing PDF...")
            process_pdf(tema, file_data, client, model)
        elif extension in [".doc", ".docx"]:
            logger.info("Processing Word document...")

        logger.info("✅ File processed successfully.")
        send_success_email(tema, user_email)

    except Tema.DoesNotExist:
        send_log_email("❌ Tema no encontrado.")

    except Exception as e:
        error_message = "".join(traceback.format_exception(type(e), e, e.__traceback__))
        logger.error(error_message)
        send_log_email(error_message)
        send_error_email(tema.nombre, user_email, tema.asignatura.nombre)




