import {useCallback, useEffect, useRef, useState} from "react";
import {RequestStatus} from "../../question/enums/recommendation";
import {getCatalogProduct} from "../../catalog/services/catalogService";
import {recommendationError} from "../../question/services/recommendationService";
import type {CatalogProductResponseDTO} from "../../catalog/types/catalog";
import type {CatalogProductState} from "../types/catalogProduct";

/** 상품 한 건만 서버에서 받는다. 빈 productId 는 저장된 추천으로만 그리는 화면이라 요청하지 않는다. */
export function useCatalogProduct(productId: string) {
    const [state, setState] = useState<CatalogProductState>({status: RequestStatus.LOADING});
    const sequence = useRef<number>(0);
    const load = useCallback(async (): Promise<void> => {
        const requestId: number = ++sequence.current;
        if (productId === "") {
            setState({status: RequestStatus.READY, product: undefined});
            return;
        }
        setState({status: RequestStatus.LOADING});
        try {
            const product: CatalogProductResponseDTO | undefined = await getCatalogProduct(productId);
            if (requestId !== sequence.current) {
                return;
            }
            setState({status: RequestStatus.READY, product});
        } catch (error: unknown) {
            // 네트워크와 JSON 파싱 예외는 서비스에서 사용자 메시지로 좁힌다.
            if (requestId !== sequence.current) {
                return;
            }
            setState({status: RequestStatus.ERROR, message: recommendationError(error)});
        }
    }, [productId]);
    const cancelPending = useCallback((): void => { ++sequence.current; }, []);
    useEffect(() => {
        let active: boolean = true;
        queueMicrotask(() => {
            if (active) {
                void load();
            }
        });
        return () => {
            active = false;
            cancelPending();
        };
    }, [load, cancelPending]);
    return {state, retry: load};
}
