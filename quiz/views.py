from django.shortcuts import render, redirect, get_object_or_404
from .forms import AsignaturaForm, ImportFileForm, PreguntaConRespuestasFormWithoutTema, TemaForm, PreguntaConRespuestasForm, RegistroUsuarioForm, TemaFormWithoutAsignatura
from .models import Pregunta, Respuesta, Asignatura, Tema, Pregunta
from django.http import HttpResponse, HttpResponseForbidden, JsonResponse
import json
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt


def homepage(request):
    return render(request, 'quiz/homepage.html')

def registrar_usuario(request):
    if request.method == 'POST':
        form = RegistroUsuarioForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = RegistroUsuarioForm()
    return render(request, 'quiz/registrar.html', {'form': form})

### ASIGNATURA ###

@login_required
def crear_asignatura(request):
    if request.method == 'POST':
        if 'file' in request.FILES:
            form_file = ImportFileForm(request.POST, request.FILES)
            if form_file.is_valid():
                return importar_asignaturas(request.FILES['file'], request.user)
        else:
            form = AsignaturaForm(request.POST)
            if form.is_valid():
                asignatura = form.save(commit=False)
                asignatura.usuario = request.user
                asignatura.save()
                return redirect('crear_asignatura')
    else:
        form = AsignaturaForm()
        form_file = ImportFileForm()

    asignaturas = Asignatura.objects.filter(usuario=request.user)

    for asignatura in asignaturas:
        asignatura.tiene_preguntas = asignatura.temas.filter(preguntas__isnull=False).exists()

    return render(request, 'quiz/crear_asignatura.html', {
        'form': form,
        'form_file':form_file,
        'asignaturas': asignaturas})

@login_required
def vista_asignatura(request, id):
    asignatura = get_object_or_404(Asignatura, id=id, usuario=request.user)

    preguntas_con_fallos = Pregunta.objects.filter(
        tema__asignatura=asignatura,
        fallos__gt=0
    ).count()

    if request.method == 'POST':
        if 'file' in request.FILES:
            form_file = ImportFileForm(request.POST, request.FILES)
            if form_file.is_valid():
                return importar_asignatura(request.FILES['file'], request.user, id)
        else:
            form = TemaFormWithoutAsignatura(request.POST, asignatura_id=id)
            if form.is_valid():
                tema = form.save(commit=False)
                tema.asignatura = asignatura
                tema.save()
                return redirect('vista_asignatura', id)
    else:
        form = TemaFormWithoutAsignatura(asignatura_id=id)
        form_file = ImportFileForm()

    asignatura.tiene_preguntas = asignatura.temas.filter(preguntas__isnull=False).exists()

    return render(request, 'quiz/asignatura.html', {
        'asignatura': asignatura,
        'preguntas_con_fallos': preguntas_con_fallos,
        'form': form,
        'form_file': form_file
        })

@login_required
def eliminar_asignatura(request, id):
    asignatura = get_object_or_404(Asignatura, id=id, usuario=request.user)
    asignatura.delete()
    return redirect('crear_asignatura')

@login_required
def editar_asignatura(request, id):
    asignatura = get_object_or_404(Asignatura, id=id, usuario=request.user)

    if request.method == 'POST':
        if 'form_tema' in request.POST:
            form_tema = TemaFormWithoutAsignatura(request.POST, asignatura_id=id)
            if form_tema.is_valid():
                form_tema.save()
                return redirect('vista_asignatura', id)
        else:
            form_asignatura = AsignaturaForm(request.POST, instance=asignatura)
            if form_asignatura.is_valid():
                form_asignatura.save()
                return redirect('vista_asignatura', id)
    else:
        form_tema = TemaFormWithoutAsignatura(asignatura_id=id)
        form_asignatura = AsignaturaForm(instance=asignatura)

    return render(request, 'quiz/editar_asignatura.html', {
        'asignatura': asignatura,
        'form_tema': form_tema,
        'form_asignatura': form_asignatura
    })

