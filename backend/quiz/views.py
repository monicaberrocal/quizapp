##################
#######API########
##################

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .serializers import RegistroUsuarioSerializer
from django.utils.timezone import now
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from django.contrib.auth import login
from rest_framework import status
from .models import CodigoActivacion
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import logout
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Asignatura
from .serializers import AsignaturaSerializer
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Tema, Asignatura
from .serializers import TemaSerializer
from collections import defaultdict
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Tema, Asignatura
from .serializers import TemaSerializer
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

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

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def asignatura_api(request):
    if request.method == "GET":
        asignaturas = Asignatura.objects.filter(usuario=request.user)
        for asignatura in asignaturas:
            asignatura.tiene_preguntas = asignatura.temas.filter(preguntas__isnull=False).exists()
            asignatura.tiene_fallos = asignatura.temas.filter(preguntas__fallos__gt=0).exists()

        serializer = AsignaturaSerializer(asignaturas, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = AsignaturaSerializer(data=request.data)
        if serializer.is_valid():
            asignatura = serializer.save(usuario=request.user)
            return Response(AsignaturaSerializer(asignatura).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def tema_api(request):
    asignaturas = Asignatura.objects.filter(usuario=request.user).prefetch_related("temas")

    data = []
    for asignatura in asignaturas:
        temas = Tema.objects.filter(asignatura=asignatura)
        temas_serializados = TemaSerializer(temas, many=True).data

        data.append({
            "asignatura": asignatura.nombre,
            "id": asignatura.id,
            "temas": temas_serializados,
        })

    return Response(data)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def eliminar_asignatura(request, asignatura_id):
    try:
        asignatura = Asignatura.objects.get(id=asignatura_id, usuario=request.user)
        asignatura.delete()
        return Response({"message": "Asignatura eliminada correctamente."}, status=status.HTTP_204_NO_CONTENT)
    except Asignatura.DoesNotExist:
        return Response({"error": "Asignatura no encontrada o no tienes permiso."}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def eliminar_tema(request, tema_id):
    try:
        tema = Tema.objects.get(id=tema_id, asignatura__usuario=request.user)
        tema.delete()
        return Response({"message": "Tema eliminado correctamente."}, status=status.HTTP_204_NO_CONTENT)
    except Tema.DoesNotExist:
        return Response({"error": "Tema no encontrado o no tienes permiso."}, status=status.HTTP_404_NOT_FOUND)

@api_view(["GET"])
def get_csrf_token(request):
    csrf_token = get_token(request)
    response = JsonResponse({"csrfToken": csrf_token})

    response.set_cookie(
        "csrftoken",
        csrf_token
    )

    return response
