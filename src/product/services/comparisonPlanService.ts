import type {CatalogProductResponseDTO} from "../../catalog/types/catalog";
import {ServerAnswerValue} from "../../question/enums/recommendation";
import type {AnswerEntry, AnswerRequestDTO} from "../../question/types/recommendation";
import {ComparisonMessages} from "../enums/comparison";
import type {ComparisonPlan} from "../types/comparison";

const DEFAULT_MONTHS: string = "12";

export function comparisonAnswers(entries: readonly AnswerEntry[], plan: ComparisonPlan): AnswerRequestDTO {
    const answers: AnswerRequestDTO = Object.fromEntries(
        entries.map((entry: AnswerEntry): readonly [string, string] => [entry.key, entry.value]),
    );
    return {...answers, monthly: plan.monthly, months: plan.months};
}

function answerValue(entries: readonly AnswerEntry[], key: string, fallback: string): string {
    for (const entry of entries) {
        if (entry.key === key) {
            return entry.value;
        }
    }
    return fallback;
}

function monthlyFromPrincipal(entries: readonly AnswerEntry[], months: string): string {
    const principal: string = answerValue(entries, "principal", "");
    if (!/^\d+$/u.test(principal) || !/^\d+$/u.test(months) || months === "0") {
        return "";
    }
    return `${BigInt(principal) / BigInt(months)}`;
}

export function comparisonPlan(params: URLSearchParams, entries: readonly AnswerEntry[]): ComparisonPlan {
    const months: string = params.get("months") ?? answerValue(entries, "months", DEFAULT_MONTHS);
    const answeredMonthly: string = answerValue(entries, "monthly", "");
    const restoredMonthly: string = answeredMonthly || monthlyFromPrincipal(entries, months);
    const monthly: string = params.get("monthly") ?? restoredMonthly;

    return {
        monthly: monthly === ServerAnswerValue.SKIPPED ? "" : monthly,
        months: /^\d+$/u.test(months) ? months : DEFAULT_MONTHS,
    };
}

export function monthlyPlanText(monthly: string): string {
    if (monthly === "") {
        return ComparisonMessages.MONTHLY_NOT_ANSWERED;
    }
    return `${ComparisonMessages.MONTHLY} ${Number(monthly).toLocaleString("ko-KR")}원`;
}

export function comparisonTerms(products: readonly CatalogProductResponseDTO[], selected: string): readonly string[] {
    const terms: number[] = [];
    for (const product of products) {
        for (const option of product.rate_options) {
            terms.push(option.saving_term_months);
        }
    }

    const values: readonly string[] = [...new Set(terms)]
        .toSorted((left: number, right: number) => left - right)
        .map((term: number) => `${term}`);

    if (values.includes(selected)) {
        return values;
    }
    return [selected, ...values];
}
