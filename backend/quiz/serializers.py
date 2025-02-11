from rest_framework import serializers
from .models import Pregunta
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from .models import CodigoActivacion
from .utils import send_activation_email
from .models import Asignatura
from .models import Tema
from rest_framework import serializers
from .models import Tema, Pregunta, Respuesta
from rest_framework import serializers
from .models import Pregunta, Respuesta, Tema

import os

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")  # 🔹 Variable de entorno para la URL de React

class RegistroUsuarioSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True, required=True, label="Confirmar contraseña")

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "password", "password2"]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Las contraseñas no coinciden."})

        try:
            validate_password(data["password"])
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": e.detail})

        return data

    def create(self, validated_data):
        validated_data.pop("password2")

        usuario = User.objects.create_user(**validated_data)

        activacion = CodigoActivacion.objects.get(usuario=usuario)
        token = activacion.token_activacion

        request = self.context.get("request")
        link_activacion = f"{FRONTEND_URL}/activar/{token}"

        send_activation_email(request, usuario, link_activacion)

        return usuario

class AsignaturaSerializer(serializers.ModelSerializer):
    tiene_preguntas = serializers.BooleanField(read_only=True)
    tiene_fallos = serializers.BooleanField(read_only=True)

    class Meta:
        model = Asignatura
        fields = ["id", "nombre", "tiene_preguntas", "tiene_fallos"]

class RespuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Respuesta
        fields = ["id", "texto"]

class PreguntaSerializer(serializers.ModelSerializer):
    respuestas = RespuestaSerializer(many=True)

    class Meta:
        model = Pregunta
        fields = ["id", "tema", "texto", "ayuda", "respuestas", "respuesta_correcta_id"]

    def validate(self, data):
        if not (1 <= data["respuesta_correcta"] <= 4):
            raise serializers.ValidationError({"respuesta_correcta": "El valor debe estar entre 1 y 4."})
        return data

    def create(self, validated_data):
        respuestas_data = validated_data.pop("respuestas")
        respuesta_correcta_index = validated_data.pop("respuesta_correcta") - 1
        pregunta = Pregunta.objects.create(**validated_data)

        respuestas = []
        for respuesta_data in respuestas_data:
            respuesta = Respuesta.objects.create(pregunta=pregunta, **respuesta_data)
            respuestas.append(respuesta)

        pregunta.respuesta_correcta = respuestas[respuesta_correcta_index]
        pregunta.save()

        return pregunta

class TemaPreguntasSerializer(serializers.ModelSerializer):
    preguntas = PreguntaSerializer(many=True, read_only=True)
    class Meta:
        model = Tema
        fields = ["id", "nombre", "preguntas"]

class TemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tema
        fields = ["id", "nombre"]