@login_required
def estudiar_asignatura(request, id):
    asignatura = get_object_or_404(Asignatura, id=id)
    preguntas = list(Pregunta.objects.filter(tema__asignatura=asignatura).order_by('respondida', '?'))
    if not preguntas:
        return render(request, 'quiz/no_preguntas.html', {'asignatura': asignatura})
    
    request.session['preguntas_ids'] = [p.id for p in preguntas]
    request.session['pregunta_actual'] = 0
    request.session['respuestas_correctas'] = 0
    request.session['total_respondidas'] = 0
    
    return redirect('mostrar_pregunta')

@login_required
def repasar_asignatura(request, id):
    asignatura = get_object_or_404(Asignatura, id=id)
    preguntas = list(Pregunta.objects.filter(tema__asignatura=asignatura, fallos__gt=0).order_by('respondida', '?'))
    if not preguntas:
        return render(request, 'quiz/no_preguntas.html', {'asignatura': asignatura})
    
    request.session['preguntas_ids'] = [p.id for p in preguntas]
    request.session['pregunta_actual'] = 0
    request.session['respuestas_correctas'] = 0
    request.session['total_respondidas'] = 0
    
    return redirect('mostrar_pregunta')

### TEMA ###

@login_required
def crear_tema(request):
    if request.method == 'POST':
        form = TemaForm(request.POST, user=request.user)
        if form.is_valid():
            tema = form.save(commit=False)
            if tema.asignatura.usuario != request.user:
                return HttpResponseForbidden(render(request, '403.html'))
            tema.save()
            return redirect('crear_tema')
    else:
        form = TemaForm(user=request.user)

    asignaturas = Asignatura.objects.filter(usuario=request.user).prefetch_related('temas')

    return render(request, 'quiz/crear_tema.html', {'form': form, 'asignaturas': asignaturas})

@login_required
def vista_tema(request, id):
    tema = get_object_or_404(Tema, id=id, asignatura__usuario=request.user)

    preguntas_con_fallos = Pregunta.objects.filter(
        tema=tema,
        fallos__gt=0
    ).count()

    if request.method == 'POST':
        if 'file' in request.FILES:
            form_file = ImportFileForm(request.POST, request.FILES)
            if form_file.is_valid():
                return importar_tema(request.FILES['file'], id)
        else:
            form = PreguntaConRespuestasFormWithoutTema(request.POST, tema_id=id)
            if form.is_valid():
                pregunta = Pregunta.objects.create(
                    tema=tema,
                    texto=form.cleaned_data['texto_pregunta'],
                    ayuda = form.cleaned_data['ayuda']
                )

                respuestas = []
                for i in range(1, 5):
                    respuesta = Respuesta.objects.create(
                        pregunta=pregunta,
                        texto=form.cleaned_data[f'respuesta{i}']
                    )
                    respuestas.append(respuesta)

                indice_correcto = int(form.cleaned_data['respuesta_correcta']) - 1
                pregunta.respuesta_correcta = respuestas[indice_correcto]
                pregunta.save()

                return redirect('vista_tema', id)
            else:
                errors = form.errors.as_text().splitlines()
                filtered_errors = [error for error in errors if not error.startswith('* __all__')]
                error_message = "\n".join(filtered_errors)
                return render(request, 'quiz/tema.html', {
                    'tema': tema,
                    'form': form,
                    'error_message': error_message
                })
    else:
        form = PreguntaConRespuestasFormWithoutTema(tema_id=id)
        form_file = ImportFileForm()

    return render(request, 'quiz/tema.html', {
        'tema': tema,
        'preguntas_con_fallos': preguntas_con_fallos,
        'form': form,
        'form_file': form_file
    })

@login_required
def eliminar_tema(request, id):
    tema = get_object_or_404(Tema, id=id, asignatura__usuario=request.user)
    tema.delete()
    return redirect('crear_tema')

@login_required
def eliminar_tema_asignatura(request, tema_id, asignatura_id):
    tema = get_object_or_404(Tema, id=id, asignatura__usuario=request.user)
    tema.delete()
    return redirect('vista_asignatura', asignatura_id)

