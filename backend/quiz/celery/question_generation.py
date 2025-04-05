import json


def analizar_temario(temario_texto, client, model):
    prompt = """
    Eres experto en analizar temarios académicos.
    Analiza el texto proporcionado y devuelve los apartados y subapartados en el siguiente formato.

    Ejemplo del formato esperado:
    {
        "BLOQUE I. FISIOLOGÍA DE LA AUDICIÓN HUMANA": "texto del apartado",
        "TEMA 1. ESTUDIO FÍSICO DEL SONIDO": "texto del apartado",
        "1. FUENTE SONORA VIBRANTE": "texto del apartado",
        "1.1. Cualidades esenciales de las ondas sonoras": "texto del apartado",
        "2. MEDIO DE PROPAGACIÓN": "texto del apartado",
        "a) REFLEXIÓN, ECO Y REVERBERACIÓN": "texto del apartado",
        "b) REFRACCIÓN": "texto del apartado",
        "Absorción": "texto del apartado",
        "Resonancia": "texto del apartado",
        "Efecto Doppler": "texto del apartado"
    }
    
    Es posible que en 'texto del apartado' haya cosas repetidas de otros apartados ya que los apartados contienen subapartados.
    """
    respuesta = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": prompt},
                  {"role": "user", "content": temario_texto}]
    )

    try:
        contenido = respuesta.choices[0].message.content.strip()
        apartados = json.loads(contenido)
    except json.JSONDecodeError as e:
        print(f"Error al decodificar el JSON: {e}")
        apartados = {}
    return apartados


def dividir_texto_por_apartados(texto, apartados):
    texto_apartado = {}
    for i, apartado in enumerate(apartados):
        inicio = texto.find(apartado)
        fin = texto.find(apartados[i + 1]) if i + \
            1 < len(apartados) else len(texto)
        texto_apartado[apartado] = texto[inicio:fin].strip()
    return texto_apartado


def generar_preguntas_json(texto, apartados, client, model, cantidad=20,):
    # texto_apartado_dict = dividir_texto_por_apartados(texto, apartados)

    preguntas_completas = []
    for texto in apartados.items():
        prompt = f"""
        Eres experto en crear preguntas tipo test sobre temarios académicos.
        Genera {cantidad} preguntas tipo test sobre el texto proporcionado.
        La finalidad de las preguntas es conseguir estudiar y aprender de manera exitosa el temario.

        Las preguntas deben estar en el siguiente formato JSON:
        {{
            "preguntas": [
                {{
                    "texto": "Enunciado de la pregunta",
                    "respuestas": [
                        {{"texto": "Respuesta CORRECTA"}},
                        {{"texto": "Respuesta 2"}},
                        {{"texto": "Respuesta 3"}},
                        {{"texto": "Respuesta 4"}}
                    ],
                    "ayuda": "Explicación de la pregunta usando las palabras literales que aparecen en el texto del temario."
                }}
            ]
        }}

        El texto del temario es el siguiente:
        {texto}
        """

        try:
            respuesta = client.chat.completions.create(
                model=model,
                messages=[{"role": "system", "content": prompt}],
                response_format={"type": "json_object"}
            )
            preguntas_json = json.loads(respuesta.choices[0].message.content)
            preguntas_completas.extend(preguntas_json["preguntas"])
        except Exception as e:
            print(f"Error generando preguntas para '{texto}': {str(e)}")

    print(f"✅ Se generaron {len(preguntas_completas)} preguntas en total.")
    return preguntas_completas


def analizar_cobertura(temario, preguntas_generadas, client, model):
    prompt = f"""
    Analiza si las siguientes preguntas cubren todo el temario:
    Temario: {temario}\nPreguntas: {preguntas_generadas}
    Indica los apartados no cubiertos.
    Es muy importante que me des el título exacto de los apartados ya que luego buscare dicho texto para hacer referencia a esa parte.
    Los apartados tienen que estar escritos exactamente igual que en el texto ya que luego voy a buscar donde aparecen. Además tienen que ser apariciones únicas, si tienes que añadir más texto de antes o de después para conseguir que sea una aparición única en el texto, hazlo.
    Ejemplo del formato esperado:
    [
        "BLOQUE I. FISIOLOGÍA DE LA AUDICIÓN HUMANA",
        "TEMA 1. ESTUDIO FÍSICO DEL SONIDO",
        "1. FUENTE SONORA VIBRANTE",
        "1.1. Cualidades esenciales de las ondas sonoras",
        "2. MEDIO DE PROPAGACIÓN",
        "a) REFLEXIÓN, ECO Y REVERBERACIÓN",
        "b) REFRACCIÓN",
        "Absorción",
        "Resonancia",
        "Efecto Doppler"
    ]
    """

    respuesta = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": prompt}]
    )

    temas_no_cubiertos = respuesta.choices[0].message.content
    print('--------------')
    print('no cobertura')
    print(temas_no_cubiertos)
    print('--------------')
    return temas_no_cubiertos.split("\n")
