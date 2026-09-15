import type {ChangeEvent} from "react";
import type {EligibilityStatus, ComparisonViewStatus} from "../enums/comparison";

export type RateMeterView = {
    readonly label: string;
    readonly value: number;
    readonly maximum: number;
    readonly fill: number;
    readonly text: string;
    readonly maximumText: string;
};
export type MaturityView = {
    readonly principal: string;
    readonly atMaxRate: string;
    readonly mine: string;
};

export type ProductPlanView = {
    readonly monthlyText: string;
    readonly months: string;
    readonly terms: readonly string[];
    readonly selectMonths: (event: ChangeEvent<HTMLSelectElement>) => void;
};
export type ProductComparisonView = {
    readonly status: ComparisonViewStatus.READY;
    readonly eligibilityStatus: EligibilityStatus;
    readonly eligibilityLabel: string;
    readonly note: string;
    readonly optionLabel: string;
    readonly meter: RateMeterView;
    readonly showMeter: boolean;
    readonly maturity: MaturityView;
    readonly showMaturity: boolean;
    readonly estimateMessage: string;
    readonly goalMessage: string;
};
export type ComparisonSummary = ProductComparisonView
    | {readonly status: ComparisonViewStatus.LOADING | ComparisonViewStatus.ERROR | ComparisonViewStatus.NO_OPTION; readonly message: string};