@login_required
def editar_tema(request, id):
    tema = get_object_or_404(Tema, id=id, asignatura__usuario=request.user)

    form_pregunta = PreguntaConRespuestasFormWithoutTema(tema_id=id)
    form_tema = TemaFormWithoutAsignatura(instance=tema, asignatura_id=tema.asignatura.id)

    if request.method == 'POST':
        if 'form_pregunta' in request.POST:
            form_pregunta = PreguntaConRespuestasFormWithoutTema(request.POST, tema_id=id)
            if form_pregunta.is_valid():
                pregunta = Pregunta.objects.create(
                    tema=tema,
                    texto=form_pregunta.cleaned_data['texto_pregunta'],
                    ayuda = form_pregunta.cleaned_data['ayuda']
                )

                respuestas = []
                for i in range(1, 5):
                    respuesta = Respuesta.objects.create(
                        pregunta=pregunta,
                        texto=form_pregunta.cleaned_data[f'respuesta{i}']
                    )
                    respuestas.append(respuesta)

                indice_correcto = int(form_pregunta.cleaned_data['respuesta_correcta']) - 1
                pregunta.respuesta_correcta = respuestas[indice_correcto]
                pregunta.save()

                return redirect('vista_tema', id)
            else:
                errors = form_pregunta.errors.as_text().splitlines()
                filtered_errors = [error for error in errors if not error.startswith('* __all__')]
                error_message = "\n".join(filtered_errors)
                return render(request, 'quiz/editar_tema.html', {
                    'tema': tema,
                    'form_pregunta': form_pregunta,
                    'form_tema': form_tema,
                    'error_message': error_message
                })
        else:
            form_tema = TemaFormWithoutAsignatura(request.POST, instance=tema, asignatura_id=tema.asignatura.id)
            if form_tema.is_valid():
                form_tema.save()
                return redirect('vista_tema', id)
            else:
                errors = form_tema.errors.as_text().splitlines()
                filtered_errors = [error for error in errors if not error.startswith('* __all__')]
                error_message = "\n".join(filtered_errors)
                return render(request, 'quiz/editar_tema.html', {
                    'tema': tema,
                    'form_pregunta': form_pregunta,
                    'form_tema': form_tema,
                    'error_message': error_message
                })

    return render(request, 'quiz/editar_tema.html', {
        'tema': tema, 
        'form_pregunta': form_pregunta,
        'form_tema': form_tema
    })

@login_required
def estudiar_tema(request, id):
    tema = get_object_or_404(Tema, id=id)
    preguntas = list(tema.preguntas.all().order_by('respondida', '?'))
    if not preguntas:
        return render(request, 'quiz/no_preguntas.html', {'tema': tema})
    
    request.session['preguntas_ids'] = [p.id for p in preguntas]
    request.session['pregunta_actual'] = 0
    request.session['respuestas_correctas'] = 0
    request.session['total_respondidas'] = 0
    
    return redirect('mostrar_pregunta')

@login_required
def repasar_tema(request, id):
    tema = get_object_or_404(Tema, id=id)
    preguntas = list(tema.preguntas.filter(fallos__gt=0).order_by('respondida', '?'))
    if not preguntas:
        return render(request, 'quiz/no_preguntas.html', {'tema': tema})
    
    request.session['preguntas_ids'] = [p.id for p in preguntas]
    request.session['pregunta_actual'] = 0
    request.session['respuestas_correctas'] = 0
    request.session['total_respondidas'] = 0
    
    return redirect('mostrar_pregunta')

### PREGUNTA ###

