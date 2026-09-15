import type {ChangeEvent, FormEvent} from "react";
import type {CatalogRateOptionResponseDTO} from "../../catalog/types/catalog";
import {isRateOption} from "../../catalog/types/catalog";
import {EligibilityStatus, EstimateStatus, GoalReachStatus} from "../enums/comparison";
import type {RequestStatus} from "../../question/enums/recommendation";
import type {NumberInputView} from "../../question/types/numberInput";
import {isArrayOf, isDecimalText, isJsonObject, isMemberOf, isText} from "../../common/lib/jsonCheck";

export type MaturityEstimateResponseDTO = {
    readonly status: EstimateStatus;
    readonly monthly_deposit: number;
    readonly principal: number;
    readonly interest_before_tax: number;
    readonly maturity_before_tax: number;
    readonly maturity_at_max_rate: number;
    readonly reason: string;
};
export type ProductComparisonOptionResponseDTO = CatalogRateOptionResponseDTO & {
    readonly applied_rate: string;
    readonly eligibility_status: EligibilityStatus;
    readonly eligibility_reasons: readonly string[];
    readonly estimate: MaturityEstimateResponseDTO;
    readonly goal_reach: GoalReachStatus;
    readonly goal_shortfall: number;
};
export type ProductComparisonResponseDTO = {
    readonly product_id: string;
    readonly options: readonly ProductComparisonOptionResponseDTO[];
};
export type ProductComparisonsResponseDTO = {readonly products: readonly ProductComparisonResponseDTO[]};
export type ComparisonState =
    | {readonly status: RequestStatus.LOADING}
    | {readonly status: RequestStatus.ERROR; readonly message: string}
    | {readonly status: RequestStatus.READY; readonly products: readonly ProductComparisonResponseDTO[]};
export type ComparisonPlan = {readonly monthly: string; readonly months: string};
export type ComparisonOptionChoice = {readonly value: string; readonly label: string};
export type ComparisonDraft = {readonly source: string; readonly plan: ComparisonPlan};
export type ComparisonFormView = {
    readonly monthly: string;
    readonly months: string;
    readonly terms: readonly string[];
    readonly monthlyInput: NumberInputView;
    readonly dragging: boolean;
    readonly onDragStart: (pointerY: number) => void;
    readonly onMonthlyChange: (value: string) => void;
    readonly onMonthsChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

// 금액 검사는 이 도메인에서만 반복되어 공용 헬퍼 대신 지역 함수로 유지한다.
function isAmount(field: unknown): field is number {
    return typeof field === "number" && Number.isSafeInteger(field) && field >= 0;
}
function isRateText(field: unknown): field is string {
    return isDecimalText(field) && Number(field) >= 0 && Number.isFinite(Number(field));
}
// HTTP JSON은 검증 전까지 구조가 보장되지 않아 검사 함수의 입력만 unknown으로 받는다.
function isEstimate(value: unknown): value is MaturityEstimateResponseDTO {
    if (!isJsonObject(value)) {
        return false;
    }
    return isMemberOf(value.status, EstimateStatus)
        && isAmount(value.monthly_deposit)
        && isAmount(value.principal)
        && isAmount(value.interest_before_tax)
        && isAmount(value.maturity_before_tax)
        && isAmount(value.maturity_at_max_rate)
        && isText(value.reason);
}
function isOption(value: unknown): value is ProductComparisonOptionResponseDTO {
    if (!isJsonObject(value)) {
        return false;
    }
    return isRateOption(value)
        && isRateText(value.applied_rate)
        && isRateText(value.max_rate)
        && isMemberOf(value.eligibility_status, EligibilityStatus)
        && isArrayOf(value.eligibility_reasons, isText)
        && isMemberOf(value.goal_reach, GoalReachStatus)
        && isAmount(value.goal_shortfall)
        && isEstimate(value.estimate);
}
function isProductComparison(value: unknown): value is ProductComparisonResponseDTO {
    return isJsonObject(value) && isText(value.product_id) && isArrayOf(value.options, isOption);
}
export function isProductComparisons(value: unknown): value is ProductComparisonsResponseDTO {
    return isJsonObject(value) && isArrayOf(value.products, isProductComparison);
}
