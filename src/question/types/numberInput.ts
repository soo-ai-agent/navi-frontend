/** 금액·나이 칩 하나. 누르면 지금 값을 nextValue 로 바꾼다. */
export type NumberChipView = {
    readonly label: string;
    readonly nextValue: string;
};

/** 값을 누적하지 않고 그 자체로 답이 되는 선택지(예: "목표 금액은 없어요"). */
export type NumberAnswerOptionView = {
    readonly label: string;
    readonly value: string;
};

/** 드래그로 고를 수 있는 범위. 상한은 나이처럼 좁은 범위이거나, 금액 선택지 중 가장 큰 값이다. */
export type NumberSliderView = {
    readonly minimum: number;
    readonly maximum: number;
    readonly step: number;
    readonly value: number;
};

export type NumberInputView = {
    /** 드래그 범위가 없는 질문은 항목이 비어 있다 — 금액처럼 범위가 넓으면 드래그가 무의미하다. */
    readonly sliders: readonly NumberSliderView[];
    readonly chips: readonly NumberChipView[];
    readonly answerOptions: readonly NumberAnswerOptionView[];
    /** 입력칸에 보이는 글자. 유효한 숫자는 1,000,000 처럼 자리표를 넣어 보여준다. */
    readonly displayValue: string;
    readonly unit: string;
    /** 입력칸 아래 한 줄 안내. 유효하면 읽는 말(백만원), 아니면 잘못된 이유. */
    readonly hint: string;
    readonly valid: boolean;
};

export type MultiChoiceItemView = {
    readonly value: string;
    readonly label: string;
    readonly selected: boolean;
};

export type MultiChoiceView = {
    readonly items: readonly MultiChoiceItemView[];
    readonly valid: boolean;
};

export type NumberInputSettings = {
    readonly unit: string;
    readonly minimum: bigint;
    readonly maximum: bigint;
    readonly invalidMessage: string;
    /** 드래그로 고를 수 있으면 true. 범위가 넓은 금액 질문은 false. */
    readonly draggable: boolean;
};
