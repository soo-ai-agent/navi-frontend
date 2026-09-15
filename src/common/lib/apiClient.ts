// fetch 단일 창구. 요청마다 시작·결과를 한 줄씩 콘솔에 남겨 화면 동작과 요청을 짝지어 볼 수 있게 한다.
const REQUEST_TIMEOUT_MS: number = 30000;
let lastOperationId: number = 0;

async function send(method: string, path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const operationId: number = ++lastOperationId;
    const startedAt: number = performance.now();
    console.info(`api 요청 시작: operation=${operationId}, method=${method}, path=${path}`);
    try {
        const response: Response = await fetch(path, {...init, signal: AbortSignal.timeout(timeoutMs)});
        const elapsedMs: number = Math.round(performance.now() - startedAt);
        console.info(`api 요청 종료: operation=${operationId}, method=${method}, path=${path}, status=${response.status}, 소요_ms=${elapsedMs}`);
        return response;
    } catch (error: unknown) {
        // fetch 는 네트워크 실패·시간 초과를 어떤 값으로도 던질 수 있다. 여기서는 기록만 하고 서비스가 좁힌다.
        const elapsedMs: number = Math.round(performance.now() - startedAt);
        console.warn(`api 요청 실패: operation=${operationId}, method=${method}, path=${path}, 소요_ms=${elapsedMs}`);
        throw error;
    }
}

export const apiClient = {
    get({path}: {readonly path: string}): Promise<Response> {
        return send("GET", path, {}, REQUEST_TIMEOUT_MS);
    },
    // LLM 응답처럼 오래 걸리는 요청만 timeoutMs 로 기본 시간 제한을 늘린다.
    post({path, body, timeoutMs = REQUEST_TIMEOUT_MS}: {
        readonly path: string;
        readonly body: string;
        readonly timeoutMs?: number;
    }): Promise<Response> {
        return send("POST", path, {method: "POST", headers: {"Content-Type": "application/json"}, body}, timeoutMs);
    },
};
