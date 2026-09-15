import {useCallback, useState} from "react";
import {AnswerKind} from "../enums/recommendation";
import {multiChoiceView, toggledChoice} from "../services/multiChoiceService";
import {numberAnswerValue, numberInputView} from "../services/numberInputService";
import {useSliderDrag} from "./useSliderDrag";
import type {MultiChoiceView} from "../types/numberInput";
import type {NumberInputView} from "../types/numberInput";
import type {QuestionResponseDTO} from "../types/recommendation";

export function useServerAnswer(initial: string, question: QuestionResponseDTO) {
    const [text, setText] = useState<string>(initial);
    const isNumber: boolean = question.answer_kind === AnswerKind.NUMBER
        || question.answer_kind === AnswerKind.NUMBER_WITH_OPTIONS;
    const isMultiChoice: boolean = question.answer_kind === AnswerKind.MULTI_OPTIONS;
    const numberInput: NumberInputView = numberInputView(text, question.key, question.options);
    const multiChoice: MultiChoiceView = multiChoiceView(text, question.options);

    // 숫자 입력칸은 1,000,000 처럼 자리표를 보여 주므로 답으로 저장할 때 걷어낸다.
    const setNumberText = useCallback((typed: string): void => {
        setText(numberAnswerValue(typed));
    }, []);
    const {dragging, beginDrag} = useSliderDrag(numberInput.sliders[0], setNumberText);
    const toggleChoice = useCallback((value: string): void => {
        setText((previous: string): string => toggledChoice(previous, value));
    }, []);

    const valid: boolean = isMultiChoice ? multiChoice.valid : numberInput.valid;
    return {
        text, setText, setNumberText, toggleChoice, valid, isNumber, isMultiChoice, numberInput, multiChoice,
        drag: {dragging, beginDrag},
    };
}
