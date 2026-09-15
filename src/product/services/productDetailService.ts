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

function joinWayList(joinWays: string): readonly string[] {
    return joinWays.split(",")
        .map((way: string) => way.trim())
        .filter((way: string) => way !== "");
}

function fromDisclosure(
    source: CatalogProductResponseDTO,
    comparison: ComparisonState,
    plan: ComparisonPlan,
    selectedOption: string,
): ProductDetailView {
    const card: CatalogCardView = catalogCard(source);
    const conditionChecked: boolean = source.condition_status === ConditionStatus.EXTRACTED;
    return {
        ...WITHOUT_DISCLOSURE,
        product_id: source.product_id, title: source.product_name, bank: source.bank_name,
        comparison: productComparisonSummary(comparison, source.product_id, plan.months, selectedOption),
        rate: card.rate, limit: card.limit,
        joinWays: joinWayList(source.join_ways),
        source: source.bonus_condition_text || RecommendationMessages.NO_SOURCE,
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
        tabs: [],
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

function tabViews(detail: ProductDetailView): readonly ProductDetailTabView[] {
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
    const views: ProductDetailTabView[] = [];
    for (const tab of Object.values(ProductDetailTab)) {
        views.push({tab, hasContent: hasContent[tab]});
    }
    return views;
}

function withTabs(detail: ProductDetailView): ProductDetailView {
    return {...detail, tabs: tabViews(detail)};
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

function findRecommended(name: string, catalogProductId: string, comparison: ComparisonState): ProductView | undefined {
    if (catalogProductId !== "") {
        return undefined;
    }
    return getResultProducts(comparison).find((row: ProductView) => row.key === name);
}

export function getProductDetail(
    name: string,
    catalogProductId: string,
    products: readonly CatalogProductResponseDTO[],
    comparison: ComparisonState,
    plan: ComparisonPlan,
    selectedOption: string = "",
): ProductDetailView | undefined {
    const recommended: ProductView | undefined = findRecommended(name, catalogProductId, comparison);

    let productId: string = catalogProductId;
    if (productId === "") {
        productId = recommended === undefined ? name : recommended.product_id;
    }
    const source: CatalogProductResponseDTO | undefined = products.find(
        (product: CatalogProductResponseDTO) => product.product_id === productId,
    );

    if (source === undefined && recommended === undefined) {
        return undefined;
    }
    const detail: ProductDetailView = source === undefined
        ? WITHOUT_DISCLOSURE
        : fromDisclosure(source, comparison, plan, selectedOption);

    if (recommended === undefined) {
        return withTabs(withChecklistNotice(detail));
    }
    return withTabs(withChecklistNotice(withRecommendation(detail, recommended)));
}
