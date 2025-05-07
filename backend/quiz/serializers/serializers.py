from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from ..models import Asignatura, Tema, Pregunta, Respuesta, CodigoActivacion
from ..utils import send_activation_email
import os
from rest_framework.validators import UniqueValidator


FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")  # 🔹 Variable de entorno para la URL de React

class RegistroUsuarioSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True, required=True, label="Confirmar contraseña")
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Este correo ya está registrado.")]
    )
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Este nombre de usuario ya está en uso.")]
    )

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "password", "password2"]
        extra_kwargs = {
            "password": {"write_only": True},
        }
    
    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Las contraseñas no coinciden."})
        
        username = data["username"]

        if User.objects.filter(email=username).exists():
            raise serializers.ValidationError({"username": "Este nombre de usuario coincide con un correo ya registrado."})

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

class RespuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Respuesta
        fields = ["id", "texto"]

class RespuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Respuesta
        fields = ["id", "texto"]

class PreguntaSerializer(serializers.ModelSerializer):
    respuestas = RespuestaSerializer(many=True)

    class Meta:
        model = Pregunta
        fields = ["id", "tema", "texto", "ayuda", "respuestas", "fallos", "respondida", "respuesta_correcta"]

    def validate(self, data):
        respuestas_data = data.get("respuestas", [])

        # 📌 Validar que haya al menos 2 respuestas y un máximo de 10
        if len(respuestas_data) < 2:
            raise serializers.ValidationError({"respuestas": "Debe haber al menos dos respuestas."})
        if len(respuestas_data) > 10:
            raise serializers.ValidationError({"respuestas": "No puede haber más de 10 respuestas."})

        return data

    def update(self, instance, validated_data):
        with transaction.atomic():  # 📌 Asegurar que todo se guarde correctamente
            respuestas_data = validated_data.pop("respuestas", [])

            instance.texto = validated_data.get("texto", instance.texto)
            instance.ayuda = validated_data.get("ayuda", instance.ayuda)
            instance.save()

            # 📌 Verificar que la pregunta realmente existe antes de continuar
            if not instance.id:
                raise serializers.ValidationError({"pregunta": "La pregunta no se ha guardado correctamente antes de actualizar las respuestas."})

            # 📌 Mapa de respuestas existentes en la base de datos
            existing_respuestas = {r.id: r for r in instance.respuestas.all()}

            # 📌 Crear una lista de los IDs de las respuestas nuevas
            nuevos_ids = [respuesta_data.get("id") for respuesta_data in respuestas_data if "id" in respuesta_data]

            # 📌 Eliminar respuestas que ya no están en la nueva lista
            for respuesta_id in existing_respuestas.keys():
                if respuesta_id not in nuevos_ids:
                    existing_respuestas[respuesta_id].delete()

            # 📌 Crear o actualizar respuestas
            for respuesta_data in respuestas_data:
                respuesta_id = respuesta_data.get("id", None)
                if respuesta_id and respuesta_id in existing_respuestas:
                    # Si la respuesta ya existe, la actualizamos
                    existing_respuestas[respuesta_id].texto = respuesta_data["texto"]
                    existing_respuestas[respuesta_id].save()
                else:
                    # 📌 Crear respuesta sin asignar directamente la pregunta para evitar violación de clave foránea
                    nueva_respuesta = Respuesta.objects.create(**respuesta_data)
                    nueva_respuesta.pregunta = instance  # 📌 Asignar después de haberla creado
                    nueva_respuesta.save()

            return instance

    def create(self, validated_data):
        with transaction.atomic():  # 📌 Usar transacción para evitar errores de integridad
            respuestas_data = validated_data.pop("respuestas", [])

            # 📌 Crear la pregunta sin "respuesta_correcta"
            pregunta = Pregunta.objects.create(**validated_data)

            # 📌 Crear respuestas y marcar la primera como la correcta
            respuestas = [
                Respuesta.objects.create(pregunta=pregunta, **respuesta_data)
                for respuesta_data in respuestas_data
            ]

            if respuestas:
                pregunta.respuesta_correcta = respuestas[0]  # 📌 La primera respuesta es la correcta
                pregunta.save()

            return pregunta


class TemaPreguntasSerializer(serializers.ModelSerializer):
    preguntas = PreguntaSerializer(many=True, read_only=True)
    asignatura_id = serializers.IntegerField(source="asignatura.id", read_only=True)
    asignatura_nombre = serializers.CharField(source="asignatura.nombre", read_only=True)
    numero_preguntas = serializers.SerializerMethodField()
    numero_fallos = serializers.SerializerMethodField()

    class Meta:
        model = Tema
        fields = ["id", "nombre", "preguntas", "asignatura_id", "asignatura_nombre", "numero_preguntas", "numero_fallos"]

    def get_numero_preguntas(self, obj):
        return Pregunta.objects.filter(tema=obj).count()

    def get_numero_fallos(self, obj):
        return Pregunta.objects.filter(tema=obj, fallos__gt=0).count()

class TemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tema
        fields = ["id", "nombre"]

class AsignaturaSerializer(serializers.ModelSerializer):
    tiene_preguntas = serializers.SerializerMethodField()
    num_preguntas_con_fallos = serializers.SerializerMethodField()
    temas_con_preguntas_falladas = serializers.SerializerMethodField()
    temas = TemaSerializer(many=True, read_only=True)

    class Meta:
        model = Asignatura
        fields = ["id", "nombre", "temas", "tiene_preguntas", "num_preguntas_con_fallos", "temas_con_preguntas_falladas"]

    def get_tiene_preguntas(self, obj):
        return any(tema.preguntas.exists() for tema in obj.temas.all())

    def get_num_preguntas_con_fallos(self, obj):
        return sum(tema.preguntas.filter(fallos__gt=0).count() for tema in obj.temas.all())

    def get_temas_con_preguntas_falladas(self, obj):
        return [tema.id for tema in obj.temas.all() if tema.preguntas.filter(fallos__gt=0).exists()]