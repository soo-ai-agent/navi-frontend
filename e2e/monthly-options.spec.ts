import {expect, test, type Page, type Request, type Route} from "@playwright/test";
import {AnswerKind, NextStepStatus} from "../src/question/enums/recommendation";
import type {NextStepResponseDTO, QuestionOption} from "../src/question/types/recommendation";

const endpoint: string = "**/api/v1/questions/next";
const monthlyTitle: string = "매달 얼마씩 넣을까요? (원)";
const ageTitle: string = "나이가 어떻게 되세요? (만)";
const monthlyOptions: readonly QuestionOption[] = [
    ["100000", "10만원"],
    ["300000", "30만원"],
    ["500000", "50만원"],
    ["1000000", "100만원"],
];
// 질문 응답은 기존 HTTP 계약에 따라 아직 없는 추천 결과를 null로 보낸다.
const monthlyResponse: NextStepResponseDTO = {
    status: NextStepStatus.QUESTION,
    question: {
        key: "monthly",
        title: monthlyTitle,
        answer_kind: AnswerKind.NUMBER_WITH_OPTIONS,
        options: monthlyOptions,
    },
    result: null,
};
const ageResponse: NextStepResponseDTO = {
    status: NextStepStatus.QUESTION,
    question: {
        key: "age",
        title: ageTitle,
        answer_kind: AnswerKind.NUMBER_WITH_OPTIONS,
        options: [
            ["20", "20세"],
            ["30", "30세"],
        ],
    },
    result: null,
};

async function showMonthlyQuestion(page: Page): Promise<void> {
    await page.route(endpoint, async (route: Route): Promise<void> => {
        const response: NextStepResponseDTO = route.request().postData() === "{}" ? monthlyResponse : ageResponse;
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(response),
        });
    });
    await page.goto("/questions");
}

async function submitAmount(page: Page): Promise<Request> {
    const submitted: Promise<Request> = page.waitForRequest((request: Request): boolean => request.url().endsWith("/questions/next"));
    await page.getByRole("button", {name: "다음", exact: true}).click();
    return submitted;
}

for (const [value, label] of monthlyOptions) {
    test(`월 납입액 ${label} 선택 후 다음으로 제출한다`, async ({page}) => {
        await showMonthlyQuestion(page);

        await page.getByRole("button", {name: label, exact: true}).click();

        await expect(page.getByRole("textbox", {name: monthlyTitle, exact: true})).toHaveValue(Number(value).toLocaleString("ko-KR"));
        const submitted: Request = await submitAmount(page);
        expect(submitted.postData()).toBe(JSON.stringify({monthly: value}));
    });
}

for (const value of ["750000", "999999999999999999"]) {
    test(`선택지에 없는 월 납입액 ${value}을 직접 입력한다`, async ({page}) => {
        await showMonthlyQuestion(page);

        await page.getByRole("textbox", {name: monthlyTitle, exact: true}).fill(value);
        const submitted: Request = await submitAmount(page);

        expect(submitted.postData()).toBe(JSON.stringify({monthly: value}));
    });
}

test("선택한 금액을 직접 수정해 제출한다", async ({page}) => {
    await showMonthlyQuestion(page);
    await page.getByRole("button", {name: "50만원", exact: true}).click();

    await page.getByRole("textbox", {name: monthlyTitle, exact: true}).fill("750000");

    await expect(page.getByRole("textbox", {name: monthlyTitle, exact: true})).toHaveValue("750,000");
    const submitted: Request = await submitAmount(page);
    expect(submitted.postData()).toBe('{"monthly":"750000"}');
});

test("뒤로 가면 직접 입력했던 월 납입액을 복원한다", async ({page}) => {
    await showMonthlyQuestion(page);
    await page.getByRole("textbox", {name: monthlyTitle, exact: true}).fill("750000");
    await submitAmount(page);
    await expect(page.getByRole("heading", {name: ageTitle, exact: true})).toBeVisible();

    await page.getByRole("button", {name: "뒤로", exact: true}).click();

    await expect(page.getByRole("textbox", {name: monthlyTitle, exact: true})).toHaveValue("750,000");
});

// 자리표가 든 "500,000"은 입력칸이 걷어내므로 잘못된 값이 아니다.
for (const value of ["", "0", "-1", "1.5", "abc", "1000000000000000000"]) {
    test(`잘못된 월 납입액 '${value}'은 제출할 수 없다`, async ({page}) => {
        await showMonthlyQuestion(page);

        await page.getByRole("textbox", {name: monthlyTitle, exact: true}).fill(value);

        await expect(page.getByRole("button", {name: "다음", exact: true})).toBeDisabled();
    });
}
