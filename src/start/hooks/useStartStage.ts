import {useCallback, useEffect, useMemo, useState} from "react";
import type {CatalogProductResponseDTO} from "../../catalog/types/catalog";
import {buildStageTracks, type StageTracks} from "../services/stageTrackService";

const TRACK_PIXELS_PER_SECOND: number = 40;
const PICK_ROTATE_MS: number = 1500;

// 트랙 내용은 이음새 없는 순환을 위해 2벌 복제되어 있어 한 벌 너비로 속도를 맞춘다.
function applyTrackSpeed(track: HTMLDivElement): void {
    const oneCopyWidth: number = track.scrollWidth / 2;
    track.style.animationDuration = `${oneCopyWidth / TRACK_PIXELS_PER_SECOND}s`;
}

export type StageState = StageTracks & {
    readonly pickBank: string;
    readonly hopKey: number; // 값이 바뀔 때마다 나비 hop 애니메이션 재생
    readonly setTrackSpeed: (element: HTMLDivElement | null) => void; // ref 콜백은 DOM 해제 시 null 을 받는다
};

export function useStartStage(products: readonly CatalogProductResponseDTO[]): StageState {
    const tracks: StageTracks = useMemo(() => buildStageTracks(products), [products]);
    const [rotateCount, setRotateCount] = useState<number>(0);

    useEffect(() => {
        // 사용자의 움직임 줄이기 설정은 브라우저만 알고 있어 matchMedia 로 직접 읽는다.
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        const timer: ReturnType<typeof setInterval> = setInterval(() => setRotateCount((count: number) => count + 1), PICK_ROTATE_MS);
        return () => clearInterval(timer);
    }, []);

    const setTrackSpeed = useCallback((element: HTMLDivElement | null): void => {
        if (element !== null) {
            // scrollWidth 는 레이아웃이 끝난 뒤에야 확정되므로 다음 프레임에서 읽는다.
            requestAnimationFrame(() => applyTrackSpeed(element));
        }
    }, []);

    const pickBank: string = tracks.banks.length === 0 ? "" : tracks.banks[rotateCount % tracks.banks.length];

    return {...tracks, pickBank, hopKey: rotateCount, setTrackSpeed};
}
