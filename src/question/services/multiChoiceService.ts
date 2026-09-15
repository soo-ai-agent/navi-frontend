import {NO_BANK_ANSWER} from "../enums/numberInput";
import type {MultiChoiceItemView, MultiChoiceView} from "../types/numberInput";
import type {QuestionOption} from "../types/recommendation";

/** 다중선택 답은 고른 값을 쉼표로 이은 문자열이다. */
function selectedValues(answer: string): readonly string[] {
    if (answer.trim() === "") {
        return [];
    }
    return answer.split(",");
}

export function multiChoiceView(answer: string, options: readonly QuestionOption[]): MultiChoiceView {
    const selected: readonly string[] = selectedValues(answer);
    const items: MultiChoiceItemView[] = [];
    for (const [value, label] of options) {
        items.push({value, label, selected: selected.includes(value)});
    }
    return {items, valid: selected.length > 0};
}

/**
 * 고른 값을 넣거나 뺀 새 답을 만든다.
 *
 * "해당 없음"은 다른 은행과 함께 고를 수 없어 서로를 지운다.
 */
export function toggledChoice(answer: string, value: string): string {
    const selected: readonly string[] = selectedValues(answer);
    if (selected.includes(value)) {
        return selected.filter((chosen: string) => chosen !== value).join(",");
    }
    if (value === NO_BANK_ANSWER) {
        return NO_BANK_ANSWER;
    }
    const others: readonly string[] = selected.filter((chosen: string) => chosen !== NO_BANK_ANSWER);
    return [...others, value].join(",");
}
