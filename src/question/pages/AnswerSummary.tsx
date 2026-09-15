import type {JSX} from "react";
import "../answerSummary.css";
import BrandHome from "../../common/components/BrandHome";
import {RecommendationMessages} from "../enums/recommendation";
import {useAnswerSummary} from "../hooks/useAnswerSummary";

export default function AnswerSummary() {
    const {summaries, actions} = useAnswerSummary();
    const rows: JSX.Element[] = [];
    for (const summary of summaries) {
        rows.push(
            <div className="answer-summary-row" key={summary.key}>
                <dt className="cap">{summary.question}</dt>
                <dd>{summary.answer}</dd>
            </div>
        );
    }
    return (
        <section id="answer-summary">
            <header className="top">
                <BrandHome />
            </header>
            <h1>{RecommendationMessages.MY_CONDITIONS}</h1>
            <p className="cap">{RecommendationMessages.MY_CONDITIONS_HELP}</p>
            {summaries.length === 0 && <p className="notice">{RecommendationMessages.MISSING}</p>}
            {summaries.length > 0 && <dl className="answer-summary-rows card">{rows}</dl>}
            <button className="cta" onClick={actions.showResult}>{RecommendationMessages.SHOW_RESULT}</button>
            <button className="text-btn" onClick={actions.edit}>{RecommendationMessages.EDIT_CONDITIONS}</button>
        </section>
    );
}
