import {useSearchParams} from "react-router-dom";
import {comparisonPlan} from "../services/comparisonPlanService";
import type {ComparisonPlan} from "../types/comparison";
import type {AnswerEntry} from "../../question/types/recommendation";

export function useComparisonPlan(entries: readonly AnswerEntry[]) {
    const [params] = useSearchParams();
    const plan: ComparisonPlan = comparisonPlan(params, entries);
    return {plan};
}
