import type {FormEvent, JSX} from "react";
import {RecommendationMessages} from "../enums/recommendation";
import MultiChoiceAnswer from "./MultiChoiceAnswer";
import NumberAnswerInput from "./NumberAnswerInput";
import type {QuestionResponseDTO} from "../types/recommendation";
import {useServerAnswer} from "../hooks/useServerAnswer";

type Props = {readonly question: QuestionResponseDTO; readonly initial: string; readonly onAnswer: (value: string) => void};

export default function ServerQuestionForm({question, initial, onAnswer}: Props) {
    const {text, setNumberText, toggleChoice, valid, isNumber, isMultiChoice, numberInput, multiChoice, drag} = useServerAnswer(initial, question);

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        if (valid) {
            onAnswer(text.trim());
        }
    };

    if (isNumber) {
        return (
            <article className="question-server-form">
                <h1>{question.title}</h1>
                <form onSubmit={submit}>
                    <NumberAnswerInput id="question-answer" label={question.title} input={numberInput}
                        dragging={drag.dragging} onChange={setNumberText} onAnswer={onAnswer} onDragStart={drag.beginDrag} />
                    <button className="cta" type="submit" disabled={!valid}>{RecommendationMessages.NEXT}</button>
                </form>
            </article>
        );
    }

    if (isMultiChoice) {
        return (
            <article className="question-server-form">
                <h1>{question.title}</h1>
                <p className="cap">{RecommendationMessages.MULTI_CHOICE_HELP}</p>
                <form onSubmit={submit}>
                    <MultiChoiceAnswer label={question.title} choice={multiChoice} onToggle={toggleChoice} />
                    <button className="cta" type="submit" disabled={!valid}>{RecommendationMessages.NEXT}</button>
                </form>
            </article>
        );
    }

    const optionViews: JSX.Element[] = [];
    for (const [value, label] of question.options) {
        optionViews.push(<button className="cta gray" key={value} onClick={() => onAnswer(value)}>{label}</button>);
    }
    return (
        <article className="question-server-form">
            <h1>{question.title}</h1>
            <div className="question-server-options">{optionViews}</div>
        </article>
    );
}
