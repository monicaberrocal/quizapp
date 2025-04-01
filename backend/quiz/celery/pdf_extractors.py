from celery import shared_task
from io import BytesIO
import fitz  # PyMuPDF
import pdfplumber
import PyPDF2
from pdfminer.high_level import extract_text
from pdf2image import convert_from_bytes
import pytesseract

def convert_uploaded_file_to_bytesio(file_bytes):
    """Convierte un archivo subido en Django a un objeto BytesIO"""
    # file_bytes = uploaded_file.read()  # Leer el contenido del archivo
    return BytesIO(file_bytes)  # Convertirlo en BytesIO

def extract_text_pymupdf(pdf_bytes):
    """Extraer texto por página usando PyMuPDF"""
    doc = fitz.open(stream=pdf_bytes.read(), filetype="pdf")
    return [page.get_text("text") for page in doc]

def extract_text_pdfplumber(pdf_bytes):
    """Extraer texto por página usando pdfplumber"""
    pdf_bytes.seek(0)
    with pdfplumber.open(pdf_bytes) as pdf:
        return [page.extract_text() or "" for page in pdf.pages]

def extract_text_pypdf2(pdf_bytes):
    """Extraer texto por página usando PyPDF2"""
    pdf_bytes.seek(0)
    reader = PyPDF2.PdfReader(pdf_bytes)
    return [page.extract_text() or "" for page in reader.pages]

def extract_text_pdfminer(pdf_path):
    """Extrae texto y corrige el número de páginas"""
    text = extract_text(pdf_path)
    # Separar páginas por el caracter de salto de página
    pages = text.split("\f")

    # Filtrar páginas vacías para evitar falsos positivos
    pages = [p for p in pages if p.strip()]

    return pages  # Devuelve el array de páginas

def extract_text_tesseract(pdf_bytes):
    """Extraer texto de imágenes escaneadas usando Tesseract OCR"""
    pdf_bytes.seek(0)
    images = convert_from_bytes(pdf_bytes.read())  # Convertir PDF en imágenes
    return [pytesseract.image_to_string(img) for img in images]

def extract_text_combined(pdf_file):
    """Convierte el archivo a BytesIO y almacena los textos en 5 arrays diferentes"""
    pdf_bytes = convert_uploaded_file_to_bytesio(pdf_file)

    # print('generando pymupdf...')
    text_pymupdf = extract_text_pymupdf(BytesIO(pdf_bytes.getvalue()))
    # print('generando pdfplumber...')
    text_pdfplumber = extract_text_pdfplumber(BytesIO(pdf_bytes.getvalue()))
    # print('generando pypdf2...')
    text_pypdf2 = extract_text_pypdf2(BytesIO(pdf_bytes.getvalue()))
    # print('generando pdfminer...')
    text_pdfminer = extract_text_pdfminer(BytesIO(pdf_bytes.getvalue()))
    # print('generando tesseract...')
    # text_tesseract = extract_text_tesseract(BytesIO(pdf_bytes.getvalue()))

    return text_pymupdf, text_pdfplumber, text_pypdf2, text_pdfminer  # , text_tesseract

