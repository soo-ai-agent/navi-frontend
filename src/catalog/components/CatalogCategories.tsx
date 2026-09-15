import type {JSX} from "react";
import {ComparisonMessages} from "../../product/enums/comparison";
import type {CatalogCategoryView} from "../types/catalog";
import type {useCatalogPager} from "../hooks/useCatalogPager";
import CatalogProductCard from "./CatalogProductCard";

type Props = {readonly categories: readonly CatalogCategoryView[]; readonly pager: ReturnType<typeof useCatalogPager>};

export default function CatalogCategories({categories, pager}: Props) {
    const {
        active, dragging, pagerRef, tabsRef, select, onScroll,
        onTouchStart, onTouchEnd,
        onPointerDown, onPointerMove, onPointerUp, onClickCapture,
    } = pager;

    const tabViews: JSX.Element[] = [];
    const panelViews: JSX.Element[] = [];
    for (const [index, category] of categories.entries()) {
        const selected: boolean = active === index;
        tabViews.push(
            <button type="button" role="tab" key={category.key} id={`catalog-tab-${category.key}`}
                aria-controls={`catalog-panel-${category.key}`} aria-selected={selected}
                className={selected ? "catalog-category on" : "catalog-category"} onClick={() => select(index)}>
                {category.title}
            </button>
        );
        const cardViews: JSX.Element[] = [];
        for (const product of category.cards) {
            cardViews.push(<CatalogProductCard key={product.product_id} product={product} />);
        }
        panelViews.push(
            <section key={category.key} className="catalog-panel" role="tabpanel" id={`catalog-panel-${category.key}`}
                aria-labelledby={`catalog-tab-${category.key}`} aria-hidden={!selected} inert={!selected}>
                <p className="cap">{category.cards.length}개 상품</p>
                {cardViews}
            </section>
        );
    }

    return (
        <>
            <p className="cap">{ComparisonMessages.SWIPE_HELP}</p>
            <div className="catalog-category-tabs" role="tablist" aria-label={ComparisonMessages.CATEGORIES} ref={tabsRef}>
                {tabViews}
            </div>
            <div className={dragging ? "catalog-pager dragging" : "catalog-pager"} ref={pagerRef} onScroll={onScroll}
                onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp} onClickCapture={onClickCapture}>
                {panelViews}
            </div>
        </>
    );
}
