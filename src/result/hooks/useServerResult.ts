import {useCallback, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useBrandHome} from "../../common/hooks/useBrandHome";
import {useProductComparisons} from "../../product/hooks/useProductComparisons";
import {comparisonAnswers, comparisonPlan} from "../../product/services/comparisonPlanService";
import {RoutePath} from "../../common/enums/routePath";
import {NextStepStatus} from "../../question/enums/recommendation";
import {answerSummaries, getResultProducts, readRecommendation} from "../../question/services/recommendationService";
import type {AnswerSummaryView, ProductView, RecommendationSession} from "../../question/types/recommendation";
import type {ComparisonPlan} from "../../product/types/comparison";

export function useServerResult() {
    const navigate = useNavigate();
    const {goHome} = useBrandHome();
    const session: RecommendationSession = readRecommendation();
    const hasResult: boolean = session.response?.status === NextStepStatus.DONE;

    const plan: ComparisonPlan = comparisonPlan(new URLSearchParams(), session.entries);
    const {state: comparison, load, cancel} = useProductComparisons(comparisonAnswers(session.entries, plan));
    const products: readonly ProductView[] = getResultProducts(comparison);

    useEffect(() => {
        if (hasResult) {
            void load();
        }
        return cancel;
    }, [hasResult, load, cancel]);

    const openProduct = useCallback((key: string): void => {
        navigate(RoutePath.PRODUCT_DETAIL.replace(":name", encodeURIComponent(key)));
    }, [navigate]);
    const resume = useCallback((): void => {
        navigate(RoutePath.QUESTIONS);
    }, [navigate]);
    const openSummary = useCallback((): void => {
        navigate(RoutePath.ANSWER_SUMMARY);
    }, [navigate]);

    const summaries: readonly AnswerSummaryView[] = answerSummaries(session.entries);

    return {
        hasResult, products, summaries,
        empty: products.length === 0,
        comparison: {state: comparison, retry: load},
        actions: {restart: goHome, resume, openProduct, openSummary},
    };
}
