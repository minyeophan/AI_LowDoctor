import os
import time
import random
from dotenv import load_dotenv
from google import genai

from analysis.law_search import search_legal_sources, build_context_text

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY가 설정되어 있지 않습니다.")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)

PRIMARY_MODEL = "gemini-2.5-flash"
FALLBACK_MODEL = "gemini-2.0-flash"

GENERATION_RETRY_COUNT = 2

CHAT_TOP_K = 1
CHAT_PREFETCH_LIMIT = 4
CHAT_RERANK_TOP_N = 2
CHAT_MIN_SCORE = 0.25

MAX_CONTEXT_CHARS = 400
MAX_DOCUMENT_CONTEXT_CHARS = 900

ANSWER_CACHE = {}
ANSWER_CACHE_MAX_SIZE = 100


BASIC_DIRECT_MAP = {
    "임대인": (
        "임대인은 집이나 물건을 빌려주는 사람입니다.\n\n"
        "월세나 전세 계약에서는 보통 집주인 쪽을 말해요."
    ),
    "임차인": (
        "임차인은 집이나 물건을 빌려 사용하는 사람입니다.\n\n"
        "월세나 전세 계약에서는 보통 세입자 쪽을 말해요."
    ),
    "임대차": (
        "임대차는 한쪽이 집이나 물건을 빌려주고, "
        "다른 쪽이 돈을 내고 사용하는 계약입니다.\n\n"
        "집, 상가, 물건을 빌릴 때 자주 쓰는 말이에요."
    ),
    "보증금": (
        "보증금은 계약을 지키기 위해 미리 맡기는 돈입니다.\n\n"
        "계약이 끝나면 특별한 문제가 없는 한 돌려받는 돈이에요."
    ),
    "보증금 반환": (
        "보증금 반환은 계약이 끝난 뒤 맡겨둔 보증금을 돌려받는 것을 말합니다.\n\n"
        "임대차 계약이 끝났을 때 자주 문제가 되는 부분이에요."
    ),
    "보증금반환": (
        "보증금 반환은 계약이 끝난 뒤 맡겨둔 보증금을 돌려받는 것을 말합니다.\n\n"
        "임대차 계약이 끝났을 때 자주 문제가 되는 부분이에요."
    ),
    "월세": (
        "월세는 집이나 상가를 빌려 쓰는 대가로 매달 내는 돈입니다.\n\n"
        "계약서에서는 보통 차임이라고도 표현해요."
    ),
    "전세": (
        "전세는 큰 보증금을 맡기고 일정 기간 집을 사용하는 계약 방식입니다.\n\n"
        "보통 매달 월세를 내지 않는 대신 보증금을 크게 맡겨요."
    ),
    "차임": (
        "차임은 빌려 쓰는 대가로 내는 돈입니다.\n\n"
        "쉽게 말하면 월세 같은 사용료를 뜻해요."
    ),
    "관리비": (
        "관리비는 건물이나 시설을 유지하고 관리하는 데 드는 비용입니다.\n\n"
        "청소비, 공용 전기료, 승강기 관리비 등이 포함될 수 있어요."
    ),
    "계약금": (
        "계약금은 계약을 맺을 때 먼저 주고받는 돈입니다.\n\n"
        "계약을 실제로 진행하겠다는 의미로 쓰이는 경우가 많아요."
    ),
    "중도금": (
        "중도금은 계약금과 잔금 사이에 지급하는 돈입니다.\n\n"
        "계약 진행 중간 단계에서 나누어 내는 금액이에요."
    ),
    "잔금": (
        "잔금은 계약에서 마지막에 지급하는 나머지 금액입니다.\n\n"
        "보통 잔금을 지급하면서 입주나 물건 인도가 함께 진행돼요."
    ),
    "특약": (
        "특약은 계약서에 추가로 정한 약속입니다.\n\n"
        "기본 계약 내용보다 중요하게 적용될 수 있어서 꼼꼼히 확인해야 해요."
    ),
    "해지": (
        "해지는 계약을 앞으로 끝내는 것입니다.\n\n"
        "쉽게 말해 앞으로는 계약을 계속하지 않겠다는 뜻이에요."
    ),
    "해제": (
        "해제는 계약의 효력을 처음부터 없애는 것입니다.\n\n"
        "해지와 달리 계약을 처음부터 없었던 것처럼 처리하는 의미에 가까워요."
    ),
    "계약 해지": (
        "계약 해지는 계약을 끝내는 것입니다.\n\n"
        "계약서에 정해진 해지 조건과 통지 방법을 먼저 확인하는 게 좋아요."
    ),
    "계약해지": (
        "계약 해지는 계약을 끝내는 것입니다.\n\n"
        "계약서에 정해진 해지 조건과 통지 방법을 먼저 확인하는 게 좋아요."
    ),
    "위약금": (
        "위약금은 계약을 어겼을 때 부담하기로 미리 정한 돈입니다.\n\n"
        "계약을 중간에 깨거나 약속을 지키지 않았을 때 문제가 될 수 있어요."
    ),
    "손해배상": (
        "손해배상은 상대방의 잘못으로 생긴 손해를 보상받는 것입니다.\n\n"
        "보통 금전으로 배상하는 경우가 많아요."
    ),
    "지연손해금": (
        "지연손해금은 돈을 제때 주지 않았을 때 추가로 부담하는 금액입니다.\n\n"
        "쉽게 말해 늦게 지급한 데 대한 배상금이에요."
    ),
    "원상복구": (
        "원상복구는 사용한 집이나 물건을 원래 상태에 가깝게 돌려놓는 것을 말합니다.\n\n"
        "임대차 계약에서 퇴거할 때 자주 문제가 되는 부분이에요."
    ),
    "자동갱신": (
        "자동갱신은 일정 조건에서 계약이 자동으로 연장되는 것입니다.\n\n"
        "별도 의사표시가 없으면 계약이 계속 이어질 수 있어요."
    ),
    "묵시적갱신": (
        "묵시적 갱신은 별도의 말이 없어도 일정 조건에서 계약이 이어지는 것입니다.\n\n"
        "임대차 계약 종료 전후에 자주 나오는 개념이에요."
    ),
    "계약기간": (
        "계약기간은 계약의 효력이 유지되는 기간입니다.\n\n"
        "이 기간 동안 계약서에 적힌 권리와 의무가 적용돼요."
    ),
    "확정일자": (
        "확정일자는 문서가 특정 날짜에 존재했다는 사실을 공적으로 확인받는 것입니다.\n\n"
        "임대차에서는 보증금 보호와 관련해 중요할 수 있어요."
    ),
    "전입신고": (
        "전입신고는 새로운 주소로 이사한 사실을 행정기관에 신고하는 것입니다.\n\n"
        "주택 임대차에서는 보증금 보호와 관련될 수 있어요."
    ),
    "대항력": (
        "대항력은 제3자에게도 자신의 권리를 주장할 수 있는 힘입니다.\n\n"
        "임차인이 보증금을 보호받는 데 중요한 개념이에요."
    ),
    "우선변제권": (
        "우선변제권은 다른 채권자보다 먼저 변제를 받을 수 있는 권리입니다.\n\n"
        "임대차 보증금 보호에서 자주 나오는 말이에요."
    ),
    "내용증명": (
        "내용증명은 어떤 내용을 언제 보냈는지 우체국이 증명해주는 우편입니다.\n\n"
        "계약 해지나 보증금 반환 요구처럼 기록이 중요할 때 사용해요."
    ),
}


