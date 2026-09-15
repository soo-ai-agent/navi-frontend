import {ServiceError} from "../../common/services/ServiceError";
import {logException, logServiceError} from "../../common/lib/errorLogger";
import {products} from "../../catalog/api/products";
import {ComparisonMessages} from "../enums/comparison";
import {RecommendationMessages} from "../../question/enums/recommendation";
import type {ProductComparisonResponseDTO} from "../types/comparison";
import {isProductComparisons} from "../types/comparison";

function failComparison(context: string, message: string): never {
    logServiceError(context, message);
    throw new ServiceError(message);
}

export async function getProductComparisons(body: string): Promise<readonly ProductComparisonResponseDTO[]> {
    let response: Response;
    try {
        response = await products.compare(body);
    } catch (error: unknown) {
        // 네트워크 계층은 Error 이외의 값도 던질 수 있어 unknown으로 받아 기록한다.
        logException("product-comparison.request", error);
        failComparison("product-comparison.request", RecommendationMessages.NETWORK_ERROR);
    }

    if (!response.ok) {
        failComparison(`product-comparison.response.${response.status}`, ComparisonMessages.ERROR);
    }

    // response.json() 결과는 런타임 검증 전까지 구조를 알 수 없다.
    let payload: unknown;
    try {
        payload = await response.json();
    } catch (error: unknown) {
        // JSON 파싱은 Error 이외의 값도 던질 수 있어 unknown으로 받아 기록한다.
        logException("product-comparison.parse", error);
        failComparison("product-comparison.parse", RecommendationMessages.RESPONSE_ERROR);
    }

    if (!isProductComparisons(payload)) {
        failComparison("product-comparison.validate", RecommendationMessages.RESPONSE_ERROR);
    }

    return payload.products;
}
