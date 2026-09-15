import {useCallback} from "react";
import {useNavigate} from "react-router-dom";
import {resetRecommendation} from "../../question/services/recommendationService";
import {RoutePath} from "../enums/routePath";

export function useBrandHome() {
    const navigate = useNavigate();
    const goHome = useCallback((): void => {
        resetRecommendation();
        navigate(RoutePath.START);
    }, [navigate]);
    return {goHome};
}