DIRECT_PATTERN_RULES = [
    {
        "keywords": ["보증금", "안줘"],
        "answer": (
            "보증금을 돌려받지 못했다면 먼저 증거를 정리하는 게 중요합니다.\n\n"
            "계약서, 송금 내역, 문자나 카카오톡 대화처럼 나중에 확인할 수 있는 자료를 모아두고 "
            "임대인에게 반환을 요구하는 것이 좋습니다."
        ),
    },
    {
        "keywords": ["보증금", "못받"],
        "answer": (
            "보증금을 받지 못했다면 계약서, 송금 내역, 대화 기록을 먼저 모아두는 것이 좋습니다.\n\n"
            "그다음 임대인에게 보증금 반환을 요구하고, 가능하면 문자나 내용증명처럼 "
            "기록이 남는 방식으로 진행하세요."
        ),
    },
    {
        "keywords": ["부동산", "사기"],
        "answer": (
            "부동산 사기가 의심되면 계약서, 송금 내역, 중개 대화, 등기부등본을 먼저 정리해두는 것이 중요합니다.\n\n"
            "상황에 따라 경찰 신고, 법률 상담, 내용증명 발송 등을 검토할 수 있습니다."
        ),
    },
    {
        "keywords": ["계약", "해지", "어떻게"],
        "answer": (
            "계약을 해지하려면 먼저 계약서의 해지 조건과 통지 방법을 확인해야 합니다.\n\n"
            "그다음 상대방에게 해지 의사를 문자, 이메일, 내용증명처럼 기록이 남는 방식으로 전달하는 것이 좋습니다."
        ),
    },
    {
        "keywords": ["원상복구", "어떻게"],
        "answer": (
            "원상복구 문제는 계약서 특약과 입주 당시 상태를 먼저 확인해야 합니다.\n\n"
            "사용 중 생긴 손상인지, 원래 있던 하자인지, 통상적인 사용으로 인한 마모인지에 따라 책임이 달라질 수 있습니다."
        ),
    },
    {
        "keywords": ["월세", "연체"],
        "answer": (
            "월세를 연체하면 계약 해지나 지연손해금 문제가 생길 수 있습니다.\n\n"
            "먼저 연체 금액과 기간을 확인하고, 임대인과 기록이 남는 방식으로 협의하는 것이 좋습니다."
        ),
    },
    {
        "keywords": ["어떻게", "대응"],
        "answer": (
            "먼저 상황을 증명할 자료를 정리하는 것이 좋습니다.\n\n"
            "계약서, 문자나 카카오톡 대화, 송금 내역처럼 나중에 확인할 수 있는 자료를 모아두세요."
        ),
    },
    {
        "keywords": ["뭘", "해야"],
        "answer": (
            "우선 관련 자료를 정리하고, 상대방에게 요구할 내용을 기록이 남는 방식으로 전달하는 것이 좋습니다.\n\n"
            "문자, 이메일, 내용증명처럼 나중에 확인 가능한 방식이 안전합니다."
        ),
    },
]


