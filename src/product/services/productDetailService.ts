import {CatalogMessages, ConditionStatus} from "../../catalog/enums/catalog";
import {ComparisonMessages, ComparisonViewStatus} from "../enums/comparison";
import {BonusResult, RecommendationMessages} from "../../question/enums/recommendation";
import {
    catalogCard,
    catalogHomepage,
    catalogRateRows,
    disclosed,
    joinRestrictionText,
} from "../../catalog/services/catalogService";
import {productComparisonSummary} from "./comparisonViewService";
import {getResultProducts} from "../../question/services/recommendationService";
import type {CatalogCardView, CatalogProductResponseDTO} from "../../catalog/types/catalog";
import type {ComparisonPlan, ComparisonState} from "../types/comparison";
import type {BonusView, ProductView} from "../../question/types/recommendation";
import {ProductDetailTab} from "../enums/productDetail";
import type {ProductDetailTabView, ProductDetailView} from "../types/productDetail";

// 서버에 공시가 없는 추천 상품은 추천 결과만으로 그린다 — 공시 칸은 전부 "미공시" 문구다.
const WITHOUT_DISCLOSURE: ProductDetailView = {
    tabs: [],
    product_id: "", title: "", bank: "",
    comparison: {status: ComparisonViewStatus.LOADING, message: ComparisonMessages.LOADING},
    rate: CatalogMessages.NO_DISCLOSURE,
    rateLabel: CatalogMessages.MAX_RATE,
    baseRate: "",
    limit: CatalogMessages.NO_DISCLOSURE,
    joinWays: [],
    source: RecommendationMessages.NO_SOURCE,
    matchedBonuses: [], unmatchedBonuses: [], checklistNotice: "",
    other_conditions: [], other_eligibility_conditions: [], other_bonus_conditions: [],
    rateRows: [],
    member: CatalogMessages.NO_DISCLOSURE,
    restriction: CatalogMessages.NO_DISCLOSURE,
    afterMaturityRate: CatalogMessages.NO_DISCLOSURE,
    note: CatalogMessages.NO_DISCLOSURE,
    disclosureMonth: CatalogMessages.NO_DISCLOSURE,
    disclosureDate: CatalogMessages.NO_DISCLOSURE,
    homepage: "", callCenter: CatalogMessages.NO_DISCLOSURE,
};

function fromDisclosure(
    source: CatalogProductResponseDTO,
    comparison: ComparisonState,
    plan: ComparisonPlan,
    selectedOption: string,
): ProductDetailView {
    const card: CatalogCardView = catalogCard(source);
    const conditionChecked: boolean = source.condition_status === ConditionStatus.EXTRACTED;
    const joinWays: readonly string[] = source.join_ways.split(",")
        .map((way: string) => way.trim())
        .filter((way: string) => way !== "");
    return {
        tabs: [],
        product_id: source.product_id, title: source.product_name, bank: source.bank_name,
        comparison: productComparisonSummary(comparison, source.product_id, plan.months, selectedOption),
        rate: card.rate,
        rateLabel: CatalogMessages.MAX_RATE,
        baseRate: "",
        limit: card.limit,
        joinWays,
        source: source.bonus_condition_text || RecommendationMessages.NO_SOURCE,
        matchedBonuses: [], unmatchedBonuses: [],
        checklistNotice: conditionChecked ? "" : CatalogMessages.CONDITION_PENDING,
        other_conditions: source.other_conditions,
        other_eligibility_conditions: source.other_eligibility_conditions,
        other_bonus_conditions: source.other_bonus_conditions,
        rateRows: catalogRateRows(source),
        member: disclosed(source.join_member),
        restriction: joinRestrictionText(source.join_restriction),
        afterMaturityRate: disclosed(source.after_maturity_rate_text),
        note: disclosed(source.etc_note),
        disclosureMonth: disclosed(source.disclosure_month),
        disclosureDate: disclosed(source.disclosure_start_date),
        homepage: catalogHomepage(source.homepage_url), callCenter: disclosed(source.call_center),
    };
}

