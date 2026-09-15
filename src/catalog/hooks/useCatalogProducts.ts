import {useCallback, useEffect, useRef, useState} from "react";
import {RequestStatus} from "../../question/enums/recommendation";
import type {CatalogProductResponseDTO, CatalogState} from "../types/catalog";
import {getCatalogProducts} from "../services/catalogService";
import {recommendationError} from "../../question/services/recommendationService";

export function useCatalogProducts() {
    const [state, setState] = useState<CatalogState>({status: RequestStatus.LOADING});
    const sequence = useRef<number>(0);
    const load = useCallback(async (): Promise<void> => {
        const requestId: number = ++sequence.current;
        setState({status: RequestStatus.LOADING});
        try {
            const products: readonly CatalogProductResponseDTO[] = await getCatalogProducts();
            if (requestId !== sequence.current) {
                return;
            }
            setState({status: RequestStatus.READY, products});
        } catch (error: unknown) {
            // 네트워크와 JSON 파싱 예외는 서비스에서 사용자 메시지로 좁힌다.
            if (requestId !== sequence.current) {
                return;
            }
            setState({status: RequestStatus.ERROR, message: recommendationError(error)});
        }
    }, []);
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
