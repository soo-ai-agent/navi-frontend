import {NumberInputKey, NumberInputMessages} from "../enums/numberInput";
import type {NumberAnswerOptionView, NumberChipView, NumberInputSettings, NumberInputView, NumberSliderView} from "../types/numberInput";
import type {QuestionOption} from "../types/recommendation";

export const MONTHLY_INPUT_OPTIONS: readonly QuestionOption[] = [
    ["100000", "10만원"], ["300000", "30만원"], ["500000", "50만원"], ["1000000", "100만원"],
];

// HTTP 숫자 답변은 최대 18자리 문자열이다.
const MAX_AMOUNT: bigint = 999999999999999999n;
const HUNDRED_MILLION: bigint = 100000000n;
const TEN_THOUSAND: bigint = 10000n;

// 서버가 정한 키가 아닌 숫자 질문은 단위 없이 범위만 검사한다.
const DEFAULT_SETTINGS: NumberInputSettings = {
    unit: "", minimum: 0n, maximum: MAX_AMOUNT, invalidMessage: NumberInputMessages.INVALID, draggable: false,
};
const SETTINGS_BY_KEY: Readonly<Record<NumberInputKey, NumberInputSettings>> = {
    [NumberInputKey.AGE]: {
        unit: NumberInputMessages.AGE_UNIT, minimum: 0n, maximum: 120n,
        invalidMessage: NumberInputMessages.AGE_INVALID, draggable: true,
    },
    [NumberInputKey.MONTHLY]: {
        unit: NumberInputMessages.MONEY_UNIT, minimum: 1n, maximum: MAX_AMOUNT,
        invalidMessage: NumberInputMessages.MONTHLY_INVALID, draggable: false,
    },
    [NumberInputKey.CARD_SPEND]: {
        unit: NumberInputMessages.MONEY_UNIT, minimum: 0n, maximum: MAX_AMOUNT,
        invalidMessage: NumberInputMessages.INVALID, draggable: false,
    },
    [NumberInputKey.PRINCIPAL]: {
        unit: NumberInputMessages.MONEY_UNIT, minimum: 0n, maximum: MAX_AMOUNT,
        invalidMessage: NumberInputMessages.INVALID, draggable: false,
    },
};

// 사용자가 1,000,000 처럼 자리표를 넣어 입력해도 서버에는 숫자만 보낸다.
export function numberAnswerValue(typed: string): string {
    return typed.replaceAll(",", "").trim();
}

export function numberInputView(value: string, key: string, options: readonly QuestionOption[]): NumberInputView {
    const settings: NumberInputSettings = numberInputSettings(key);
    const chips: readonly NumberChipView[] = chipViews(options);
    const answerOptions: readonly NumberAnswerOptionView[] = answerOptionViews(options);
    const normalized: string = value.trim();
    if (normalized === "") {
        return {
            chips, answerOptions, sliders: sliderViews(settings, settings.minimum, options), unit: settings.unit,
            displayValue: "", hint: NumberInputMessages.UNSELECTED, valid: false,
        };
    }
    if (!/^\d{1,18}$/u.test(normalized)) {
        return {
            chips, answerOptions, sliders: sliderViews(settings, settings.minimum, options), unit: settings.unit,
            displayValue: value, hint: settings.invalidMessage, valid: false,
        };
    }
    // 18자리는 number 정밀도를 넘으므로 표시와 범위 검사에 BigInt를 쓴다.
    const amount: bigint = BigInt(normalized);
    const valid: boolean = amount >= settings.minimum && amount <= settings.maximum;
    return {
        chips, answerOptions, sliders: sliderViews(settings, amount, options), unit: settings.unit,
        displayValue: amount.toLocaleString("ko-KR"),
        hint: valid ? hintText(amount, settings) : settings.invalidMessage,
        valid,
    };
}