CHAT_BASE_PROMPT = """
너는 한국 법률 문서 이해를 돕는 챗봇이다.
업로드 문서 내용이 제공되면 반드시 업로드 문서 내용을 가장 우선으로 참고한다.
업로드 문서 내용이 있으면 법률 검색 참고자료보다 업로드 문서 내용을 우선한다.
검색 결과와 업로드 문서 내용이 있으면 그 범위 안에서만 답한다.
답변은 짧고 친절하게 작성하되, 불필요한 마무리 문구를 반복하지 않는다.
"필요하면 더 쉽게 풀어드릴게요", "더 자세히 설명해드릴게요", "필요하면 알려드릴게요" 같은 문구는 사용자가 요청하지 않으면 붙이지 않는다.
전문 용어는 쉬운 말로 풀어 쓴다.
문서 내용만으로 확인이 어려우면 어렵다고 답한다.
"한줄 답변:", "추가 안내:" 같은 라벨식 표현은 쓰지 않는다.
이전 대화 내용이 함께 제공되면 현재 질문은 이전 대화의 후속 질문으로 이해하고 답한다.
""".strip()


CHAT_TASK_PROMPTS = {
    "term_explanation": "용어 뜻을 쉬운 말로 짧게 설명한다.",
    "clause_explanation": "조항이나 문장의 의미를 쉬운 말로 짧게 풀어 설명한다.",
    "risk_check": "위험 여부를 먼저 말하고, 이유를 짧게 설명한다.",
    "action_guide": "먼저 해야 할 행동을 짧고 구체적으로 안내한다.",
    "general": "질문에 대해 쉬운 말로 짧게 답한다.",
}


