import {useCallback, useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {RoutePath} from "../../common/enums/routePath";
import {ServerAnswerValue, NextStepStatus, RequestStatus} from "../enums/recommendation";
import type {AnswerEntry, NextStepResponseDTO, QuestionRequestState, RecommendationSession} from "../types/recommendation";
import {
    appendRecommendationAnswer,
    getNextRecommendation,
    readRecommendation,
    recommendationError,
    saveRecommendation,
} from "../services/recommendationService";

export function useServerQuestions() {
    const navigate = useNavigate();
    const [state, setState] = useState<QuestionRequestState>(() => {
        const saved: RecommendationSession = readRecommendation();
        if (saved.response !== null) {
            return {status: RequestStatus.READY, response: saved.response};
        }
        return {status: RequestStatus.LOADING};
    });
    const [initialAnswer, setInitialAnswer] = useState<string>("");
    // 답변 목록은 화면에 그리지 않고 요청에만 쓰므로 상태가 아니라 ref 에 둔다.
    const entries = useRef<readonly AnswerEntry[]>([]);
    // 뒤로 가기·재시도·화면 이탈로 요청이 겹치면 마지막 번호의 응답만 화면에 반영한다.
    const sequence = useRef<number>(0);

    const load = useCallback(async (nextEntries: readonly AnswerEntry[]): Promise<void> => {
        const requestId: number = ++sequence.current;
        entries.current = nextEntries;
        saveRecommendation({entries: nextEntries, response: null});
        try {
            const response: NextStepResponseDTO = await getNextRecommendation(nextEntries);
            if (sequence.current !== requestId) {
                return;
            }
            saveRecommendation({entries: nextEntries, response});
            setState({status: RequestStatus.READY, response});
            if (response.status === NextStepStatus.DONE) {
                navigate(RoutePath.ANSWER_SUMMARY, {replace: true});
            }
        } catch (error: unknown) { // 네트워크 실패 등 임의의 예외가 온다.
            if (sequence.current !== requestId) {
                return;
            }
            setState({status: RequestStatus.ERROR, message: recommendationError(error)});
        }
    }, [navigate]);

    useEffect(() => {
        let active: boolean = true;
        const requestSequence = sequence;
        const session: RecommendationSession = readRecommendation();
        entries.current = session.entries;
        if (session.response === null) {
            // StrictMode의 바로 이어지는 정리 단계에서는 초기 요청을 전송하지 않는다.
            queueMicrotask(() => {
                if (active) {
                    void load(session.entries);
                }
            });
        } else if (session.response.status === NextStepStatus.DONE) {
            navigate(RoutePath.ANSWER_SUMMARY, {replace: true});
        }
        return () => {
            active = false;
            ++requestSequence.current; // 화면을 떠난 뒤 도착한 응답은 버린다.
        };
    }, [load, navigate]);

    const answer = useCallback((value: string): void => {
        if (state.status !== RequestStatus.READY || state.response.status !== NextStepStatus.QUESTION) {
            return;
        }
        const nextEntries: readonly AnswerEntry[] = appendRecommendationAnswer(entries.current, state.response.question, value);
        setInitialAnswer("");
        setState({status: RequestStatus.LOADING});
        void load(nextEntries);
    }, [load, state]);

    const back = useCallback((): void => {
        const previous: AnswerEntry | undefined = entries.current.at(-1); // 첫 질문에는 이전 답이 없다.
        if (previous === undefined) {
            ++sequence.current;
            navigate(RoutePath.START);
            return;
        }
        const skipped: boolean = previous.value === ServerAnswerValue.SKIPPED;
        setInitialAnswer(skipped ? "" : previous.value);
        setState({status: RequestStatus.LOADING});
        void load(entries.current.slice(0, -1));
    }, [load, navigate]);

    const retry = useCallback((): void => {
        if (state.status === RequestStatus.LOADING) {
            return;
        }
        setState({status: RequestStatus.LOADING});
        void load(entries.current);
    }, [load, state]);

    const skip = useCallback((): void => answer(ServerAnswerValue.SKIPPED), [answer]);

    return {state, initialAnswer, actions: {answer, back, retry, skip}};
}
