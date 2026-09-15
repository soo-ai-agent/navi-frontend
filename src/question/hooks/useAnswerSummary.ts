import {useCallback} from "react";
import {useNavigate} from "react-router-dom";
import {RoutePath} from "../../common/enums/routePath";
import {answerSummaries, readRecommendation} from "../services/recommendationService";
import type {AnswerSummaryView, RecommendationSession} from "../types/recommendation";

export function useAnswerSummary() {
    const navigate = useNavigate();
    const session: RecommendationSession = readRecommendation();
    const summaries: readonly AnswerSummaryView[] = answerSummaries(session.entries);

    const showResult = useCallback((): void => {
        navigate(RoutePath.RESULT);
    }, [navigate]);
    const edit = useCallback((): void => {
        navigate(RoutePath.QUESTIONS);
    }, [navigate]);

    return {summaries, actions: {showResult, edit}};
}
