export enum WishStepStatus {
    FIRST_MESSAGE = "FIRST_MESSAGE",
    QUESTION = "QUESTION",
    DONE = "DONE",
}
export enum WishMessages {
    TITLE = "문장으로 적금 찾기",
    HELP = "지금 상황을 문장으로 적어 주세요. 상황에 맞는 적금 순위를 근거와 함께 알려 드려요.",
    PLACEHOLDER = "예: 사회초년생이고 월 30만원씩 1년 모으고 싶어요",
    SEND = "보내기",
    LOADING_READING = "문장을 읽는 중...",
    LOADING_ANALYZING = "상황을 분석하는 중...",
    LOADING_AI_ANSWER = "AI 답변을 기다리는 중...",
    LOADING_MATCHING = "우대조건을 맞춰 보는 중...",
    LOADING_RANKING = "상품 순위를 고르는 중...",
    LOADING_ESTIMATE = "보통 1~2분 정도 걸려요",
    CONTINUE_WITH_BUTTONS = "버튼으로 이어서 답하기",
    UNMAPPED_TITLE = "상품 데이터로 확인하지 못한 요구예요.",
    NETWORK_ERROR = "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
    INPUT_ERROR = "문장을 이해하지 못했어요. 다르게 적어 다시 보내 주세요.",
    AI_UNAVAILABLE = "AI 사용이 현재 어려워 문장 추천이 안 되고 있어요. 잠시 후 다시 시도하시거나, 버튼으로 질문에 답하시면 바로 추천받을 수 있어요.",
    SERVER_ERROR = "AI 응답 처리 중 문제가 있었어요. 잠시 후 다시 시도해 주세요.",
    RESPONSE_ERROR = "AI 답변이 느려서 응답을 처리하지 못했어요. AI 응답 상태를 확인해 주세요.",
}
