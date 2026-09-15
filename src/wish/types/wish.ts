import type {RequestStatus} from "../../question/enums/recommendation";
import {isNextStep, isRankedProduct} from "../../question/types/recommendation";
import type {NextStepResponseDTO, RankedProductResponseDTO} from "../../question/types/recommendation";
import {isArrayOf, isInteger, isJsonObject, isText} from "../../common/lib/jsonCheck";

export type WishRequestDTO = {
    readonly message: string | null; // 선택지 버튼으로만 답한 턴에는 새로 말한 문장이 없다.
    // 은행별 키를 포함해 질문 키를 서버가 동적으로 정하므로 고정 키 집합으로 선언할 수 없다.
    readonly answers: Readonly<Record<string, string>>;
    readonly situation: string;
};
export type WishAnswerResponseDTO = {readonly code: string; readonly value: string};
export type WishUnmappedResponseDTO = {readonly name: string; readonly text: string};
export type WishRankedProductResponseDTO = RankedProductResponseDTO & {readonly reason: string};
export type WishResponseDTO = {
    readonly wish_id: number | null; // 버튼 답 턴에는 새 문장이 없어 wish 가 저장되지 않는다.
    readonly reply: string;
    readonly next: NextStepResponseDTO;
    readonly ranked: readonly WishRankedProductResponseDTO[];
    readonly answers: readonly WishAnswerResponseDTO[];
    readonly unmapped: readonly WishUnmappedResponseDTO[];
};
export type WishTurn = {
    readonly id: number; // 목록 key 용 요청 번호 — wish_id 는 버튼 답 턴에 null 이라 key 로 쓸 수 없다.
    readonly message: string; // 사용자가 말한 문장 또는 선택한 답 라벨.
    readonly response: WishResponseDTO;
};
export type WishChatState =
    | {readonly status: RequestStatus.LOADING}
    | {readonly status: RequestStatus.ERROR; readonly message: string}
    | {readonly status: RequestStatus.READY};

function isWishRankedProduct(value: unknown): value is WishRankedProductResponseDTO {
    return isJsonObject(value) && isText(value.reason) && isRankedProduct(value);
}
function isWishAnswer(value: unknown): value is WishAnswerResponseDTO {
    return isJsonObject(value) && isText(value.code) && isText(value.value);
}
function isWishUnmapped(value: unknown): value is WishUnmappedResponseDTO {
    return isJsonObject(value) && isText(value.name) && isText(value.text);
}
export function isWishResponse(value: unknown): value is WishResponseDTO {
    if (!isJsonObject(value)) {
        return false;
    }
    return (value.wish_id === null || isInteger(value.wish_id))
        && isText(value.reply)
        && isNextStep(value.next)
        && isArrayOf(value.ranked, isWishRankedProduct)
        && isArrayOf(value.answers, isWishAnswer)
        && isArrayOf(value.unmapped, isWishUnmapped);
}
