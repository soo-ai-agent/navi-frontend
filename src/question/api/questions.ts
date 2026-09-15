import {apiClient} from "../../common/lib/apiClient";
import type {AnswerRequestDTO} from "../types/recommendation";

const NEXT_QUESTION: string = "/api/v1/questions/next";
export const questions = {
    next(answers: AnswerRequestDTO): Promise<Response> {
        return apiClient.post({path: NEXT_QUESTION, body: JSON.stringify(answers)});
    },
};
