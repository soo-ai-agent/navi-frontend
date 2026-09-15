import {InterestCalcType, ReserveType} from "../../catalog/enums/catalog";
import type {ComparisonSummary} from "../../product/types/comparisonView";
import {AnswerKind, BonusResult, MonthlyLimitStatus, NextStepStatus} from "../enums/recommendation";
import type {RequestStatus} from "../enums/recommendation";
import {isArrayOf, isDecimalText, isFilledText, isInteger, isJsonObject, isMemberOf, isText} from "../../common/lib/jsonCheck";

export type QuestionOption = readonly [string, string];
export type QuestionResponseDTO = {
    readonly key: string;
    readonly title: string;
    readonly answer_kind: AnswerKind;
    readonly options: readonly QuestionOption[];
};
export type BonusResultResponseDTO = {
    readonly label: string;
    readonly result: BonusResult;
    readonly percentage_point: string;
};
export type OtherConditionResponseDTO = {
    readonly name: string;
    readonly value: string;
    readonly reason: string;
};
export type RankedProductResponseDTO = {
    readonly product_id: string;
    readonly rank: number;
    readonly bank_name: string;
    readonly product_name: string;
    readonly rate: string;
    readonly base_rate: string;
    readonly max_rate: string;
    readonly reserve_type: ReserveType;
    readonly interest_calc_type: InterestCalcType;
    readonly saving_term_months: number;
    readonly monthly_limit_status: MonthlyLimitStatus;
    readonly monthly_limit: number;
    readonly bonus_condition_text: string;
    readonly bonus_results: readonly BonusResultResponseDTO[];
    readonly other_conditions: readonly OtherConditionResponseDTO[];
    readonly other_eligibility_conditions: readonly OtherConditionResponseDTO[];
    readonly other_bonus_conditions: readonly OtherConditionResponseDTO[];
};
type RankingResultResponseDTO = {readonly rows: readonly RankedProductResponseDTO[]};
export type NextStepResponseDTO =
    | {readonly status: NextStepStatus.QUESTION; readonly question: QuestionResponseDTO; readonly result: null}
    | {readonly status: NextStepStatus.DONE; readonly question: null; readonly result: RankingResultResponseDTO};
export type AnswerEntry = {
    readonly key: string;
    readonly value: string;
    readonly questionTitle: string;
    readonly answerLabel: string;
};
export type AnswerSummaryView = {readonly key: string; readonly question: string; readonly answer: string};
// 은행별 키를 포함해 서버가 동적으로 정하므로 고정된 키 집합으로 선언할 수 없다.
export type AnswerRequestDTO = Readonly<Record<string, string>>;
export type RecommendationSession = {
    readonly entries: readonly AnswerEntry[];
    readonly response: NextStepResponseDTO | null; // 요청 전·요청 중에는 확정 응답이 없다.
};
export type QuestionRequestState =
    | {readonly status: RequestStatus.LOADING}
    | {readonly status: RequestStatus.ERROR; readonly message: string}
    | {readonly status: RequestStatus.READY; readonly response: NextStepResponseDTO};
export type BonusView = {
    readonly key: string;
    readonly label: string;
    readonly status: string;
    readonly point: string;
    readonly result: BonusResult;
};
export type ProductView = {
    readonly key: string;
    readonly product_id: string;
    readonly title: string;
    readonly bank: string;
    readonly rank: number;
    readonly rate: string;
    readonly baseRate: string;
    readonly comparison: ComparisonSummary;
    readonly term: string;
    readonly limit: string;
    readonly source: string;
    readonly bonuses: readonly BonusView[];
    readonly other_conditions: readonly OtherConditionResponseDTO[];
    readonly other_eligibility_conditions: readonly OtherConditionResponseDTO[];
    readonly other_bonus_conditions: readonly OtherConditionResponseDTO[];
};

function isQuestionOption(option: unknown): boolean {
    return Array.isArray(option) && option.length === 2 && isText(option[0]) && isText(option[1]);
}
function isQuestion(value: unknown): value is QuestionResponseDTO {
    if (!isJsonObject(value)) {
        return false;
    }
    return isFilledText(value.key)
        && isText(value.title)
        && isMemberOf(value.answer_kind, AnswerKind)
        && isArrayOf(value.options, isQuestionOption);
}
// 한도 유무는 상태가, 금액은 LIMITED 일 때만 뜻을 갖는다 — 순위·전체목록 응답이 같은 규칙을 쓴다.
export function isMonthlyLimit(value: Readonly<Record<string, unknown>>): boolean {
    if (!isMemberOf(value.monthly_limit_status, MonthlyLimitStatus) || !isInteger(value.monthly_limit) || Number(value.monthly_limit) < 0) {
        return false;
    }
    return value.monthly_limit_status !== MonthlyLimitStatus.UNLIMITED || value.monthly_limit === 0;
}
function isBonus(value: unknown): value is BonusResultResponseDTO {
    if (!isJsonObject(value)) {
        return false;
    }
    return isText(value.label)
        && isMemberOf(value.result, BonusResult)
        && isDecimalText(value.percentage_point);
}
export function isOtherCondition(value: unknown): value is OtherConditionResponseDTO {
    if (!isJsonObject(value)) {
        return false;
    }
    return isText(value.name) && isText(value.value) && isText(value.reason);
}
export function isRankedProduct(value: unknown): value is RankedProductResponseDTO {
    if (!isJsonObject(value)) {
        return false;
    }
    return isText(value.product_id)
        && isInteger(value.rank)
        && isText(value.bank_name)
        && isText(value.product_name)
        && isDecimalText(value.rate)
        && isDecimalText(value.base_rate)
        && isDecimalText(value.max_rate)
        && isMemberOf(value.reserve_type, ReserveType)
        && isMemberOf(value.interest_calc_type, InterestCalcType)
        && isInteger(value.saving_term_months)
        && isMonthlyLimit(value)
        && isText(value.bonus_condition_text)
        && isArrayOf(value.bonus_results, isBonus)
        && isArrayOf(value.other_conditions, isOtherCondition)
        && isArrayOf(value.other_eligibility_conditions, isOtherCondition)
        && isArrayOf(value.other_bonus_conditions, isOtherCondition);
}
export function isNextStep(value: unknown): value is NextStepResponseDTO {
    if (!isJsonObject(value)) {
        return false;
    }
    if (value.status === NextStepStatus.QUESTION) {
        return value.result === null && isQuestion(value.question);
    }
    if (value.status !== NextStepStatus.DONE || value.question !== null) {
        return false;
    }
    return isJsonObject(value.result) && isArrayOf(value.result.rows, isRankedProduct);
}
function isEntry(value: unknown): value is AnswerEntry {
    return isJsonObject(value) && isText(value.key) && isText(value.value)
        && isText(value.questionTitle) && isText(value.answerLabel);
}
export function isRecommendationSession(value: unknown): value is RecommendationSession {
    if (!hasAnswerEntries(value)) {
        return false;
    }
    return value.response === null || isNextStep(value.response);
}
// 이전 버전의 추천 응답을 갱신할 때 검증된 사용자 답변만 보존한다.
export function hasAnswerEntries(value: unknown): value is {readonly entries: readonly AnswerEntry[]; readonly response: unknown} {
    return isJsonObject(value) && isArrayOf(value.entries, isEntry);
}
