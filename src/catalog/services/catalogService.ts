import {RoutePath} from "../../common/enums/routePath";
import {ServiceError} from "../../common/services/ServiceError";
import {products} from "../api/products";
import {CatalogMessages, InterestCalcType, JoinRestriction, ReserveType} from "../enums/catalog";
import {ComparisonMessages, ComparisonViewStatus} from "../../product/enums/comparison";
import {MonthlyLimitStatus, RecommendationMessages} from "../../question/enums/recommendation";
import type {ComparisonPlan, ComparisonState} from "../../product/types/comparison";
import {productComparisonSummary} from "../../product/services/comparisonViewService";
import type {CatalogCategoryView, CatalogCardView, CatalogProductResponseDTO, CatalogRateOptionResponseDTO, CatalogRateView} from "../types/catalog";
import {isCatalogProduct, isProductCatalog} from "../types/catalog";

const RESERVE_LABELS: Readonly<Record<ReserveType, string>> = {
    [ReserveType.FIXED]: CatalogMessages.FIXED,
    [ReserveType.FREE]: CatalogMessages.FREE,
};
const CALCULATION_LABELS: Readonly<Record<InterestCalcType, string>> = {
    [InterestCalcType.SIMPLE]: CatalogMessages.SIMPLE,
    [InterestCalcType.COMPOUND]: CatalogMessages.COMPOUND,
};
const RESTRICTION_LABELS: Readonly<Record<JoinRestriction, string>> = {
    [JoinRestriction.ANYONE]: CatalogMessages.ANYONE,
    [JoinRestriction.LOW_INCOME_ONLY]: CatalogMessages.LOW_INCOME,
    [JoinRestriction.PARTIAL]: CatalogMessages.PARTIAL,
};

export async function getCatalogProducts(): Promise<readonly CatalogProductResponseDTO[]> {
    let response: Response;
    try {
        response = await products.list();
    } catch {
        throw new ServiceError(RecommendationMessages.NETWORK_ERROR);
    }
    if (!response.ok) {
        throw new ServiceError(CatalogMessages.LOAD_ERROR);
    }
    // 외부 JSON 은 DTO 모양을 보장하지 않는다 — 검사 함수를 통과한 뒤에만 화면으로 넘긴다.
    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        throw new ServiceError(RecommendationMessages.RESPONSE_ERROR);
    }
    if (!isProductCatalog(payload)) {
        throw new ServiceError(RecommendationMessages.RESPONSE_ERROR);
    }
    return payload.products;
}
// 주소로 직접 들어오면 없는 상품일 수 있다 — 서버의 404 는 실패가 아니라 "없음"이라 undefined 로 돌려준다.
export async function getCatalogProduct(productId: string): Promise<CatalogProductResponseDTO | undefined> {
    let response: Response;
    try {
        response = await products.detail(productId);
    } catch {
        throw new ServiceError(RecommendationMessages.NETWORK_ERROR);
    }
    if (response.status === 404) {
        return undefined;
    }
    if (!response.ok) {
        throw new ServiceError(CatalogMessages.LOAD_ERROR);
    }
    // 외부 JSON 은 DTO 모양을 보장하지 않는다 — 검사 함수를 통과한 뒤에만 화면으로 넘긴다.
    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        throw new ServiceError(RecommendationMessages.RESPONSE_ERROR);
    }
    if (!isCatalogProduct(payload)) {
        throw new ServiceError(RecommendationMessages.RESPONSE_ERROR);
    }
    return payload;
}

