// ── 주민등록번호 ──────────────────────────────────────────────────────────────
// 구분자(-, ., 공백) 없거나 1개까지 허용 / 뒷자리 첫 숫자 1~4 제한
// 앞뒤에 다른 숫자가 붙으면 미매칭 (더 긴 숫자열 오탐 방지)
const SSN_PATTERN = /(?<!\d)\d{6}[\s.\-]?[1-4]\d{6}(?!\d)/g;
const SSN_MASK    = '******-*******';

// ── 전화번호 ──────────────────────────────────────────────────────────────────
// 010 외 지역번호(02, 031 등) 포함 / 구분자 정확히 1개씩 필수
// 구분자 없는 붙여쓰기는 날짜로 오인 가능하여 제외
const PHONE_PATTERN = /(0\d{1,2})[\s.\-](\d{3,4})[\s.\-](\d{4})/g;
const maskPhoneNumber = (_, prefix, mid, last) =>
  `${prefix}-${'*'.repeat(mid.length)}-${last}`;

// ── 계좌번호 ──────────────────────────────────────────────────────────────────
// KB/NH/SC 영문 접두사 선택적 허용 / 은행명 필수 (조항번호 오탐 방지)
// 숫자+하이픈 10자리 이상일 때만 매칭 / 은행명 유지, 번호만 마스킹
const ACCOUNT_PATTERN = /(?:KB|NH|SC)?(국민|신한|우리|하나|기업|농협|수협|산업|외환|SC제일|씨티|카카오|케이|토스|우체국|새마을|신협|대구|부산|경남|광주|전북|제주|저축)(은행)?\s*([\d][\d\-]{9,})/g;
const maskAccountNumber = (_, bank, suffix, numbers) =>
  `${bank}${suffix ?? ''} ${'*'.repeat(numbers.trim().length)}`;

// ── 상세주소 ──────────────────────────────────────────────────────────────────
// 동·호수: 동과 호가 함께 있을 때만 매칭 (단독 "동" → 지명 오탐 방지)
// 번지: "123-4번지" / "123번지" 패턴 / 원본 자릿수만큼 * 처리
const BUILDING_UNIT_PATTERN = /(\d+)동\s+(\d+)호/g;
const JIBUN_WITH_HYPHEN_PATTERN = /(\d+)-(\d+)(번지)/g;
const JIBUN_PLAIN_PATTERN = /(\d+)(번지)/g;

const maskBuildingUnit = (_, building, unit) =>
  `${'*'.repeat(building.length)}동 ${'*'.repeat(unit.length)}호`;

const maskJibunWithHyphen = (_, main, sub, suffix) =>
  `${'*'.repeat(main.length)}-${'*'.repeat(sub.length)}${suffix}`;

const maskJibunPlain = (_, number, suffix) =>
  `${'*'.repeat(number.length)}${suffix}`;


// ── 메인 함수 ─────────────────────────────────────────────────────────────────
// SSN → 전화 → 계좌 → 주소 순서로 실행 (순서 변경 시 패턴 충돌 가능)
export function maskPII(html) {
  return html
    .replace(SSN_PATTERN,                SSN_MASK)
    .replace(PHONE_PATTERN,              maskPhoneNumber)
    .replace(ACCOUNT_PATTERN,            maskAccountNumber)
    .replace(BUILDING_UNIT_PATTERN,      maskBuildingUnit)
    .replace(JIBUN_WITH_HYPHEN_PATTERN,  maskJibunWithHyphen)
    .replace(JIBUN_PLAIN_PATTERN,        maskJibunPlain);
}
