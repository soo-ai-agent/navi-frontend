import {useCallback, useRef, useState} from "react";
import {RequestStatus} from "../../question/enums/recommendation";
import {getProductComparisons} from "../services/comparisonService";
import {recommendationError} from "../../question/services/recommendationService";
import type {ComparisonState, ProductComparisonResponseDTO} from "../types/comparison";
import type {AnswerRequestDTO} from "../../question/types/recommendation";

export function useProductComparisons(answers: AnswerRequestDTO) {
    const [state, setState] = useState<ComparisonState>({status: RequestStatus.LOADING});
    // 늦게 도착한 이전 요청의 응답을 버리기 위한 요청 번호. 렌더와 무관해 ref 에 둔다.
    const sequence = useRef<number>(0);
    const requestBody: string = JSON.stringify(answers);
    const load = useCallback(async (): Promise<void> => {
        const requestId: number = ++sequence.current;
        setState({status: RequestStatus.LOADING});
        try {
            const compared: readonly ProductComparisonResponseDTO[] = await getProductComparisons(requestBody);
            if (requestId !== sequence.current) {
                return;
            }
            setState({status: RequestStatus.READY, products: compared});
        } catch (error: unknown) {
            // catch 는 어떤 값이든 받을 수 있어 unknown 이며, 서비스가 사용자 메시지로 좁힌다.
            if (requestId !== sequence.current) {
                return;
            }
            setState({status: RequestStatus.ERROR, message: recommendationError(error)});
        }
    }, [requestBody]);

    const cancel = useCallback((): void => { ++sequence.current; }, []);
    return {state, load, cancel};
}
