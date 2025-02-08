from celery import shared_task
import time

@shared_task
def tarea_pesada():
    print("✅ Celery ejecutando una tarea en segundo plano...")
    time.sleep(5)
    print("✅ Tarea finalizada en Celery.")