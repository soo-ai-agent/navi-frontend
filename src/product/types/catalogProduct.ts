import type {RequestStatus} from "../../question/enums/recommendation";
import type {CatalogProductResponseDTO} from "../../catalog/types/catalog";

/** 상세 화면이 받는 상품 한 건. READY + undefined 는 "서버에 없는 상품"이다. */
export type CatalogProductState =
    | {readonly status: RequestStatus.LOADING}
    | {readonly status: RequestStatus.ERROR; readonly message: string}
    | {readonly status: RequestStatus.READY; readonly product: CatalogProductResponseDTO | undefined};
