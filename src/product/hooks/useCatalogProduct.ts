import {useCallback, useEffect, useRef, useState} from "react";
import {RequestStatus} from "../../question/enums/recommendation";
import {getCatalogProduct} from "../../catalog/services/catalogService";
import {recommendationError} from "../../question/services/recommendationService";
import type {CatalogProductResponseDTO} from "../../catalog/types/catalog";
import type {CatalogProductState} from "../types/catalogProduct";

// 상품 한 건만 서버에서 받는다. 빈 productId 는 저장된 추천으로만 그리는 화면이라 요청하지 않는다.
export function useCatalogProduct(productId: string) {
    const [state, setState] = useState<CatalogProductState>({status: RequestStatus.LOADING});
    // 늦게 도착한 이전 요청의 응답을 버리기 위한 요청 번호. 렌더와 무관해 ref 에 둔다.
    const sequence = useRef<number>(0);
    const load = useCallback(async (): Promise<void> => {
        const requestId: number = ++sequence.current;
        if (productId === "") {
            setState({status: RequestStatus.READY, product: undefined});
            return;
        }
        setState({status: RequestStatus.LOADING});
        try {
            // 서버 404 는 "없는 상품"이라 서비스가 undefined 로 돌려준다.
            const product: CatalogProductResponseDTO | undefined = await getCatalogProduct(productId);
            if (requestId !== sequence.current) {
                return;
            }
            setState({status: RequestStatus.READY, product});
        } catch (error: unknown) {
            // catch 는 어떤 값이든 받을 수 있어 unknown 이며, 서비스가 사용자 메시지로 좁힌다.
            if (requestId !== sequence.current) {
                return;
            }
            setState({status: RequestStatus.ERROR, message: recommendationError(error)});
        }
    }, [productId]);
    useEffect(() => {
        // 같은 틱에 cleanup 된 effect(재실행·언마운트)는 요청을 보내지 않도록 한 틱 미룬다.
        let active: boolean = true;
        const requestSequence = sequence;
        queueMicrotask(() => {
            if (active) {
                void load();
            }
        });
        return () => {
            active = false;
            ++requestSequence.current; // 화면을 떠난 뒤 도착한 응답은 버린다.
        };
    }, [load]);
    return {state, retry: load};
}
