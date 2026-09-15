import {RequestStatus} from "../../question/enums/recommendation";
import type {RankedProductResponseDTO} from "../../question/types/recommendation";
import {
    ComparisonMessages,
    ComparisonViewStatus,
    EligibilityStatus,
    GoalReachStatus,
} from "../enums/comparison";
import type {
    ComparisonOptionChoice,
    ComparisonState,
    MaturityEstimateResponseDTO,
    ProductComparisonOptionResponseDTO,
} from "../types/comparison";
import type {ComparisonSummary, MaturityView, ProductComparisonView, RateMeterView} from "../types/comparisonView";
import {
    comparisonOptionKey,
    comparisonOptionLabel,
    sortedOptionsForMonths,
} from "./comparisonOptionService";

const ELIGIBILITY_LABELS: Readonly<Record<EligibilityStatus, ComparisonMessages>> = {
    [EligibilityStatus.ELIGIBLE]: ComparisonMessages.ELIGIBLE,
    [EligibilityStatus.NEEDS_CONFIRMATION]: ComparisonMessages.NEEDS_CONFIRMATION,
    [EligibilityStatus.NOT_ELIGIBLE]: ComparisonMessages.NOT_ELIGIBLE,
};

const ELIGIBILITY_NOTES: Readonly<Record<EligibilityStatus, string>> = {
    [EligibilityStatus.ELIGIBLE]: ComparisonMessages.ELIGIBLE_HELP,
    [EligibilityStatus.NEEDS_CONFIRMATION]: "",
    [EligibilityStatus.NOT_ELIGIBLE]: ComparisonMessages.REJECTED_HELP,
};

function wonText(amount: number): string {
    return `${amount.toLocaleString("ko-KR")}원`;
}

function rateMeter(option: ProductComparisonOptionResponseDTO): RateMeterView {
    const value: number = Number(option.applied_rate);
    const maximum: number = Number(option.max_rate);
    const label: ComparisonMessages = option.eligibility_status === EligibilityStatus.ELIGIBLE
        ? ComparisonMessages.CONFIRMED_RATE
        : ComparisonMessages.CONDITIONAL_RATE;
    const fill: number = maximum === 0 ? 0 : Math.min(100, value / maximum * 100);

    return {
        label,
        value,
        maximum,
        fill,
        text: `연 ${option.applied_rate}%`,
        maximumText: `연 ${option.max_rate}%`,
    };
}

function maturityView(estimate: MaturityEstimateResponseDTO): MaturityView {
    if (estimate.principal <= 0) {
        return {principal: "", atMaxRate: "", mine: ""};
    }
    return {
        principal: wonText(estimate.principal),
        atMaxRate: wonText(estimate.maturity_at_max_rate),
        mine: wonText(estimate.maturity_before_tax),
    };
}

function goalMessage(option: ProductComparisonOptionResponseDTO): string {
    switch (option.goal_reach) {
        case GoalReachStatus.NO_GOAL:
            return "";
        case GoalReachStatus.REACHED: {
            const maturity: string = wonText(option.estimate.maturity_before_tax);
            return `${ComparisonMessages.GOAL_REACHED} ${maturity}까지 받을 수 있어요.`;
        }
        case GoalReachStatus.REACHED_AT_MAX_RATE: {
            const maximumMaturity: string = wonText(option.estimate.maturity_at_max_rate);
            return `${ComparisonMessages.GOAL_REACHED_AT_MAX_RATE} ${maximumMaturity}까지 받을 수 있어요.`;
        }
        case GoalReachStatus.SHORT:
            return `${ComparisonMessages.GOAL_SHORT} ${wonText(option.goal_shortfall)} 모자라요.`;
    }
}

function productComparisonView(option: ProductComparisonOptionResponseDTO): ProductComparisonView {
    return {
        status: ComparisonViewStatus.READY,
        eligibilityStatus: option.eligibility_status,
        eligibilityLabel: ELIGIBILITY_LABELS[option.eligibility_status],
        note: ELIGIBILITY_NOTES[option.eligibility_status],
        optionLabel: comparisonOptionLabel(option),
        meter: rateMeter(option),
        showMeter: option.eligibility_status !== EligibilityStatus.NOT_ELIGIBLE,
        maturity: maturityView(option.estimate),
        showMaturity: option.estimate.principal > 0,
        estimateMessage: option.estimate.reason,
        goalMessage: goalMessage(option),
    };
}

// 목록 카드(catalogService)는 옵션을 고르지 않고 정렬 첫 옵션을 보여 주므로 optionKey 를 생략한다.
export function productComparisonSummary(
    state: ComparisonState,
    productId: string,
    months: string,
    optionKey: string = "",
): ComparisonSummary {
    if (state.status === RequestStatus.LOADING) {
        return {status: ComparisonViewStatus.LOADING, message: ComparisonMessages.LOADING};
    }
    if (state.status === RequestStatus.ERROR) {
        return {status: ComparisonViewStatus.ERROR, message: state.message};
    }

    const options: readonly ProductComparisonOptionResponseDTO[] = sortedOptionsForMonths(
        state.products,
        productId,
        months,
    );
    if (options.length === 0) {
        return {status: ComparisonViewStatus.NO_OPTION, message: ComparisonMessages.NO_OPTION};
    }
    // URL 의 option 이 이 기간에 없으면 Array.find 가 undefined 를 돌려주고, 그때는 정렬 첫 옵션을 보여 준다.
    const matchedOption: ProductComparisonOptionResponseDTO | undefined = options.find(
        (option: ProductComparisonOptionResponseDTO) => comparisonOptionKey(option) === optionKey,
    );
    return productComparisonView(matchedOption ?? options[0]);
}

export function rankedComparisonSummary(
    state: ComparisonState,
    row: RankedProductResponseDTO,
): ComparisonSummary {
    return productComparisonSummary(
        state,
        row.product_id,
        `${row.saving_term_months}`,
        comparisonOptionKey(row),
    );
}

export function productComparisonChoices(
    state: ComparisonState,
    productId: string,
    months: string,
): readonly ComparisonOptionChoice[] {
    if (state.status !== RequestStatus.READY) {
        return [];
    }

    const options: readonly ProductComparisonOptionResponseDTO[] = sortedOptionsForMonths(
        state.products,
        productId,
        months,
    );
    return options.map(
        (option: ProductComparisonOptionResponseDTO): ComparisonOptionChoice => ({
            value: comparisonOptionKey(option),
            label: comparisonOptionLabel(option),
        }),
    );
}
