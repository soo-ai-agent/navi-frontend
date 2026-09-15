import {useCallback, useEffect, type ChangeEvent} from "react";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {useCatalogProduct} from "./useCatalogProduct";
import {useProductComparisons} from "./useProductComparisons";
import {useProductDetailPager} from "./useProductDetailPager";
import {comparisonAnswers, comparisonPlan, comparisonTerms, monthlyPlanText} from "../services/comparisonPlanService";
import {productComparisonChoices} from "../services/comparisonViewService";
import {getRankedProduct, readRecommendation} from "../../question/services/recommendationService";
import type {CatalogProductResponseDTO} from "../../catalog/types/catalog";
import type {ComparisonOptionChoice, ComparisonPlan} from "../types/comparison";
import type {RankedProductResponseDTO, RecommendationSession} from "../../question/types/recommendation";
import {RoutePath} from "../../common/enums/routePath";
import {CatalogMessages} from "../../catalog/enums/catalog";
import {RecommendationMessages, RequestStatus} from "../../question/enums/recommendation";
import {getProductDetail} from "../services/productDetailService";
import type {ProductDetailView} from "../types/productDetail";
import type {ProductPlanView} from "../types/comparisonView";

export function useServerProductDetail() {
    const navigate = useNavigate();
    const {name = ""} = useParams();
    const [params, setParams] = useSearchParams();
    const session: RecommendationSession = readRecommendation();
    const enteredPlan: ComparisonPlan = comparisonPlan(params, session.entries);

    const catalogProductId: string = params.get("product_id") ?? "";
    const fromRecommendation: boolean = catalogProductId === "";
    // 전체 상품 URL에는 저장된 추천이 없으므로 조회 결과가 undefined일 수 있다.
    const recommended: RankedProductResponseDTO | undefined = fromRecommendation ? getRankedProduct(name) : undefined;

    const plan: ComparisonPlan = recommended === undefined
        ? enteredPlan
        : {...enteredPlan, months: `${recommended.saving_term_months}`};

    const requestedProductId: string = recommended === undefined ? catalogProductId : recommended.product_id;
    const {state, retry} = useCatalogProduct(requestedProductId);
    const {state: comparison, load, cancel} = useProductComparisons(comparisonAnswers(session.entries, plan));
    // 상품 응답이 준비되지 않았거나 서버에 상품이 없으면 공시 데이터가 undefined다.
    const disclosure: CatalogProductResponseDTO | undefined = state.status === RequestStatus.READY
        ? state.product
        : undefined;
    const source: readonly CatalogProductResponseDTO[] = disclosure === undefined ? [] : [disclosure];
    const selectedOption: string = params.get("option") ?? "";

    // 잘못된 URL은 추천과 공시를 모두 찾지 못하므로 상세 상품이 undefined일 수 있다.
    const product: ProductDetailView | undefined = getProductDetail(
        name,
        catalogProductId,
        source,
        comparison,
        plan,
        selectedOption,
    );
    const detailProductId: string = product === undefined ? "" : product.product_id;

    const options: readonly ComparisonOptionChoice[] = recommended === undefined
        ? productComparisonChoices(comparison, detailProductId, plan.months)
        : [];
    const firstOptionValue: string = options.length === 0 ? "" : options[0].value;
    const optionValue: string = selectedOption === "" ? firstOptionValue : selectedOption;

    const selectOption = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
        const next: URLSearchParams = new URLSearchParams(params);
        next.set("option", event.target.value);
        setParams(next, {replace: true});
    }, [params, setParams]);

    useEffect(() => {
        void load();
        return cancel;
    }, [load, cancel]);

    const pager = useProductDetailPager(product?.tabs ?? []);

    const backPath: string = fromRecommendation
        ? RoutePath.RESULT
        : `${RoutePath.PRODUCTS}?${new URLSearchParams({monthly: plan.monthly, months: plan.months})}`;
    const backLabel: string = fromRecommendation ? RecommendationMessages.RESULT_BACK : CatalogMessages.LIST_BACK;
    const back = useCallback((): void => {
        navigate(backPath);
    }, [backPath, navigate]);
    const refresh = useCallback((): void => {
        navigate(RoutePath.QUESTIONS);
    }, [navigate]);

    const terms: readonly string[] = recommended === undefined ? comparisonTerms(source, plan.months) : [plan.months];
    const selectMonths = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
        const next: URLSearchParams = new URLSearchParams(params);
        next.set("months", event.target.value);
        next.delete("option");
        setParams(next, {replace: true});
    }, [params, setParams]);
    const planView: ProductPlanView = {
        monthlyText: monthlyPlanText(plan.monthly),
        months: plan.months,
        terms,
        selectMonths,
    };

    return {
        product, state,
        calculation: {plan: planView, state: comparison, retry: load, options, optionValue, selectOption},
        pager,
        actions: {back, backLabel, refresh, retry},
    };
}
