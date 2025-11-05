import os
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

def send_activation_email(request, usuario, link_activacion):
    html_content = render_to_string("quiz/registro/email/activacion.html", {
        "usuario": usuario.first_name,
        "link_activacion": link_activacion,
    })

    subject = "🔐 Activa tu cuenta en nuestra plataforma"

    send_email(subject, html_content, [usuario.email])

def send_info_email(usuario):
     EmailMultiAlternatives(
        subject="Nuevo usuario",
        body="Se ha registrado un nuevo usuario: " + usuario.first_name + ".\nCon email: " + usuario.email,
        from_email="gemastudiesapp@gmail.com",
        to=["gemastudiesapp@gmail.com"],
    ).send() 

def send_email(subject, html_content, destinataries):
    email = EmailMultiAlternatives(
        subject=subject,
        body=strip_tags(html_content),
        from_email="gemastudiesapp@gmail.com",
        to=destinataries,
    )
    email.attach_alternative(html_content, "text/html")
    email.send()
    
def send_log_email(message):
    EmailMultiAlternatives(
        subject="Execution error",
        body=message,
        from_email="gemastudiesapp@gmail.com",
        to=["gemastudiesapp@gmail.com"],
    ).send()
    
def send_error_email(tema_name, user_email, asignatura_name):
    html_content = render_to_string("quiz/error_questions_generation.html", {
        "tema": tema_name,
        "asignatura": asignatura_name
    })

    subject = "❌ Error al generar las preguntas"
    send_email(subject, html_content, [user_email])

def send_success_email(tema, user_email):
    link = f"{FRONTEND_URL}/temas/{tema.id}"

    html_content = render_to_string("quiz/success_questions_generation.html", {
        "tema": tema.nombre,
        "asignatura": tema.asignatura.nombre,
        "quiz_link": link
    })

    subject = "✅ Tus preguntas están listas!"
    send_email(subject, html_content, [user_email])