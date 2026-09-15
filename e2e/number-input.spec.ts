import {expect, test, type Page, type Request, type Route} from "@playwright/test";
import {AnswerKind, NextStepStatus} from "../src/question/enums/recommendation";
import type {NextStepResponseDTO, QuestionResponseDTO} from "../src/question/types/recommendation";

const ageQuestion: QuestionResponseDTO = {
    key: "age",
    title: "나이가 어떻게 되세요? (만)",
    answer_kind: AnswerKind.NUMBER_WITH_OPTIONS,
    options: [
        ["18", "18세"],
        ["20", "20세"],
        ["30", "30세"],
        ["40", "40세"],
        ["50", "50세"],
        ["60", "60세"],
    ],
};

async function showNumberQuestion(page: Page, question: QuestionResponseDTO): Promise<void> {
    // 질문 단계의 결과는 기존 HTTP 계약상 null이다.
    const response: NextStepResponseDTO = {status: NextStepStatus.QUESTION, question, result: null};
    await page.route("**/api/v1/questions/next", (route: Route) => route.fulfill({json: response}));
    await page.goto("/questions");
    await expect(page.getByRole("heading", {name: question.title, exact: true})).toBeVisible();
}

test("숫자 질문은 선택하지 않은 상태로 시작하고 키보드를 자동으로 열지 않는다", async ({page}) => {
    await page.setViewportSize({width: 375, height: 812});
    await showNumberQuestion(page, ageQuestion);

    await expect(page.getByRole("textbox", {name: ageQuestion.title})).toBeEmpty();
    await expect(page.getByRole("textbox", {name: ageQuestion.title})).not.toBeFocused();
    await expect(page.getByRole("button", {name: "다음", exact: true})).toBeDisabled();
});

const cases: readonly {readonly question: QuestionResponseDTO; readonly chip: string; readonly expected: string}[] = [
    {
        question: {
            key: "monthly",
            title: "월 납입액",
            answer_kind: AnswerKind.NUMBER_WITH_OPTIONS,
            options: [["300000", "30만원"]],
        },
        chip: "30만원",
        expected: "300000",
    },
    {
        question: {
            key: "principal",
            title: "현재 보유 금액",
            answer_kind: AnswerKind.NUMBER_WITH_OPTIONS,
            options: [["3000000", "300만원"]],
        },
        chip: "300만원",
        expected: "3000000",
    },
    {
        question: {
            key: "card_spend_at_product_bank:bank",
            title: "월 카드 사용액",
            answer_kind: AnswerKind.NUMBER_WITH_OPTIONS,
            options: [["300000", "30만원"]],
        },
        chip: "30만원",
        expected: "300000",
    },
];

for (const {question, chip, expected} of cases) {
    test(`${question.key} 금액 칩을 누른 값을 그대로 제출한다`, async ({page}) => {
        await showNumberQuestion(page, question);

        await page.getByRole("button", {name: chip, exact: true}).click();
        const submitted: Promise<Request> = page.waitForRequest((request: Request) => request.url().endsWith("/questions/next"));
        await page.getByRole("button", {name: "다음", exact: true}).click();

        expect((await submitted).postData()).toBe(JSON.stringify({[question.key]: expected}));
    });
}

test("금액 칩을 다시 누르면 누른 금액으로 바뀐다", async ({page}) => {
    const question: QuestionResponseDTO = {
        key: "monthly",
        title: "월 납입액",
        answer_kind: AnswerKind.NUMBER_WITH_OPTIONS,
        options: [
            ["100000", "10만원"],
            ["300000", "30만원"],
        ],
    };
    await showNumberQuestion(page, question);

    await page.getByRole("button", {name: "10만원", exact: true}).click();
    await page.getByRole("button", {name: "30만원", exact: true}).click();

    const submitted: Promise<Request> = page.waitForRequest((request: Request) => request.url().endsWith("/questions/next"));
    await page.getByRole("button", {name: "다음", exact: true}).click();

    expect((await submitted).postData()).toBe('{"monthly":"300000"}');
});

