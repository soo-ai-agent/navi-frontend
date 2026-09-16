import {WishMessages} from "../enums/wish";
import type {QuestionOption, QuestionResponseDTO} from "../../question/types/recommendation";

type Props = {
    readonly question: QuestionResponseDTO;
    readonly onSelectOption: (questionKey: string, value: string, label: string) => void;
    readonly onContinueWithQuestions: () => void;
};

export default function WishQuestionBubble({question, onSelectOption, onContinueWithQuestions}: Props) {
    return (
        <div className="wish-bubble wish-bot">
            <p>{question.title}</p>
            <div className="wish-options">
                {question.options.map(([value, label]: QuestionOption) => (
                    <button className="wish-option" key={value} onClick={() => onSelectOption(question.key, value, label)}>
                        {label}
                    </button>
                ))}
            </div>
            <button className="link wish-continue" onClick={onContinueWithQuestions}>{WishMessages.CONTINUE_WITH_BUTTONS}</button>
        </div>
    );
}
