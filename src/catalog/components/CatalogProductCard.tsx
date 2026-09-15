import ProductComparisonSummary from "../../product/components/ProductComparisonSummary";
import ProductEligibilityBadge from "../../product/components/ProductEligibilityBadge";
import {Link} from "react-router-dom";
import {CatalogMessages} from "../enums/catalog";
import {ComparisonViewStatus} from "../../product/enums/comparison";
import type {CatalogCardView} from "../types/catalog";

type Props = {readonly product: CatalogCardView};
export default function CatalogProductCard({product}: Props) {
    return (
        <Link className="card catalog-product-card" to={product.href} draggable={false}>
            <span className="catalog-product-head">
                <span className="cap">{product.bank} · {product.terms}</span>
                <ProductEligibilityBadge summary={product.comparison} />
            </span>
            <h2>{product.title}</h2>
            {product.comparison.status !== ComparisonViewStatus.READY && (
                <p className="catalog-rate"><span className="cap">{CatalogMessages.MAX_RATE}</span> <strong className="up">{product.rate}</strong></p>
            )}
            <ProductComparisonSummary summary={product.comparison} showReason={false} />
        </Link>
    );
}
