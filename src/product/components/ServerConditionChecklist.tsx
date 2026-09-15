import type {JSX} from "react";
import {RecommendationMessages} from "../../question/enums/recommendation";
import type {OtherConditionResponseDTO} from "../../question/types/recommendation";

type Props = {readonly title: string; readonly conditions: readonly OtherConditionResponseDTO[]};
export default function ServerConditionChecklist({title, conditions}: Props) {
    if (conditions.length === 0) {
        return null;
    }
    const items: JSX.Element[] = [];
    for (const condition of conditions) {
        items.push(
            <li className="product-plan-note" key={`${condition.name}:${condition.value}`}>
                <h3>{condition.name}</h3>
                <p className="product-server-source">{condition.value}</p>
                <p className="sub">{RecommendationMessages.CONDITION_REASON} {condition.reason}</p>
            </li>
        );
    }
    return (
        <section aria-label={title}>
            <h2 className="product-server-title">{title}</h2>
            <ul className="card product-server-bonuses">{items}</ul>
        </section>
    );
}
