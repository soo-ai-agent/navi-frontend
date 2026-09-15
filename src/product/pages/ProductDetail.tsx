import "../product.css";
import "../comparison.css";
import {ComparisonMessages} from "../enums/comparison";
import BrandHome from "../../common/components/BrandHome";
import {CatalogMessages} from "../../catalog/enums/catalog";
import {RecommendationMessages, RequestStatus} from "../../question/enums/recommendation";
import ProductDetailContent from "../components/ProductDetailContent";
import ProductOptionSelect from "../components/ProductOptionSelect";
import ProductPlanControls from "../components/ProductPlanControls";
import {useServerProductDetail} from "../hooks/useServerProductDetail";

export default function ProductDetail() {
    const {product, state, pager, actions, calculation} = useServerProductDetail();
    const missing: boolean = product === undefined;
    return (
        <section id="detail">
            <header className="top">
                <button className="icon" aria-label={actions.backLabel} onClick={actions.back}>‹</button>
                <BrandHome />
            </header>
            {product !== undefined && (
                <ProductDetailContent product={product} pager={pager}>
                    <ProductPlanControls plan={calculation.plan} />
                    <ProductOptionSelect calculation={calculation} />
                    {calculation.state.status === RequestStatus.ERROR && (
                        <p role="alert">
                            {calculation.state.message}
                            <button className="text-btn" onClick={calculation.retry}>{ComparisonMessages.RETRY}</button>
                        </p>
                    )}
                </ProductDetailContent>
            )}
            {missing && state.status === RequestStatus.LOADING && <p role="status">{CatalogMessages.LOADING}</p>}
            {missing && state.status === RequestStatus.READY && (
                <p>
                    {CatalogMessages.MISSING}
                    <button className="text-btn" onClick={actions.refresh}>{ComparisonMessages.REFRESH}</button>
                </p>
            )}
            {state.status === RequestStatus.ERROR && (
                <div className="notice">
                    <p role="alert">{missing ? state.message : CatalogMessages.DETAIL_INCOMPLETE}</p>
                    <button className="text-btn" onClick={actions.retry}>{RecommendationMessages.RETRY}</button>
                </div>
            )}
        </section>
    );
}
