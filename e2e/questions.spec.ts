import {test, expect, type APIResponse, type Page, type Request, type Response, type Route} from "@playwright/test";
import {appendRecommendationAnswer, SESSION_KEY} from "../src/question/services/recommendationService";
import {AnswerKind} from "../src/question/enums/recommendation";

const endpoint: string = "**/api/v1/questions/next";
const ageTitle: string = "나이가 어떻게 되세요? (만)";
const bankTitle: string = "급여나 연금은 어느 은행으로 받으세요?";
const goalTitle: string = "만기까지 모으고 싶은 금액이 있나요? (원)";
const monthlyTitle: string = "매달 얼마씩 넣을까요? (원)";

test("다중 선택한 은행 코드를 은행명으로 요약한다", () => {
    const entries = appendRecommendationAnswer([], {
        key: "salary_bank",
        title: bankTitle,
        answer_kind: AnswerKind.MULTI_OPTIONS,
        options: [
            ["0010001", "우리은행"],
            ["0010002", "한국스탠다드차타드은행"],
        ],
    }, "0010001,0010002");

    expect(entries[0]?.answerLabel).toBe("우리은행, 한국스탠다드차타드은행");
});

async function reachAgeQuestion(page: Page): Promise<void> {
    await page.goto("/");
    await page.getByRole("button", {name: "선택해서 적금 찾기", exact: true}).click();
    await page.getByRole("button", {name: "12개월", exact: true}).click();
    // 기간 다음은 월 납입액, 그다음이 목표 금액이다. 둘 다 모른다고 답해 나이 질문으로 넘어간다.
    await expect(page.getByRole("heading", {name: monthlyTitle, exact: true})).toBeVisible();
    await page.getByRole("button", {name: "모르겠어요", exact: true}).click();
    await expect(page.getByRole("heading", {name: goalTitle, exact: true})).toBeVisible();
    await page.getByRole("button", {name: "목표 금액은 없어요", exact: true}).click();
}

async function reachBankQuestion(page: Page): Promise<void> {
    await reachAgeQuestion(page);
    await page.getByRole("textbox", {name: ageTitle, exact: true}).fill("19");
    await page.getByRole("button", {name: "다음", exact: true}).click();
}

async function reachResult(page: Page): Promise<void> {
    await reachBankQuestion(page);
    await page.getByRole("button", {name: "bank", exact: true}).click();
    await page.getByRole("button", {name: "다음", exact: true}).click();
    // 질문이 끝나면 내가 답한 조건을 먼저 확인하고 결과로 넘어간다.
    await page.getByRole("button", {name: "결과 보기", exact: true}).click();
}

test("질문 키에 답을 누적해 실제 서버 금리를 표시한다", async ({page}) => {
    const payloads: string[] = [];
    page.on("request", (request: Request): void => {
        if (request.url().endsWith("/api/v1/questions/next")) {
            payloads.push(request.postData() ?? "");
        }
    });

    await reachResult(page);

    await expect(page).toHaveURL(/\/result$/u);
    await expect(page.locator(".comparison-rate-mine").filter({hasText: "연 3.7%"})).toBeVisible();
    expect(payloads).toEqual([
        '{}',
        '{"months":"12"}',
        '{"months":"12","monthly":"none"}',
        '{"months":"12","monthly":"none","goal_amount":"none"}',
        '{"months":"12","monthly":"none","goal_amount":"none","age":"19"}',
        '{"months":"12","monthly":"none","goal_amount":"none","age":"19","salary_bank":"bank"}',
    ]);
});

test("뒤로 가서 바꾼 나이로 가입조건을 다시 판정한다", async ({page}) => {
    await reachBankQuestion(page);
    await expect(page.getByRole("heading", {name: bankTitle, exact: true})).toBeVisible();
    await page.getByRole("button", {name: "뒤로", exact: true}).click();

    await page.getByRole("textbox", {name: ageTitle, exact: true}).fill("18");
    await page.getByRole("button", {name: "다음", exact: true}).click();

    await page.getByRole("button", {name: "결과 보기", exact: true}).click();
    await expect(page.getByText("입력한 조건에 맞는 상품이 없어요.", {exact: true})).toBeVisible();
});

test("결과 화면의 나비 로고로 답변을 초기화하고 시작 화면으로 이동한다", async ({page}) => {
    await reachResult(page);

    await page.getByRole("button", {name: "나비 홈으로", exact: true}).click();

    await expect(page).toHaveURL(/\/$/u);
    const savedEntries: number = await page.evaluate((key: string) => {
        const saved: string = sessionStorage.getItem(key) ?? "";
        return saved === "" ? 0 : (JSON.parse(saved) as {entries: unknown[]}).entries.length;
    }, SESSION_KEY);
    expect(savedEntries).toBe(0);
});

