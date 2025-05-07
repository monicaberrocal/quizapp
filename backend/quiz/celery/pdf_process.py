import re
from textwrap import dedent

from ..models import Pregunta, Respuesta

from .pdf_extractors import extract_all_text_versions
from .question_generation import generate_questions_json

PAGE_SEPARATOR = '-¿!11441165473941=(-'

def process_pdf(tema, file, client, model):
    text = extract_clean_text_from_pdf(file, client, model)
    questions_json = generate_question_set(text, client, model)
    import_questions_from_json(questions_json, tema)
    
def extract_clean_text_from_pdf(file, client, model):
    text_pymupdf, text_pdfplumber, text_pypdf2, text_pdfminer = extract_all_text_versions(file)

    clean_text = ''
    
    pages_number = max(len(text_pymupdf), len(text_pdfplumber), len(text_pypdf2), len(text_pdfminer))

    for i in range(pages_number):
        parts = []
        for extractor in [text_pymupdf, text_pdfplumber, text_pypdf2, text_pdfminer]:
            parts.append(extractor[i] if i < len(extractor) else "")
        text = PAGE_SEPARATOR.join(parts)
        
        prompt = dedent("""
                    He usado 5 librerías para extraer el texto de un pdf. 
                    Los 4 resultados son los siguientes.
                    Necesito que me des un texto limpio final usando la información de las 4 extracciones.
                    No escribas nada más que el texto limpio final.
                    La separación entre texto y texto es: '""" + PAGE_SEPARATOR + """'
                """)

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": text},
                ],
                temperature=0
            )
            clean_text += response.choices[0].message.content
        except Exception as e:
            raise
            
    return clean_text

def generate_question_set(text, client, model):
    sections = split_by_sections(text) 
    question_set = generate_questions_json(sections, client, model)
    return {"preguntas": question_set}
        
def split_by_sections(text):
    heading_patterns = re.compile(
        r'''^(
            BLOQUE\s+\w+ |                      # Coincide con encabezados como 'BLOQUE I', 'BLOQUE II', etc.
            Bloque\s+\w+ |
            TEMA\s+\w+ |                        # Coincide con encabezados como 'TEMA 1', 'TEMA 2', etc.
            Tema\s+\w+ |
            CAPÍTULO\s+\w+(?:\.\d+)*\.? |       # Coincide con 'CAPÍTULO 1', 'CAPÍTULO I.2', etc.
            Capítulo\s+\w+(?:\.\d+)*\.? |
            SECCIÓN\s+\w+(?:\.\d+)*\.? |        # Coincide con 'SECCIÓN 2', 'SECCIÓN 2.1', etc.
            Sección\s+\w+(?:\.\d+)*\.? |
            APÉNDICE\s+\w+ |                    # Coincide con 'APÉNDICE A', 'APÉNDICE B', etc.
            Apéndice\s+\w+ |
            \d+(?:\.\d+)* |                     # Coincide con '1', '1.1', '1.1.1', etc. (índices numerados)
            \d+\) |                             # Coincide con ítems numerados tipo '1)', '2)', etc.
            [a-zA-Z]+[\.\)]\s+ |                # Coincide con ítems como 'a)', 'b.', 'aa)', 'c.', etc.
            [IVXLCDM]+\.\s+ |                   # Coincide con números romanos con punto, ej: 'I. ', 'II. ', etc.
            [A-ZÁÉÍÓÚÑ\s]{4,}                   # Coincide con líneas completamente en mayúsculas (mín. 4 letras)
        )[^\n]*''',
        re.MULTILINE | re.VERBOSE
    )

    indexes = [m.start() for m in heading_patterns.finditer(text)]
    
    if not indexes:
        return [text]

    indexes.append(len(text))
    
    blocks = [text[indexes[i]:indexes[i+1]].strip() for i in range(len(indexes)-1)]

    def is_empty_block(bloque):
        lines_of_block = bloque.splitlines()
        return not any(len(line.strip()) > 5 for line in lines_of_block[1:])

    def process_blocks(blocks, accumulator=""):
        if not blocks:
            return [accumulator.strip()] if accumulator.strip() else []

        current_block = blocks[0]
        remaining_blocks = blocks[1:]

        if is_empty_block(current_block):
            return process_blocks(remaining_blocks, accumulator + "\n" + current_block)
        else:
            section = (accumulator + "\n" + current_block).strip()
            return [section] + process_blocks(remaining_blocks)
    
    def estimate_questions(text, ratio = 65):
        questions_by_lines = text.count('\n') * 2
        questions_by_characters = len(text) // ratio
        return max(questions_by_lines, questions_by_characters)

    processed_blocks = process_blocks(blocks)
    return [(section, estimate_questions(section)) for section in processed_blocks]

def import_questions_from_json(tema_data, tema):
    for question_data in tema_data["preguntas"]:
        pregunta = Pregunta.objects.create(
            texto=question_data["texto"],
            ayuda=question_data.get("ayuda", ''),
            tema=tema
        )

        formatted_answers = []
        for answer_data in question_data["respuestas"]:
            respuesta = Respuesta.objects.create(
                texto=answer_data["texto"],
                pregunta=pregunta
            )
            formatted_answers.append(respuesta)

        pregunta.respuesta_correcta = formatted_answers[0]
        pregunta.save()