import pdfplumber  # 텍스트 기반 PDF 처리
import pytesseract  # 이미지 OCR 처리
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
    text = ""  # 전체 텍스트 저장 변수 초기화

    # PDF 파일 열기
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            # 1) pdfplumber로 텍스트 추출
            page_text = page.extract_text()
            
            if page_text:  # 텍스트가 있으면 그대로 사용
                text += f"--- Page {page_num} (텍스트 기반) ---\n{page_text}\n"
            else:  # 텍스트가 없으면 이미지로 간주 후 OCR 수행
                # pdfplumber로 페이지 이미지를 PIL.Image로 변환
                pil_image = page.to_image(resolution=300).original
                # pytesseract OCR 수행
                ocr_text = pytesseract.image_to_string(pil_image, lang="kor+eng", config="--psm 6")
                text += f"--- Page {page_num} (이미지 기반 OCR) ---\n{ocr_text}\n"

    return text


