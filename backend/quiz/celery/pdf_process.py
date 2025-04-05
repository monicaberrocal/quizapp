from .pdf_extractors import extract_text_combined
from .question_generation import *
from ..models import Pregunta, Respuesta
import re
import traceback

def procesar_pdf(tema, file, client, model):
    print("dentro de procesar")
    texto = extraer_texto_pdf(file, client, model)
    preguntas_json = generar_bateria_completa(texto, client, model)
    print(preguntas_json)
    importar_preguntas_json(preguntas_json, tema)
    
def extraer_texto_pdf(file, client, model):
    text_pymupdf, text_pdfplumber, text_pypdf2, text_pdfminer = extract_text_combined(file)

    respuesta = ''

    for i in range(len(text_pdfminer)):
        text = '-¿!11441165473941=(-' + text_pymupdf[i] + '-¿!11441165473941=(-' + text_pdfplumber[i] + '-¿!11441165473941=(-' + \
            text_pypdf2[i] + '-¿!11441165473941=(-' + \
            text_pdfminer[i]  # + '-¿!11441165473941=(-' + text_tesseract[i]
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system",
                    "content": "He usado 5 librerías para extraer el texto de un pdf. Los 4 resultados son los siguientes. Necesito que me des un texto limpio final usando la información de las 4 extracciones. No escribas nada más que el texto limpio final. La separación entre texto y texto es: '-¿!11441165473941=(-'"},
                {"role": "user", "content": text},
            ],
            temperature=0.7
        )
        respuesta += response.choices[0].message.content
            
    return respuesta

def generar_bateria_completa(temario_texto, client, model):
    # Paso 1: Análisis del temario
    # apartados = analizar_temario(temario_texto, client, model)
    
    apartados = dividir_por_apartados(temario_texto)
    
    # Paso 2: Generar 20 preguntas por cada apartado en el formato JSON solicitado    
    preguntas_generadas = generar_preguntas_json(temario_texto, apartados, client, model, 10)

    # Paso 3: Analizar la cobertura del temario
    # apartados_no_cubiertos = analizar_cobertura(temario_texto, preguntas_generadas, client, model)

    # Paso 4: Generar 10 preguntas adicionales para temas no cubiertos
    # preguntas_adicionales = generar_preguntas_json(temario_texto, apartados_no_cubiertos, client, model, 20)

    # Unir las preguntas originales con las adicionales
    # preguntas_generadas.extend(preguntas_adicionales)
    
    return {"preguntas": preguntas_generadas}

def importar_preguntas_json(tema_data, tema):
    # 📌 Crear las preguntas
    for pregunta_data in tema_data["preguntas"]:
        pregunta = Pregunta.objects.create(
            texto=pregunta_data["texto"],
            ayuda=pregunta_data.get("ayuda", ''),
            tema=tema
        )

        # 📌 Crear las respuestas
        respuestas_formatted = []
        for idx, respuesta_data in enumerate(pregunta_data["respuestas"]):
            respuesta = Respuesta.objects.create(
                texto=respuesta_data["texto"],
                pregunta=pregunta
            )
            respuestas_formatted.append(respuesta)

        pregunta.respuesta_correcta = respuestas_formatted[0]
        pregunta.save()
        
def dividir_por_apartados(texto):
    patrones_titulo = re.compile(
        r'''^(
            BLOQUE\s+\w+ |                      # Coincide con encabezados como 'BLOQUE I', 'BLOQUE II', etc.
            Bloque\s+\w+ |
            TEMA\s+\w+ |                        # Coincide con encabezados como 'TEMA 1', 'TEMA 2', etc.
            Tema\s+\w+ |
            CAPÍTULO\s+\w+(?:\.\d+)*\.? |       # Coincide con 'CAPÍTULO 1', 'CAPÍTULO I.2', etc.
            Capítulo\s+\w+(?:\.\d+)*\.? |
            SECCIÓN\s+\w+(?:\.\d+)*\.? |        # Coincide con 'SECCIÓN 2', 'SECCIÓN 2.1', etc.
            Sección\s+\w+(?:\.\d+)*\.? |
            APÉNDICE\s+\w+ |                    # Coincide con 'APÉNDICE A', 'APÉNDICE B', etc.
            Apéndice\s+\w+ |
            \d+(?:\.\d+)* |                     # Coincide con '1', '1.1', '1.1.1', etc. (índices numerados)
            \d+\) |                             # Coincide con ítems numerados tipo '1)', '2)', etc.
            [a-zA-Z]+[\.\)]\s+ |                # Coincide con ítems como 'a)', 'b.', 'aa)', 'c.', etc.
            [IVXLCDM]+\.\s+ |                   # Coincide con números romanos con punto, ej: 'I. ', 'II. ', etc.
            [A-ZÁÉÍÓÚÑ\s]{4,}                   # Coincide con líneas completamente en mayúsculas (mín. 4 letras)
        )[^\n]*''',
        re.MULTILINE | re.VERBOSE
    )

    secciones = []
    indices = [m.start() for m in patrones_titulo.finditer(texto)]
    
    if not indices:
        return texto  # No se encontraron títulos

    # Añadir el final del texto como último índice
    indices.append(len(texto))

    for i in range(len(indices)-1):
        seccion = texto[indices[i]:indices[i+1]].strip()
        if seccion:
            secciones.append(seccion)

    return secciones