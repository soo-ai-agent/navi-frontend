import {CatalogMessages, InterestCalcType, ReserveType} from "../../catalog/enums/catalog";
import type {CatalogRateOptionResponseDTO} from "../../catalog/types/catalog";
import type {
    ProductComparisonOptionResponseDTO,
    ProductComparisonResponseDTO,
} from "../types/comparison";

type OptionKeyFields = Pick<
    CatalogRateOptionResponseDTO,
    "saving_term_months" | "reserve_type" | "interest_calc_type"
>;

const RESERVE_LABELS: Readonly<Record<ReserveType, CatalogMessages>> = {
    [ReserveType.FIXED]: CatalogMessages.FIXED,
    [ReserveType.FREE]: CatalogMessages.FREE,
};

const CALCULATION_LABELS: Readonly<Record<InterestCalcType, CatalogMessages>> = {
    [InterestCalcType.SIMPLE]: CatalogMessages.SIMPLE,
    [InterestCalcType.COMPOUND]: CatalogMessages.COMPOUND,
};

const RESERVE_ORDER: Readonly<Record<ReserveType, number>> = {
    [ReserveType.FIXED]: 0,
    [ReserveType.FREE]: 1,
};

const CALCULATION_ORDER: Readonly<Record<InterestCalcType, number>> = {
    [InterestCalcType.SIMPLE]: 0,
    [InterestCalcType.COMPOUND]: 1,
};

export function comparisonOptionKey(option: OptionKeyFields): string {
    return `${option.saving_term_months}:${option.reserve_type}:${option.interest_calc_type}`;
}

export function comparisonOptionLabel(option: ProductComparisonOptionResponseDTO): string {
    const reserve: CatalogMessages = RESERVE_LABELS[option.reserve_type];
    const calculation: CatalogMessages = CALCULATION_LABELS[option.interest_calc_type];
    return `${option.saving_term_months}개월 · ${reserve} · ${calculation}`;
}

function compareProductOptions(
    left: ProductComparisonOptionResponseDTO,
    right: ProductComparisonOptionResponseDTO,
): number {
    const rateDifference: number = Number(right.applied_rate) - Number(left.applied_rate);
    if (rateDifference !== 0) {
        return rateDifference;
    }

    const reserveDifference: number = RESERVE_ORDER[left.reserve_type] - RESERVE_ORDER[right.reserve_type];
    if (reserveDifference !== 0) {
        return reserveDifference;
    }

    return CALCULATION_ORDER[left.interest_calc_type] - CALCULATION_ORDER[right.interest_calc_type];
}

export function sortedOptionsForMonths(
    comparisons: readonly ProductComparisonResponseDTO[],
    productId: string,
    months: string,
): readonly ProductComparisonOptionResponseDTO[] {
    for (const comparison of comparisons) {
        if (comparison.product_id !== productId) {
            continue;
        }

        const options: readonly ProductComparisonOptionResponseDTO[] = comparison.options.filter(
            (option: ProductComparisonOptionResponseDTO) => `${option.saving_term_months}` === months,
        );
        return options.toSorted(compareProductOptions);
    }
    return [];
}
