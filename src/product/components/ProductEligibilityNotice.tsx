import ProductEligibilityBadge from "./ProductEligibilityBadge";
import {ComparisonViewStatus} from "../enums/comparison";
import type {ComparisonSummary} from "../types/comparisonView";

type Props = {readonly summary: ComparisonSummary};

export default function ProductEligibilityNotice({summary}: Props) {
    if (summary.status !== ComparisonViewStatus.READY) {
        return null;
    }
    return (
        <div className="card product-eligibility-notice">
            <p className="product-eligibility-head">
                <ProductEligibilityBadge summary={summary} />
                <span className="cap comparison-option">{summary.optionLabel}</span>
            </p>
            {summary.note !== "" && <p className="cap">{summary.note}</p>}
        </div>
    );
}
