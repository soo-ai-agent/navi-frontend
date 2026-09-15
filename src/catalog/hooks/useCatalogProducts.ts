import {useCallback, useEffect, useRef, useState} from "react";
import {RequestStatus} from "../../question/enums/recommendation";
import type {CatalogProductResponseDTO, CatalogState} from "../types/catalog";
import {getCatalogProducts} from "../services/catalogService";
import {recommendationError} from "../../question/services/recommendationService";

export function useCatalogProducts() {
    const [state, setState] = useState<CatalogState>({status: RequestStatus.LOADING});
    // 재시도가 겹치면 마지막 요청의 응답만 화면에 반영한다.
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
            // catch 는 임의의 예외를 받는다 — 서비스가 사용자 메시지로 좁힌다.
            if (requestId !== sequence.current) {
                return;
            }
            setState({status: RequestStatus.ERROR, message: recommendationError(error)});
        }
    }, []);
    useEffect(() => {
        let active: boolean = true;
        const requestSequence = sequence;
        // StrictMode 는 마운트 직후 정리를 한 번 더 실행한다 — 한 틱 미뤄 그 경우의 요청을 건너뛴다.
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
