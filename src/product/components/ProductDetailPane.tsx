import type {ReactNode} from "react";

type Props = {
    readonly index: number;
    readonly activeTab: number;
    readonly label: string;
    readonly children: ReactNode;
};

export default function ProductDetailPane({index, activeTab, label, children}: Props) {
    const hidden: boolean = index !== activeTab;
    return (
        <div className="pane" role="tabpanel" id={`product-panel-${index}`}
            aria-labelledby={`product-tab-${index}`} aria-label={label} aria-hidden={hidden} inert={hidden}>
            {children}
        </div>
    );
}
