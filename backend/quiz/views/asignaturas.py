import json
import pandas as pd

# Django imports
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Q, Exists, OuterRef

# Django REST framework imports
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Local imports (models and serializers)
from .temas import generar_json_tema
from ..models import Asignatura, Pregunta, Tema, Respuesta
from ..serializers.serializers import AsignaturaSerializer, TemaSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def asignaturas_api(request):
    if request.method == "GET":
        asignaturas = (
            Asignatura.objects.filter(usuario=request.user)
            .prefetch_related("temas")
            .annotate(
                tiene_preguntas=Exists(
                    Tema.objects.filter(
                        asignatura=OuterRef("pk"), preguntas__isnull=False
                    )
                ),
                tiene_fallos=Exists(
                    Tema.objects.filter(
                        asignatura=OuterRef("pk"), preguntas__fallos__gt=0
                    )
                ),
            )
            .values("id", "nombre", "tiene_preguntas", "tiene_fallos")
        )

        temas = (
            Tema.objects.filter(asignatura__usuario=request.user)
            .annotate(
                tiene_preguntas=Exists(
                    Pregunta.objects.filter(tema=OuterRef("pk"))),
                tiene_fallos=Exists(
                    Pregunta.objects.filter(tema=OuterRef("pk"), fallos__gt=0)
                ),
            )
            .values("id", "nombre", "asignatura_id", "tiene_preguntas", "tiene_fallos")
        )

        temas_dict = {}
        for tema in temas:
            temas_dict.setdefault(tema["asignatura_id"], []).append(
                {
                    "id": tema["id"],
                    "nombre": tema["nombre"],
                    "tiene_preguntas": tema["tiene_preguntas"],
                    "tiene_fallos": tema["tiene_fallos"],
                }
            )

        data = []
        for asignatura in asignaturas:
            data.append(
                {
                    "id": asignatura["id"],
                    "nombre": asignatura["nombre"],
                    "tiene_preguntas": asignatura["tiene_preguntas"],
                    "tiene_fallos": asignatura["tiene_fallos"],
                    "temas": temas_dict.get(asignatura["id"], []),
                }
            )

        return Response(data)

    elif request.method == "POST":
        serializer = AsignaturaSerializer(data=request.data)
        if serializer.is_valid():
            asignatura = serializer.save(usuario=request.user)
            return Response(
                AsignaturaSerializer(
                    asignatura).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "DELETE", "PUT"])
