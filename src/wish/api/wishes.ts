import {apiClient} from "../../common/lib/apiClient";
import type {WishRequestDTO} from "../types/wish";

const WISHES: string = "/api/v1/wishes";
// LLM 이 순위 근거를 만드느라 80~100초 걸린다 — 기본 시간 제한보다 길게 잡는다.
const WISH_TIMEOUT_MS: number = 180000;
export const wishes = {
    create(request: WishRequestDTO): Promise<Response> {
        return apiClient.post({path: WISHES, body: JSON.stringify(request), timeoutMs: WISH_TIMEOUT_MS});
    },
};
