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
        window.scrollTo(0, 0);
    }, [pathname]);
}