test("지우기를 누르면 입력한 금액이 비워진다", async ({page}) => {
    const question: QuestionResponseDTO = {
        key: "monthly",
        title: "월 납입액",
        answer_kind: AnswerKind.NUMBER_WITH_OPTIONS,
        options: [["100000", "10만원"]],
    };
    await showNumberQuestion(page, question);

    await page.getByRole("button", {name: "10만원", exact: true}).click();
    await page.getByRole("button", {name: "지우기", exact: true}).click();

    await expect(page.getByRole("textbox", {name: question.title})).toBeEmpty();
    await expect(page.getByRole("button", {name: "다음", exact: true})).toBeDisabled();
});

test("나이 질문은 드래그로도 고를 수 있다", async ({page}) => {
    await showNumberQuestion(page, ageQuestion);

    const slider = page.getByRole("slider", {name: ageQuestion.title});
    await expect(slider).toHaveAttribute("min", "0");
    await expect(slider).toHaveAttribute("max", "120");

    await slider.fill("35");

    await expect(page.getByRole("textbox", {name: ageQuestion.title})).toHaveValue("35");
});

test("금액 질문의 드래그 상한은 선택지 중 가장 큰 값이다", async ({page}) => {
    const question: QuestionResponseDTO = {
        key: "monthly",
        title: "월 납입액",
        answer_kind: AnswerKind.NUMBER_WITH_OPTIONS,
        options: [
            ["100000", "10만원"],
            ["1000000", "100만원"],
        ],
    };
    await showNumberQuestion(page, question);

    // 18자리 상한을 그대로 쓰면 막대를 끌 수 없어 선택지 최댓값을 상한으로 삼는다.
    await expect(page.getByRole("slider", {name: question.title})).toHaveAttribute("max", "1000000");
});

test("120세를 넘는 직접 입력은 제출하지 않는다", async ({page}) => {
    await showNumberQuestion(page, ageQuestion);

    await page.getByRole("textbox", {name: ageQuestion.title}).fill("121");

    await expect(page.getByText("만 나이는 0~120세로 입력해 주세요.")).toBeVisible();
    await expect(page.getByRole("button", {name: "다음", exact: true})).toBeDisabled();
});

test("18자리 금액을 직접 입력해도 끝자리를 자리표와 함께 보여준다", async ({page}) => {
    const question: QuestionResponseDTO = {
        key: "monthly",
        title: "월 납입액",
        answer_kind: AnswerKind.NUMBER_WITH_OPTIONS,
        options: [["100000", "10만원"]],
    };
    await showNumberQuestion(page, question);

    await page.getByRole("textbox", {name: question.title}).fill("999999999999800001");

    await expect(page.getByRole("textbox", {name: question.title})).toHaveValue("999,999,999,999,800,001");
});

test("나이 질문 건너뛰기는 나이 기본값 대신 any를 보낸다", async ({page}) => {
    await showNumberQuestion(page, ageQuestion);

    const submitted: Promise<Request> = page.waitForRequest((request: Request) => request.url().endsWith("/questions/next"));
    await page.getByRole("button", {name: "건너뛰기", exact: true}).click();

    expect((await submitted).postData()).toBe('{"age":"none"}');
});

test("목표 금액 질문은 없다고 답할 수 있다", async ({page}) => {
    const question: QuestionResponseDTO = {
        key: "goal_amount",
        title: "만기까지 모으고 싶은 금액이 있나요? (원)",
        answer_kind: AnswerKind.NUMBER_WITH_OPTIONS,
        options: [
            ["1000000", "100만원"],
            ["none", "목표 금액은 없어요"],
        ],
    };
    await showNumberQuestion(page, question);

    const submitted: Promise<Request> = page.waitForRequest((request: Request) => request.url().endsWith("/questions/next"));
    await page.getByRole("button", {name: "목표 금액은 없어요", exact: true}).click();

    expect((await submitted).postData()).toBe('{"goal_amount":"none"}');
});
