import "../start.css";
import BrandHome from "../../common/components/BrandHome";
import MatchStage from "../components/MatchStage";
import {RecommendationMessages} from "../../question/enums/recommendation";
import {StartMessages} from "../enums/start";
import {useStart} from "../hooks/useStart";

export default function Start() {
    const {stage, start, startWish, viewProducts} = useStart();
    return (
        <section id="start">
            <header className="top"><BrandHome /></header>
            <h1 className="center-text start-title">
                {StartMessages.TITLE}
                <br />
                <span className="hl">{StartMessages.TITLE_HIGHLIGHT}</span>
            </h1>
            <MatchStage stage={stage} />
            <p className="center-text start-lede">
                {StartMessages.INTRO} <b>{StartMessages.INTRO_AI}</b>,
                <br />
                <b>{StartMessages.INTRO_RATE}</b>{StartMessages.INTRO_END}
            </p>
            <div className="sticky">
                <button className="cta start-cta" onClick={start}>{RecommendationMessages.START}</button>
                <button className="cta start-cta" onClick={startWish}>{StartMessages.WISH_START}</button>
                <button className="link start-link" onClick={viewProducts}>{RecommendationMessages.ALL_PRODUCTS}</button>
            </div>
        </section>
    );
}
