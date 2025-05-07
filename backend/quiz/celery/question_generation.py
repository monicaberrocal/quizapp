import json
from textwrap import dedent
import openai
import logging
import re

from ..utils import send_log_email

logger = logging.getLogger(__name__)

MAX_PREGUNTAS_POR_LLAMADA = 15

def generate_questions_json(sections, client, model):
    all_questions = []
    
    for text, questions_number in sections:
        print(text[:20])
        print("Se van a hacer " + str(questions_number))
        
        if (questions_number > 16):
            num_llamadas = (questions_number + MAX_PREGUNTAS_POR_LLAMADA - 1) // MAX_PREGUNTAS_POR_LLAMADA
            partes = []

            longitud = len(text)
            salto = longitud // num_llamadas

            for i in range(num_llamadas):
                inicio = i * salto
                fin = (i + 1) * salto if i < num_llamadas - 1 else longitud
                partes.append(text[inicio:fin])
                
            num_preguntas = MAX_PREGUNTAS_POR_LLAMADA
        else:
            partes = [text]
            num_llamadas = 1
            num_preguntas = questions_number

        for i, parte in enumerate(partes):         
            prompt = dedent(f"""
                        Eres un experto en pedagogía y creación de preguntas tipo test académicas.
                        Genera exactamente {num_preguntas} preguntas tipo test basadas directamente en el texto proporcionado.
                        Las preguntas deben ayudar a estudiar y memorizar el contenido, evitando enunciados vagos o demasiado generales.
                        Las preguntas deben ser del estilo que haría un profesor en un examen para evaluar si el alumno ha entendido el contenido.

                        Las preguntas deben estar en el siguiente formato JSON:
                        {{
                            "preguntas": [
                                {{
                                    "texto": "Enunciado de la pregunta",
                                    "respuestas": [
                                        {{"texto": "Respuesta CORRECTA"}},
                                        {{"texto": "Respuesta 2"}},
                                        {{"texto": "Respuesta 3"}},
                                        {{"texto": "Respuesta 4"}}
                                    ],
                                    "ayuda": "Explicación de la pregunta usando las palabras literales que aparecen en el texto del temario."
                                }}
                            ]
                        }}
                        
                        Genera exactamente {num_preguntas} preguntas tipo test basadas directamente en el texto proporcionado.
                        """)
            
            response = generate_questions_with_openai(prompt, parte, client, model)
            all_questions.extend(response)
            print(f"➡️  Parte {i+1}/{num_llamadas} — Se pidieron {num_preguntas}, se generaron {len(response)}")
    return all_questions

def generate_questions_with_openai(prompt, text, client, model, accumulator=0):
    if accumulator > 3:
        return []

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text},
            ],
            # response_format={"type": "json_object"},
            temperature = 0.7
        )
        if not response.choices:
            raise ValueError("Empty response from OpenAI")

        openai_json = response.choices[0].message.content
        response_data = json.loads(openai_json)
        return response_data["preguntas"]
        
    except json.JSONDecodeError:
        # response_data = fix_json(openai_json, client, model)
        response_data = fix_json_manually(openai_json, client, model)
        if response_data:
            return response_data["preguntas"]
        else:
            response_data = generate_questions_with_openai(prompt, text, client, model, accumulator+1)
            if response_data:
                return response_data
            else:
                raise
        
    except openai.OpenAIError as e:
        response_data = generate_questions_with_openai(prompt, text, client, model, accumulator+1)
        if response_data:
            return response_data
        else:
            raise

def fix_json_manually(texto, client, model):
    patron = r'"ayuda"\s*:\s*".*?"\s*}'
    coincidencias = list(re.finditer(patron, texto, re.DOTALL))

    if not coincidencias:
        print("❌ No se pudo encontrar un cierre válido de 'ayuda'.")
        return fix_json(texto_arreglado, client, model)

    ultima = coincidencias[-1]
    fin = ultima.end()

    texto_arreglado = texto[:fin] + ']}'

    try:
        return json.loads(texto_arreglado)
    except json.JSONDecodeError as e:
        return fix_json(texto_arreglado, client, model)


def fix_json(invalid_json, client, model, accumulator=0):
    send_log_email(invalid_json)
    
    if accumulator > 3:
        return []

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Arregla el formato de este json para que sea válido."},
                {"role": "user", "content": invalid_json},
            ],
            temperature = 0
        )
        if not response.choices:
            logger.error("No se recibieron respuestas del modelo.")
            raise ValueError("Empty response from OpenAI")

        openai_json = response.choices[0].message.content
        response_data = json.loads(openai_json)
        return response_data
    
    except json.JSONDecodeError:
        logger.error("La respuesta no es un JSON válido.")
        response_data = fix_json(openai_json, client, model, accumulator+1)
        return response_data