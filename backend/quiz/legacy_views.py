import json
import uuid
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required

from django.http import HttpResponse, HttpResponseForbidden, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.utils.timezone import now

from django.templatetags.static import static

from django.views.decorators.csrf import csrf_exempt
from .forms import (
    AsignaturaForm,
    ImportFileForm,
    PreguntaConRespuestasForm,
    PreguntaConRespuestasFormWithoutTema,
    RegistroUsuarioForm,
    TemaForm,
    TemaFormWithoutAsignatura,
)
from .models import Asignatura, Pregunta, Respuesta, Tema, CodigoActivacion
from utils.openai_utils import generate_questions
import fitz
import pdfplumber
import docx
import os


### ASIGNATURA ###
@login_required
def estudiar_asignatura(request, id):
    asignatura = get_object_or_404(Asignatura, id=id)
    preguntas = list(Pregunta.objects.filter(tema__asignatura=asignatura).order_by('respondida', '?'))
    if not preguntas:
        return render(request, 'quiz/no_preguntas.html', {'asignatura': asignatura})
    
    request.session['preguntas_ids'] = [p.id for p in preguntas]
    request.session['pregunta_actual'] = 0
    request.session['respuestas_correctas'] = 0
    request.session['total_respondidas'] = 0
    
    return redirect('pregunta_mostrar')

@login_required
def repasar_asignatura(request, id):
    asignatura = get_object_or_404(Asignatura, id=id)
    preguntas = list(Pregunta.objects.filter(tema__asignatura=asignatura, fallos__gt=0).order_by('respondida', '?'))
    if not preguntas:
        return render(request, 'quiz/no_preguntas.html', {'asignatura': asignatura})
    
    request.session['preguntas_ids'] = [p.id for p in preguntas]
    request.session['pregunta_actual'] = 0
    request.session['respuestas_correctas'] = 0
    request.session['total_respondidas'] = 0
    
    return redirect('pregunta_mostrar')

### TEMA ###

@login_required
def estudiar_tema(request, id):
    tema = get_object_or_404(Tema, id=id)
    preguntas = list(tema.preguntas.all().order_by('respondida', '?'))
    if not preguntas:
        return render(request, 'quiz/no_preguntas.html', {'tema': tema})
    
    request.session['preguntas_ids'] = [p.id for p in preguntas]
    request.session['pregunta_actual'] = 0
    request.session['respuestas_correctas'] = 0
    request.session['total_respondidas'] = 0
    
    return redirect('pregunta_mostrar')

@login_required
def repasar_tema(request, id):
    tema = get_object_or_404(Tema, id=id)
    preguntas = list(tema.preguntas.filter(fallos__gt=0).order_by('respondida', '?'))
    if not preguntas:
        return render(request, 'quiz/no_preguntas.html', {'tema': tema})
    
    request.session['preguntas_ids'] = [p.id for p in preguntas]
    request.session['pregunta_actual'] = 0
    request.session['respuestas_correctas'] = 0
    request.session['total_respondidas'] = 0
    
    return redirect('pregunta_mostrar')

### TESTS ###

@login_required
def pregunta_mostrar(request):
    pregunta_actual_index = request.session.get('pregunta_actual', 0)
    preguntas_ids = request.session.get('preguntas_ids', [])

    if pregunta_actual_index >= len(preguntas_ids):
        return redirect('finalizar_test')

    pregunta_id = preguntas_ids[pregunta_actual_index]
    pregunta = get_object_or_404(Pregunta, id=pregunta_id)
    pregunta.respondida += 1
    pregunta.save()
    respuestas = pregunta.respuestas.all().order_by('?')

    return render(request, 'quiz/pregunta/pregunta_mostrar.html', {
        'pregunta': pregunta,
        'respuestas': respuestas,
        'pregunta_actual_index': pregunta_actual_index + 1,
        'total_preguntas': len(preguntas_ids),
    })

