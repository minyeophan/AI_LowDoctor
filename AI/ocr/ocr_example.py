import pdfplumber
import pytesseract
from PIL import Image
import os


# ----------------------------------------
# PDF에서 텍스트 추출 함수 (통합 버전)
# ----------------------------------------
def extract_text_from_pdf(pdf_path: str) -> str:
    """
    pdfplumber와 pytesseract를 사용하여 PDF에서 텍스트 추출
    - 텍스트 기반 페이지는 pdfplumber 사용
    - 이미지 기반 페이지는 pytesseract OCR 사용
    - 각 페이지를 순회하며 텍스트 누적
    """
    text = ""

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text()

            if page_text:
                text += f"--- Page {page_num} (텍스트 기반) ---\n{page_text}\n"
            else:
                pil_image = page.to_image(resolution=300).original
                ocr_text = pytesseract.image_to_string(pil_image, lang="kor+eng", config="--psm 6")
                text += f"--- Page {page_num} (이미지 기반 OCR) ---\n{ocr_text}\n"

    return text