DOC_TYPE_INSTRUCTIONS = {
    "lease": "임대차 맥락이다. 보증금, 월세, 계약기간, 해지, 원상복구, 특약을 우선 고려한다.",
    "employment": "근로계약 맥락이다. 임금, 근로시간, 해고를 우선 고려한다.",
    "terms": "약관 맥락이다. 환불, 해지, 자동갱신, 면책을 우선 고려한다.",
    "application": "동의서 맥락이다. 개인정보 수집, 제3자 제공을 우선 고려한다.",
}


def _is_429_error(error_text: str) -> bool:
    return "429" in error_text or "RESOURCE_EXHAUSTED" in error_text


def _is_503_error(error_text: str) -> bool:
    return (
        "503" in error_text
        or "UNAVAILABLE" in error_text
        or "high demand" in error_text.lower()
    )


def _generate_once(prompt: str, model: str) -> str:
    response = gemini_client.models.generate_content(
        model=model,
        contents=prompt,
    )
    return (response.text or "").strip()


def generate_with_retry(prompt: str, max_retries: int = GENERATION_RETRY_COUNT) -> str:
    models = [PRIMARY_MODEL, FALLBACK_MODEL]

    for model in models:
        for attempt in range(max_retries):
            try:
                answer = _generate_once(prompt, model)

                if answer:
                    return answer

                return "답변을 생성하지 못했습니다."

            except Exception as e:
                error_text = str(e)

                if _is_429_error(error_text):
                    raise

                if _is_503_error(error_text):
                    if attempt < max_retries - 1:
                        wait_time = (2 ** attempt) + random.uniform(0, 0.5)
                        time.sleep(wait_time)
                        continue
                    break

                raise

    return "현재 AI 요청이 많아 자세한 답변 생성이 어렵습니다.\n\n잠시 후 다시 질문해 주세요."


def add_followup_guide(answer: str) -> str:
    answer = (answer or "").strip()

    if not answer:
        return answer

    guide_phrases = [
        "더 쉽게 설명해드릴게요",
        "더 쉽게 풀어드릴게요",
        "자세히 설명해드릴게요",
        "예시로 설명해드릴게요",
    ]

    if any(phrase in answer for phrase in guide_phrases):
        return answer

    return answer + "\n\n원하시면 더 쉽게 설명해드릴게요."


def format_answer_for_readability(answer: str, max_chars: int = 500) -> str:
    answer = (answer or "").strip()

    if not answer:
        return answer

    banned_phrases = [
        "필요하면 더 쉽게 풀어드릴게요.",
        "필요하면 더 쉽게 설명해드릴게요.",
        "원하시면 더 쉽게 설명해드릴게요.",
        "원하시면 더 쉽게 풀어드릴게요.",
        "더 자세히 설명해드릴게요.",
        "필요하시면 더 자세히 설명해드릴게요.",
        "필요하면 알려드릴게요.",
    ]

    for phrase in banned_phrases:
        answer = answer.replace(phrase, "").strip()

    if len(answer) > max_chars:
        answer = answer[:max_chars].rstrip() + "..."

    answer = answer.replace(". ", ".\n\n")
    answer = answer.replace("? ", "?\n\n")
    answer = answer.replace("! ", "!\n\n")

    while "\n\n\n" in answer:
        answer = answer.replace("\n\n\n", "\n\n")

    return answer.strip()


def extract_current_user_question(question: str) -> str:
    text = (question or "").strip()

    marker = "현재 사용자 질문:"
    if marker not in text:
        return text

    current_part = text.split(marker, 1)[1].strip()

    end_markers = [
        "위 이전 대화의 맥락을 기준으로",
        "위 이전 대화",
    ]

    for end_marker in end_markers:
        if end_marker in current_part:
            current_part = current_part.split(end_marker, 1)[0].strip()

    return current_part.strip()


