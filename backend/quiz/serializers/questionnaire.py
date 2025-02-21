# en quiz/serializers.py
from rest_framework import serializers
from ..models import Pregunta, Respuesta

class RespuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Respuesta
        fields = ['id', 'texto']

class PreguntaSerializer(serializers.ModelSerializer):
    respuestas = RespuestaSerializer(many=True)

    class Meta:
        model = Pregunta
        fields = ['id', 'texto', 'respuestas', 'respuesta_correcta']