@login_required
def crear_pregunta_con_respuestas(request):
    if request.method == 'POST':
        form = PreguntaConRespuestasForm(request.POST, user=request.user)
        if form.is_valid():
            tema = form.cleaned_data['tema']
            if tema.asignatura.usuario != request.user:
                return HttpResponseForbidden(render(request, '403.html'))
            pregunta = Pregunta.objects.create(
                tema = tema,
                texto = form.cleaned_data['texto_pregunta'],
                ayuda = form.cleaned_data['ayuda']
            )

            respuestas = []
            for i in range(1, 5):
                respuesta = Respuesta.objects.create(
                    pregunta=pregunta,
                    texto=form.cleaned_data[f'respuesta{i}']
                )
                respuestas.append(respuesta)

            indice_correcto = int(form.cleaned_data['respuesta_correcta']) - 1
            pregunta.respuesta_correcta = respuestas[indice_correcto]
            pregunta.save()

            return redirect('lista_preguntas')
    else:
        form = PreguntaConRespuestasForm(user=request.user)

    return render(request, 'quiz/crear_pregunta_con_respuestas.html', {'form': form})

@login_required
def pregunta_vista(request, id):
    pregunta = get_object_or_404(Pregunta, id=id, tema__asignatura__usuario=request.user)
    return render(request, 'quiz/pregunta.html', {'pregunta': pregunta})

@login_required
def eliminar_pregunta(request, pregunta_id, tema_id):
    pregunta = get_object_or_404(Pregunta, id=pregunta_id, tema__asignatura__usuario=request.user)
    pregunta.delete()
    return redirect('vista_tema', tema_id)

### ERRORES ###
def mi_error_404(request, exception):
    return render(request, '404.html', status=404)

def mi_error_403(request, exception):
    return render(request, '403.html', status=403)

### TESTS ###

@login_required
def mostrar_pregunta(request):
    pregunta_actual_index = request.session.get('pregunta_actual', 0)
    preguntas_ids = request.session.get('preguntas_ids', [])

    if pregunta_actual_index >= len(preguntas_ids):
        return redirect('finalizar_test')

    pregunta_id = preguntas_ids[pregunta_actual_index]
    pregunta = get_object_or_404(Pregunta, id=pregunta_id)
    pregunta.respondida += 1
    pregunta.save()
    respuestas = pregunta.respuestas.all().order_by('?')

    return render(request, 'quiz/mostrar_pregunta.html', {
        'pregunta': pregunta,
        'respuestas': respuestas,
        'pregunta_actual_index': pregunta_actual_index + 1,
        'total_preguntas': len(preguntas_ids),
    })

@login_required
def procesar_respuesta(request):
    if request.method == 'POST':
        respuesta_seleccionada_id = request.POST.get('respuesta')
        request.session['respuesta_seleccionada_id'] = respuesta_seleccionada_id

        pregunta_actual_index = request.session.get('pregunta_actual', 0)
        preguntas_ids = request.session.get('preguntas_ids', [])

        pregunta_id = preguntas_ids[pregunta_actual_index]
        pregunta = get_object_or_404(Pregunta, id=pregunta_id)

        respuesta_correcta_id = pregunta.respuesta_correcta.id

        request.session['total_respondidas'] += 1
        
        if respuesta_seleccionada_id == str(respuesta_correcta_id):
            request.session['respuestas_correctas'] += 1
            request.session['respuesta_correcta'] = True
            if(pregunta.fallos > 0):
                pregunta.fallos -= 1
                pregunta.save()
        else:
            request.session['respuesta_correcta'] = False
            pregunta.fallos += 1
            pregunta.save()

        return redirect('mostrar_respuesta')

    return redirect('mostrar_pregunta')

@login_required
def mostrar_respuesta(request):
    correcto = request.session.get('respuesta_correcta', False)
    pregunta_actual_index = request.session.get('pregunta_actual', 0)
    preguntas_ids = request.session.get('preguntas_ids', [])

    pregunta_id = preguntas_ids[pregunta_actual_index]
    pregunta = get_object_or_404(Pregunta, id=pregunta_id)

    respuesta_seleccionada_id = request.session.get('respuesta_seleccionada_id')
    respuesta_seleccionada = get_object_or_404(Respuesta, id=respuesta_seleccionada_id)

    if correcto:
        mensaje = "¡Muy bien! Tu respuesta es correcta."
    else:
        respuesta_correcta = pregunta.respuesta_correcta
        mensaje = f"Error. La respuesta correcta es: {respuesta_correcta.texto}"

    request.session['pregunta_actual'] += 1

    request.session.pop('respuesta_correcta', None)

    return render(request, 'quiz/mostrar_respuesta.html', {
        'mensaje': mensaje,
        'pregunta': pregunta,
        'correcto': correcto,
        'total_respondidas': request.session['total_respondidas'],
        'respuestas_correctas': request.session['respuestas_correctas'],
        'total_preguntas': len(preguntas_ids),
        'respuesta_seleccionada': respuesta_seleccionada
    })

