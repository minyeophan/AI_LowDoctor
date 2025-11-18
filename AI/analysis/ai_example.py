import os
from openai import OpenAI
from dotenv import load_dotenv

# .env 파일 불러오기
load_dotenv()

# OpenAI 클라이언트 설정 (환경변수에서 API 키 읽기)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 샘플 텍스트
sample_text = """
임대인은 계약 해지 시 임차인에게 과도한 위약금을 청구할 수 있다.
이 조항은 일반적인 수준을 넘어선 부담을 줄 수 있다.
"""

# 분석 함수 정의
def analyze_contract(text: str) -> str:
    prompt = f"""
    다음 계약서 문장에서 임차인에게 불리할 수 있는 위험 요소를 설명해줘.
    초보자도 이해할 수 있게 간단히 풀어서 설명하고,
    어떻게 수정하거나 대응하면 좋을지 가이드도 함께 제시해줘.

    문장:
    {text}
    """
    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    if res.choices and res.choices[0].message:
        return res.choices[0].message.content
    else:
        return "⚠️ 응답이 비어있거나 형식이 다름"

# 테스트용 실행
if __name__ == "__main__":
    result = analyze_contract(sample_text)
    print("=== AI 분석 결과 ===")
    print(result)
