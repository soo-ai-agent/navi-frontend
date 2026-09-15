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

const NO_MATURITY: MaturityView = {principal: "", atMaxRate: "", mine: ""};

function wonText(amount: number): string {
    return `${amount.toLocaleString("ko-KR")}원`;
}

function selectedOption(
    options: readonly ProductComparisonOptionResponseDTO[],
    optionKey: string,
): ProductComparisonOptionResponseDTO | false {
    let firstOption: ProductComparisonOptionResponseDTO | false = false;
    for (const option of options) {
        if (firstOption === false) {
            firstOption = option;
        }
        if (comparisonOptionKey(option) === optionKey) {
            return option;
        }
    }
    return firstOption;
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
    const estimate: MaturityEstimateResponseDTO = option.estimate;
    const estimated: boolean = estimate.principal > 0;

    return {
        status: ComparisonViewStatus.READY,
        eligibilityStatus: option.eligibility_status,
        eligibilityLabel: ELIGIBILITY_LABELS[option.eligibility_status],
        note: ELIGIBILITY_NOTES[option.eligibility_status],
        optionLabel: comparisonOptionLabel(option),
        meter: rateMeter(option),
        showMeter: option.eligibility_status !== EligibilityStatus.NOT_ELIGIBLE,
        maturity: estimated ? maturityView(estimate) : NO_MATURITY,
        showMaturity: estimated,
        estimateMessage: estimate.reason,
        goalMessage: goalMessage(option),
    };
}

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
    const option: ProductComparisonOptionResponseDTO | false = selectedOption(options, optionKey);
    if (option === false) {
        return {status: ComparisonViewStatus.NO_OPTION, message: ComparisonMessages.NO_OPTION};
    }
    return productComparisonView(option);
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
