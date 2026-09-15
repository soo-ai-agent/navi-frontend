import {useEffect, useRef} from "react";
import {useLocation} from "react-router-dom";

export function useAppNavigation(): void {
    const {pathname} = useLocation();
    const previousPath = useRef<string>("");
    useEffect(() => {
        if (previousPath.current === pathname) {
            return;
        }
        previousPath.current = pathname;
        // 라우터는 경로만 바꾸고 스크롤은 되돌리지 않는다 — 브라우저에 직접 요청한다.
        window.scrollTo(0, 0);
    }, [pathname]);
}