// 우대조건 질문의 키는 "card_spend_at_product_bank:은행코드" 처럼 뒤에 대상이 붙는다.
function numberInputSettings(key: string): NumberInputSettings {
    const [field] = key.split(":");
    // 서버가 정한 키 밖의 숫자 질문이 있다.
    const known: NumberInputKey | undefined = Object.values(NumberInputKey)
        .find((candidate: NumberInputKey) => candidate === field);
    return known === undefined ? DEFAULT_SETTINGS : SETTINGS_BY_KEY[known];
}

// 칩을 누르면 그 값으로 바뀐다. 선택지 값이 숫자가 아닌 질문(예/아니오 등)에는 칩을 만들지 않는다.
function chipViews(options: readonly QuestionOption[]): readonly NumberChipView[] {
    const chips: NumberChipView[] = [];
    for (const [value, label] of options) {
        if (/^\d{1,18}$/u.test(value)) {
            chips.push({label, nextValue: value});
        }
    }
    return chips;
}

// 숫자가 아닌 선택지는 더할 수 없다 — 누르면 그 값이 그대로 답이 된다.
function answerOptionViews(options: readonly QuestionOption[]): readonly NumberAnswerOptionView[] {
    const answerOptions: NumberAnswerOptionView[] = [];
    for (const [value, label] of options) {
        if (!/^\d{1,18}$/u.test(value)) {
            answerOptions.push({label, value});
        }
    }
    return answerOptions;
}

// 나이처럼 설정에 좁은 범위가 있으면 그대로 쓰고, 금액처럼 상한이 18자리인 질문은
// 선택지 중 가장 큰 값을 상한으로 삼는다 — 18자리를 끝까지 끄는 막대는 쓸 수 없다.
function sliderViews(
    settings: NumberInputSettings, amount: bigint, options: readonly QuestionOption[],
): readonly NumberSliderView[] {
    const maximum: number = settings.draggable ? Number(settings.maximum) : largestOption(options);
    if (maximum <= 0) {
        return [];
    }
    const minimum: number = Number(settings.minimum);
    const value: number = Math.min(Math.max(Number(amount), minimum), maximum);
    return [{minimum, maximum, step: sliderStep(minimum, maximum), value}];
}

function largestOption(options: readonly QuestionOption[]): number {
    let largest: number = 0;
    for (const [value] of options) {
        if (/^\d{1,15}$/u.test(value)) {
            largest = Math.max(largest, Number(value));
        }
    }
    return largest;
}

// 막대를 끝에서 끝까지 100칸으로 나눈다. 금액은 만원 단위로 떨어지게 올림한다.
function sliderStep(minimum: number, maximum: number): number {
    const span: number = maximum - minimum;
    if (span <= 200) {
        return 1;
    }
    return Math.ceil(span / 100 / 10000) * 10000;
}

// 금액은 사람이 읽는 말(100만원)로, 나머지 단위는 입력한 수 그대로 보여 준다.
function hintText(amount: bigint, settings: NumberInputSettings): string {
    if (settings.unit !== NumberInputMessages.MONEY_UNIT) {
        return `${NumberInputMessages.ENTERED} ${amount.toLocaleString("ko-KR")}${settings.unit}`;
    }
    const parts: string[] = [];
    const hundredMillions: bigint = amount / HUNDRED_MILLION;
    const tenThousands: bigint = (amount % HUNDRED_MILLION) / TEN_THOUSAND;
    const ones: bigint = amount % TEN_THOUSAND;
    if (hundredMillions > 0n) {
        parts.push(`${hundredMillions.toLocaleString("ko-KR")}억`);
    }
    if (tenThousands > 0n) {
        parts.push(`${tenThousands.toLocaleString("ko-KR")}만`);
    }
    if (ones > 0n) {
        parts.push(ones.toLocaleString("ko-KR"));
    }
    return `${parts.join(" ")}${NumberInputMessages.MONEY_UNIT}`;
}
