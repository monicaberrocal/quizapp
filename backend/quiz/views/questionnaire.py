# en quiz/views.py
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from ..models import Asignatura, ProgresoTest, Tema, Pregunta, Respuesta
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
        
        try:
            test = ProgresoTest.objects.get(
                usuario=request.user,
                tipo=tipo,
                filtro=filtro,
                id_contenido=id,
                completado=False
            )
            indice_actual = test.pregunta_actual
            pregunta_id = test.preguntas_id[indice_actual]
            pregunta_actual = Pregunta.objects.get(id=pregunta_id)
        except ProgresoTest.DoesNotExist:
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
            
            ids_preguntas = list(preguntas.values_list('id', flat=True))
            test = ProgresoTest.objects.create(
                usuario=request.user,
                tipo=tipo,
                filtro=filtro,
                id_contenido=id,
                preguntas_id=ids_preguntas,
            )
            pregunta_actual = preguntas[test.pregunta_actual]
                   
        
        pregunta_serializada = PreguntaSerializer(pregunta_actual).data
        respuestas = pregunta_serializada.get('respuestas', [])
        random.shuffle(respuestas)
        pregunta_serializada['respuestas'] = respuestas
        pregunta_serializada['indice'] = test.pregunta_actual

        return Response({
            'pregunta_actual': pregunta_serializada,
            'total': len(test.preguntas_id),
            'test_id': test.id
        }, status=status.HTTP_200_OK)



    def post(self, request):
        pregunta_id = request.data.get('pregunta_id')
        respuesta_id = request.data.get('respuesta_id')
        test_id = request.data.get('test_id')

        if not pregunta_id or not respuesta_id or not test_id:
            return Response({'error': 'Datos incompletos'}, status=status.HTTP_400_BAD_REQUEST)

        pregunta = get_object_or_404(Pregunta, id=pregunta_id)
        respuesta_seleccionada = get_object_or_404(Respuesta, id=respuesta_id)
        test = get_object_or_404(ProgresoTest, id=test_id)

        respuesta_correcta = pregunta.respuesta_correcta
        correcto = respuesta_seleccionada.id == respuesta_correcta.id

        if correcto:
            if pregunta.fallos > 0:
                pregunta.fallos -= 1
            test.respuestas_correctas = test.respuestas_correctas + 1
        else:
            pregunta.fallos += 1

        test.respondidas.append(respuesta_id)
        test.totalRespondidas = test.totalRespondidas + 1
        test.pregunta_actual = test.pregunta_actual + 1
        test.save()
        
        pregunta.respondida += 1
        pregunta.save()
        
        pregunta_actual = Pregunta.objects.get(id=test.preguntas_id[test.pregunta_actual])
        pregunta_serializada = PreguntaSerializer(pregunta_actual).data
        respuestas = pregunta_serializada.get('respuestas', [])
        random.shuffle(respuestas)
        pregunta_serializada['respuestas'] = respuestas
        pregunta_serializada['indice'] = test.pregunta_actual

        return Response({
            'pregunta_actual': pregunta_serializada
        }, status=status.HTTP_200_OK)


@permission_classes([IsAuthenticated])
class FinalizarTestView(APIView):
    def get(self, request, test_id):
        test = get_object_or_404(ProgresoTest, id=test_id)

        total_respondidas = test.totalRespondidas
        respuestas_correctas = test.respuestas_correctas
        fallos = total_respondidas - respuestas_correctas
        
        test.completado = True
        test.finalizado_en =  timezone.now()

        return Response({
            'total_respondidas': total_respondidas,
            'respuestas_correctas': respuestas_correctas,
            'fallos': fallos,
        }, status=status.HTTP_200_OK)
