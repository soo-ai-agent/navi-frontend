import {useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent} from "react";

const DRAG_THRESHOLD_PIXELS: number = 6;
const TAB_LEFT_MARGIN_PIXELS: number = 12;
// 마지막 scroll 이벤트 뒤 이만큼 조용하면 스냅이 끝난 것으로 본다.
const SETTLE_DELAY_MILLISECONDS: number = 150;

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
    const drag = useRef<{active: boolean; startX: number; startScroll: number; distance: number}>(
        {active: false, startX: 0, startScroll: 0, distance: 0},
    );
    // 손가락이 화면에 닿아 있는 동안은 active 를 바꾸지 않는다. 비활성 패널은 height:0 이라
    // 제스처 도중 active 가 바뀌면 문서 높이가 무너지며 scrollY 가 튀어 스와이프가 끊긴다.
    const touching = useRef<boolean>(false);
    // 0 = 예약된 타이머 없음.
    const settleTimer = useRef<number>(0);

    useEffect(() => () => window.clearTimeout(settleTimer.current), []);

    const select = useCallback((index: number): void => {
        window.clearTimeout(settleTimer.current);
        const pager: HTMLDivElement | null = pagerRef.current;
        if (pager === null) {
            return;
        }
        const [first] = pager.children;
        const target: Element | undefined = pager.children[index];
        if (!(first instanceof HTMLElement) || !(target instanceof HTMLElement)) {
            return;
        }
        // 스크롤 위치는 React 상태가 아니라 DOM 이 들고 있어 직접 옮긴다.
        pager.scrollTo({left: target.offsetLeft - first.offsetLeft, behavior: "smooth"});
        setActive(index);
    }, []);

    // 스크롤이 멈춘 뒤(스냅 완료) 보이는 패널을 active 로 확정한다.
    const settle = useCallback((): void => {
        window.clearTimeout(settleTimer.current);
        settleTimer.current = window.setTimeout(() => {
            const pager: HTMLDivElement | null = pagerRef.current;
            const tabs: HTMLDivElement | null = tabsRef.current;
            if (pager === null || touching.current || drag.current.active) {
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
        }, SETTLE_DELAY_MILLISECONDS);
    }, [categoryCount]);

    const onTouchStart = useCallback((): void => {
        touching.current = true;
    }, []);

    const onTouchEnd = useCallback((): void => {
        touching.current = false;
        settle();
    }, [settle]);

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
        // 포인터가 pager 밖으로 나가도 드래그를 이어받으려면 DOM 캡처가 필요하다.
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

    return {
        active, dragging, pagerRef, tabsRef, select, onScroll: settle,
        onTouchStart, onTouchEnd,
        onPointerDown, onPointerMove, onPointerUp, onClickCapture,
    };
}
