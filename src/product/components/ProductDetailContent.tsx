import type {JSX, ReactNode} from "react";
import {CatalogMessages} from "../../catalog/enums/catalog";
import {ComparisonViewStatus} from "../enums/comparison";
import {ProductDetailTab} from "../enums/productDetail";
import {RecommendationMessages} from "../../question/enums/recommendation";
import ProductComparisonSummary from "./ProductComparisonSummary";
import ProductDetailPane from "./ProductDetailPane";
import ProductEligibilityBadge from "./ProductEligibilityBadge";
import ProductEligibilityNotice from "./ProductEligibilityNotice";
import ProductJoinLink from "./ProductJoinLink";
import type {useProductDetailPager} from "../hooks/useProductDetailPager";
import type {ProductDetailView} from "../types/productDetail";
import InfoRow from "./InfoRow";
import RateTable from "./RateTable";
import ServerBonusRow from "./ServerBonusRow";
import ServerConditionChecklist from "./ServerConditionChecklist";

type Props = {
    readonly product: ProductDetailView;
    readonly children: ReactNode;
    readonly pager: ReturnType<typeof useProductDetailPager>;
};

export default function ProductDetailContent({product, children, pager}: Props) {
    const {tabs, activeTab, selectTab, pagerRef, handlePagerScroll} = pager;

    const matchedBonusViews: JSX.Element[] = [];
    for (const bonus of product.matchedBonuses) {
        matchedBonusViews.push(<ServerBonusRow key={bonus.key} bonus={bonus} />);
    }
    const unmatchedBonusViews: JSX.Element[] = [];
    for (const bonus of product.unmatchedBonuses) {
        unmatchedBonusViews.push(<ServerBonusRow key={bonus.key} bonus={bonus} />);
    }

    const paneContents: Readonly<Record<ProductDetailTab, JSX.Element>> = {
        [ProductDetailTab.MEMBER]: (
            <>
                <ProductEligibilityNotice summary={product.comparison} />
                <dl className="card product-info-rows">
                    <InfoRow label={CatalogMessages.MEMBER} value={product.member} />
                    <InfoRow label={CatalogMessages.JOIN_WAYS} value={product.joinWays.join(", ")} />
                    <InfoRow label={CatalogMessages.CONTACT} value={product.callCenter} />
                </dl>
            </>
        ),
        [ProductDetailTab.RESTRICTION]: (
            <dl className="card product-info-rows">
                <InfoRow label={CatalogMessages.RESTRICTION} value={product.restriction} />
                <InfoRow label={CatalogMessages.LIMIT} value={product.limit} />
            </dl>
        ),
        [ProductDetailTab.ELIGIBILITY_CHECKLIST]: (
            <ServerConditionChecklist title={RecommendationMessages.ELIGIBILITY_CHECKLIST_TITLE}
                conditions={product.other_eligibility_conditions} />
        ),
        [ProductDetailTab.CHECKLIST]: (
            <>
                <ServerConditionChecklist title={RecommendationMessages.OTHER_CHECKLIST_TITLE} conditions={product.other_conditions} />
                {product.checklistNotice !== "" && <p className="notice">{product.checklistNotice}</p>}
            </>
        ),
        [ProductDetailTab.BONUSES]: (
            <>
                {matchedBonusViews.length > 0 && (
                    <section aria-label={RecommendationMessages.MATCHED_BONUS_TITLE}>
                        <h2 className="product-server-title">{RecommendationMessages.MATCHED_BONUS_TITLE}</h2>
                        <ul className="card product-server-bonuses">{matchedBonusViews}</ul>
                    </section>
                )}
                {unmatchedBonusViews.length > 0 && (
                    <section aria-label={RecommendationMessages.UNMATCHED_BONUS_TITLE}>
                        <h2 className="product-server-title">{RecommendationMessages.UNMATCHED_BONUS_TITLE}</h2>
                        <ul className="card product-server-bonuses">{unmatchedBonusViews}</ul>
                    </section>
                )}
                <ServerConditionChecklist title={RecommendationMessages.BONUS_CHECKLIST_TITLE} conditions={product.other_bonus_conditions} />
            </>
        ),
        [ProductDetailTab.RATES]: (
            <>
                <p className="cap sec">
                    {CatalogMessages.PERIOD_RATES} <span className="m">{CatalogMessages.DISCLOSURE_PRETAX}</span>
                </p>
                <RateTable rows={product.rateRows} />
            </>
        ),
        [ProductDetailTab.NOTES]: (
            <dl className="card product-info-rows">
                <InfoRow label={CatalogMessages.MATURITY} value={product.afterMaturityRate} />
                <InfoRow label={CatalogMessages.NOTE} value={product.note} />
            </dl>
        ),
        [ProductDetailTab.DISCLOSURE]: (
            <dl className="card product-info-rows">
                <InfoRow label={CatalogMessages.DISCLOSURE_MONTH} value={product.disclosureMonth} />
                <InfoRow label={CatalogMessages.DISCLOSURE_DATE} value={product.disclosureDate} />
                <InfoRow label={RecommendationMessages.SOURCE_TITLE} value={product.source} />
            </dl>
        ),
    };

    const tabViews: JSX.Element[] = [];
    const paneViews: JSX.Element[] = [];
    const dotViews: JSX.Element[] = [];
    for (const [index, view] of tabs.entries()) {
        const selected: boolean = index === activeTab;
        tabViews.push(
            <button key={view.tab} id={`product-tab-${index}`} aria-controls={`product-panel-${index}`}
                className={selected ? "tab on" : "tab"} role="tab" aria-selected={selected} onClick={() => selectTab(index)}>
                {view.tab}
            </button>
        );
        paneViews.push(
            <ProductDetailPane key={view.tab} index={index} activeTab={activeTab} label={view.tab}>
                {paneContents[view.tab]}
            </ProductDetailPane>
        );
        dotViews.push(<i key={view.tab} className={selected ? "on" : ""} />);
    }

    return (
        <>
            <h2>{product.title}</h2>
            <p className="sub">{product.bank}</p>
            <div className="card hero">
                <div className="hero-head">
                    <span className="s">{product.rateLabel}</span>
                    <ProductEligibilityBadge summary={product.comparison} />
                </div>
                {product.comparison.status !== ComparisonViewStatus.READY && <div className="big">{product.rate}</div>}
                <ProductComparisonSummary summary={product.comparison} showReason={true} />
            </div>
            {children}
            <div className="tabs" role="tablist" aria-label={product.title}>{tabViews}</div>
            <div className="pager" ref={pagerRef} onScroll={handlePagerScroll}>{paneViews}</div>
            <div className="dots" aria-hidden="true">{dotViews}</div>
            <ProductJoinLink homepage={product.homepage} bank={product.bank} />
            <p className="cap product-footnote">{CatalogMessages.FOOTNOTE}</p>
        </>
    );
}
