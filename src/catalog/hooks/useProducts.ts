import {useEffect} from "react";
import {RequestStatus} from "../../question/enums/recommendation";
import {useComparisonPlan} from "../../product/hooks/useComparisonPlan";
import {useProductComparisons} from "../../product/hooks/useProductComparisons";
import {catalogCategories} from "../services/catalogService";
import {comparisonAnswers} from "../../product/services/comparisonPlanService";
import {readRecommendation} from "../../question/services/recommendationService";
import type {CatalogCategoryView, CatalogProductResponseDTO} from "../types/catalog";
import type {RecommendationSession} from "../../question/types/recommendation";
import {useCatalogProducts} from "./useCatalogProducts";
import {useCatalogPager} from "./useCatalogPager";

export function useProducts() {
    const {state, retry} = useCatalogProducts();
    const session: RecommendationSession = readRecommendation();
    const {plan} = useComparisonPlan(session.entries);
    const {state: comparison, load, cancel} = useProductComparisons(comparisonAnswers(session.entries, plan));
    const products: readonly CatalogProductResponseDTO[] = state.status === RequestStatus.READY ? state.products : [];
    const categories: readonly CatalogCategoryView[] = catalogCategories(products, comparison, plan);
    const pager = useCatalogPager(categories.length);
    useEffect(() => {
        void load();
        return cancel;
    }, [load, cancel]);

    return {
        state, retry,
        content: {categories, pager},
        calculation: {
            state: comparison,
            retry: load,
        },
    };
}
