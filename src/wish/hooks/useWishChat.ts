import {useCallback, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {RoutePath} from "../../common/enums/routePath";
import {NextStepStatus, RequestStatus} from "../../question/enums/recommendation";
import {WishStepStatus} from "../enums/wish";
import {prefillWishAnswers, requestWish, wishError} from "../services/wishService";
import type {QuestionResponseDTO} from "../../question/types/recommendation";
import type {WishChatState, WishRequestDTO, WishResponseDTO, WishStep, WishTurn} from "../types/wish";
import {useWishLoadingPhase} from "./useWishLoadingPhase";

export function useWishChat() {
    const navigate = useNavigate();
    const [draft, setDraft] = useState<string>("");
    const [pendingMessage, setPendingMessage] = useState<string>("");
    const [turns, setTurns] = useState<readonly WishTurn[]>([]);
    // 서버는 무상태다 — 지금까지의 답 전체와 말한 문장 전체를 매 요청에 실어 보낸다.
    const [answers, setAnswers] = useState<Readonly<Record<string, string>>>({});
    const [situation, setSituation] = useState<string>("");
    const [state, setState] = useState<WishChatState>({status: RequestStatus.READY});
    const loadingMessage = useWishLoadingPhase(state.status === RequestStatus.LOADING);
    // 응답 대기 중 재전송이 겹치면 마지막 요청의 응답만 화면에 반영한다.
    const sequence = useRef<number>(0);
    // 클릭 핸들러는 렌더 시점의 state 를 붙들고 있어, 같은 틱의 두 번째 전송은 ref 로만 막을 수 있다.
    const busy = useRef<boolean>(false);

    const send = useCallback(async (request: WishRequestDTO, shownMessage: string): Promise<void> => {
        const requestId: number = ++sequence.current;
        const isLatestRequest = (): boolean => sequence.current === requestId;

        busy.current = true;
        setPendingMessage(shownMessage);
        setState({status: RequestStatus.LOADING});
        try {
            const response: WishResponseDTO = await requestWish(request);
            if (!isLatestRequest()) {
                return;
            }
            const extractedAnswers: Readonly<Record<string, string>> = Object.fromEntries(
                response.answers.map((answer): readonly [string, string] => [answer.code, answer.value]),
            );
            // 서버와 같은 규칙으로 합친다 — 이미 답한 키는 기존 값을 유지한다.
            const mergedAnswers: Readonly<Record<string, string>> = {...extractedAnswers, ...request.answers};
            prefillWishAnswers(mergedAnswers);
            setAnswers(mergedAnswers);
            setSituation(request.situation);
            setTurns((previous: readonly WishTurn[]): readonly WishTurn[] =>
                [...previous, {id: requestId, message: shownMessage, response}]);
            setState({status: RequestStatus.READY});
        } catch (error: unknown) {
            // catch 는 임의의 예외를 받는다 — 서비스가 사용자 메시지로 좁힌다.
            if (!isLatestRequest()) {
                return;
            }
            setState({status: RequestStatus.ERROR, message: wishError(error)});
        } finally {
            if (isLatestRequest()) {
                busy.current = false;
            }
        }
    }, []);

    const submit = useCallback((): void => {
        const message: string = draft.trim();
        if (busy.current || message === "") {
            return;
        }
        setDraft("");
        const joinedSituation: string = situation === "" ? message : `${situation}\n${message}`;
        void send({message, answers, situation: joinedSituation}, message);
    }, [draft, send, answers, situation]);

    const answerWithOption = useCallback((questionKey: string, value: string, label: string): void => {
        if (busy.current) {
            return;
        }
        // 버튼 답 턴에는 구조화할 새 문장이 없다 — message 없이 답만 보낸다.
        void send({message: null, answers: {...answers, [questionKey]: value}, situation}, label);
    }, [send, answers, situation]);

    const continueWithQuestions = useCallback((): void => {
        navigate(RoutePath.QUESTIONS);
    }, [navigate]);

    let step: WishStep = {status: WishStepStatus.FIRST_MESSAGE};
    if (turns.length > 0) {
        const lastResponse: WishResponseDTO = turns.at(-1)!.response; // length > 0 을 위에서 확인했다.
        step = lastResponse.next.status === NextStepStatus.QUESTION
            ? {status: WishStepStatus.QUESTION, question: lastResponse.next.question}
            : {status: WishStepStatus.DONE};
    }
    // 로딩·에러 중이거나 순위가 확정되면 띄울 버튼 질문이 없다.
    let shownQuestion: QuestionResponseDTO | null = null;
    if (state.status === RequestStatus.READY && step.status === WishStepStatus.QUESTION) {
        shownQuestion = step.question;
    }

    return {
        chat: {turns, state, step, shownQuestion, pendingMessage, loadingMessage, answerWithOption, continueWithQuestions},
        composer: {draft, setDraft, submit},
    };
}
