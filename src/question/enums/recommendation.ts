// 답을 모르거나 건너뛴 경우 서버로 보내는 값.
export enum ServerAnswerValue {
    SKIPPED = "none",
}
export enum NextStepStatus {
    QUESTION = "question",
    DONE = "done",
}
export enum AnswerKind {
    MULTI_OPTIONS = "MULTI_OPTIONS",
    OPTIONS = "OPTIONS",
    NUMBER = "NUMBER",
    NUMBER_WITH_OPTIONS = "NUMBER_WITH_OPTIONS",
    BOOLEAN = "BOOLEAN",
}
export enum BonusResult {
    ELIGIBLE = "ELIGIBLE",
    NOT_ELIGIBLE = "NOT_ELIGIBLE",
    UNKNOWN = "UNKNOWN",
}
export enum RequestStatus {
    LOADING = "LOADING",
    READY = "READY",
    ERROR = "ERROR",
}
export enum MonthlyLimitStatus {
    LIMITED = "LIMITED",
    UNLIMITED = "UNLIMITED",
}
export enum RecommendationMessages {
    MULTI_CHOICE_HELP = "해당하는 것을 모두 골라 주세요.",
    MY_CONDITIONS = "내가 답한 조건",
    MY_CONDITIONS_HELP = "이 조건으로 적금을 비교할게요. 맞는지 확인해 주세요.",
    MY_CONDITIONS_LINK = "내가 답한 조건 보기",
    BANK_NAME_UNAVAILABLE = "은행명 확인 필요",
    SHOW_RESULT = "결과 보기",
    EDIT_CONDITIONS = "조건 고치기",
    START = "선택해서 비교하기",
    ALL_PRODUCTS = "전체 상품 보기",
    BACK = "뒤로",
    SKIP = "건너뛰기",
    NEXT = "다음",
    RETRY = "다시 시도",
    LOADING = "조건을 확인하고 있어요.",
    NETWORK_ERROR = "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
    CONDITIONS_UNAVAILABLE = "상품 조건 데이터를 확인할 수 없어 비교할 수 없어요. 잠시 후 다시 시도해 주세요.",
    SERVER_ERROR = "조건을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
    INPUT_ERROR = "답변을 확인하지 못했어요. 뒤로 가서 다시 입력해 주세요.",
    RESPONSE_ERROR = "응답을 읽지 못했어요. 다시 시도해 주세요.",
    EMPTY = "입력한 조건에 맞는 상품이 없어요.",
    EMPTY_HELP = "답변을 수정하거나, 다른 기간으로 다시 비교해 보세요.",
    RESULT = "내 조건으로 비교한 적금",
    RESULT_HELP = "확인된 가입조건과 우대조건을 반영한 금리 순서예요.",
    RESULT_BACK = "결과로",
    MISSING = "저장된 비교 결과가 없어요.",
    MISSING_HELP = "조건을 입력하면 실제 상품의 금리를 비교할 수 있어요.",
    BONUS_TITLE = "우대조건 판정",
    MATCHED_BONUS_TITLE = "현재 내 조건으로 충족한 우대",
    UNMATCHED_BONUS_TITLE = "그 외 우대사항",
    SOURCE_TITLE = "우대조건 공시 원문",
    ELIGIBILITY_CHECKLIST_TITLE = "가입 자격·납입 조건 체크리스트",
    BONUS_CHECKLIST_TITLE = "우대조건 체크리스트",
    OTHER_CHECKLIST_TITLE = "기타 공시 조건 체크리스트",
    CONDITION_REASON = "확인이 필요한 이유:",
    NO_SOURCE = "등록된 우대조건 원문이 없어요.",
    APPLIED_RATE = "조건 반영 금리",
    UNLIMITED = "한도 없음",
    ELIGIBLE = "충족",
    NOT_ELIGIBLE = "미충족",
    UNKNOWN = "확인하지 않음",
}
