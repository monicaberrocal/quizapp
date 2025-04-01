from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

def send_activation_email(request, usuario, link_activacion):
    html_content = render_to_string("quiz/registro/email/activacion.html", {
        "usuario": usuario,
        "link_activacion": link_activacion,
    })

    subject = "🔐 Activa tu cuenta en nuestra plataforma"

    send_email(subject, html_content, [usuario.email])


def send_email(subject, html_content, destinataries):
    email = EmailMultiAlternatives(
        subject=subject,
        body=strip_tags(html_content),
        from_email="gemastudiesapp@gmail.com",
        to=destinataries,
    )
    email.attach_alternative(html_content, "text/html")
    email.send()