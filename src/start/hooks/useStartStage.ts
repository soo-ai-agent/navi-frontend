import {useCallback, useEffect, useMemo, useState} from "react";
import type {CatalogProductResponseDTO} from "../../catalog/types/catalog";
import {buildStageTracks, type StageTracks} from "../services/stageTrackService";

const TRACK_PIXELS_PER_SECOND: number = 40;
const PICK_ROTATE_MS: number = 1500;

function applyTrackSpeed(track: HTMLDivElement): void {
    const oneCopyWidth: number = track.scrollWidth / 2; // 트랙 내용은 이음새 없는 순환을 위해 2벌 복제되어 있다
    track.style.animationDuration = `${oneCopyWidth / TRACK_PIXELS_PER_SECOND}s`;
}

export type StageState = StageTracks & {
    readonly pickBank: string;
    readonly hopKey: number; // 값이 바뀔 때마다 나비 hop 애니메이션 재생
    // 브라우저가 DOM을 연결하기 전에는 ref가 비어 있다.
    readonly setTrackSpeed: (element: HTMLDivElement | null) => void;
};

export function useStartStage(products: readonly CatalogProductResponseDTO[]): StageState {
    const tracks: StageTracks = useMemo(() => buildStageTracks(products), [products]);
    const [rotateCount, setRotateCount] = useState<number>(0);

    useEffect(() => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        const timer: ReturnType<typeof setInterval> = setInterval(() => setRotateCount((count: number) => count + 1), PICK_ROTATE_MS);
        return () => clearInterval(timer);
    }, []);

    const setTrackSpeed = useCallback((element: HTMLDivElement | null): void => {
        if (element !== null) {
            requestAnimationFrame(() => applyTrackSpeed(element));
        }
    }, []);

    const pickBank: string = tracks.banks.length === 0 ? "" : tracks.banks[rotateCount % tracks.banks.length];

    return {...tracks, pickBank, hopKey: rotateCount, setTrackSpeed};
}
