import type {NumberSliderView} from "../types/numberInput";

/** 위로 한 칸 올리는 데 필요한 세로 이동 거리(px). 작을수록 빠르게 변한다. */
const PIXELS_PER_STEP: number = 6;

/**
 * 커서를 위로 끈 거리만큼 값을 올린 결과를 만든다.
 *
 * 화면 좌표는 아래로 갈수록 커지므로 시작점에서 현재 위치를 뺀 값이 "올린 거리"다.
 */
export function draggedValue(slider: NumberSliderView, startValue: number, liftedPixels: number): string {
    const steps: number = Math.round(liftedPixels / PIXELS_PER_STEP);
    const moved: number = startValue + steps * slider.step;
    const bounded: number = Math.min(Math.max(moved, slider.minimum), slider.maximum);
    return String(bounded);
}