@login_required
def procesar_respuesta(request):
    if request.method == 'POST':
        respuesta_seleccionada_id = request.POST.get('respuesta')
        request.session['respuesta_seleccionada_id'] = respuesta_seleccionada_id

        pregunta_actual_index = request.session.get('pregunta_actual', 0)
        preguntas_ids = request.session.get('preguntas_ids', [])

        pregunta_id = preguntas_ids[pregunta_actual_index]
        pregunta = get_object_or_404(Pregunta, id=pregunta_id)

        respuesta_correcta_id = pregunta.respuesta_correcta.id

        request.session['total_respondidas'] += 1
        
        if respuesta_seleccionada_id == str(respuesta_correcta_id):
            request.session['respuestas_correctas'] += 1
            request.session['respuesta_correcta'] = True
            if(pregunta.fallos > 0):
                pregunta.fallos -= 1
                pregunta.save()
        else:
            request.session['respuesta_correcta'] = False
            pregunta.fallos += 1
            pregunta.save()

        return redirect('respuesta_mostrar')

    return redirect('pregunta_mostrar')

@login_required
def respuesta_mostrar(request):
    correcto = request.session.get('respuesta_correcta', False)
    pregunta_actual_index = request.session.get('pregunta_actual', 0)
    preguntas_ids = request.session.get('preguntas_ids', [])

    pregunta_id = preguntas_ids[pregunta_actual_index]
    pregunta = get_object_or_404(Pregunta, id=pregunta_id)

    respuesta_seleccionada_id = request.session.get('respuesta_seleccionada_id')
    respuesta_seleccionada = get_object_or_404(Respuesta, id=respuesta_seleccionada_id)

    if correcto:
        mensaje = "¡Muy bien! Tu respuesta es correcta."
    else:
        respuesta_correcta = pregunta.respuesta_correcta
        mensaje = f"Error. La respuesta correcta es: {respuesta_correcta.texto}"

    request.session['pregunta_actual'] += 1

    request.session.pop('respuesta_correcta', None)

    return render(request, 'quiz/pregunta/respuesta_mostrar.html', {
        'mensaje': mensaje,
        'pregunta': pregunta,
        'correcto': correcto,
        'total_respondidas': request.session['total_respondidas'],
        'respuestas_correctas': request.session['respuestas_correctas'],
        'total_preguntas': len(preguntas_ids),
        'respuesta_seleccionada': respuesta_seleccionada
    })

@login_required
def finalizar_test(request):
    total_respondidas = request.session.get('total_respondidas', 0)
    respuestas_correctas = request.session.get('respuestas_correctas', 0)
    preguntas_ids = request.session.get('preguntas_ids', [])
    total_preguntas = len(preguntas_ids)

    fallos = total_respondidas - respuestas_correctas

    request.session.pop('preguntas_ids', None)
    request.session.pop('pregunta_actual', None)
    request.session.pop('respuestas_correctas', None)
    request.session.pop('total_respondidas', None)

    return render(request, 'quiz/test/finalizar_test.html', {
        'total_respondidas': total_respondidas,
        'respuestas_correctas': respuestas_correctas,
        'fallos': fallos,
        'total_preguntas': total_preguntas,
    })


### DATOS ###

@login_required
def exportar_asignaturas(request):
    asignaturas = Asignatura.objects.filter(usuario=request.user).prefetch_related('temas__preguntas__respuesta_correcta')

    data = {"asignaturas": []}
    
    for asignatura in asignaturas:
        temas_data = []
        for tema in asignatura.temas.all():
            preguntas_data = []
            for pregunta in tema.preguntas.all():
                respuestas_data = []
                
                if pregunta.respuesta_correcta:
                    respuestas_data.append({"texto": pregunta.respuesta_correcta.texto})
                
                for respuesta in pregunta.respuestas.exclude(id=pregunta.respuesta_correcta.id):
                    respuestas_data.append({"texto": respuesta.texto})

                pregunta_data = {
                    "texto": pregunta.texto,
                    "respuestas": respuestas_data
                }

                if pregunta.ayuda:
                    pregunta_data["ayuda"] = pregunta.ayuda

                preguntas_data.append(pregunta_data)
                
            temas_data.append({
                "nombre": tema.nombre,
                "preguntas": preguntas_data
            })
        
        data["asignaturas"].append({
            "nombre": asignatura.nombre,
            "temas": temas_data
        })

    json_data = json.dumps(data, ensure_ascii=False)

    response = HttpResponse(json_data, content_type='text/plain')
    response['Content-Disposition'] = 'attachment; filename="asignaturas_exportadas.txt"'

    return response

