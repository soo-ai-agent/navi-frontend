import {BrandMessages} from "../enums/brand";
import {useBrandHome} from "../hooks/useBrandHome";
import BrandButterfly from "./BrandButterfly";

export default function BrandHome() {
    const {goHome} = useBrandHome();
    return (
        <button className="brand brand-home" type="button" onClick={goHome} aria-label={BrandMessages.HOME}>
            <BrandButterfly className="brand-mark" />{BrandMessages.NAME}
        </button>
    );
}
