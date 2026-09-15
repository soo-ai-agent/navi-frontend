import {CatalogMessages} from "../../catalog/enums/catalog";

type Props = {readonly homepage: string; readonly bank: string};

export default function ProductJoinLink({homepage, bank}: Props) {
    if (homepage === "") {
        return null;
    }
    return (
        <div className="product-join-link">
            <a className="cta" href={homepage} target="_blank" rel="noopener noreferrer">{CatalogMessages.JOIN_LINK}</a>
            <p className="cap">{bank} {CatalogMessages.JOIN_LINK_NOTICE}</p>
        </div>
    );
}
