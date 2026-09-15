import type {ChangeEvent, PointerEvent} from "react";
import {NumberInputMessages} from "../enums/numberInput";
import type {NumberInputView} from "../types/numberInput";
import type {NumberAnswerOptionView, NumberChipView, NumberSliderView} from "../types/numberInput";

type Props = {
    readonly id: string;
    readonly label: string;
    readonly input: NumberInputView;
    readonly dragging: boolean;
    readonly onChange: (value: string) => void;
    readonly onAnswer: (value: string) => void;
    readonly onDragStart: (pointerY: number) => void;
};

export default function NumberAnswerInput({id, label, input, dragging, onChange, onAnswer, onDragStart}: Props) {
    return (
        <div className="answer-number">
            <div className={dragging ? "answer-number-field is-dragging" : "answer-number-field"}
                onPointerDown={(event: PointerEvent<HTMLDivElement>) => onDragStart(event.clientY)}>
                <input id={id} aria-label={label} type="text" inputMode="numeric" placeholder="0"
                    value={input.displayValue}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} />
                <span className="answer-number-unit">{input.unit}</span>
            </div>
            {input.sliders.map((slider: NumberSliderView) => (
                <input className="answer-number-slider" type="range" key={label} aria-label={label}
                    min={slider.minimum} max={slider.maximum} step={slider.step} value={slider.value}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} />
            ))}
            <p className="cap answer-number-hint" aria-live="polite">{input.hint}</p>
            {input.chips.length > 0 && (
                <div className="answer-number-options" role="group" aria-label={label}>
                    {input.chips.map((chip: NumberChipView) => (
                        <button className="answer-number-option" type="button" key={chip.label} onClick={() => onChange(chip.nextValue)}>
                            {chip.label}
                        </button>
                    ))}
                    <button className="answer-number-option" type="button" onClick={() => onChange("")}>
                        {NumberInputMessages.CLEAR}
                    </button>
                </div>
            )}
            {input.answerOptions.map((option: NumberAnswerOptionView) => (
                <button className="text-btn answer-number-skip" type="button" key={option.value}
                    onClick={() => onAnswer(option.value)}>
                    {option.label}
                </button>
            ))}
        </div>
    );
}
