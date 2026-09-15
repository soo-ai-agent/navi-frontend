import {ServiceError} from "../../common/services/ServiceError";
import {questions} from "../api/questions";
import {monthlyLimitText} from "../../catalog/services/catalogService";
import {browserStorage} from "../../common/lib/browserStorage";
import {isFilledText, isJsonObject} from "../../common/lib/jsonCheck";
import {BonusResult, NextStepStatus, RecommendationMessages} from "../enums/recommendation";
import type {
    AnswerEntry,
    AnswerRequestDTO,
    AnswerSummaryView,
    QuestionResponseDTO,
    BonusResultResponseDTO,
    BonusView,
    NextStepResponseDTO,
    ProductView,
    RankedProductResponseDTO,
    RecommendationSession,
} from "../types/recommendation";
import type {ComparisonState} from "../../product/types/comparison";
import {rankedComparisonSummary} from "../../product/services/comparisonViewService";
import {hasAnswerEntries, isNextStep, isRecommendationSession} from "../types/recommendation";

export const SESSION_KEY: string = "navi.server-recommendation.v1";
const EMPTY_SESSION: RecommendationSession = {entries: [], response: null};
const BANK_NAMES: Readonly<Record<string, string>> = {
    "0010001": "우리은행",
    "0010002": "한국스탠다드차타드은행",
    "0010016": "iM뱅크",
    "0010017": "부산은행",
    "0010019": "광주은행",
    "0010020": "제주은행",
    "0010022": "전북은행",
    "0010024": "경남은행",
    "0010026": "중소기업은행",
    "0010030": "한국산업은행",
    "0010927": "국민은행",
    "0011625": "신한은행",
    "0013175": "농협은행",
    "0013909": "하나은행",
    "0014674": "케이뱅크",
    "0014807": "수협은행",
    "0015130": "카카오뱅크",
    "0017801": "토스뱅크",
};
const BANK_ANSWER_KEYS: ReadonlySet<string> = new Set([
    "salary_bank",
    "existing_bank",
    "card_bank",
    "payment_account_bank",
    "salaryBank",
    "existingBank",
    "cardBank",
    "paymentAccountBank",
]);
const BONUS_RESULT_LABELS: Readonly<Record<BonusResult, string>> = {
    [BonusResult.ELIGIBLE]: RecommendationMessages.ELIGIBLE,
    [BonusResult.NOT_ELIGIBLE]: RecommendationMessages.NOT_ELIGIBLE,
    [BonusResult.UNKNOWN]: RecommendationMessages.UNKNOWN,
};
// StrictMode의 연속 마운트가 동일한 읽기 요청을 두 번 전송하지 않도록 진행 중인 요청만 공유한다.
const pendingRequests: Map<string, Promise<NextStepResponseDTO>> = new Map();

// ---- 세션 저장소 ----
// 새로고침해도 답이 남아야 해서 React 상태 밖(sessionStorage)에 둔다.
export function readRecommendation(): RecommendationSession {
    const raw: string = browserStorage.read(SESSION_KEY);
    if (raw === "") {
        return EMPTY_SESSION;
    }
    try {
        // 이전 배포가 남긴 세션이 같은 탭에 살아 있을 수 있어 읽을 때 계약을 검증한다.
        const saved: unknown = JSON.parse(raw);
        if (isRecommendationSession(saved)) {
            const needsMonthly: boolean = saved.response?.status === NextStepStatus.DONE
                && saved.entries.every((entry: AnswerEntry): boolean => entry.key !== "monthly");
            if (needsMonthly) {
                return {entries: saved.entries, response: null}; // 새 필수 질문 전에는 확정 응답이 없다.
            }
            return saved;
        }
        if (hasAnswerEntries(saved)) {
            return {entries: saved.entries, response: null};
        }
    } catch {
        // 손상된 세션은 새 비교로 시작한다.
    }
    return EMPTY_SESSION;
}
export function saveRecommendation(session: RecommendationSession): void {
    browserStorage.write(SESSION_KEY, JSON.stringify(session));
}
export function resetRecommendation(): void {
    saveRecommendation(EMPTY_SESSION);
}

