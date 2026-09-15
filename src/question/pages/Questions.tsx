import "../question.css";
import "../answer.css";
import BrandHome from "../../common/components/BrandHome";
import {NextStepStatus, RecommendationMessages, RequestStatus} from "../enums/recommendation";
import QuestionProgressBar from "../components/QuestionProgressBar";
import ServerQuestionForm from "../components/ServerQuestionForm";
import {useServerQuestions} from "../hooks/useServerQuestions";

export default function Questions() {
    const {state, initialAnswer, actions} = useServerQuestions();
    return (
        <section id="questions">
            <header className="top">
                <button className="icon" aria-label={RecommendationMessages.BACK} onClick={actions.back}>‹</button>
                <BrandHome />
                <button className="text-btn" onClick={actions.skip} disabled={state.status !== RequestStatus.READY}>
                    {RecommendationMessages.SKIP}
                </button>
            </header>
            <QuestionProgressBar />
            {state.status === RequestStatus.LOADING && <p role="status" className="notice">{RecommendationMessages.LOADING}</p>}
            {state.status === RequestStatus.ERROR && (
                <div className="notice">
                    <p role="alert">{state.message}</p>
                    <button className="cta" onClick={actions.retry}>{RecommendationMessages.RETRY}</button>
                </div>
            )}
            {state.status === RequestStatus.READY && state.response.status === NextStepStatus.QUESTION && (
                <ServerQuestionForm key={state.response.question.key} question={state.response.question}
                    initial={initialAnswer} onAnswer={actions.answer} />
            )}
        </section>
    );
}
