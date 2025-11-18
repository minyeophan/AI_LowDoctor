import pytesseract
from PIL import Image

# OCR 텍스트 추출 함수 정의
def extract_text_from_image(path: str) -> str:
    img = Image.open(path)
    return pytesseract.image_to_string(img, lang="kor+eng", config='--psm 6')

# 테스트용 실행
if __name__ == "__main__":
    sample_path = "../../samples/contract_sample.png"
    try:
        print("=== OCR 결과 ===")
        result_text = extract_text_from_image(sample_path)
        print(result_text)
    except FileNotFoundError:
        print("⚠️ 샘플 이미지 파일을 찾을 수 없습니다.")