function withRecommendation(base: ProductDetailView, recommended: ProductView): ProductDetailView {
    const noDisclosedSource: boolean = base.source === RecommendationMessages.NO_SOURCE;
    return {
        ...base,
        product_id: recommended.product_id, title: recommended.title, bank: recommended.bank,
        comparison: recommended.comparison,
        rate: recommended.rate,
        rateLabel: RecommendationMessages.APPLIED_RATE,
        baseRate: recommended.baseRate, limit: recommended.limit,
        source: noDisclosedSource ? recommended.source : base.source,
        matchedBonuses: recommended.bonuses.filter((bonus: BonusView) => bonus.result === BonusResult.ELIGIBLE),
        unmatchedBonuses: recommended.bonuses.filter((bonus: BonusView) => bonus.result !== BonusResult.ELIGIBLE),
        other_conditions: recommended.other_conditions,
        other_eligibility_conditions: recommended.other_eligibility_conditions,
        other_bonus_conditions: recommended.other_bonus_conditions,
    };
}

function withChecklistNotice(detail: ProductDetailView): ProductDetailView {
    if (detail.checklistNotice !== "") {
        return detail;
    }
    const conditionCount: number = detail.other_conditions.length
        + detail.other_eligibility_conditions.length
        + detail.other_bonus_conditions.length;
    if (conditionCount > 0) {
        return detail;
    }
    return {...detail, checklistNotice: CatalogMessages.CHECKLIST_EMPTY};
}

function withTabs(detail: ProductDetailView): ProductDetailView {
    const hasContent: Readonly<Record<ProductDetailTab, boolean>> = {
        [ProductDetailTab.MEMBER]: detail.member !== "" || detail.joinWays.length > 0 || detail.callCenter !== "",
        [ProductDetailTab.RESTRICTION]: detail.restriction !== "" || detail.limit !== "",
        [ProductDetailTab.ELIGIBILITY_CHECKLIST]: detail.other_eligibility_conditions.length > 0,
        [ProductDetailTab.CHECKLIST]: detail.other_conditions.length > 0 || detail.checklistNotice !== "",
        [ProductDetailTab.BONUSES]: detail.matchedBonuses.length > 0
            || detail.unmatchedBonuses.length > 0
            || detail.other_bonus_conditions.length > 0,
        [ProductDetailTab.RATES]: detail.rateRows.length > 0,
        [ProductDetailTab.NOTES]: detail.afterMaturityRate !== "" || detail.note !== "",
        [ProductDetailTab.DISCLOSURE]: detail.disclosureMonth !== ""
            || detail.disclosureDate !== ""
            || detail.source !== "",
    };
    const tabs: ProductDetailTabView[] = [];
    for (const tab of Object.values(ProductDetailTab)) {
        tabs.push({tab, hasContent: hasContent[tab]});
    }
    return {...detail, tabs};
}

// 잘못된 주소는 추천에도 공시에도 없어 상세를 만들 수 없다 — 그때만 undefined 다.
export function getProductDetail(
    name: string,
    catalogProductId: string,
    products: readonly CatalogProductResponseDTO[],
    comparison: ComparisonState,
    plan: ComparisonPlan,
    selectedOption: string,
): ProductDetailView | undefined {
    // 추천 결과 주소(product_id 없음)일 때만 저장된 추천을 찾는다 — Array.find 라 없으면 undefined 다.
    const recommended: ProductView | undefined = catalogProductId === ""
        ? getResultProducts(comparison).find((row: ProductView) => row.key === name)
        : undefined;

    let productId: string = catalogProductId;
    if (productId === "") {
        productId = recommended === undefined ? name : recommended.product_id;
    }
    // 서버에 없는 상품이면 공시 목록이 비어 Array.find 가 undefined 를 돌려준다.
    const source: CatalogProductResponseDTO | undefined = products.find(
        (product: CatalogProductResponseDTO) => product.product_id === productId,
    );

    if (source === undefined && recommended === undefined) {
        return undefined;
    }
    let detail: ProductDetailView = source === undefined
        ? WITHOUT_DISCLOSURE
        : fromDisclosure(source, comparison, plan, selectedOption);
    if (recommended !== undefined) {
        detail = withRecommendation(detail, recommended);
    }
    return withTabs(withChecklistNotice(detail));
}
