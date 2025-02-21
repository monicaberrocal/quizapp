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


@permission_classes([IsAuthenticated])
class QuestionnarieView(APIView):
    def get(self, request):
        tipo = request.query_params.get('tipo')
        filtro = request.query_params.get('filtro')
        id = request.query_params.get('id')

        if not all([tipo, filtro, id]):
            return Response({'error': 'Parámetros inválidos'}, status=status.HTTP_400_BAD_REQUEST)

        preguntas = []

        if filtro == 'asignatura':
            asignatura = get_object_or_404(Asignatura, id=id)
            if tipo == 'estudiar':
                preguntas = Pregunta.objects.filter(
                    tema__asignatura=asignatura).order_by('respondida', '?')
            elif tipo == 'repasar':
                preguntas = Pregunta.objects.filter(
                    tema__asignatura=asignatura, fallos__gt=0).order_by('respondida', '?')

        elif filtro == 'tema':
            tema = get_object_or_404(Tema, id=id)
            if tipo == 'estudiar':
                preguntas = tema.preguntas.all().order_by('respondida', '?')
            elif tipo == 'repasar':
                preguntas = tema.preguntas.filter(
                    fallos__gt=0).order_by('respondida', '?')

        else:
            return Response({'error': 'Filtro inválido'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PreguntaSerializer(preguntas, many=True)
        preguntas_data = serializer.data

        for pregunta in preguntas_data:
            respuestas = pregunta.get('respuestas', [])
            random.shuffle(respuestas)
            pregunta['respuestas'] = respuestas

        return Response(preguntas_data, status=status.HTTP_200_OK)

    def post(self, request):
        pregunta_id = request.data.get('pregunta_id')
        respuesta_id = request.data.get('respuesta_id')

        if not pregunta_id or not respuesta_id:
            return Response({'error': 'Datos incompletos'}, status=status.HTTP_400_BAD_REQUEST)

        pregunta = get_object_or_404(Pregunta, id=pregunta_id)
        respuesta_seleccionada = get_object_or_404(Respuesta, id=respuesta_id)

        respuesta_correcta = pregunta.respuesta_correcta
        correcto = respuesta_seleccionada.id == respuesta_correcta.id

        if correcto:
            if pregunta.fallos > 0:
                pregunta.fallos -= 1
            request.session['respuestas_correctas'] = request.session.get(
                'respuestas_correctas', 0) + 1
        else:
            pregunta.fallos += 1

        request.session['total_respondidas'] = request.session.get(
            'total_respondidas', 0) + 1
        pregunta.respondida += 1
        pregunta.save()

        return Response({
            'correcto': correcto,
            'respuesta_correcta': respuesta_correcta.texto
        }, status=status.HTTP_200_OK)


@permission_classes([IsAuthenticated])
class FinalizarTestView(APIView):
    def get(self, request):
        total_respondidas = request.session.get('total_respondidas', 0)
        respuestas_correctas = request.session.get('respuestas_correctas', 0)
        fallos = total_respondidas - respuestas_correctas

        request.session.pop('respuestas_correctas', None)
        request.session.pop('total_respondidas', None)

        return Response({
            'total_respondidas': total_respondidas,
            'respuestas_correctas': respuestas_correctas,
            'fallos': fallos,
        }, status=status.HTTP_200_OK)
