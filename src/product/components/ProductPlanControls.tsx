import {ComparisonMessages} from "../enums/comparison";
import type {ProductPlanView} from "../types/comparisonView";

type Props = {readonly plan: ProductPlanView};

export default function ProductPlanControls({plan}: Props) {
    return (
        <div className="product-plan-controls">
            <p className="cap">{plan.monthlyText}</p>
            <label className="product-term-select">
                <span className="cap">{ComparisonMessages.MONTHS}</span>
                <select value={plan.months} onChange={plan.selectMonths}>
                    {plan.terms.map((term: string) => <option value={term} key={term}>{term}개월</option>)}
                </select>
            </label>
        </div>
    );
}