test("우대 질문을 건너뛰면 기본금리를 표시한다", async ({page}) => {
    await reachBankQuestion(page);
    await expect(page.getByRole("heading", {name: bankTitle, exact: true})).toBeVisible();

    await page.getByRole("button", {name: "건너뛰기", exact: true}).click();

    await page.getByRole("button", {name: "결과 보기", exact: true}).click();
    await expect(page.getByText("연 3%", {exact: true})).toBeVisible();
});

test("새로고침해도 누적 답변으로 이어서 질문한다", async ({page}) => {
    await reachBankQuestion(page);
    await expect(page.getByRole("heading", {name: bankTitle, exact: true})).toBeVisible();

    await page.reload();

    await expect(page.getByRole("heading", {name: bankTitle, exact: true})).toBeVisible();
});

test("요청 실패 후 재시도하면 같은 답변으로 다시 진행한다", async ({page}) => {
    const detail: string = "AI가 상품 조건을 해석하지 못했어요. 조건 분석 후 다시 시도해 주세요.";
    await reachAgeQuestion(page);
    await page.route(endpoint, async (route: Route): Promise<void> => {
        await route.fulfill({status: 503, contentType: "application/json", body: JSON.stringify({detail})});
    });
    await page.getByRole("textbox", {name: ageTitle, exact: true}).fill("19");
    await page.getByRole("button", {name: "다음", exact: true}).click();
    await expect(page.getByRole("alert")).toHaveText(detail);
    await expect(page.getByRole("button", {name: "다시 시도", exact: true})).toBeVisible();

    await page.unroute(endpoint);
    await page.getByRole("button", {name: "다시 시도", exact: true}).click();

    await expect(page.getByRole("heading", {name: bankTitle, exact: true})).toBeVisible();
});

test("상품 상세에 서버가 판정한 우대 결과를 표시한다", async ({page}) => {
    await reachResult(page);
    await page.getByRole("button", {name: /테스트 적금/u}).click();

    await page.getByRole("tab", {name: "우대 조건", exact: true}).click();
    await expect(page.getByRole("tabpanel", {name: "우대 조건", exact: true})).toContainText("0.7%p");

    // 판정 근거가 된 공시 원문은 공시 정보 탭에 남는다.
    await page.getByRole("tab", {name: "공시 정보", exact: true}).click();
    await expect(page.getByRole("tabpanel", {name: "공시 정보", exact: true})).toContainText("테스트 조건");
});

test("뒤로 간 뒤 도착한 이전 응답이 현재 질문을 덮지 않는다", async ({page}) => {
    await reachAgeQuestion(page);
    const gate: PromiseWithResolvers<void> = Promise.withResolvers<void>();
    await page.route(endpoint, async (route: Route): Promise<void> => {
        const response: APIResponse = await route.fetch();
        await gate.promise;
        await route.fulfill({response});
    }, {times: 1});
    await page.getByRole("textbox", {name: ageTitle, exact: true}).fill("19");
    await page.getByRole("button", {name: "다음", exact: true}).click();
    await expect(page.getByRole("status")).toBeVisible();

    await page.getByRole("button", {name: "뒤로", exact: true}).click();
    await expect(page.getByRole("heading", {name: ageTitle, exact: true})).toBeVisible();
    const oldResponse: Promise<Response> = page.waitForResponse((response: Response) =>
        response.url().endsWith("/questions/next")
        && response.request().postData() === '{"months":"12","monthly":"none","goal_amount":"none","age":"19"}');
    gate.resolve();
    await oldResponse;

    await expect(page.getByRole("heading", {name: ageTitle, exact: true})).toBeVisible();
    await expect(page.getByRole("textbox", {name: ageTitle, exact: true})).toHaveValue("19");
});

test("잘못된 서버 응답을 샘플 순위로 대체하지 않는다", async ({page}) => {
    await reachBankQuestion(page);
    await expect(page.getByRole("heading", {name: bankTitle, exact: true})).toBeVisible();
    await page.route(endpoint, async (route: Route): Promise<void> => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: '{"status":"done","question":null,"result":{"rows":[{}]}}',
        });
    });

    await page.getByRole("button", {name: "bank", exact: true}).click();
    await page.getByRole("button", {name: "다음", exact: true}).click();

    await expect(page.getByRole("alert")).toHaveText("AI 답변이 느려서 응답을 처리하지 못했어요. AI 응답 상태를 확인해 주세요.");
});

for (const body of ['{"detail":123}', 'not-json', '{"detail":"  "}']) {
    test(`503 오류 본문이 유효하지 않으면 기본 안내를 표시한다: ${body}`, async ({page}) => {
        await reachAgeQuestion(page);
        await page.route(endpoint, async (route: Route): Promise<void> => {
            await route.fulfill({status: 503, contentType: "application/json", body});
        });
        await page.getByRole("textbox", {name: ageTitle, exact: true}).fill("19");
        await page.getByRole("button", {name: "다음", exact: true}).click();

        await expect(page.getByRole("alert")).toHaveText("AI 응답 처리 중 조건 데이터를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");
    });
}