@login_required
def exportar_asignatura(request, id):
    asignatura = get_object_or_404(Asignatura, id=id, usuario=request.user)
    temas_data = []

    for tema in asignatura.temas.all():
        preguntas_data = []
        for pregunta in tema.preguntas.all():
            respuestas_data = []
            
            if pregunta.respuesta_correcta:
                respuestas_data.append({"texto": pregunta.respuesta_correcta.texto})
            
            for respuesta in pregunta.respuestas.exclude(id=pregunta.respuesta_correcta.id):
                respuestas_data.append({"texto": respuesta.texto})

            pregunta_data = {
                "texto": pregunta.texto,
                "respuestas": respuestas_data
            }

            if pregunta.ayuda:
                pregunta_data["ayuda"] = pregunta.ayuda

            preguntas_data.append(pregunta_data)
        
        temas_data.append({
            "nombre": tema.nombre,
            "preguntas": preguntas_data
        })

    data = {
        "nombre": asignatura.nombre,
        "temas": temas_data
    }

    json_data = json.dumps(data, ensure_ascii=False)

    response = HttpResponse(json_data, content_type='text/plain')
    response['Content-Disposition'] = 'attachment; filename="'+ asignatura.nombre + '_preguntas.txt' +'"'

    return response

@login_required
def exportar_tema(request, id):
    tema = get_object_or_404(Tema, id=id)

    preguntas_data = []
    for pregunta in tema.preguntas.all():
        respuestas_data = []
        
        if pregunta.respuesta_correcta:
            respuestas_data.append({"texto": pregunta.respuesta_correcta.texto})
        
        for respuesta in pregunta.respuestas.exclude(id=pregunta.respuesta_correcta.id):
            respuestas_data.append({"texto": respuesta.texto})

        pregunta_data = {
            "texto": pregunta.texto,
            "respuestas": respuestas_data
        }

        if pregunta.ayuda:
            pregunta_data["ayuda"] = pregunta.ayuda

        preguntas_data.append(pregunta_data)

    data = {
        "nombre": tema.nombre,
        "preguntas": preguntas_data
    }

    json_data = json.dumps(data, ensure_ascii=False)

    response = HttpResponse(json_data, content_type='text/plain')
    response['Content-Disposition'] = 'attachment; filename="'+ tema.asignatura.nombre + '_' + tema.nombre + '_preguntas.txt' +'"'

    return response

import json
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from .models import Tema

def exportar_tema(request, id):
    tema = get_object_or_404(Tema, id=id)

    preguntas_data = [
        {
            "texto": pregunta.texto,
            "respuestas": [
                {"texto": respuesta.texto} 
                for respuesta in [pregunta.respuesta_correcta] + list(pregunta.respuestas.exclude(id=pregunta.respuesta_correcta.id))
                if respuesta
            ],
            **({"ayuda": pregunta.ayuda} if pregunta.ayuda else {})
        }
        for pregunta in tema.preguntas.all()
    ]

    data = {
        "nombre": tema.nombre,
        "preguntas": preguntas_data
    }

    json_data = json.dumps(data, ensure_ascii=False, indent=4)  # Indentación para mayor legibilidad

    filename = f"{tema.asignatura.nombre}_{tema.nombre}_preguntas.txt"
    response = HttpResponse(json_data, content_type="text/plain")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    return response

