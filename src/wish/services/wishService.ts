import {ServiceError} from "../../common/services/ServiceError";
import {wishes} from "../api/wishes";
import {isFilledText, isJsonObject} from "../../common/lib/jsonCheck";
import {saveRecommendation} from "../../question/services/recommendationService";
import {WishMessages} from "../enums/wish";
import type {AnswerEntry} from "../../question/types/recommendation";
import type {WishRequestDTO, WishResponseDTO} from "../types/wish";
import {isWishResponse} from "../types/wish";

// 서버가 안내 문구를 보내면 그대로 쓰고, 본문을 읽지 못하면 기본 안내를 쓴다.
async function unavailableMessage(response: Response): Promise<string> {
    try {
        const payload: unknown = await response.json();
        if (isJsonObject(payload) && isFilledText(payload.detail)) {
            return payload.detail;
        }
    } catch {
        // 본문이 JSON 이 아니면 기본 안내를 쓴다.
    }
    return WishMessages.SERVER_ERROR;
}
export async function requestWish(request: WishRequestDTO): Promise<WishResponseDTO> {
    let response: Response;
    try {
        response = await wishes.create(request);
    } catch {
        throw new ServiceError(WishMessages.NETWORK_ERROR);
    }
    if (response.status === 422) {
        throw new ServiceError(WishMessages.INPUT_ERROR);
    }
    if (response.status === 503) {
        throw new ServiceError(await unavailableMessage(response));
    }
    if (!response.ok) {
        throw new ServiceError(WishMessages.SERVER_ERROR);
    }
    try {
        // 외부 JSON은 DTO 타입을 보장하지 않으므로 검증 이후에만 UI로 전달한다.
        const payload: unknown = await response.json();
        if (isWishResponse(payload)) {
            return payload;
        }
    } catch {
        throw new ServiceError(WishMessages.RESPONSE_ERROR);
    }
    throw new ServiceError(WishMessages.RESPONSE_ERROR);
}
// 문장에서 추출된 답을 기존 질문 세션에 넣어 두면, 버튼 질문 화면이 그 답 다음 질문부터 이어간다.
export function prefillWishAnswers(answers: Readonly<Record<string, string>>): void {
    const entries: readonly AnswerEntry[] = Object.entries(answers).map(([key, value]): AnswerEntry => ({
        key, value, questionTitle: key, answerLabel: value,
    }));
    saveRecommendation({entries, response: null});
}
// catch는 네트워크 실패 등 임의의 예외를 받을 수 있으므로 여기에서 사용자 메시지로 좁힌다.
export function wishError(error: unknown): string {
    if (error instanceof ServiceError) {
        return error.message;
    }
    return WishMessages.SERVER_ERROR;
}
