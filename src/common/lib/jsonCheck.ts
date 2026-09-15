// 외부 JSON(HTTP 응답·sessionStorage)은 런타임 타입을 보장하지 않는다.
// 그 값을 다루는 unknown 은 이 파일과 각 도메인의 DTO 검사 함수에만 두고, 통과한 뒤에는 DTO 타입으로만 다룬다.
type JsonObject = Readonly<Record<string, unknown>>;

export function isJsonObject(value: unknown): value is JsonObject {
    return typeof value === "object" && value !== null;
}
export function isText(field: unknown): field is string {
    return typeof field === "string";
}
export function isFilledText(field: unknown): field is string {
    return isText(field) && field.trim() !== "";
}
export function isInteger(field: unknown): boolean {
    return typeof field === "number" && Number.isInteger(field);
}
// 금리·금액은 정밀도를 보존하려고 서버가 문자열로 보낸다. 계산에 쓰기 전에 형식을 확인한다.
export function isDecimalText(field: unknown): boolean {
    return isText(field) && /^-?\d+(\.\d+)?([Ee][+-]?\d+)?$/u.test(field);
}
export function isMemberOf(field: unknown, members: Readonly<Record<string, string>>): boolean {
    return isText(field) && Object.values(members).includes(field);
}
export function isArrayOf(field: unknown, isItem: (item: unknown) => boolean): boolean {
    return Array.isArray(field) && field.every((item: unknown) => isItem(item));
}
