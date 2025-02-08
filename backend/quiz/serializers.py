from rest_framework import serializers
from .models import Pregunta
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from .models import CodigoActivacion

class PreguntaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pregunta
        fields = '__all__'

class RegistroUsuarioSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True, required=True, label="Confirmar contraseña")

    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "password", "password2"]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def validate(self, data):
        # Validar que las contraseñas coincidan
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Las contraseñas no coinciden."})

        try:
            validate_password(data["password"])  # Validar seguridad de la contraseña
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": e.detail})  # 🔹 Capturar errores en "password"

        return data

    def create(self, validated_data):
        validated_data.pop("password2")  # No necesitamos almacenar la confirmación

        usuario = User.objects.create_user(**validated_data)

        # Obtener el código de activación
        activacion = CodigoActivacion.objects.get(usuario=usuario)
        token = activacion.token_activacion

        # Construir el enlace de activación
        request = self.context.get("request")
        link_activacion = request.build_absolute_uri(f"/quiz/activar/{token}/")

        # Enviar correo de activación
        # from .utils import send_activation_email
        # send_activation_email(request, usuario, link_activacion)

        return usuario

