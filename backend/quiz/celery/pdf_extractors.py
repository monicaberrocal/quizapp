from io import BytesIO
import fitz  # PyMuPDF
import pdfplumber
import PyPDF2
from pdfminer.high_level import extract_text


def extract_text_with_pymupdf(pdf_bytes):
    pdf_bytes.seek(0)
    doc = fitz.open(stream=pdf_bytes.read(), filetype="pdf")
    return [page.get_text("text") for page in doc]


def extract_text_with_pdfplumber(pdf_bytes):
    pdf_bytes.seek(0)
    with pdfplumber.open(pdf_bytes) as pdf:
        return [page.extract_text() or "" for page in pdf.pages]


def extract_text_with_pypdf2(pdf_bytes):
    pdf_bytes.seek(0)
    reader = PyPDF2.PdfReader(pdf_bytes)
    return [page.extract_text() or "" for page in reader.pages]


def extract_text_with_pdfminer(pdf_bytes):
    pdf_bytes.seek(0)
    text = extract_text(pdf_bytes)
    pages = text.split("\f")
    return [p for p in pages if p.strip()]


def extract_all_text_versions(pdf_file):
    pdf_data = pdf_file if isinstance(pdf_file, bytes) else pdf_file.read()

    text_with_pymupdf = extract_text_with_pymupdf(BytesIO(pdf_data))
    text_with_pdfplumber = extract_text_with_pdfplumber(BytesIO(pdf_data))
    text_with_pypdf2 = extract_text_with_pypdf2(BytesIO(pdf_data))
    text_with_pdfminer = extract_text_with_pdfminer(BytesIO(pdf_data))

    return text_with_pymupdf, text_with_pdfplumber, text_with_pypdf2, text_with_pdfminer

