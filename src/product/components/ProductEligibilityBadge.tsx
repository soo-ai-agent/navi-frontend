import {ComparisonViewStatus} from "../enums/comparison";
import type {ComparisonSummary} from "../types/comparisonView";

type Props = {readonly summary: ComparisonSummary};

export default function ProductEligibilityBadge({summary}: Props) {
    if (summary.status !== ComparisonViewStatus.READY) {
        return null;
    }
    return <span className="comparison-eligibility" data-status={summary.eligibilityStatus}>{summary.eligibilityLabel}</span>;
}
