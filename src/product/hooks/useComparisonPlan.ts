import {useCallback, useState, type ChangeEvent, type FormEvent} from "react";
import {useSearchParams} from "react-router-dom";
import {comparisonPlan} from "../services/comparisonPlanService";
import type {ComparisonDraft, ComparisonPlan} from "../types/comparison";
import type {AnswerEntry} from "../../question/types/recommendation";
import {NumberInputKey} from "../../question/enums/numberInput";
import {MONTHLY_INPUT_OPTIONS, numberAnswerValue, numberInputView} from "../../question/services/numberInputService";
import type {NumberInputView} from "../../question/types/numberInput";
import {useSliderDrag} from "../../question/hooks/useSliderDrag";

export function useComparisonPlan(entries: readonly AnswerEntry[]) {
    const [params, setParams] = useSearchParams();
    const plan: ComparisonPlan = comparisonPlan(params, entries);
    const source: string = JSON.stringify(plan);
    const [edited, setEdited] = useState<ComparisonDraft>({source, plan});
    const draft: ComparisonPlan = edited.source === source ? edited.plan : plan;
    const onMonthlyChange = useCallback((monthly: string): void => {
        setEdited({source, plan: {...draft, monthly: numberAnswerValue(monthly)}});
    }, [draft, source]);
    const onMonthsChange = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
        const months: string = event.target.value;
        setEdited({source, plan: {...draft, months}});
    }, [draft, source]);
    const onSubmit = useCallback((event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        const next: URLSearchParams = new URLSearchParams(params);
        next.set("monthly", draft.monthly.trim());
        next.set("months", draft.months);
        next.delete("option");
        setParams(next, {replace: true});
    }, [draft, params, setParams]);
    const monthlyInput: NumberInputView = numberInputView(draft.monthly, NumberInputKey.MONTHLY, MONTHLY_INPUT_OPTIONS);
    const {dragging, beginDrag} = useSliderDrag(monthlyInput.sliders[0], onMonthlyChange);
    return {
        plan, draft,
        form: {
            monthly: draft.monthly, months: draft.months, monthlyInput, dragging,
            onMonthlyChange, onMonthsChange, onSubmit, onDragStart: beginDrag,
        },
    };
}
