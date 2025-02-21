
# Django imports
from django.db import transaction
from django.http import JsonResponse

# Django REST framework imports
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Local imports (models and serializers)
from ..models import Pregunta, Respuesta
from ..serializers.serializers import (
    PreguntaSerializer
)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def crear_pregunta_api(request):
    serializer = PreguntaSerializer(data=request.data)

    if serializer.is_valid():
        tema = serializer.validated_data["tema"]

        # 📌 Validación: El usuario solo puede crear preguntas en sus propias asignaturas
        if tema.asignatura.usuario != request.user:
            return Response(
                {"error": "No tienes permiso para agregar preguntas a este tema."},
                status=status.HTTP_403_FORBIDDEN
            )

        pregunta = serializer.save()
        return Response(PreguntaSerializer(pregunta).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE", "PUT"])
@permission_classes([IsAuthenticated])
def pregunta_api(request, pregunta_id):
    try:
        pregunta = Pregunta.objects.get(
            id=pregunta_id, tema__asignatura__usuario=request.user)
    except Pregunta.DoesNotExist:
        return Response({"error": "Pregunta no encontrada o no tienes permiso."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        pregunta.delete()
        return Response({"message": "Pregunta eliminada correctamente."}, status=status.HTTP_204_NO_CONTENT)

    elif request.method == "PUT":
        # return Response({"message": "Pregunta eliminada correctamente."}, status=status.HTTP_204_NO_CONTENT)
        return pregunta_api_put(request.data, pregunta)


def pregunta_api_put(data, pregunta):
    try:
        with transaction.atomic():  # Asegura consistencia en la base de datos en caso de error
            # Actualizar los campos editables de la pregunta
            if "texto" in data:
                pregunta.texto = data["texto"]
            if "ayuda" in data:
                pregunta.ayuda = data["ayuda"]
                
            respuestas_actuales = list(pregunta.respuestas.all())

            # Manejo de respuestas
            if "respuestas" in data:
                nuevas_respuestas = data["respuestas"]

                # Actualizar respuestas existentes o crear nuevas
                for idx, respuesta_data in enumerate(nuevas_respuestas):
                    # Editar respuesta existente
                    if "id" in respuesta_data and respuesta_data["id"]:
                        try:
                            respuesta = Respuesta.objects.get(
                                id=respuesta_data["id"], pregunta=pregunta)
                            respuesta.texto = respuesta_data["texto"]
                            respuesta.save()
                        except Respuesta.DoesNotExist:
                            return JsonResponse({"error": f"La respuesta con ID {respuesta_data['id']} no existe"}, status=400)
                    else:  # Crear nueva respuesta si no hay más de 10
                        if len(respuestas_actuales) + idx >= 10:
                            return JsonResponse({"error": "No se pueden agregar más de 10 respuestas"}, status=400)
                        nueva_respuesta = Respuesta.objects.create(
                            pregunta=pregunta, texto=respuesta_data["texto"])
                        respuestas_actuales.append(nueva_respuesta)

            if "respuestas_eliminadas" in data:
                if len(respuestas_actuales)-len(data["respuestas_eliminadas"]) < 2:
                    return JsonResponse({"error": "Debe haber al menos 2 respuestas"}, status=400)
                
                for respuesta in data["respuestas_eliminadas"]:
                    try:
                        respuesta_a_eliminar = Respuesta.objects.get(id=respuesta["id"], pregunta=pregunta)
                        respuesta_a_eliminar.delete()
                    except Respuesta.DoesNotExist:
                        return JsonResponse({"error": "No se ha encontrado la respuesta."}, status=400)
                        
            if "respuesta_correcta" in data:
                try:
                    respuesta_correcta = Respuesta.objects.get(id=data["respuesta_correcta"], pregunta=pregunta)
                    pregunta.respuesta_correcta = respuesta_correcta
                except Respuesta.DoesNotExist:
                    return JsonResponse({"error": "La respuesta correcta no existe para esta pregunta"}, status=400)

            pregunta.save()
            return Response(PreguntaSerializer(pregunta).data, status=status.HTTP_202_ACCEPTED)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
