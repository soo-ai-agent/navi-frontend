import {CatalogMessages} from "../../catalog/enums/catalog";
import {ComparisonMessages, ComparisonViewStatus} from "../enums/comparison";
import type {ComparisonSummary} from "../types/comparisonView";

type Props = {
    readonly summary: ComparisonSummary;
    readonly showReason: boolean;
};

export default function ProductComparisonSummary({summary, showReason}: Props) {
    if (summary.status !== ComparisonViewStatus.READY) {
        return <span className="comparison-pending cap">{summary.message}</span>;
    }
    return (
        <span className="comparison-summary">
            {summary.showMeter && (
                <span className="comparison-rates">
                    <span className="cap comparison-rate-label">{ComparisonMessages.MY_RATE_LABEL}</span>
                    <span className="comparison-rate-line">
                        <strong className="comparison-rate-mine">{summary.meter.text}</strong>
                        <span className="cap comparison-rate-max">{CatalogMessages.MAX_RATE} {summary.meter.maximumText}</span>
                    </span>
                    <span className="comparison-meter" role="meter" aria-label={summary.meter.label}
                        aria-valuemin={0} aria-valuemax={summary.meter.maximum} aria-valuenow={summary.meter.value}
                        aria-valuetext={`${summary.meter.text} / ${summary.meter.maximumText}`}>
                        <span className="comparison-meter-fill" style={{width: `${summary.meter.fill}%`}} />
                    </span>
                </span>
            )}

            {summary.showMaturity && (
                <span className="comparison-maturity">
                    <span className="comparison-maturity-item">
                        <span className="cap">{ComparisonMessages.PRINCIPAL}</span>
                        <span>{summary.maturity.principal}</span>
                    </span>
                    <span className="comparison-maturity-item is-mine">
                        <span className="cap">{ComparisonMessages.MATURITY_MINE}</span>
                        <strong>{summary.maturity.mine}</strong>
                    </span>
                    <span className="comparison-maturity-item">
                        <span className="cap">{ComparisonMessages.MATURITY_AT_MAX}</span>
                        <span>{summary.maturity.atMaxRate}</span>
                    </span>
                </span>
            )}
            {!summary.showMaturity && showReason && <span className="comparison-pending cap">{summary.estimateMessage}</span>}
            {summary.goalMessage !== "" && <span className="comparison-goal cap">{summary.goalMessage}</span>}
        </span>
    );
}
