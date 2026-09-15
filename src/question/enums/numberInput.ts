/** 해당하는 은행이 없다는 답. 모른다는 답(ServerAnswerValue.SKIPPED)과 뜻이 다르다. */
export const NO_BANK_ANSWER: string = "no_bank";
export enum NumberInputKey {
    AGE = "age",
    MONTHLY = "monthly",
    PRINCIPAL = "principal",
    CARD_SPEND = "card_spend_at_product_bank",
}

export enum NumberInputMessages {
    UNSELECTED = "아직 입력하지 않았어요.",
    INVALID = "0 이상의 정수를 입력해 주세요.",
    AGE_INVALID = "만 나이는 0~120세로 입력해 주세요.",
    MONTHLY_INVALID = "월 납입액은 1원 이상 입력해 주세요.",
    ENTERED = "입력한 값",
    CLEAR = "지우기",
    AGE_UNIT = "세",
    MONEY_UNIT = "원",
}
