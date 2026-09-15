import "../result.css";
import "../../product/comparison.css";
import {ComparisonMessages} from "../../product/enums/comparison";
import {RecommendationMessages, RequestStatus} from "../../question/enums/recommendation";
import type {ProductView} from "../../question/types/recommendation";
import ServerProductCard from "../components/ServerProductCard";
import {useServerResult} from "../hooks/useServerResult";
import BrandHome from "../../common/components/BrandHome";

export default function Result() {
    const {hasResult, products, summaries, empty, actions, comparison} = useServerResult();
    return (
        <section id="result">
            <header className="top">
                <BrandHome />
            </header>
            <h1>{RecommendationMessages.RESULT}</h1>
            <p className="cap">{RecommendationMessages.RESULT_HELP}</p>
            {!hasResult && (
                <div className="notice">
                    <p>{RecommendationMessages.MISSING}</p>
                    <p>{RecommendationMessages.MISSING_HELP}</p>
                    <button className="cta" onClick={actions.resume}>{ComparisonMessages.REFRESH}</button>
                </div>
            )}
            {hasResult && empty && (
                <div className="notice">
                    <p role="status">{RecommendationMessages.EMPTY}</p>
                    <p>{RecommendationMessages.EMPTY_HELP}</p>
                </div>
            )}
            {hasResult && comparison.state.status === RequestStatus.ERROR && (
                <p role="alert">
                    {comparison.state.message}
                    <button className="text-btn" onClick={comparison.retry}>{ComparisonMessages.RETRY}</button>
                </p>
            )}
            {hasResult && summaries.length > 0 && (
                <button className="result-summary-link" onClick={actions.openSummary}>
                    {RecommendationMessages.MY_CONDITIONS_LINK}
                </button>
            )}
            <div className="cards">
                {products.map((product: ProductView) => <ServerProductCard key={product.key} product={product} onOpen={actions.openProduct} />)}
            </div>
        </section>
    );
}
