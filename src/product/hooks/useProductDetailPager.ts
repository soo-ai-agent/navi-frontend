import {useCallback, useRef, useState, type UIEvent} from "react";
import type {ProductDetailTabView} from "../types/productDetail";

// 탭 이동은 CSS scroll-snap 이 맡는 가로 스크롤이라 React 상태로는 위치를 정할 수 없고,
// 패널 간격도 렌더된 DOM 좌표(offsetLeft)에서만 알 수 있다.
function paneStep(pager: HTMLDivElement): number {
    const [first, second] = pager.children;
    if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) {
        return 0;
    }
    return second.offsetLeft - first.offsetLeft;
}

export function useProductDetailPager(available: readonly ProductDetailTabView[]) {
    const tabs: readonly ProductDetailTabView[] = available.filter((view: ProductDetailTabView) => view.hasContent);
    const [activeTab, setActiveTab] = useState<number>(0);
    // React 가 DOM 을 연결하기 전이나 해제한 뒤에는 ref.current 가 null 이다.
    const pagerRef = useRef<HTMLDivElement | null>(null);

    const selectTab = useCallback((index: number): void => {
        const pager: HTMLDivElement | null = pagerRef.current;
        if (pager === null) {
            return;
        }
        pager.scrollTo({left: paneStep(pager) * index, behavior: "smooth"});
    }, []);

    const handlePagerScroll = useCallback((event: UIEvent<HTMLDivElement>): void => {
        const pager: HTMLDivElement = event.currentTarget;
        const step: number = paneStep(pager);
        if (step <= 0) {
            return;
        }
        setActiveTab(Math.round(pager.scrollLeft / step));
    }, []);

    return {tabs, activeTab, selectTab, pagerRef, handlePagerScroll};
}
