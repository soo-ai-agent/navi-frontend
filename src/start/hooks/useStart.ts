import {useCallback} from "react";
import {useNavigate} from "react-router-dom";
import {RoutePath} from "../../common/enums/routePath";
import {RequestStatus} from "../../question/enums/recommendation";
import {useCatalogProducts} from "../../catalog/hooks/useCatalogProducts";
import {resetRecommendation} from "../../question/services/recommendationService";
import type {CatalogProductResponseDTO} from "../../catalog/types/catalog";
import {useStartStage, type StageState} from "./useStartStage";

const NO_PRODUCTS: readonly CatalogProductResponseDTO[] = [];

export function useStart() {
    const navigate = useNavigate();
    const {state} = useCatalogProducts();
    const products: readonly CatalogProductResponseDTO[] = state.status === RequestStatus.READY ? state.products : NO_PRODUCTS;
    const stage: StageState = useStartStage(products);

    const start = useCallback((): void => {
        resetRecommendation();
        navigate(RoutePath.QUESTIONS);
    }, [navigate]);
    const startWish = useCallback((): void => { navigate(RoutePath.WISH); }, [navigate]);
    const viewProducts = useCallback((): void => { navigate(RoutePath.PRODUCTS); }, [navigate]);

    return {stage, start, startWish, viewProducts};
}
