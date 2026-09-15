import "../catalog.css";
import "../../product/comparison.css";
import "../../question/answer.css";
import BrandHome from "../../common/components/BrandHome";
import {CatalogMessages} from "../enums/catalog";
import {ComparisonMessages} from "../../product/enums/comparison";
import {RecommendationMessages, RequestStatus} from "../../question/enums/recommendation";
import CatalogCategories from "../components/CatalogCategories";
import {useProducts} from "../hooks/useProducts";

export default function Products() {
    const {state, retry, content, calculation} = useProducts();
    return (
        <section id="catalog">
            <header className="top"><BrandHome /></header>
            <h1>{CatalogMessages.TITLE}</h1>
            <p className="sub">{CatalogMessages.HELP}</p>
            {calculation.state.status === RequestStatus.ERROR && (
                <p role="alert">
                    {calculation.state.message}
                    <button className="text-btn" onClick={calculation.retry}>{ComparisonMessages.RETRY}</button>
                </p>
            )}
            {state.status === RequestStatus.LOADING && <p role="status">{CatalogMessages.LOADING}</p>}
            {state.status === RequestStatus.ERROR && (
                <div className="card">
                    <p role="alert">{state.message}</p>
                    <button className="cta" onClick={retry}>{RecommendationMessages.RETRY}</button>
                </div>
            )}
            {state.status === RequestStatus.READY && <div className="catalog-list"><CatalogCategories {...content} /></div>}
        </section>
    );
}
