import json
import pandas as pd
import os
import base64

from django.http import JsonResponse, HttpResponse

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Asignatura, Pregunta, Tema, Respuesta
from ..serializers.serializers import (
    TemaPreguntasSerializer,
    TemaSerializer
)
from ..tasks import process_uploaded_file_task


@api_view(["GET", "DELETE", "PUT"])
@permission_classes([IsAuthenticated])
def tema_api(request, tema_id):
    try:
        tema = Tema.objects.get(id=tema_id, asignatura__usuario=request.user)
    except Tema.DoesNotExist:
        return Response({"error": "Tema no encontrado o no tienes permiso."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response({"tema": TemaPreguntasSerializer(tema).data}, status=200)

    elif request.method == "DELETE":
        tema.delete()
        return Response({"message": "Tema eliminado correctamente."}, status=status.HTTP_204_NO_CONTENT)

    elif request.method == "PUT":
        nuevo_nombre = request.data.get("nombre", "").strip()

        if not nuevo_nombre:
            return Response({"error": "El nombre no puede estar vacío."}, status=status.HTTP_400_BAD_REQUEST)

        tema.nombre = nuevo_nombre
        tema.save()

        return Response({"nombre": tema.nombre}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def tema_api_detalle(request, tema_id):
    try:
        tema = Tema.objects.get(id=tema_id, asignatura__usuario=request.user)
    except Tema.DoesNotExist:
        return Response({"error": "Tema no encontrado o no tienes permiso."}, status=status.HTTP_404_NOT_FOUND)
    return Response({"tema": TemaSerializer(tema).data}, status=200)


@api_view(["POST"])
def crear_tema_api(request):
    asignatura_id = request.data.get("asignatura_id")
    nombre = request.data.get("nombre", "").strip()
    if not nombre:
        return Response({"error": "El nombre del tema no puede estar vacío."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        asignatura = Asignatura.objects.get(
            id=asignatura_id, usuario=request.user)
    except Asignatura.DoesNotExist:
        return Response({"error": "Asignatura no encontrada o no tienes permiso."}, status=status.HTTP_404_NOT_FOUND)
    tema = Tema.objects.create(nombre=nombre, asignatura=asignatura)
    return Response(TemaSerializer(tema).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def descargar_tema(request, tema_id):
    formato = request.GET.get("formato", "json")

    try:
        tema = Tema.objects.get(id=tema_id, asignatura__usuario=request.user)
    except Tema.DoesNotExist:
        return JsonResponse({"error": "Tema no encontrado o no tienes permiso."}, status=404)

    tema_data = generar_json_tema(tema=tema)

    if formato == "json":
        return JsonResponse(tema_data, json_dumps_params={"indent": 2})

    elif formato == "excel":
        return generar_excel_tema(tema_data)

    else:
        return JsonResponse({"error": "Formato no válido. Usa ?formato=json o ?formato=excel"}, status=400)


def generar_json_tema(tema):
    preguntas = Pregunta.objects.filter(
        tema=tema).prefetch_related("respuestas")
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
        for pregunta in preguntas
    ]

    tema_data = {
        "nombre": tema.nombre,
        "preguntas": preguntas_data
    }

    return tema_data


def generar_excel_tema(tema_data):
    """
    Genera un archivo Excel con la estructura del tema.
    """
    # 📌 Crear DataFrame para las preguntas
    data = []

    for pregunta in tema_data["preguntas"]:
        fila = [
            pregunta["texto"],  # Nombre de la pregunta
            pregunta["ayuda"],  # Ayuda
        ]
        # Respuestas (primera es la correcta)
        fila.extend([r["texto"] for r in pregunta["respuestas"]])
        data.append(fila)

    # 📌 Obtener el máximo de respuestas para definir las columnas dinámicamente
    max_respuestas = max(len(p["respuestas"]) for p in tema_data["preguntas"])
    columnas = ["Pregunta", "Ayuda"] + \
        [f"Respuesta {i+1}" for i in range(max_respuestas)]

    # 📌 Crear DataFrame con preguntas
    df = pd.DataFrame(data, columns=columnas)

    # 📌 Crear el archivo Excel
    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = f'attachment; filename="{tema_data["nombre"]}.xlsx"'

    with pd.ExcelWriter(response, engine="xlsxwriter") as writer:
        # 📌 Las preguntas comienzan en la segunda fila
        df.to_excel(writer, sheet_name="Preguntas", index=False, startrow=1)
        worksheet = writer.sheets["Preguntas"]

        # 📌 Escribir el título del tema en A1
        worksheet.write(0, 0, tema_data["nombre"])

        writer.close()

    return response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def importar_tema(request, asignatura_id):
    """
    Importa un tema en formato JSON o Excel.
    """
    archivo = request.FILES.get("archivo")
    # 📌 Se elige entre "json" o "excel"
    formato = request.GET.get("formato", "json")

    if not archivo:
        return JsonResponse({"error": "No se ha proporcionado ningún archivo."}, status=400)

    try:
        asignatura = Asignatura.objects.get(
            id=asignatura_id, usuario=request.user)
    except Asignatura.DoesNotExist:
        return JsonResponse({"error": "Asignatura no encontrada o no tienes permiso."}, status=404)

    if formato == "json":
        return importar_tema_json(archivo, asignatura)
    elif formato == "excel":
        return importar_tema_excel(archivo, asignatura)
    else:
        return JsonResponse({"error": "Formato no válido. Usa ?formato=json o ?formato=excel"}, status=400)


def importar_tema_json(archivo, asignatura):
    """
    Importa un tema desde un archivo JSON.
    """
    try:
        tema_data = json.load(archivo)
    except json.JSONDecodeError:
        return JsonResponse({"error": "El archivo JSON no es válido."}, status=400)

    # 📌 Crear el tema
    tema = Tema.objects.create(
        nombre=tema_data["nombre"], asignatura=asignatura)

    importar_preguntas_json(tema_data=tema_data, tema=tema)

    return JsonResponse({"message": f"Tema '{tema.nombre}' importado correctamente."}, status=201)


def importar_tema_excel(archivo, asignatura):
    """
    Importa un tema desde un archivo Excel.
    """
    try:
        df = pd.read_excel(archivo, sheet_name="Preguntas",
                           header=None)  # 📌 Leer sin encabezados
    except Exception as e:
        return JsonResponse({"error": f"Error al leer el archivo Excel: {str(e)}"}, status=400)

    if df.empty or df.shape[1] < 3:  # 📌 Mínimo: Pregunta, Ayuda, Respuesta 1
        return JsonResponse({"error": "El archivo Excel no tiene el formato esperado."}, status=400)

    # 📌 Extraer el nombre del tema desde la celda A1 (fila 0, columna 0)
    tema_nombre = df.iloc[0, 0]

    # 📌 Crear el tema en la base de datos
    tema = Tema.objects.create(nombre=tema_nombre, asignatura=asignatura)

    importar_preguntas_excel(tema, df)

    return JsonResponse({"message": f"Tema '{tema.nombre}' importado correctamente."}, status=201)


def importar_preguntas_json(tema_data, tema):
    # 📌 Crear las preguntas
    for pregunta_data in tema_data["preguntas"]:
        pregunta = Pregunta.objects.create(
            texto=pregunta_data["texto"],
            ayuda=pregunta_data["ayuda"],
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


def importar_preguntas_excel(tema, df):
    # 📌 Eliminar la primera fila con el título del tema, dejando solo las preguntas
    # df = df.iloc[1:].reset_index(drop=True)

    # 📌 Iterar sobre las preguntas
    for _, row in df.iterrows():
        pregunta_texto = row.iloc[0]  # 📌 Primera columna es la pregunta
        ayuda = row.iloc[1]  # 📌 Segunda columna es la ayuda
        # 📌 Tomar las respuestas de la fila
        respuestas = row.iloc[2:].dropna().tolist()

        if not pregunta_texto or not respuestas:
            continue  # 📌 Saltar filas vacías o preguntas sin respuestas

        pregunta = Pregunta.objects.create(
            texto=pregunta_texto,
            ayuda=ayuda,
            tema=tema  # 📌 La primera respuesta siempre es la correcta
        )

        # 📌 Crear respuestas
        respuestas_formatted = []
        for respuesta_texto in respuestas:
            respuesta = Respuesta.objects.create(
                texto=respuesta_texto,
                pregunta=pregunta
            )
            respuestas_formatted.append(respuesta)

        pregunta.respuesta_correcta = respuestas_formatted[0]
        pregunta.save()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def importar_preguntas(request, tema_id):
    """
    Importar preguntas a un tema en formato JSON o Excel.
    """
    archivo = request.FILES.get("archivo")
    formato = request.GET.get("formato", "json")

    if not archivo:
        return JsonResponse({"error": "No se ha proporcionado ningún archivo."}, status=400)

    try:
        tema = Tema.objects.get(id=tema_id, asignatura__usuario=request.user)
    except Tema.DoesNotExist:
        return JsonResponse({"error": "Tema no encontrado o no tienes permiso."}, status=404)

    if formato == "json":
        return importar_preguntas_tema_json(archivo, tema)
    elif formato == "excel":
        return importar_preguntas_tema_excel(archivo, tema)
    else:
        return JsonResponse({"error": "Formato no válido. Usa ?formato=json o ?formato=excel"}, status=400)


def importar_preguntas_tema_json(archivo, tema):
    """
    Importar preguntas a un tema desde un archivo JSON.
    """
    try:
        tema_data = json.load(archivo)
    except json.JSONDecodeError:
        return JsonResponse({"error": "El archivo JSON no es válido."}, status=400)

    importar_preguntas_json(tema_data=tema_data, tema=tema)

    return JsonResponse({"message": f"Preguntas importadas al tema '{tema.nombre}' correctamente."}, status=201)


def importar_preguntas_tema_excel(archivo, tema):
    """
    Importar preguntas a un tema desde un archivo Excel.
    """
    try:
        # 📌 Leer TODAS las hojas del archivo
        excel_data = pd.read_excel(archivo, sheet_name=None)

        # 📌 Verificar si "Preguntas" existe, si no, usar la primera hoja
        sheet_name = "Preguntas" if "Preguntas" in excel_data else list(excel_data.keys())[
            0]

        # 📌 Cargar la hoja seleccionada
        df = excel_data[sheet_name]

    except Exception as e:
        return Response({"error": f"Error al leer el archivo Excel: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    if df.empty or df.shape[1] < 3:  # 📌 Mínimo: Pregunta, Ayuda, Respuesta 1
        return JsonResponse({"error": "El archivo Excel no tiene el formato esperado."}, status=400)

    importar_preguntas_excel(tema, df)

    return JsonResponse({"message": f"Preguntas importadas al tema '{tema.nombre}' correctamente."}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generar_preguntas(request, tema_id):
    archivo = request.FILES.get("archivo")
    
    if not archivo:
        return JsonResponse({"error": "No se ha proporcionado ningún archivo."}, status=400)
    
    try:
        tema = Tema.objects.get(id=tema_id, asignatura__usuario=request.user)
    except Tema.DoesNotExist:
        return JsonResponse({"error": "Tema no encontrado o no tienes permiso."}, status=404)
    
    file_extension = os.path.splitext(archivo.name)[1].lower()
    
    if file_extension not in [".pdf", ".doc", ".docx"]:
        return JsonResponse({"success": False, "error": "Formato no soportado"}, status=400)
    

    archivo_data = archivo.read()
    # text_list = extract_text_with_pymupdf(archivo_data)
    # character_count = sum(len(page) for page in text_list)
    # user = request.user
    # usage = user.openai_usage
    # if not usage.can_use(character_count):
    #     return JsonResponse({"success": False, "message": "No tienes suficientes créditos.", "credits": usage.left_use()}, status=200)

    archivo_base64 = base64.b64encode(archivo_data).decode('utf-8')
    
    tema = Tema.objects.get(id=tema_id)
    user_email = tema.asignatura.usuario.email
    
    process_uploaded_file_task.delay(tema_id, archivo_base64, file_extension, user_email)
    
    return JsonResponse({"success": True, "message": "El archivo se está procesando en segundo plano."}, status=200)
