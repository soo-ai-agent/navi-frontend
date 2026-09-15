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
    try {
        // HTTP JSON은 DTO를 보장하지 않아 검증을 통과한 원형만 화면에 넘긴다.
        const payload: unknown = await response.json();
        if (isProductCatalog(payload)) {
            return payload.products;
        }
    } catch {
        throw new ServiceError(RecommendationMessages.RESPONSE_ERROR);
    }
    throw new ServiceError(RecommendationMessages.RESPONSE_ERROR);
}
/** 주소로 직접 들어오면 없는 상품일 수 있다. 서버가 404로 알려주면 "없음"으로 좁힌다. */
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
    try {
        const payload: unknown = await response.json();
        if (isCatalogProduct(payload)) {
            return payload;
        }
    } catch {
        throw new ServiceError(RecommendationMessages.RESPONSE_ERROR);
    }
    throw new ServiceError(RecommendationMessages.RESPONSE_ERROR);
}
// 공시 금리는 정밀도를 보존한 문자열로 오므로 최대값 비교에서만 숫자로 읽는다.
function highestRateText(options: readonly CatalogRateOptionResponseDTO[]): string {
    const rates: readonly number[] = options.map((option: CatalogRateOptionResponseDTO) => Number(option.max_rate));
    if (rates.length === 0) {
        return CatalogMessages.NO_DISCLOSURE;
    }
    const highest: CatalogRateOptionResponseDTO = options[rates.indexOf(Math.max(...rates))];
    return `연 ${highest.max_rate}%`;
}
function termsText(options: readonly CatalogRateOptionResponseDTO[]): string {
    const months: readonly number[] = options.map((option: CatalogRateOptionResponseDTO) => option.saving_term_months);
    const sorted: readonly number[] = [...new Set(months)].toSorted((left: number, right: number) => left - right);
    return sorted.length === 0 ? CatalogMessages.NO_DISCLOSURE : `${sorted.join(" · ")}개월`;
}
function detailHref(productId: string): string {
    const path: string = RoutePath.PRODUCT_DETAIL.replace(":name", encodeURIComponent(productId));
    return `${path}?product_id=${encodeURIComponent(productId)}`;
}
export function catalogCard(product: CatalogProductResponseDTO): CatalogCardView {
    return {
        product_id: product.product_id, bank_code: product.bank_code, title: product.product_name, bank: product.bank_name,
        rate: highestRateText(product.rate_options), terms: termsText(product.rate_options),
        limit: monthlyLimitText(product.monthly_limit_status, product.monthly_limit),
        comparison: {status: ComparisonViewStatus.LOADING, message: ComparisonMessages.LOADING},
        href: detailHref(product.product_id),
    };
}
// 한도 유무는 상태가 정본이고 금액은 LIMITED 일 때만 뜻이 있다 — 순위·전체목록 두 응답이 같은 규칙을 쓴다.
export function monthlyLimitText(status: MonthlyLimitStatus, amount: number): string {
    if (status === MonthlyLimitStatus.UNLIMITED) {
        return RecommendationMessages.UNLIMITED;
    }
    return `${amount.toLocaleString("ko-KR")}원`;
}
export function catalogRateRows(product: CatalogProductResponseDTO): readonly CatalogRateView[] {
    const reserveLabels: Readonly<Record<ReserveType, string>> = {
        [ReserveType.FIXED]: CatalogMessages.FIXED, [ReserveType.FREE]: CatalogMessages.FREE,
    };
    const calculationLabels: Readonly<Record<InterestCalcType, string>> = {
        [InterestCalcType.SIMPLE]: CatalogMessages.SIMPLE, [InterestCalcType.COMPOUND]: CatalogMessages.COMPOUND,
    };
    return product.rate_options.map((option: CatalogRateOptionResponseDTO): CatalogRateView => ({
        key: `${option.saving_term_months}:${option.reserve_type}:${option.interest_calc_type}`,
        term: `${option.saving_term_months}개월`, reserve: reserveLabels[option.reserve_type],
        calculation: calculationLabels[option.interest_calc_type], base: `${option.base_rate}%`, maximum: `${option.max_rate}%`,
    }));
}
export function joinRestrictionText(restriction: JoinRestriction): string {
    const restrictions: Readonly<Record<JoinRestriction, string>> = {
        [JoinRestriction.ANYONE]: CatalogMessages.ANYONE,
        [JoinRestriction.LOW_INCOME_ONLY]: CatalogMessages.LOW_INCOME,
        [JoinRestriction.PARTIAL]: CatalogMessages.PARTIAL,
    };
    return restrictions[restriction];
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

export function catalogCategories(source: readonly CatalogProductResponseDTO[], comparison: ComparisonState, plan: ComparisonPlan): readonly CatalogCategoryView[] {
    const query: URLSearchParams = new URLSearchParams({monthly: plan.monthly, months: plan.months});
    const cards: readonly CatalogCardView[] = source.map((product: CatalogProductResponseDTO): CatalogCardView => {
        const card: CatalogCardView = catalogCard(product);
        return {...card, href: `${card.href}&${query}`, comparison: productComparisonSummary(comparison, product.product_id, plan.months)};
    });
    const bankNames: Map<string, string> = new Map(source.map((product: CatalogProductResponseDTO): readonly [string, string] => [product.bank_code, product.bank_name]));

    const categories: CatalogCategoryView[] = [{key: "all", title: ComparisonMessages.ALL_BANKS, cards}];
    for (const [bankCode, bankName] of bankNames) {
        categories.push({key: bankCode, title: bankName, cards: cards.filter((card: CatalogCardView) => card.bank_code === bankCode)});
    }
    return categories;
}