def is_site_help_question(question: str) -> bool:
    q = (question or "").strip().lower()
    compact_q = q.replace(" ", "")

    direct_menu_keywords = [
        "커뮤니티",
        "법률서식",
        "일정관리",
        "마이페이지",
        "회원탈퇴",
        "회원 탈퇴",
        "사례검색",
        "사례 검색",
        "챗봇",
        "aidt",
        "메인홈페이지",
        "메인 홈페이지",
        "홈페이지",
    ]

    normalized_menu_keywords = [
        keyword.replace(" ", "").lower() for keyword in direct_menu_keywords
    ]

    if q in direct_menu_keywords or compact_q in normalized_menu_keywords:
        return True

    site_keywords = [
        "이 사이트",
        "사이트",
        "홈페이지",
        "페이지",
        "화면",
        "메뉴",
        "기능",
        "법률서식",
        "일정관리",
        "커뮤니티",
        "마이페이지",
        "로그인",
        "회원가입",
        "회원 탈퇴",
        "탈퇴",
        "계정 삭제",
        "aidt",
        "사례 검색",
        "챗봇",
    ]

    intent_keywords = [
        "어디",
        "이동",
        "들어가",
        "들어가는",
        "가는",
        "경로",
        "사용법",
        "뭐 할 수",
        "무엇을 할 수",
        "버튼",
        "위치",
    ]

    if "회원 탈퇴" in q or "계정 삭제" in q or q == "탈퇴":
        return True

    if any(k in q for k in site_keywords) and any(k in q for k in intent_keywords):
        return True

    if "이 사이트에서 뭐 할 수 있어" in q or ("이 사이트" in q and "기능" in q):
        return True

    return False


def is_document_specific_question(question: str) -> bool:
    q = (question or "").strip()

    return any(
        x in q
        for x in [
            "특약",
            "조항",
            "계약서",
            "이 내용",
            "이 문서",
            "주의해서 봐야",
            "확인해야",
            "위험한 부분",
            "불리한 부분",
            "과한지",
            "봐줘",
            "검토",
            "분석",
            "원상복구",
            "보증금 반환",
            "계약 내용",
            "대응가이드",
            "개선안",
        ]
    )


def classify_chat_intent(question: str) -> str:
    q = (question or "").strip()

    if len(q.split()) == 1 or len(q) <= 6:
        return "term_explanation"

    if any(x in q for x in ["뜻", "뭐야", "의미", "정의"]):
        return "term_explanation"

    if any(x in q for x in ["쉽게", "해석", "무슨 뜻", "이 문장", "이 조항", "설명해줘"]):
        return "clause_explanation"

    if any(x in q for x in ["위험", "문제", "불리", "손해", "괜찮아", "봐줘", "리스크", "과한"]):
        return "risk_check"

    if any(x in q for x in ["어떻게", "대응", "해야 돼", "조치", "말해야", "수정 요청", "어쩌지"]):
        return "action_guide"

    return "general"


def detect_doc_type_from_question(question: str) -> str | None:
    q = (question or "").strip()

    if any(x in q for x in ["임대차", "전세", "월세", "보증금", "임대인", "임차인", "집주인", "원상복구"]):
        return "lease"

    if any(x in q for x in ["근로계약", "근로자", "회사", "급여", "임금", "해고", "퇴직"]):
        return "employment"

    if any(x in q for x in ["약관", "회원", "환불", "서비스", "면책", "자동갱신", "개인정보"]):
        return "terms"

    if any(x in q for x in ["신청서", "동의서", "제3자 제공", "수집", "보유기간"]):
        return "application"

    return None


