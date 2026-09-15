import type {ComparisonSummary} from "../../product/types/comparisonView";
import {ConditionStatus, InterestCalcType, JoinRestriction, ReserveType} from "../enums/catalog";
import type {MonthlyLimitStatus, RequestStatus} from "../../question/enums/recommendation";
import type {OtherConditionResponseDTO} from "../../question/types/recommendation";
import {isMonthlyLimit, isOtherCondition} from "../../question/types/recommendation";
import {isArrayOf, isDecimalText, isFilledText, isInteger, isJsonObject, isMemberOf, isText} from "../../common/lib/jsonCheck";

export type CatalogRateOptionResponseDTO = {
    readonly saving_term_months: number;
    readonly reserve_type: ReserveType;
    readonly interest_calc_type: InterestCalcType;
    readonly base_rate: string;
    readonly max_rate: string;
};
export type CatalogProductResponseDTO = {
    readonly product_id: string;
    readonly bank_code: string;
    readonly bank_name: string;
    readonly homepage_url: string;
    readonly call_center: string;
    readonly product_name: string;
    readonly join_ways: string;
    readonly join_member: string;
    readonly join_restriction: JoinRestriction;
    readonly monthly_limit_status: MonthlyLimitStatus;
    readonly monthly_limit: number;
    readonly bonus_condition_text: string;
    readonly after_maturity_rate_text: string;
    readonly etc_note: string;
    readonly disclosure_month: string;
    readonly disclosure_start_date: string;
    readonly rate_options: readonly CatalogRateOptionResponseDTO[];
    readonly condition_status: ConditionStatus;
    readonly other_conditions: readonly OtherConditionResponseDTO[];
    readonly other_eligibility_conditions: readonly OtherConditionResponseDTO[];
    readonly other_bonus_conditions: readonly OtherConditionResponseDTO[];
};
type ProductCatalogResponseDTO = {readonly products: readonly CatalogProductResponseDTO[]};
export type CatalogState =
    | {readonly status: RequestStatus.LOADING}
    | {readonly status: RequestStatus.ERROR; readonly message: string}
    | {readonly status: RequestStatus.READY; readonly products: readonly CatalogProductResponseDTO[]};
export type CatalogCardView = {
    readonly product_id: string;
    readonly bank_code: string;
    readonly title: string;
    readonly bank: string;
    readonly rate: string;
    readonly terms: string;
    readonly limit: string;
    readonly href: string;
    readonly comparison: ComparisonSummary;
};
export type CatalogRateView = {
    readonly key: string;
    readonly term: string;
    readonly reserve: string;
    readonly calculation: string;
    readonly base: string;
    readonly maximum: string;
};

export type CatalogCategoryView = {readonly key: string; readonly title: string; readonly cards: readonly CatalogCardView[]};

export function isRateOption(value: unknown): boolean {
    if (!isJsonObject(value)) {
        return false;
    }
    return isInteger(value.saving_term_months) && Number(value.saving_term_months) > 0
        && isMemberOf(value.reserve_type, ReserveType)
        && isMemberOf(value.interest_calc_type, InterestCalcType)
        && isDecimalText(value.base_rate)
        && isDecimalText(value.max_rate);
}
export function isCatalogProduct(value: unknown): value is CatalogProductResponseDTO {
    if (!isJsonObject(value)) {
        return false;
    }
    return isFilledText(value.product_id)
        && isText(value.bank_code)
        && isText(value.bank_name)
        && isText(value.product_name)
        && isText(value.homepage_url)
        && isText(value.call_center)
        && isText(value.join_ways)
        && isText(value.join_member)
        && isMemberOf(value.join_restriction, JoinRestriction)
        && isMonthlyLimit(value)
        && isText(value.bonus_condition_text)
        && isText(value.after_maturity_rate_text)
        && isText(value.etc_note)
        && isText(value.disclosure_month)
        && isText(value.disclosure_start_date)
        && isArrayOf(value.rate_options, isRateOption)
        && isMemberOf(value.condition_status, ConditionStatus)
        && isArrayOf(value.other_conditions, isOtherCondition)
        && isArrayOf(value.other_eligibility_conditions, isOtherCondition)
        && isArrayOf(value.other_bonus_conditions, isOtherCondition);
}
export function isProductCatalog(value: unknown): value is ProductCatalogResponseDTO {
    return isJsonObject(value) && isArrayOf(value.products, isCatalogProduct);
}