// ---- 다음 질문 요청 ----
export function getNextRecommendation(entries: readonly AnswerEntry[]): Promise<NextStepResponseDTO> {
    const answers: AnswerRequestDTO = Object.fromEntries(entries.map((entry: AnswerEntry): readonly [string, string] => [entry.key, entry.value]));
    const key: string = JSON.stringify(answers);
    const existing: Promise<NextStepResponseDTO> | undefined = pendingRequests.get(key); // 같은 입력의 요청이 없을 수 있다.
    if (existing !== undefined) {
        return existing;
    }
    const request: Promise<NextStepResponseDTO> = requestNext(answers);
    pendingRequests.set(key, request);
    void request.then(() => pendingRequests.delete(key), () => pendingRequests.delete(key));
    return request;
}
async function requestNext(answers: AnswerRequestDTO): Promise<NextStepResponseDTO> {
    let response: Response;
    try {
        response = await questions.next(answers);
    } catch {
        throw new ServiceError(RecommendationMessages.NETWORK_ERROR);
    }
    if (response.status === 422) {
        throw new ServiceError(RecommendationMessages.INPUT_ERROR);
    }
    if (response.status === 503) {
        throw new ServiceError(await unavailableMessage(response));
    }
    if (!response.ok) {
        throw new ServiceError(RecommendationMessages.SERVER_ERROR);
    }
    try {
        // 외부 JSON은 DTO 타입을 보장하지 않으므로 검증 이후에만 UI로 전달한다.
        const payload: unknown = await response.json();
        if (isNextStep(payload)) {
            return payload;
        }
    } catch {
        throw new ServiceError(RecommendationMessages.RESPONSE_ERROR);
    }
    throw new ServiceError(RecommendationMessages.RESPONSE_ERROR);
}
// 서버가 안내 문구를 보내면 그대로 쓰고, 본문을 읽지 못하면 기본 안내를 쓴다.
async function unavailableMessage(response: Response): Promise<string> {
    try {
        // 오류 본문은 DTO 계약이 없어 detail 문자열만 골라 쓴다.
        const payload: unknown = await response.json();
        if (isJsonObject(payload) && isFilledText(payload.detail)) {
            return payload.detail;
        }
    } catch {
        // 본문이 JSON 이 아니면 기본 안내를 쓴다.
    }
    return RecommendationMessages.CONDITIONS_UNAVAILABLE;
}
// catch는 네트워크 실패 등 임의의 예외를 받을 수 있으므로 여기에서 사용자 메시지로 좁힌다.
export function recommendationError(error: unknown): string {
    if (error instanceof ServiceError) {
        return error.message;
    }
    return RecommendationMessages.SERVER_ERROR;
}

// ---- 답변 목록 ----
// 같은 질문에 다시 답하면 그 뒤의 답은 버린다 — 뒤 질문은 앞 답에 따라 달라진다.
export function appendRecommendationAnswer(
    entries: readonly AnswerEntry[], question: QuestionResponseDTO, value: string,
): readonly AnswerEntry[] {
    const index: number = entries.findIndex((entry: AnswerEntry) => entry.key === question.key);
    const previous: readonly AnswerEntry[] = index < 0 ? entries : entries.slice(0, index);
    // 다중 선택은 각 값을 표시 이름으로 바꾸고, 직접 입력은 그대로 보여준다.
    const labels: ReadonlyMap<string, string> = new Map(question.options);
    const answerLabel: string = value.split(",").map((answer: string): string => {
        const label: string = labels.get(answer) ?? answer;
        return readableBankName(question.key, label);
    }).join(", ");
    return [...previous, {key: question.key, value, questionTitle: question.title, answerLabel}];
}
export function answerSummaries(entries: readonly AnswerEntry[]): readonly AnswerSummaryView[] {
    const summaries: AnswerSummaryView[] = [];
    for (const entry of entries) {
        if (entry.questionTitle === "") {
            continue;
        }
        const answer: string = entry.answerLabel
            .split(",")
            .map((label: string): string => readableBankName(entry.key, label.trim()))
            .join(", ");
        summaries.push({key: entry.key, question: entry.questionTitle, answer});
    }
    return summaries;
}
// 은행 질문의 답은 7자리 기관 코드로 저장되므로 보여 줄 때 은행 이름으로 바꾼다.
function readableBankName(key: string, label: string): string {
    if (!BANK_ANSWER_KEYS.has(key) || !/^\d{7}$/u.test(label)) {
        return label;
    }
    return BANK_NAMES[label] ?? RecommendationMessages.BANK_NAME_UNAVAILABLE;
}

// ---- 확정된 추천 결과 ----
export function getResultProducts(comparison: ComparisonState): readonly ProductView[] {
    const session: RecommendationSession = readRecommendation();
    if (session.response?.status !== NextStepStatus.DONE) {
        return [];
    }
    return session.response.result.rows.map((row: RankedProductResponseDTO) => productView(row, comparison));
}
function productView(row: RankedProductResponseDTO, comparison: ComparisonState): ProductView {
    const bonuses: readonly BonusView[] = row.bonus_results.map((bonus: BonusResultResponseDTO, index: number) => ({
        key: `${index}:${bonus.label}`, label: bonus.label, status: BONUS_RESULT_LABELS[bonus.result],
        point: `${bonus.percentage_point}%p`, result: bonus.result,
    }));
    return {
        key: `${row.rank}:${row.product_id}`, product_id: row.product_id, rank: row.rank,
        title: row.product_name, bank: row.bank_name, rate: `연 ${row.rate}%`, baseRate: `연 ${row.base_rate}%`,
        term: `${row.saving_term_months}개월`, comparison: rankedComparisonSummary(comparison, row),
        limit: monthlyLimitText(row.monthly_limit_status, row.monthly_limit),
        source: row.bonus_condition_text || RecommendationMessages.NO_SOURCE, bonuses,
        other_conditions: row.other_conditions,
        other_eligibility_conditions: row.other_eligibility_conditions,
        other_bonus_conditions: row.other_bonus_conditions,
    };
}
// 추천 결과 주소가 없거나 예전 저장 결과이면 해당 옵션이 없다.
export function getRankedProduct(key: string): RankedProductResponseDTO | undefined {
    const session: RecommendationSession = readRecommendation();
    if (session.response?.status !== NextStepStatus.DONE) {
        return undefined;
    }
    return session.response.result.rows.find((row: RankedProductResponseDTO) => `${row.rank}:${row.product_id}` === key);
}