def build_prompt(question: str, context_text: str, document_text: str | None = None) -> str:
    current_question = extract_current_user_question(question)

    intent = classify_chat_intent(current_question)
    task_prompt = CHAT_TASK_PROMPTS.get(intent, CHAT_TASK_PROMPTS["general"])

    doc_type = detect_doc_type_from_question(question)
    doc_type_instruction = DOC_TYPE_INSTRUCTIONS.get(doc_type, "")

    document_text = (document_text or "").strip()
    document_text = document_text[:MAX_DOCUMENT_CONTEXT_CHARS]

    parts = [CHAT_BASE_PROMPT, task_prompt]

    if doc_type_instruction:
        parts.append(doc_type_instruction)

    if document_text:
        parts.append(
            "[업로드 문서 내용]\n"
            f"{document_text}\n\n"
            "위 업로드 문서 내용을 우선으로 참고해서 답변하라. "
            "문서 내용에서 확인되는 부분만 말하고, 문서에 없는 내용은 단정하지 말라."
        )

    if context_text:
        parts.append(f"[법률 검색 참고자료]\n{context_text}")

    parts.append(f"[사용자 질문]\n{question}")

    return "\n\n".join(parts).strip()


def _site_answer(page_name: str, description: str, path: str, button_text: str) -> str:
    return (
        f"[사이트안내]\n"
        f"페이지명: {page_name}\n"
        f"설명: {description}\n"
        f"경로: {path}\n"
        f"버튼텍스트: {button_text}"
    )


def answer_site_help_direct(question: str, current_path: str | None = None) -> str:
    q = (question or "").strip()

    if "회원 탈퇴" in q or "탈퇴" in q or "계정 삭제" in q:
        return _site_answer(
            "마이페이지",
            "회원 탈퇴는 마이페이지에서 진행할 수 있어요. 이동한 뒤 회원 탈퇴 버튼을 누르면 됩니다.",
            "/mypage",
            "회원 탈퇴 하러 가기",
        )

    if "커뮤니티" in q:
        return _site_answer(
            "커뮤니티",
            "커뮤니티 페이지에서 게시글 목록 보기, 인기글 확인, 게시글 작성, 게시글 상세 확인을 할 수 있어요.",
            "/community",
            "커뮤니티로 이동",
        )

    if "법률서식" in q or ("서식" in q and "내용증명" not in q and "통보서" not in q):
        return _site_answer(
            "법률서식",
            "법률서식 페이지에서 다양한 서식을 확인하고 다운로드할 수 있어요.",
            "/form",
            "법률서식으로 이동",
        )

    if "일정" in q:
        return _site_answer(
            "일정관리",
            "일정관리 페이지에서 계약 관련 일정을 확인하고 관리할 수 있어요.",
            "/schedule",
            "일정관리로 이동",
        )

    if "마이페이지" in q:
        return _site_answer(
            "마이페이지",
            "마이페이지에서 내 문서와 계정 정보를 확인할 수 있어요.",
            "/mypage",
            "마이페이지로 이동",
        )

    if "사례 검색" in q:
        return _site_answer(
            "AIDT",
            "사례 검색은 AIDT 화면 오른쪽 사이드바에서 사용할 수 있어요.",
            "/analysis",
            "AIDT로 이동",
        )

    if "챗봇" in q:
        return _site_answer(
            "AIDT",
            "챗봇은 AIDT 화면 오른쪽 사이드바에서 사용할 수 있어요.",
            "/analysis",
            "AIDT로 이동",
        )

    if "메인" in q or "홈페이지" in q or "aidt" in q.lower():
        return _site_answer(
            "AIDT",
            "AIDT에서는 문서 업로드, 문서 보기와 편집, AI 분석, 요약 확인, 챗봇과 사례 검색 기능을 사용할 수 있어요.",
            "/analysis",
            "AIDT로 이동",
        )

    return _site_answer(
        "AIDT",
        "AIDT에서는 문서 업로드, 문서 보기와 편집, AI 분석, 요약 확인, 챗봇과 사례 검색 기능을 사용할 수 있어요.",
        "/analysis",
        "AIDT로 이동",
    )


