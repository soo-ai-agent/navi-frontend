import {useCallback, useRef, useState, type UIEvent} from "react";
import type {ProductDetailTabView} from "../types/productDetail";

// React는 형제 패널 사이의 실제 스크롤 간격을 제공하지 않아 렌더된 DOM 위치를 읽는다.
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
    const pagerRef = useRef<HTMLDivElement | null>(null);

    const selectTab = useCallback((index: number): void => {
        // React가 DOM을 연결하기 전이나 해제한 뒤에는 ref.current가 null이다.
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