export function catalogCard(product: CatalogProductResponseDTO): CatalogCardView {
    const detailPath: string = RoutePath.PRODUCT_DETAIL.replace(":name", encodeURIComponent(product.product_id));
    return {
        product_id: product.product_id,
        bank_code: product.bank_code,
        title: product.product_name,
        bank: product.bank_name,
        rate: highestRateText(product.rate_options),
        terms: termsText(product.rate_options),
        limit: monthlyLimitText(product.monthly_limit_status, product.monthly_limit),
        comparison: {status: ComparisonViewStatus.LOADING, message: ComparisonMessages.LOADING},
        href: `${detailPath}?product_id=${encodeURIComponent(product.product_id)}`,
    };
}
// 공시 금리는 정밀도를 보존한 문자열로 오므로 최대값 비교에서만 숫자로 읽는다.
function highestRateText(options: readonly CatalogRateOptionResponseDTO[]): string {
    if (options.length === 0) {
        return CatalogMessages.NO_DISCLOSURE;
    }
    const rates: readonly number[] = options.map((option: CatalogRateOptionResponseDTO) => Number(option.max_rate));
    const highest: CatalogRateOptionResponseDTO = options[rates.indexOf(Math.max(...rates))];
    return `연 ${highest.max_rate}%`;
}
function termsText(options: readonly CatalogRateOptionResponseDTO[]): string {
    if (options.length === 0) {
        return CatalogMessages.NO_DISCLOSURE;
    }
    const months: readonly number[] = options.map((option: CatalogRateOptionResponseDTO) => option.saving_term_months);
    const sortedMonths: readonly number[] = [...new Set(months)].toSorted((left: number, right: number) => left - right);
    return `${sortedMonths.join(" · ")}개월`;
}
// 한도 유무는 상태가 정본이고 금액은 LIMITED 일 때만 뜻이 있다 — 순위·전체목록 두 응답이 같은 규칙을 쓴다.
export function monthlyLimitText(status: MonthlyLimitStatus, amount: number): string {
    if (status === MonthlyLimitStatus.UNLIMITED) {
        return RecommendationMessages.UNLIMITED;
    }
    return `${amount.toLocaleString("ko-KR")}원`;
}
export function catalogRateRows(product: CatalogProductResponseDTO): readonly CatalogRateView[] {
    return product.rate_options.map((option: CatalogRateOptionResponseDTO): CatalogRateView => ({
        key: `${option.saving_term_months}:${option.reserve_type}:${option.interest_calc_type}`,
        term: `${option.saving_term_months}개월`,
        reserve: RESERVE_LABELS[option.reserve_type],
        calculation: CALCULATION_LABELS[option.interest_calc_type],
        base: `${option.base_rate}%`,
        maximum: `${option.max_rate}%`,
    }));
}
export function joinRestrictionText(restriction: JoinRestriction): string {
    return RESTRICTION_LABELS[restriction];
}
export function disclosed(value: string): string {
    return value.trim() === "" ? CatalogMessages.NO_DISCLOSURE : value;
}
export function catalogHomepage(value: string): string {
    try {
        const url: URL = new URL(value);
        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }
    } catch {
        // 공시 URL이 비어 있거나 잘못된 경우 클릭 가능한 주소를 만들지 않는다.
    }
    return "";
}

// 전체 목록은 "모든 은행" 카테고리 하나 뒤에 은행별 카테고리를 공시 순서대로 붙인다.
export function catalogCategories(
    source: readonly CatalogProductResponseDTO[],
    comparison: ComparisonState,
    plan: ComparisonPlan,
): readonly CatalogCategoryView[] {
    const planQuery: URLSearchParams = new URLSearchParams({monthly: plan.monthly, months: plan.months});
    const cards: readonly CatalogCardView[] = source.map((product: CatalogProductResponseDTO): CatalogCardView => {
        const card: CatalogCardView = catalogCard(product);
        return {
            ...card,
            href: `${card.href}&${planQuery}`,
            comparison: productComparisonSummary(comparison, product.product_id, plan.months),
        };
    });

    const categories: CatalogCategoryView[] = [{key: "all", title: ComparisonMessages.ALL_BANKS, cards}];
    const bankNames: Map<string, string> = new Map(
        source.map((product: CatalogProductResponseDTO): readonly [string, string] => [product.bank_code, product.bank_name]),
    );
    for (const [bankCode, bankName] of bankNames) {
        categories.push({key: bankCode, title: bankName, cards: cards.filter((card: CatalogCardView) => card.bank_code === bankCode)});
    }
    return categories;
}
