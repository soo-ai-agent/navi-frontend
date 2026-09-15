import {useEffect, useRef, type RefObject} from "react";

/* 대화 패널에 새 말풍선이 생겨 내용 높이가 늘면 바닥으로 내린다.
   스크롤 위치는 DOM 이 들고 있는 값이라 React 상태·JSX 로는 표현할 수 없어 effect 에서 직접 옮긴다. */
export function useWishScroll(): RefObject<HTMLDivElement | null> {
    const chatRef = useRef<HTMLDivElement>(null);
    const lastHeight = useRef(0);
    useEffect(() => {
        const chat: HTMLDivElement | null = chatRef.current;
        if (chat === null || chat.scrollHeight === lastHeight.current) {
            return;
        }
        lastHeight.current = chat.scrollHeight;
        chat.scrollTop = chat.scrollHeight;
    });
    return chatRef;
}
