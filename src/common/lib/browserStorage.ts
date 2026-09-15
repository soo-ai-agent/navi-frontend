// sessionStorage 단일 창구. 차단된 브라우저에서는 메모리로 대신해 같은 인터페이스를 유지한다.
const memoryFallback: Map<string, string> = new Map();

export const browserStorage = {
    read(key: string): string {
        try {
            return sessionStorage.getItem(key) ?? "";
        } catch {
            return memoryFallback.get(key) ?? "";
        }
    },
    write(key: string, value: string): void {
        memoryFallback.set(key, value);
        try {
            sessionStorage.setItem(key, value);
        } catch {
            // 저장소 차단이 현재 비교를 실패시키지 않게 한다 — 위 메모리 값으로 이어 간다.
        }
    },
};