def get_direct_pattern_answer(question: str) -> str | None:
    q = (question or "").replace(" ", "")

    for rule in DIRECT_PATTERN_RULES:
        if all(keyword.replace(" ", "") in q for keyword in rule["keywords"]):
            return rule["answer"]

    return None


def _is_busy_answer(answer: str) -> bool:
    return "현재 AI 요청이 많아" in answer or "현재 AI 검색 요청이 많아" in answer


def answer_with_document_first(question: str, document_text: str) -> str:
    prompt = build_prompt(
        question=question,
        context_text="",
        document_text=document_text,
    )

    cache_key = f"doc:{question}:{document_text[:120]}"
    cached_answer = ANSWER_CACHE.get(cache_key)

    if cached_answer:
        return cached_answer

    answer = generate_with_retry(prompt)

    if not answer:
        return "답변을 생성하지 못했습니다."

    answer = format_answer_for_readability(answer)

    if not _is_busy_answer(answer):
        if len(ANSWER_CACHE) >= ANSWER_CACHE_MAX_SIZE:
            ANSWER_CACHE.pop(next(iter(ANSWER_CACHE)))

        ANSWER_CACHE[cache_key] = answer

    return answer


def answer_chat(
    question: str,
    current_path: str | None = None,
    document_text: str | None = None,
) -> str:
    question = (question or "").strip()
    document_text = (document_text or "").strip()

    if not question:
        return "질문이 비어 있습니다."

    current_question = extract_current_user_question(question)

    if is_site_help_question(current_question):
        return answer_site_help_direct(current_question, current_path)

    normalized_question = current_question.replace(" ", "")
    basic_answer = BASIC_DIRECT_MAP.get(current_question) or BASIC_DIRECT_MAP.get(normalized_question)

    if basic_answer:
        return add_followup_guide(basic_answer)

    pattern_answer = get_direct_pattern_answer(current_question)

    if pattern_answer:
        return pattern_answer

    if document_text:
        return answer_with_document_first(question, document_text)

    if is_document_specific_question(current_question):
        return (
            "현재 챗봇은 업로드 문서 원문을 직접 읽어 답변하지 않습니다.\n\n"
            "계약서 내용 확인이나 특약 검토가 필요하다면 "
            "AI 분석 화면에서 요약, 위험탐지, 대응가이드를 먼저 확인해 주세요."
        )

    grouped = {
        "terms": [],
        "knowledge": [],
        "laws": [],
        "interpretations": [],
        "cases": [],
        "others": [],
    }

    try:
        grouped = search_legal_sources(
            question,
            top_k=CHAT_TOP_K,
            prefetch_limit=CHAT_PREFETCH_LIMIT,
            rerank_top_n=CHAT_RERANK_TOP_N,
            min_score=CHAT_MIN_SCORE,
        )

    except Exception as e:
        error_text = str(e)

        if _is_503_error(error_text):
            return "현재 AI 검색 요청이 많아 자세한 검색 답변은 어렵습니다.\n\n잠시 후 다시 질문해 주세요."

        raise

    context_text = build_context_text(grouped)[:MAX_CONTEXT_CHARS]
    has_any_result = any(len(grouped[key]) > 0 for key in grouped)

    if not has_any_result:
        return "죄송합니다. 관련 정보를 찾지 못했습니다.\n\n다른 표현으로 다시 질문해 주세요."

    prompt = build_prompt(question, context_text, document_text=None)

    cache_key = f"{question}:{context_text[:120]}"
    cached_answer = ANSWER_CACHE.get(cache_key)

    if cached_answer:
        return cached_answer

    answer = generate_with_retry(prompt)

    if not answer:
        return "답변을 생성하지 못했습니다."

    answer = format_answer_for_readability(answer)

    if not _is_busy_answer(answer):
        if len(ANSWER_CACHE) >= ANSWER_CACHE_MAX_SIZE:
            ANSWER_CACHE.pop(next(iter(ANSWER_CACHE)))

        ANSWER_CACHE[cache_key] = answer

    return answer