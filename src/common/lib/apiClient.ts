// API 한 번 호출마다 시작과 결과를 한 줄씩 남긴다. 브라우저 콘솔에서 화면 동작과 요청을 짝지어 볼 수 있다.
const REQUEST_TIMEOUT_MS: number = 30000;
let lastOperationId: number = 0;

function logStart(operationId: number, method: string, path: string): void {
    console.info(`api 요청 시작: operation=${operationId}, method=${method}, path=${path}`);
}

function logResult(operationId: number, method: string, path: string, status: number, startedAt: number): void {
    const elapsed: number = Math.round(performance.now() - startedAt);
    console.info(`api 요청 종료: operation=${operationId}, method=${method}, path=${path}, status=${status}, 소요_ms=${elapsed}`);
}

function logFailure(operationId: number, method: string, path: string, startedAt: number): void {
    const elapsed: number = Math.round(performance.now() - startedAt);
    console.warn(`api 요청 실패: operation=${operationId}, method=${method}, path=${path}, 소요_ms=${elapsed}`);
}

async function send(method: string, path: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const operationId: number = ++lastOperationId;
    const startedAt: number = performance.now();
    logStart(operationId, method, path);
    try {
        const response: Response = await fetch(path, {...init, signal: AbortSignal.timeout(timeoutMs)});
        logResult(operationId, method, path, response.status, startedAt);
        return response;
    } catch (error: unknown) {
        // 네트워크 실패와 시간 초과는 서비스가 사용자 메시지로 좁힌다. 여기서는 기록만 한다.
        logFailure(operationId, method, path, startedAt);
        throw error;
    }
}

export const apiClient = {
    get({path}: {readonly path: string}): Promise<Response> {
        return send("GET", path, {}, REQUEST_TIMEOUT_MS);
    },
    // LLM 응답처럼 오래 걸리는 요청만 timeoutMs 로 기본 시간 제한을 늘린다.
    post({path, body, timeoutMs = REQUEST_TIMEOUT_MS}: {readonly path: string; readonly body: string; readonly timeoutMs?: number}): Promise<Response> {
        return send("POST", path, {method: "POST", headers: {"Content-Type": "application/json"}, body}, timeoutMs);
    },
};
