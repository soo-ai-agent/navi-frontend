import {useEffect, useState} from "react";
import {WishMessages} from "../enums/wish";

const LOADING_PHASES: readonly WishMessages[] = [
    WishMessages.LOADING_READING,
    WishMessages.LOADING_ANALYZING,
    WishMessages.LOADING_MATCHING,
    WishMessages.LOADING_RANKING,
];
const PHASE_INTERVAL_MILLISECONDS: number = 2000;

// 응답을 기다리는 동안 진행 단계 문구를 차례로 보여 준다. 마지막 문구에서 멈춘다.
export function useWishLoadingPhase(loading: boolean): WishMessages {
    const [phase, setPhase] = useState<number>(0);
    const [previousLoading, setPreviousLoading] = useState<boolean>(loading);
    if (loading !== previousLoading) {
        setPreviousLoading(loading);
        setPhase(0);
    }
    useEffect(() => {
        if (!loading) {
            return;
        }
        // React 에는 시간 경과를 표현하는 수단이 없어 브라우저 타이머를 effect 안에서 쓰고 정리한다.
        const timer: number = window.setInterval(() => {
            setPhase((previous: number): number => Math.min(previous + 1, LOADING_PHASES.length - 1));
        }, PHASE_INTERVAL_MILLISECONDS);
        return (): void => { window.clearInterval(timer); };
    }, [loading]);
    return LOADING_PHASES[phase];
}
