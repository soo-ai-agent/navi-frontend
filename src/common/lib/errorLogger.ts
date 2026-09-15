export function logException(context: string, error: unknown): void {
    // catch 경계에는 어떤 값도 전달될 수 있어 unknown으로 받은 뒤 기록만 한다.
    console.error(`예외 발생: context=${context}`, error);
}

export function logServiceError(context: string, message: string): void {
    console.error(`서비스 오류: context=${context}, message=${message}`);
}
