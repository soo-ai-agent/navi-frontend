import {useCallback, useEffect, useRef, useState} from "react";
import {draggedValue} from "../services/sliderDragService";
import type {NumberSliderView} from "../types/numberInput";

type DragStart = {
    readonly pointerY: number;
    readonly startValue: number;
    readonly slider: NumberSliderView;
    readonly onChange: (value: string) => void;
};

/**
 * 입력칸을 위아래로 끌어 숫자를 바꾼다.
 *
 * 드래그 중에는 커서가 입력칸을 벗어나도 따라가야 하는데 React 이벤트는 요소 안에서만 오므로 window 에 직접 듣는다.
 * 기준점과 변경 통로를 누르는 순간 ref 에 담아 두므로, 다시 그려져도 리스너를 다시 달지 않는다.
 */
export function useSliderDrag(
    slider: NumberSliderView | undefined, // 드래그 범위가 없는 금액 질문은 slider 가 없다.
    onChange: (value: string) => void,
) {
    const [dragging, setDragging] = useState<boolean>(false);
    const start = useRef<DragStart | null>(null); // 드래그를 시작하기 전에는 기준점이 없다.

    const beginDrag = useCallback((pointerY: number): void => {
        if (slider === undefined) {
            return;
        }
        start.current = {pointerY, startValue: slider.value, slider, onChange};
        setDragging(true);
    }, [slider, onChange]);

    useEffect((): (() => void) => {
        const move = (event: PointerEvent): void => {
            const begin: DragStart | null = start.current;
            if (begin === null) {
                return;
            }
            begin.onChange(draggedValue(begin.slider, begin.startValue, begin.pointerY - event.clientY));
        };
        const stop = (): void => {
            start.current = null;
            setDragging(false);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop);
        return (): void => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", stop);
        };
    }, []);

    return {dragging, beginDrag};
}
