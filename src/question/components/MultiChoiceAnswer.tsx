import type {JSX} from "react";
import type {MultiChoiceView} from "../types/numberInput";

type Props = {
    readonly label: string;
    readonly choice: MultiChoiceView;
    readonly onToggle: (value: string) => void;
};

export default function MultiChoiceAnswer({label, choice, onToggle}: Props) {
    const items: JSX.Element[] = [];
    for (const item of choice.items) {
        items.push(
            <button className="choice-chip" type="button" key={item.value}
                aria-pressed={item.selected} onClick={() => onToggle(item.value)}>
                {item.label}
            </button>
        );
    }
    return <div className="choice-chips" role="group" aria-label={label}>{items}</div>;
}
