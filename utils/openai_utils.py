import openai
from django.conf import settings

def generate_questions(theme_text, instructions):
    """Genera preguntas usando la API moderna de OpenAI."""
    openai.api_key = settings.OPENAI_API_KEY

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {"role": "system", "content": instructions},
                {"role": "user", "content": theme_text},
            ],
            max_tokens=60,
            temperature=0.7
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        # Captura cualquier excepción genérica de Python
        return f"Error en la solicitud a OpenAI: {str(e)}"