@login_required
def finalizar_test(request):
    total_respondidas = request.session.get('total_respondidas', 0)
    respuestas_correctas = request.session.get('respuestas_correctas', 0)
    preguntas_ids = request.session.get('preguntas_ids', [])
    total_preguntas = len(preguntas_ids)

    fallos = total_respondidas - respuestas_correctas

    request.session.pop('preguntas_ids', None)
    request.session.pop('pregunta_actual', None)
    request.session.pop('respuestas_correctas', None)
    request.session.pop('total_respondidas', None)

    return render(request, 'quiz/finalizar_test.html', {
        'total_respondidas': total_respondidas,
        'respuestas_correctas': respuestas_correctas,
        'fallos': fallos,
        'total_preguntas': total_preguntas,
    })

### DATOS ###

@login_required
def exportar_asignaturas(request):
    asignaturas = Asignatura.objects.filter(usuario=request.user).prefetch_related('temas__preguntas__respuesta_correcta')

    data = {"asignaturas": []}
    
    for asignatura in asignaturas:
        temas_data = []
        for tema in asignatura.temas.all():
            preguntas_data = []
            for pregunta in tema.preguntas.all():
                respuestas_data = []
                
                if pregunta.respuesta_correcta:
                    respuestas_data.append({"texto": pregunta.respuesta_correcta.texto})
                
                for respuesta in pregunta.respuestas.exclude(id=pregunta.respuesta_correcta.id):
                    respuestas_data.append({"texto": respuesta.texto})

                preguntas_data.append({
                    "texto": pregunta.texto,
                    "respuestas": respuestas_data
                })

                if pregunta.ayuda:
                    preguntas_data["ayuda"] = pregunta.ayuda
                
            temas_data.append({
                "nombre": tema.nombre,
                "preguntas": preguntas_data
            })
        
        data["asignaturas"].append({
            "nombre": asignatura.nombre,
            "temas": temas_data
        })

    json_data = json.dumps(data, ensure_ascii=False)

    response = HttpResponse(json_data, content_type='text/plain')
    response['Content-Disposition'] = 'attachment; filename="asignaturas_exportadas.txt"'

    return response

@login_required
def exportar_asignatura(request, id):
    asignatura = get_object_or_404(Asignatura, id=id, usuario=request.user)
    temas_data = []

    for tema in asignatura.temas.all():
        preguntas_data = []
        for pregunta in tema.preguntas.all():
            respuestas_data = []
            
            if pregunta.respuesta_correcta:
                respuestas_data.append({"texto": pregunta.respuesta_correcta.texto})
            
            for respuesta in pregunta.respuestas.exclude(id=pregunta.respuesta_correcta.id):
                respuestas_data.append({"texto": respuesta.texto})

            preguntas_data.append({
                "texto": pregunta.texto,
                "respuestas": respuestas_data
            })

            if pregunta.ayuda:
                preguntas_data["ayuda"] = pregunta.ayuda
        
        temas_data.append({
            "nombre": tema.nombre,
            "preguntas": preguntas_data
        })

    data = {
        "nombre": asignatura.nombre,
        "temas": temas_data
    }

    json_data = json.dumps(data, ensure_ascii=False)

    response = HttpResponse(json_data, content_type='text/plain')
    response['Content-Disposition'] = 'attachment; filename="'+ asignatura.nombre + '_preguntas.txt' +'"'

    return response