@csrf_exempt
def importar_asignaturas(file, user):
    try:
        file_content = file.read().decode('utf-8')
        data = json.loads(file_content)
        for asignatura_data in data.get('asignaturas', []):
            asignatura = Asignatura.objects.create(
                nombre=asignatura_data['nombre'],
                usuario=user
            )

            for tema_data in asignatura_data.get('temas', []):
                tema = Tema.objects.create(
                    nombre=tema_data['nombre'],
                    asignatura=asignatura
                )

                for pregunta_data in tema_data.get('preguntas', []):
                    pregunta = Pregunta.objects.create(
                        texto=pregunta_data['texto'],
                        tema=tema,
                        ayuda=pregunta_data.get('ayuda')
                    )

                    respuestas = []
                    for idx, respuesta in enumerate(pregunta_data['respuestas']):
                        resp = Respuesta.objects.create(
                            texto=respuesta['texto'],
                            pregunta=pregunta
                        )
                        respuestas.append(resp)

                    if respuestas:
                        pregunta.respuesta_correcta = respuestas[0]
                        pregunta.save()

        return redirect(asignatura_crear)

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Error al decodificar el JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@csrf_exempt
def importar_asignatura(file, user, id):
    try:
        file_content = file.read().decode('utf-8')
        data = json.loads(file_content)
        asignatura = get_object_or_404(Asignatura, id=id, usuario=user)

        for tema_data in data.get('temas', []):
            tema = Tema.objects.create(
                nombre=tema_data['nombre'],
                asignatura=asignatura
            )

            for pregunta_data in tema_data.get('preguntas', []):
                pregunta = Pregunta.objects.create(
                    texto=pregunta_data['texto'],
                    tema=tema,
                    ayuda=pregunta_data.get('ayuda')
                )

                respuestas = []
                for idx, respuesta in enumerate(pregunta_data['respuestas']):
                    resp = Respuesta.objects.create(
                        texto=respuesta['texto'],
                        pregunta=pregunta
                    )
                    respuestas.append(resp)

                if respuestas:
                    pregunta.respuesta_correcta = respuestas[0]
                    pregunta.save()

        return redirect(vista_asignatura, id)

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Error al decodificar el JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@csrf_exempt
def importar_tema(file, id):
    try:
        file_content = file.read().decode('utf-8')
        data = json.loads(file_content)
        tema = get_object_or_404(Tema, id=id)

        for pregunta_data in data.get('preguntas', []):
            pregunta = Pregunta.objects.create(
                texto=pregunta_data['texto'],
                tema=tema,
                ayuda=pregunta_data.get('ayuda')
            )

            respuestas = []
            for idx, respuesta in enumerate(pregunta_data['respuestas']):
                resp = Respuesta.objects.create(
                    texto=respuesta['texto'],
                    pregunta=pregunta
                )
                respuestas.append(resp)

            if respuestas:
                pregunta.respuesta_correcta = respuestas[0]
                pregunta.save()

        return redirect(vista_tema, id)

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Error al decodificar el JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

### GENERACION ###

from django.http import JsonResponse
import traceback

def generar_tema(file, id):
    try:
        file_extension = os.path.splitext(file.name)[1].lower()
        
        if file_extension == ".pdf":
            texto = extraer_texto_pdf(file, id)
            print(texto)
        elif file_extension in [".doc", ".docx"]:
            texto = extraer_texto_doc(file)
        else:
            return JsonResponse({"success": False, "error": "Formato no soportado"}, status=400)

        return JsonResponse({"success": True, "texto": texto})

    except Exception as e:
        error_trace = traceback.format_exc()  # Captura la traza del error
        print(error_trace)  # Imprime la traza en la consola

        return JsonResponse({
            "success": False,
            "error": f"Error al procesar el archivo: {str(e)}",
            "trace": error_trace  # Puedes incluir la traza en la respuesta si lo deseas
        }, status=500)

from io import BytesIO

def convert_uploaded_file_to_bytesio(uploaded_file):
    """Convierte un archivo subido en Django a un objeto BytesIO"""
    file_bytes = uploaded_file.read()  # Leer el contenido del archivo
    return BytesIO(file_bytes)  # Convertirlo en BytesIO

import fitz  # PyMuPDF
import pdfplumber
import PyPDF2
from pdfminer.high_level import extract_text
import pytesseract
from pdf2image import convert_from_bytes
from io import BytesIO

def extract_text_pymupdf(pdf_bytes):
    """Extraer texto por página usando PyMuPDF"""
    doc = fitz.open(stream=pdf_bytes.read(), filetype="pdf")
    return [page.get_text("text") for page in doc]

def extract_text_pdfplumber(pdf_bytes):
    """Extraer texto por página usando pdfplumber"""
    pdf_bytes.seek(0)
    with pdfplumber.open(pdf_bytes) as pdf:
        return [page.extract_text() or "" for page in pdf.pages]

def extract_text_pypdf2(pdf_bytes):
    """Extraer texto por página usando PyPDF2"""
    pdf_bytes.seek(0)
    reader = PyPDF2.PdfReader(pdf_bytes)
    return [page.extract_text() or "" for page in reader.pages]

