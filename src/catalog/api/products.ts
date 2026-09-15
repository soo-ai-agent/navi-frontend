import {apiClient} from "../../common/lib/apiClient";

const PRODUCTS: string = "/api/v1/products";
export const products = {
    compare(body: string): Promise<Response> {
        return apiClient.post({path: `${PRODUCTS}/compare`, body});
    },
    list(): Promise<Response> {
        return apiClient.get({path: PRODUCTS});
    },
    detail(productId: string): Promise<Response> {
        return apiClient.get({path: `${PRODUCTS}/${encodeURIComponent(productId)}`});
    },
};
