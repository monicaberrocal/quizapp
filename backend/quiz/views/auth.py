# Django imports
from django.contrib.auth import authenticate, login, logout, get_user_model
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
from django.core.cache import cache
from django.contrib.auth import authenticate, login, get_user_model
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["POST"])
def registrar_usuario_api(request):
    serializer = RegistroUsuarioSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        usuario = serializer.save()

        device_id = f"dispositivo:{request.META.get('REMOTE_ADDR', 'unknown')}"      
        cuentas = [usuario.username, usuario.email]
        for cuenta in cuentas:
            cuenta_id = f"cuenta:{cuenta}"
            cache.delete(f"intentos:{device_id}_{cuenta_id}")
            cache.delete(f"bloqueo:{device_id}_{cuenta_id}")

        
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

    # Establecer cookie de sesión explícitamente con atributos para móviles
    response = Response({
        "message": "Cuenta activada correctamente.",
        "username": usuario.username
    }, status=status.HTTP_200_OK)
    response.set_cookie(
        "sessionid",
        request.session.session_key,
        samesite="None",
        secure=True,
        httponly=True,
        max_age=3600
    )
    return response

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
    response.delete_cookie(
        "sessionid",
        samesite="None",
        secure=True,
        httponly=True
    )
    return response


@api_view(["POST"])
def login_api(request):
    username_or_email = request.data.get("username")
    password = request.data.get("password")

    if not username_or_email or not password:
        return Response({"error": "El nombre de usuario y la contraseña son obligatorios."}, status=400)

    User = get_user_model()

    # Verificamos si el usuario existe
    try:
        user_obj = User.objects.get(email=username_or_email)
        username = user_obj.username
    except User.DoesNotExist:
        try:
            user_obj = User.objects.get(username=username_or_email)
            username = user_obj.username
        except User.DoesNotExist:
            username=username_or_email

    device_id = f"dispositivo:{request.META.get('REMOTE_ADDR', 'unknown')}"
    cuenta_id = f"cuenta:{username}"

    # Verificamos si esta cuenta está bloqueada
    bloqueo = cache.get(f"bloqueo:{device_id}_{cuenta_id}")
    if bloqueo == "bloqueo_1h":
        return Response({"error": "Esta cuenta ha sido bloqueada por demasiados intentos. Intenta de nuevo en 1 hora."}, status=403)
    elif bloqueo == "bloqueo_3h":
        return Response({"error": "Esta cuenta ha sido bloqueada por demasiados intentos. Intenta de nuevo en 3 horas."}, status=403)
    elif bloqueo == "bloqueo_indefinido":
        return Response({"error": "Esta cuenta ha sido bloqueada permanentemente. Contacta con el equipo técnico."}, status=403)

    # Intentamos autenticar
    user = authenticate(username=username, password=password)

    if user is not None:
        login(request, user)
        # Reiniciar contador de intentos si login exitoso
        cache.delete(f"intentos:{device_id}_{cuenta_id}")
        cache.delete(f"bloqueo:{device_id}_{cuenta_id}")
        
        # Establecer cookie de sesión explícitamente con atributos para móviles
        response = Response({"message": "Inicio de sesión exitoso.", "username": user.username}, status=200)
        response.set_cookie(
            "sessionid",
            request.session.session_key,
            samesite="None",
            secure=True,
            httponly=True,
            max_age=3600
        )
        return response
    else:
        # Registrar intento fallido por cuenta
        intentos = cache.get(f"intentos:{device_id}_{cuenta_id}", 0) + 1
        cache.set(f"intentos:{device_id}_{cuenta_id}", intentos, timeout=None)

        # Aplicar bloqueos progresivos
        if intentos == 3:
            cache.set(f"bloqueo:{device_id}_{cuenta_id}", "bloqueo_1h", timeout=3600)
            return Response({"error": "Demasiados intentos fallidos. Esta cuenta ha sido bloqueada durante 1 hora."}, status=403)
        elif intentos == 6:
            cache.set(f"bloqueo:{device_id}_{cuenta_id}", "bloqueo_3h", timeout=10800)
            return Response({"error": "Demasiados intentos fallidos. Esta cuenta ha sido bloqueada durante 3 horas."}, status=403)
        elif intentos >= 9:
            cache.set(f"bloqueo:{device_id}_{cuenta_id}", "bloqueo_indefinido", timeout=None)
            return Response({"error": "Esta cuenta ha sido bloqueada permanentemente. Contacta con el equipo técnico."}, status=403)

        return Response({"error": "Nombre de usuario o contraseña incorrectos."}, status=401)


@api_view(["GET"])
def get_csrf_token(request):
    csrf_token = get_token(request)
    response = JsonResponse({"csrfToken": csrf_token})

    response.set_cookie(
        "csrftoken",
        csrf_token,
        samesite="None",
        secure=True,
        httponly=False
    )

    return response