def extract_text_pdfminer(pdf_bytes):
    """Extraer texto por página usando PDFMiner"""
    pdf_bytes.seek(0)
    return extract_text(pdf_bytes).split("\f")  # Divide por páginas

def extract_text_pdfminer_fixed(pdf_path):
    """Extrae texto y corrige el número de páginas"""
    text = extract_text(pdf_path)
    pages = text.split("\f")  # Separar páginas por el caracter de salto de página
    
    # Filtrar páginas vacías para evitar falsos positivos
    pages = [p for p in pages if p.strip()]
    
    return pages  # Devuelve el array de páginas

def extract_text_tesseract(pdf_bytes):
    """Extraer texto de imágenes escaneadas usando Tesseract OCR"""
    pdf_bytes.seek(0)
    images = convert_from_bytes(pdf_bytes.read())  # Convertir PDF en imágenes
    return [pytesseract.image_to_string(img) for img in images]

def extract_text_combined(pdf_file):
    """Convierte el archivo a BytesIO y almacena los textos en 5 arrays diferentes"""
    pdf_bytes = convert_uploaded_file_to_bytesio(pdf_file)

    print('generando pymupdf...')
    text_pymupdf = extract_text_pymupdf(BytesIO(pdf_bytes.getvalue()))
    print('generando pdfplumber...')
    text_pdfplumber = extract_text_pdfplumber(BytesIO(pdf_bytes.getvalue()))
    print('generando pypdf2...')
    text_pypdf2 = extract_text_pypdf2(BytesIO(pdf_bytes.getvalue()))
    print('generando pdfminer...')
    text_pdfminer = extract_text_pdfminer_fixed(BytesIO(pdf_bytes.getvalue()))
    print('generando tesseract...')
    text_tesseract = extract_text_tesseract(BytesIO(pdf_bytes.getvalue()))

    return text_pymupdf, text_pdfplumber, text_pypdf2, text_pdfminer, text_tesseract

import openai
from django.conf import settings

def extraer_texto_pdf(file, id):
    text_pymupdf, text_pdfplumber, text_pypdf2, text_pdfminer, text_tesseract = extract_text_combined(file)

    file.close()

    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    respuesta = ''
    
    for i in range(len(text_pdfminer)):
        text = '-¿!11441165473941=(-' + text_pymupdf[i] + '-¿!11441165473941=(-' + text_pdfplumber[i] + '-¿!11441165473941=(-' + text_pypdf2[i] + '-¿!11441165473941=(-' + text_pdfminer[i] + '-¿!11441165473941=(-' + text_tesseract[i]
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo-0125",
                messages=[
                    {"role": "system", "content": "He usado 5 librerías para extraer el texto de un pdf. Los 5 resultados son los siguientes. Necesito que me des un texto limpio final usando la información de las 5 extracciones. No escribas nada más que el texto limpio final. La separación entre texto y texto es: '-¿!11441165473941=(-'"},
                    {"role": "user", "content": text},
                ],
                temperature=0.7
            )
            respuesta += response.choices[0].message.content
        except Exception as e:
            return f"Error en la solicitud a OpenAI: {str(e)}"

    return redirect(vista_tema, id)

# 🔹 Función para extraer texto de DOC/DOCX
def extraer_texto_doc(file):
    texto = ""
    doc = docx.Document(file)
    for para in doc.paragraphs:
        texto += para.text + "\n"
    return texto.strip()

from django.http import JsonResponse
from utils.openai_utils import generate_questions

from django.http import JsonResponse
from backend.quiz.tasks import tarea_pesada  # Importa la tarea de Celery

def pruebas(request):
    tarea_pesada.delay()  # Ejecuta la tarea en segundo plano con Celery
    return JsonResponse({"message": "Tarea iniciada en segundo plano."})
    # try:
    #     instructions = "He usado 5 librerías para extraer el texto de un pdf. Los 5 resultados son los siguientes. Necesito que me des un texto limpio final usando la información de las 5 extracciones. No escribas nada más que el texto limpio final."
    #     theme_text = "Texto 1:"
    #     result = generate_questions(theme_text, instructions)
    #     return JsonResponse({"result": result})
    # except Exception as e:
    #     return JsonResponse({"error": str(e)}, status=500)
