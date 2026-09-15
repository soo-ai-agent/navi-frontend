import type {ProductDetailTab} from "../enums/productDetail";
import type {ComparisonSummary} from "./comparisonView";
import type {CatalogRateView} from "../../catalog/types/catalog";
import type {BonusView, OtherConditionResponseDTO} from "../../question/types/recommendation";

export type ProductDetailTabView = {
    readonly tab: ProductDetailTab;
    readonly hasContent: boolean;
};

export type ProductDetailView = {
    readonly tabs: readonly ProductDetailTabView[];
    readonly product_id: string;
    readonly comparison: ComparisonSummary;
    readonly title: string;
    readonly bank: string;
    readonly rate: string;
    readonly rateLabel: string;
    readonly baseRate: string;
    readonly limit: string;
    readonly joinWays: readonly string[];
    readonly source: string;
    readonly matchedBonuses: readonly BonusView[];
    readonly unmatchedBonuses: readonly BonusView[];
    readonly checklistNotice: string;
    readonly other_conditions: readonly OtherConditionResponseDTO[];
    readonly other_eligibility_conditions: readonly OtherConditionResponseDTO[];
    readonly other_bonus_conditions: readonly OtherConditionResponseDTO[];
    readonly rateRows: readonly CatalogRateView[];
    readonly member: string;
    readonly restriction: string;
    readonly afterMaturityRate: string;
    readonly note: string;
    readonly disclosureMonth: string;
    readonly disclosureDate: string;
    readonly homepage: string;
    readonly callCenter: string;
};