@login_required
def exportar_tema(request, id):
    tema = get_object_or_404(Tema, id=id)

    preguntas_data = []
    for pregunta in tema.preguntas.all():
        respuestas_data = []
        
        if pregunta.respuesta_correcta:
            respuestas_data.append({"texto": pregunta.respuesta_correcta.texto})
        
        for respuesta in pregunta.respuestas.exclude(id=pregunta.respuesta_correcta.id):
            respuestas_data.append({"texto": respuesta.texto})

        preguntas_data.append({
            "texto": pregunta.texto,
            "respuestas": respuestas_data
        })

        if pregunta.ayuda:
            preguntas_data["ayuda"] = pregunta.ayuda

    data = {
        "nombre": tema.nombre,
        "preguntas": preguntas_data
    }

    json_data = json.dumps(data, ensure_ascii=False)

    response = HttpResponse(json_data, content_type='text/plain')
    response['Content-Disposition'] = 'attachment; filename="'+ tema.asignatura.nombre + '_' + tema.nombre + '_preguntas.txt' +'"'

    return response


@csrf_exempt
def importar_asignaturas(file, user):
    try:
        file_content = file.read().decode('utf-8')
        data = json.loads(file_content)
        for asignatura_data in data.get('asignaturas', []):
            asignatura = Asignatura.objects.create(
                nombre=asignatura_data['nombre'],
                usuario=user
            )

            for tema_data in asignatura_data.get('temas', []):
                tema = Tema.objects.create(
                    nombre=tema_data['nombre'],
                    asignatura=asignatura
                )

                for pregunta_data in tema_data.get('preguntas', []):
                    pregunta = Pregunta.objects.create(
                        texto=pregunta_data['texto'],
                        tema=tema,
                        ayuda=pregunta_data.get('ayuda')
                    )

                    respuestas = []
                    for idx, respuesta in enumerate(pregunta_data['respuestas']):
                        resp = Respuesta.objects.create(
                            texto=respuesta['texto'],
                            pregunta=pregunta
                        )
                        respuestas.append(resp)

                    if respuestas:
                        pregunta.respuesta_correcta = respuestas[0]
                        pregunta.save()

        return redirect(crear_asignatura)

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Error al decodificar el JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@csrf_exempt
def importar_asignatura(file, user, id):
    try:
        file_content = file.read().decode('utf-8')
        data = json.loads(file_content)
        asignatura = get_object_or_404(Asignatura, id=id, usuario=user)

        for tema_data in data.get('temas', []):
            tema = Tema.objects.create(
                nombre=tema_data['nombre'],
                asignatura=asignatura
            )

            for pregunta_data in tema_data.get('preguntas', []):
                pregunta = Pregunta.objects.create(
                    texto=pregunta_data['texto'],
                    tema=tema,
                    ayuda=pregunta_data.get('ayuda')
                )

                respuestas = []
                for idx, respuesta in enumerate(pregunta_data['respuestas']):
                    resp = Respuesta.objects.create(
                        texto=respuesta['texto'],
                        pregunta=pregunta
                    )
                    respuestas.append(resp)

                if respuestas:
                    pregunta.respuesta_correcta = respuestas[0]
                    pregunta.save()

        return redirect(vista_asignatura, id)

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Error al decodificar el JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@csrf_exempt
def importar_tema(file, id):
    try:
        file_content = file.read().decode('utf-8')
        data = json.loads(file_content)
        tema = get_object_or_404(Tema, id=id)

        for pregunta_data in data.get('preguntas', []):
            pregunta = Pregunta.objects.create(
                texto=pregunta_data['texto'],
                tema=tema,
                ayuda=pregunta_data.get('ayuda')
            )

            respuestas = []
            for idx, respuesta in enumerate(pregunta_data['respuestas']):
                resp = Respuesta.objects.create(
                    texto=respuesta['texto'],
                    pregunta=pregunta
                )
                respuestas.append(resp)

            if respuestas:
                pregunta.respuesta_correcta = respuestas[0]
                pregunta.save()

        return redirect(vista_tema, id)

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Error al decodificar el JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
