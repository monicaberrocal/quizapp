# Django imports
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils.timezone import now

# Django REST framework imports
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Local imports (models and serializers)
from ..models import CodigoActivacion
from ..serializers.serializers import (
    RegistroUsuarioSerializer
)


@api_view(["POST"])
def registrar_usuario_api(request):
    serializer = RegistroUsuarioSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Registro exitoso. Revisa tu correo para activar la cuenta."}, status=status.HTTP_201_CREATED)
    
    print("Errores de validación:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
def activar_cuenta_api(request, token):
    activacion = get_object_or_404(CodigoActivacion, token_activacion=token)

    if activacion.token_expira < now():
        usuario = activacion.usuario
        activacion.delete()
        usuario.delete()
        return Response({"error": "El enlace de activación ha expirado."}, status=status.HTTP_400_BAD_REQUEST)

    usuario = activacion.usuario
    usuario.is_active = True
    usuario.save()
    activacion.delete()
    
    login(request, usuario)

    return Response({
        "message": "Cuenta activada correctamente.",
        "username": usuario.username
    }, status=status.HTTP_200_OK)

@api_view(["GET"])
def auth_status(request):
    return Response({
        "authenticated": request.user.is_authenticated,
        "username": request.user.username if request.user.is_authenticated else None
    })

@api_view(["GET"])
def logout_api(request):
    logout(request)
    response = Response({"message": "Sesión cerrada correctamente."})
    response.delete_cookie("sessionid")
    return response

@api_view(["POST"])
def login_api(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "El nombre de usuario y la contraseña son obligatorios."}, status=400)

    user = authenticate(username=username, password=password)

    if user is not None:
        login(request, user)
        return Response({"message": "Inicio de sesión exitoso.", "username": user.username}, status=200)
    else:
        return Response({"error": "Nombre de usuario o contraseña incorrectos."}, status=401)

@api_view(["GET"])
def get_csrf_token(request):
    csrf_token = get_token(request)
    response = JsonResponse({"csrfToken": csrf_token})

    response.set_cookie(
        "csrftoken",
        csrf_token
    )

    return response