@permission_classes([IsAuthenticated])
def asignatura_api(request, asignatura_id):
    try:
        asignatura = Asignatura.objects.get(
            id=asignatura_id, usuario=request.user)
    except Asignatura.DoesNotExist:
        return Response(
            {"error": "Asignatura no encontrada o no tienes permiso."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        asignatura = (
            Asignatura.objects.filter(id=asignatura_id, usuario=request.user)
            .annotate(
                tiene_preguntas=Exists(
                    Tema.objects.filter(asignatura=OuterRef(
                        "pk"), preguntas__isnull=False)
                ),
                numero_fallos=Count(
                    'temas__preguntas',
                    filter=Q(temas__preguntas__fallos__gt=0),
                    distinct=True
                ),
            )
            .values("id", "nombre", "tiene_preguntas", "numero_fallos")
            .first()
        )

        if not asignatura:
            return Response({"error": "Asignatura no encontrada."}, status=404)

        temas = list(
            Tema.objects.filter(asignatura_id=asignatura_id)
            .annotate(
                tiene_preguntas=Exists(
                    Pregunta.objects.filter(tema=OuterRef("pk"))),
                tiene_fallos=Exists(Pregunta.objects.filter(
                    tema=OuterRef("pk"), fallos__gt=0)),
            )
            .values("id", "nombre", "tiene_preguntas", "tiene_fallos")
        )

        data = {
            "id": asignatura["id"],
            "nombre": asignatura["nombre"],
            "tiene_preguntas": asignatura["tiene_preguntas"],
            "tiene_fallos": asignatura["numero_fallos"] > 0,
            "numero_fallos": asignatura["numero_fallos"],
            "temas": temas,  # Ya es una lista optimizada
        }

        return Response(data)

    elif request.method == "DELETE":
        asignatura.delete()
        return Response(
            {"message": "Asignatura eliminada correctamente."},
            status=status.HTTP_204_NO_CONTENT,
        )

    elif request.method == "PUT":
        nuevo_nombre = request.data.get("nombre", "").strip()
        if not nuevo_nombre:
            return Response(
                {"error": "El nombre no puede estar vacío."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        asignatura.nombre = nuevo_nombre
        asignatura.save()
        return Response({"nombre": asignatura.nombre}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def exportar_asignatura(request, asignatura_id):
    """
    Exporta una asignatura completa en formato JSON o Excel.
    """
    formato = request.GET.get(
        "formato", "json")  # Elegir entre "json" o "excel"

    try:
        asignatura = Asignatura.objects.get(
            id=asignatura_id, usuario=request.user)
    except Asignatura.DoesNotExist:
        return JsonResponse(
            {"error": "Asignatura no encontrada o no tienes permiso."}, status=404
        )

    # 📌 Obtener los temas y sus preguntas
    temas = Tema.objects.filter(asignatura=asignatura).prefetch_related(
        "preguntas__respuestas"
    )

    # 📌 Construcción de la estructura de datos
    asignatura_data = {"nombre": asignatura.nombre, "temas": []}

    for tema in temas:
        asignatura_data["temas"].append(generar_json_tema(tema))

    # 📌 Si el formato es JSON
    if formato == "json":
        return JsonResponse(asignatura_data, json_dumps_params={"indent": 2})

    # 📌 Si el formato es Excel
    elif formato == "excel":
        return generar_excel_asignatura(asignatura_data)

    else:
        return JsonResponse(
            {"error": "Formato no válido. Usa ?formato=json o ?formato=excel"},
            status=400,
        )


def generar_excel_asignatura(asignatura_data):
    """
    Genera un archivo Excel con la estructura de la asignatura.
    """
    # 📌 Crear una lista para almacenar todas las filas
    data = []

    # 📌 Insertar el título de la asignatura en la primera fila
    # 📌 Primera fila: Título de la asignatura
    data.append([asignatura_data["nombre"]])
    data.append([])  # 📌 Fila vacía para separar del contenido

    # 📌 Iterar sobre cada tema y sus preguntas
    for tema in asignatura_data["temas"]:
        data.append([f"Tema: {tema['nombre']}"])  # 📌 Título del tema
        data.append(
            [
                "Pregunta",
                "Ayuda",
                "Respuesta 1 (correcta)",
                "Respuesta 2",
                "Respuesta 3",
                "Respuesta 4",
            ]
        )  # 📌 Encabezados

        for pregunta in tema["preguntas"]:
            fila = [
                pregunta["texto"],  # 📌 Pregunta
                pregunta["ayuda"],  # 📌 Ayuda
            ]
            # 📌 Respuestas (primera siempre es la correcta)
            fila.extend([r["texto"] for r in pregunta["respuestas"]])
            data.append(fila)

        data.append([])  # 📌 Fila vacía para separar temas

    # 📌 Crear el DataFrame
    df = pd.DataFrame(data)

    # 📌 Crear el archivo Excel
    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response[
        "Content-Disposition"
    ] = f'attachment; filename="{asignatura_data["nombre"]}.xlsx"'

    with pd.ExcelWriter(response, engine="xlsxwriter") as writer:
        df.to_excel(
            writer, sheet_name="Asignatura", index=False, header=False
        )  # 📌 Sin encabezados
        worksheet = writer.sheets["Asignatura"]

        # 📌 Formato: Hacer que el título de la asignatura sea grande y centrado
        worksheet.merge_range(
            "A1:F1",
            asignatura_data["nombre"],
            writer.book.add_format(
                {"bold": True, "align": "center", "font_size": 14}),
        )

        writer.close()

    return response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def importar_asignatura(request):
    archivo = request.FILES.get("archivo")
    formato = request.GET.get("formato", "json")

    if not archivo:
        return JsonResponse(
            {"error": "No se ha proporcionado ningún archivo."}, status=400
        )

    if formato == "json":
        return importar_asignatura_json(archivo, request.user)
    elif formato == "excel":
        return importar_asignatura_excel(archivo, request.user)
    else:
        return JsonResponse(
            {"error": "Formato no válido. Usa ?formato=json o ?formato=excel"},
            status=400,
        )


def importar_asignatura_json(archivo, usuario):
    try:
        asignatura_data = json.load(archivo)
    except json.JSONDecodeError:
        return JsonResponse({"error": "El archivo JSON no es válido."}, status=400)

    # 📌 Crear la asignatura
    asignatura = Asignatura.objects.create(
        nombre=asignatura_data["nombre"], usuario=usuario
    )

    # 📌 Crear los temas
    for tema_data in asignatura_data["temas"]:
        tema = Tema.objects.create(
            nombre=tema_data["nombre"], asignatura=asignatura)

        # 📌 Crear las preguntas
        for pregunta_data in tema_data["preguntas"]:
            pregunta = Pregunta.objects.create(
                texto=pregunta_data["texto"],
                ayuda=pregunta_data["ayuda"],
                tema=tema,
                respuesta_correcta=1,  # 📌 La primera respuesta siempre es la correcta
            )

            # 📌 Crear las respuestas
            for respuesta_data in pregunta_data["respuestas"]:
                Respuesta.objects.create(
                    texto=respuesta_data["texto"], pregunta=pregunta
                )

    return JsonResponse(
        {"message": f"Asignatura '{asignatura.nombre}' importada correctamente."},
        status=201,
    )


def importar_asignatura_excel(archivo, usuario):
    try:
        df = pd.read_excel(
            archivo, sheet_name="Asignatura", header=None
        )  # 📌 Leer sin encabezados
    except Exception as e:
        return JsonResponse(
            {"error": f"Error al leer el archivo Excel: {str(e)}"}, status=400
        )

    if df.empty:
        return JsonResponse(
            {"error": "El archivo Excel está vacío o no tiene el formato esperado."},
            status=400,
        )

    # 📌 Extraer el nombre de la asignatura desde la celda A1
    asignatura_nombre = df.iloc[0, 0]

    # 📌 Crear la asignatura en la base de datos
    asignatura = Asignatura.objects.create(
        nombre=asignatura_nombre, usuario=usuario)

    tema = None  # Variable para almacenar el tema actual

    # 📌 Iterar sobre las filas del DataFrame
    # 📌 Saltamos la primera fila (asignatura) y la segunda fila (vacía)
    for _, row in df.iloc[2:].iterrows():
        # 📌 Si encontramos un nuevo tema
        if pd.isna(row.iloc[0]) or row.iloc[0].startswith("Tema:"):
            tema = Tema.objects.create(
                nombre=row.iloc[0].replace("Tema: ", ""), asignatura=asignatura
            )
        elif tema:
            # 📌 Crear pregunta
            pregunta_texto = row.iloc[0]
            ayuda = row.iloc[1]
            # 📌 Obtener respuestas sin NaN
            respuestas = row.iloc[2:].dropna().tolist()

            if not pregunta_texto or not respuestas:
                continue  # 📌 Saltar preguntas vacías

            pregunta = Pregunta.objects.create(
                texto=pregunta_texto,
                ayuda=ayuda,
                tema=tema,
                respuesta_correcta=1,  # 📌 La primera respuesta siempre es la correcta
            )

            # 📌 Crear respuestas
            for respuesta_texto in respuestas:
                Respuesta.objects.create(
                    texto=respuesta_texto, pregunta=pregunta)

    return JsonResponse(
        {"message": f"Asignatura '{asignatura.nombre}' importada correctamente."},
        status=201,
    )
