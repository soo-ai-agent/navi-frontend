import {useCallback, useRef, useState, type MouseEvent, type PointerEvent} from "react";

const DRAG_THRESHOLD_PIXELS: number = 6;
const TAB_LEFT_MARGIN_PIXELS: number = 12;

function visibleIndex(pager: HTMLElement, categoryCount: number): number {
    const scrolled: number = Math.round(pager.scrollLeft / pager.clientWidth);
    return Math.min(categoryCount - 1, Math.max(0, scrolled));
}

export function useCatalogPager(categoryCount: number) {
    const [active, setActive] = useState<number>(0);
    const [dragging, setDragging] = useState<boolean>(false);
    // 브라우저가 카테고리 DOM을 연결하기 전에는 ref가 비어 있다.
    const pagerRef = useRef<HTMLDivElement | null>(null);
    const tabsRef = useRef<HTMLDivElement | null>(null);
    const drag = useRef<{active: boolean; startX: number; startScroll: number; distance: number}>({active: false, startX: 0, startScroll: 0, distance: 0});

    const select = useCallback((index: number): void => {
        const pager: HTMLDivElement | null = pagerRef.current;
        if (pager === null) {
            return;
        }
        const [first] = pager.children;
        const target: Element | undefined = pager.children[index];
        if (!(first instanceof HTMLElement) || !(target instanceof HTMLElement)) {
            return;
        }
        pager.scrollTo({left: target.offsetLeft - first.offsetLeft, behavior: "smooth"});
        setActive(index);
    }, []);

    const onScroll = useCallback((): void => {
        const pager: HTMLDivElement | null = pagerRef.current;
        const tabs: HTMLDivElement | null = tabsRef.current;
        if (pager === null) {
            return;
        }
        const index: number = visibleIndex(pager, categoryCount);
        setActive(index);
        if (tabs === null) {
            return;
        }
        const tab: Element | undefined = tabs.children[index];
        if (tab instanceof HTMLElement) {
            tabs.scrollTo({left: tab.offsetLeft - tabs.offsetLeft - TAB_LEFT_MARGIN_PIXELS});
        }
    }, [categoryCount]);

    const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>): void => {
        if (event.pointerType !== "mouse" || event.button !== 0) {
            return;
        }
        drag.current = {active: true, startX: event.clientX, startScroll: event.currentTarget.scrollLeft, distance: 0};
    }, []);

    const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>): void => {
        if (!drag.current.active) {
            return;
        }
        const moved: number = drag.current.startX - event.clientX;
        drag.current.distance = Math.abs(moved);
        if (drag.current.distance <= DRAG_THRESHOLD_PIXELS) {
            return;
        }
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.scrollLeft = drag.current.startScroll + moved;
    }, []);

    const onPointerUp = useCallback((event: PointerEvent<HTMLDivElement>): void => {
        if (!drag.current.active) {
            return;
        }
        drag.current.active = false;
        setDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (drag.current.distance > DRAG_THRESHOLD_PIXELS) {
            const startIndex: number = Math.round(drag.current.startScroll / event.currentTarget.clientWidth);
            const direction: number = drag.current.startX > event.clientX ? 1 : -1;
            select(Math.min(categoryCount - 1, Math.max(0, startIndex + direction)));
        }
    }, [categoryCount, select]);

    const onClickCapture = useCallback((event: MouseEvent<HTMLDivElement>): void => {
        if (drag.current.distance > DRAG_THRESHOLD_PIXELS) {
            event.preventDefault();
            event.stopPropagation();
            drag.current.distance = 0;
        }
    }, []);

    return {active, dragging, pagerRef, tabsRef, select, onScroll, onPointerDown, onPointerMove, onPointerUp, onClickCapture};
}
