import {ComparisonMessages} from "../enums/comparison";
import type {ComparisonFormView} from "../types/comparison";
import NumberAnswerInput from "../../question/components/NumberAnswerInput";

type Props = {readonly form: ComparisonFormView};

export default function ComparisonForm({form}: Props) {
    const submitDisabled: boolean = form.monthly !== "" && !form.monthlyInput.valid;
    return (
        <form className="comparison-form card" onSubmit={form.onSubmit} aria-label={ComparisonMessages.TITLE}>
            <div className="comparison-form-monthly">
                <p className="cap">{ComparisonMessages.MONTHLY_INPUT}</p>
                <NumberAnswerInput id="comparison-monthly" label={ComparisonMessages.MONTHLY_INPUT}
                    input={form.monthlyInput} dragging={form.dragging} onChange={form.onMonthlyChange}
                    onAnswer={form.onMonthlyChange} onDragStart={form.onDragStart} />
            </div>
            <label>
                {ComparisonMessages.MONTHS}
                <select value={form.months} onChange={form.onMonthsChange}>
                    {form.terms.map((term: string) => <option value={term} key={term}>{term}개월</option>)}
                </select>
            </label>
            <button className="cta" type="submit" disabled={submitDisabled}>{ComparisonMessages.SUBMIT}</button>
            <p className="cap comparison-form-note">{ComparisonMessages.ASSUMPTION}</p>
        </form>
    );
}
