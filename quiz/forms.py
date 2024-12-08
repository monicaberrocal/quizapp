from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Asignatura, Tema, Pregunta, Respuesta

class AsignaturaForm(forms.ModelForm):
    class Meta:
        model = Asignatura
        fields = ['nombre']

class TemaForm(forms.ModelForm):
    class Meta:
        model = Tema
        fields = ['asignatura', 'nombre']

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super(TemaForm, self).__init__(*args, **kwargs)
        if user:
            self.fields['asignatura'].queryset = Asignatura.objects.filter(usuario=user)

class TemaFormWithoutAsignatura(forms.ModelForm):
    class Meta:
        model = Tema
        fields = ['nombre']

    def __init__(self, *args, **kwargs):
        self.asignatura_id = kwargs.pop('asignatura_id', None)
        super(TemaFormWithoutAsignatura, self).__init__(*args, **kwargs)

    def save(self, commit=True):
        tema = super(TemaFormWithoutAsignatura, self).save(commit=False)
        tema.asignatura_id = self.asignatura_id
        if commit:
            tema.save()
        return tema

class PreguntaConRespuestasForm(forms.Form):
    tema = forms.ModelChoiceField(queryset=Tema.objects.none(), label="Tema")
    texto_pregunta = forms.CharField(max_length=200, label="Pregunta")
    ayuda = forms.CharField(max_length=500, label="Explicación de la pregunta / Lugar del temario donde se encuentra (opcional)", required=False)
    
    respuesta1 = forms.CharField(max_length=200, label="Respuesta 1")
    respuesta2 = forms.CharField(max_length=200, label="Respuesta 2")
    respuesta3 = forms.CharField(max_length=200, label="Respuesta 3")
    respuesta4 = forms.CharField(max_length=200, label="Respuesta 4")
    
    respuesta_correcta = forms.ChoiceField(
        choices=[(1, 'Respuesta 1'), (2, 'Respuesta 2'), (3, 'Respuesta 3'), (4, 'Respuesta 4')],
        widget=forms.RadioSelect,
        label="Respuesta Correcta"
    )

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super(PreguntaConRespuestasForm, self).__init__(*args, **kwargs)
        if user:
            asignaturas = Asignatura.objects.filter(usuario=user).prefetch_related('temas')
            temas = []
            for asignatura in asignaturas:
                for tema in asignatura.temas.all():
                    temas.append((tema.id, f"{asignatura.nombre} - {tema.nombre}"))
            self.fields['tema'].choices = temas

    def clean(self):
        cleaned_data = super().clean()
        respuestas = [cleaned_data.get(f'respuesta{i}') for i in range(1, 5)]
        if len(set(respuestas)) != 4:
            raise forms.ValidationError("Todas las respuestas deben ser diferentes.")
        return cleaned_data

class PreguntaConRespuestasFormWithoutTema(forms.Form):
    texto_pregunta = forms.CharField(max_length=200, label="Pregunta")
    ayuda = forms.CharField(max_length=500, label="Explicación de la pregunta / Lugar del temario donde se encuentra (opcional)", required=False)
    
    respuesta1 = forms.CharField(max_length=200, label="Respuesta 1")
    respuesta2 = forms.CharField(max_length=200, label="Respuesta 2")
    respuesta3 = forms.CharField(max_length=200, label="Respuesta 3")
    respuesta4 = forms.CharField(max_length=200, label="Respuesta 4")
    
    respuesta_correcta = forms.ChoiceField(
        choices=[(1, 'Respuesta 1'), (2, 'Respuesta 2'), (3, 'Respuesta 3'), (4, 'Respuesta 4')],
        widget=forms.RadioSelect,
        label="Respuesta Correcta"
    )

    def __init__(self, *args, **kwargs):
        self.tema_id = kwargs.pop('tema_id', None)
        super(PreguntaConRespuestasFormWithoutTema, self).__init__(*args, **kwargs)

    def clean(self):
        cleaned_data = super().clean()
        respuestas = [cleaned_data.get(f'respuesta{i}') for i in range(1, 5)]
        if len(set(respuestas)) != 4:
            raise forms.ValidationError("Todas las respuestas deben ser diferentes.")
        return cleaned_data
    
    def save(self, commit=True):
        pregunta = super(PreguntaConRespuestasFormWithoutTema, self).save(commit=False)
        pregunta.tema_id = self.tema_id
        if commit:
            pregunta.save()
        return pregunta

class ImportFileForm(forms.Form):
    file = forms.FileField()

class RegistroUsuarioForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['username', 'password1', 'password2']