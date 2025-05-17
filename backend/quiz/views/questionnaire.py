# en quiz/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from ..models import Asignatura, Tema, Pregunta, Respuesta
from ..serializers.questionnaire import PreguntaSerializer
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
import random
from ..models import ProgresoTest
from django.db.models import Exists, OuterRef
import json


@permission_classes([IsAuthenticated])
class QuestionnarieView(APIView):
    # def get(self, request):
    #     tipo = request.query_params.get('tipo')
    #     filtro = request.query_params.get('filtro')
    #     id = request.query_params.get('id')

    #     if not all([tipo, filtro, id]):
    #         return Response({'error': 'Parámetros inválidos'}, status=status.HTTP_400_BAD_REQUEST)

    #     preguntas = []

    #     if filtro == 'asignatura':
    #         asignatura = get_object_or_404(Asignatura, id=id)
    #         if tipo == 'estudiar':
    #             preguntas = Pregunta.objects.filter(
    #                 tema__asignatura=asignatura).order_by('respondida', '?')
    #         elif tipo == 'repasar':
    #             preguntas = Pregunta.objects.filter(
    #                 tema__asignatura=asignatura, fallos__gt=0).order_by('respondida', '?')

    #     elif filtro == 'tema':
    #         tema = get_object_or_404(Tema, id=id)
    #         if tipo == 'estudiar':
    #             preguntas = tema.preguntas.all().order_by('respondida', '?')
    #         elif tipo == 'repasar':
    #             preguntas = tema.preguntas.filter(
    #                 fallos__gt=0).order_by('respondida', '?')

    #     else:
    #         return Response({'error': 'Filtro inválido'}, status=status.HTTP_400_BAD_REQUEST)

    #     serializer = PreguntaSerializer(preguntas, many=True)
    #     preguntas_data = serializer.data

    #     for pregunta in preguntas_data:
    #         respuestas = pregunta.get('respuestas', [])
    #         random.shuffle(respuestas)
    #         pregunta['respuestas'] = respuestas

    #     return Response(preguntas_data, status=status.HTTP_200_OK)

    def get(self, request):
        tipo = request.query_params.get("tipo")
        filtro = request.query_params.get("filtro")
        filtro_id = request.query_params.get("id")

        if not all([tipo, filtro, filtro_id]):
            return Response({"error": "Parámetros inválidos"}, status=status.HTTP_400_BAD_REQUEST)

        filtro_id = int(filtro_id)

        # 🧠 Buscar progreso no completado
        progreso = (
            ProgresoTest.objects
            .filter(usuario=request.user, tipo=tipo, filtro=filtro_id, completado=False)
            .order_by("-creado_en")
            .first()
        )

        if not progreso:
            # 🧠 Si no hay, lo creamos
            preguntas_ids = self._get_preguntas_ids(tipo, filtro, filtro_id)
            if not preguntas_ids:
                return Response({"mensaje": "No hay preguntas disponibles."}, status=status.HTTP_200_OK)

            progreso = ProgresoTest.objects.create(
                usuario=request.user,
                tipo=tipo,
                filtro=filtro_id,
                preguntas_id=preguntas_ids,
            )

        if progreso.pregunta_actual >= len(progreso.preguntas_id):
            progreso.completado = True
            progreso.save()
            return Response({"mensaje": "Test finalizado"}, status=status.HTTP_200_OK)

        # Obtener pregunta actual
        pregunta_id = progreso.preguntas_id[progreso.pregunta_actual]
        pregunta = get_object_or_404(Pregunta, id=pregunta_id)
        serializer = PreguntaSerializer(pregunta)

        pregunta_data = serializer.data
        respuestas = pregunta_data.get("respuestas", [])
        random.shuffle(respuestas)
        pregunta_data["respuestas"] = respuestas

        return Response({
            "pregunta": pregunta_data,
            "numero_actual": progreso.pregunta_actual + 1,
            "total": len(progreso.preguntas_id),
        }, status=status.HTTP_200_OK)

    def _get_preguntas_ids(self, tipo, filtro, filtro_id):
        if filtro == "tema":
            qs = Pregunta.objects.filter(tema_id=filtro_id)
        elif filtro == "asignatura":
            qs = Pregunta.objects.filter(tema__asignatura_id=filtro_id)
        else:
            return []

        if tipo == "repasar":
            qs = qs.filter(fallos__gt=0)

        return list(qs.order_by("?").values_list("id", flat=True))

    # def post(self, request):
    #     pregunta_id = request.data.get('pregunta_id')
    #     respuesta_id = request.data.get('respuesta_id')

    #     if not pregunta_id or not respuesta_id:
    #         return Response({'error': 'Datos incompletos'}, status=status.HTTP_400_BAD_REQUEST)

    #     pregunta = get_object_or_404(Pregunta, id=pregunta_id)
    #     respuesta_seleccionada = get_object_or_404(Respuesta, id=respuesta_id)

    #     respuesta_correcta = pregunta.respuesta_correcta
    #     correcto = respuesta_seleccionada.id == respuesta_correcta.id

    #     if correcto:
    #         if pregunta.fallos > 0:
    #             pregunta.fallos -= 1
    #         request.session['respuestas_correctas'] = request.session.get(
    #             'respuestas_correctas', 0) + 1
    #     else:
    #         pregunta.fallos += 1

    #     request.session['total_respondidas'] = request.session.get(
    #         'total_respondidas', 0) + 1
    #     pregunta.respondida += 1
    #     pregunta.save()

    #     return Response({
    #         'correcto': correcto,
    #         'respuesta_correcta': respuesta_correcta.texto
    #     }, status=status.HTTP_200_OK)

    def post(self, request):
        pregunta_id = request.data.get("pregunta_id")
        respuesta_id = request.data.get("respuesta_id")
        tipo = request.data.get("tipo")
        filtro = request.data.get("filtro")
        filtro_id = request.data.get("id")

        if not all([pregunta_id, respuesta_id, tipo, filtro, filtro_id]):
            return Response({"error": "Datos incompletos"}, status=status.HTTP_400_BAD_REQUEST)

        filtro_id = int(filtro_id)

        progreso = (
            ProgresoTest.objects
            .filter(usuario=request.user, tipo=tipo, filtro=filtro_id, completado=False)
            .order_by("-creado_en")
            .first()
        )

        if not progreso:
            return Response({"error": "No hay progreso activo para este test"}, status=status.HTTP_404_NOT_FOUND)

        if progreso.pregunta_actual >= len(progreso.preguntas_id):
            progreso.completado = True
            progreso.save()
            return Response({"error": "Ya has completado este test"}, status=status.HTTP_400_BAD_REQUEST)

        pregunta_id_esperada = progreso.preguntas_id[progreso.pregunta_actual]
        if int(pregunta_id) != pregunta_id_esperada:
            return Response({"error": "Pregunta no esperada"}, status=status.HTTP_400_BAD_REQUEST)

        pregunta = get_object_or_404(Pregunta, id=pregunta_id)
        respuesta = get_object_or_404(Respuesta, id=respuesta_id)
        es_correcta = respuesta.id == pregunta.respuesta_correcta_id

        if es_correcta:
            if pregunta.fallos > 0:
                pregunta.fallos -= 1
            progreso.respuestas_correctas += 1
        else:
            pregunta.fallos += 1

        pregunta.respondida += 1
        pregunta.save()

        progreso.respondidas.append(pregunta.id)
        progreso.pregunta_actual += 1
        if progreso.pregunta_actual >= len(progreso.preguntas_id):
            progreso.completado = True
        progreso.save()

        return Response({
            "correcto": es_correcta,
            "respuesta_correcta": pregunta.respuesta_correcta.texto
        }, status=status.HTTP_200_OK)

@permission_classes([IsAuthenticated])
class FinalizarTestView(APIView):
    def get(self, request):
        tipo = request.query_params.get("tipo")
        filtro = request.query_params.get("filtro")
        filtro_id = request.query_params.get("id")

        if not all([tipo, filtro, filtro_id]):
            return Response({"error": "Faltan parámetros"}, status=status.HTTP_400_BAD_REQUEST)

        filtro_id = int(filtro_id)

        progreso = (
            ProgresoTest.objects
            .filter(usuario=request.user, tipo=tipo, filtro=filtro_id)
            .order_by("-creado_en")
            .first()
        )

        if not progreso:
            return Response({"error": "No hay progreso registrado."}, status=status.HTTP_404_NOT_FOUND)

        total_respondidas = len(progreso.respondidas)
        respuestas_correctas = progreso.respuestas_correctas
        fallos = total_respondidas - respuestas_correctas

        return Response({
            "total_respondidas": total_respondidas,
            "respuestas_correctas": respuestas_correctas,
            "fallos": fallos
        }, status=status.HTTP_200_OK)
