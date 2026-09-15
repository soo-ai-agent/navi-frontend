import ProductComparisonSummary from "../../product/components/ProductComparisonSummary";
import ProductEligibilityBadge from "../../product/components/ProductEligibilityBadge";
import type {ProductView} from "../../question/types/recommendation";

type Props = {readonly product: ProductView; readonly onOpen: (key: string) => void};

export default function ServerProductCard({product, onOpen}: Props) {
    return (
        <button className="pickcard" onClick={() => onOpen(product.key)}>
            <span className="pc-rank">{product.rank}</span>
            <span className="pc-head">
                <span className="pc-bank">{product.bank} · {product.term}</span>
                <ProductEligibilityBadge summary={product.comparison} />
            </span>
            <span className="pc-name">{product.title}</span>
            <ProductComparisonSummary summary={product.comparison} showReason={false} />
        </button>
    );
}
