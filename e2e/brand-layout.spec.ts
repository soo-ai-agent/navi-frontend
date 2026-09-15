import {InterestCalcType, ReserveType} from "../src/catalog/enums/catalog";
import {expect, test, type Locator, type Page, type Route} from "@playwright/test";
import {MonthlyLimitStatus, NextStepStatus} from "../src/question/enums/recommendation";
import {serveComparison} from "./comparisonFixture";
import type {RankedProductResponseDTO} from "../src/question/types/recommendation";
import {SESSION_KEY} from "../src/question/services/recommendationService";

const endpoint: string = "**/api/v1/questions/next";
const checklistProduct: RankedProductResponseDTO = {
    product_id: "layout-product",
    rank: 1,
    bank_name: "테스트 은행",
    product_name: "월 납입 한도가 있는 적금",
    rate: "3.00",
    base_rate: "3.00",
    max_rate: "4.00",
    reserve_type: ReserveType.FIXED,
    interest_calc_type: InterestCalcType.SIMPLE,
    saving_term_months: 12,
    monthly_limit_status: MonthlyLimitStatus.LIMITED,
    monthly_limit: 5000000,
    bonus_condition_text: "자동이체 우대",
    bonus_results: [],
    other_conditions: [],
    other_eligibility_conditions: [
        {name: "가입 계좌 제한", value: "1인 1계좌", reason: "기존 계좌 확인이 필요합니다."},
    ],
    other_bonus_conditions: [],
};

async function reachAgeQuestion(page: Page): Promise<void> {
    await page.goto("/");
    await page.getByRole("button", {name: "내 조건으로 비교하기", exact: true}).click();
    await page.getByRole("button", {name: "12개월", exact: true}).click();
    // 기간 다음은 목표 금액이다. 목표가 없다고 답해 나이 질문으로 넘어간다.
    await page.getByRole("button", {name: "목표 금액은 없어요", exact: true}).click();
    await page.getByRole("heading", {name: "나이가 어떻게 되세요? (만)", exact: true}).waitFor({state: "visible"});
}

for (const width of [375, 768]) {
    test(`추천 카드의 가입 상태와 금액이 겹치지 않는다: ${width}px`, async ({page}) => {
        await page.setViewportSize({width, height: 812});
        await serveComparison(page, checklistProduct);
        await page.route(endpoint, async (route: Route): Promise<void> => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    status: NextStepStatus.DONE,
                    question: null,
                    result: {rows: [checklistProduct]},
                }),
            });
        });
        await page.goto("/questions");
        // 질문이 끝나면 내가 답한 조건을 먼저 확인하고 결과로 넘어간다.
        await page.getByRole("button", {name: "결과 보기", exact: true}).click();

        const card: Locator = page.getByRole("button", {name: /월 납입 한도가 있는 적금/u});
        // 가입 상태는 카드 머리에, 금액은 그 아래에 있어 서로 겹치지 않는다.
        await expect(card.locator(".comparison-eligibility")).toBeVisible();
        const spacing: number = await card.evaluate((element: HTMLElement): number => {
            const badge: Element | null = element.querySelector(".comparison-eligibility");
            const summary: Element | null = element.querySelector(".comparison-summary");
            if (badge === null || summary === null) {
                return -1;
            }
            return summary.getBoundingClientRect().top - badge.getBoundingClientRect().bottom;
        });
        expect(spacing).toBeGreaterThanOrEqual(0);
    });
}

function savedAnswerCount(page: Page): Promise<number> {
    return page.evaluate((key: string) => {
        const saved: string = sessionStorage.getItem(key) ?? "";
        return saved === "" ? 0 : (JSON.parse(saved) as {entries: unknown[]}).entries.length;
    }, SESSION_KEY);
}

test("시작 화면에서 전체 상품 보기를 비교 버튼 바로 아래에 둔다", async ({page}) => {
    await page.goto("/");

    await expect(page.locator(".sticky > button").nth(0)).toHaveText("내 조건으로 비교하기");
    await expect(page.locator(".sticky > button").nth(1)).toHaveText("전체 상품 보기");
});

test("질문 화면의 공통 로고가 답변을 지우고 시작 화면으로 이동한다", async ({page}) => {
    await reachAgeQuestion(page);

    await page.getByRole("button", {name: "나비 홈으로", exact: true}).click();

    await expect(page).toHaveURL(/\/$/u);
    await expect(page.getByRole("button", {name: "내 조건으로 비교하기", exact: true})).toBeVisible();
    expect(await savedAnswerCount(page)).toBe(0);
});

test("시작 화면에서도 공통 로고를 누르면 저장된 답변을 지운다", async ({page}) => {
    await reachAgeQuestion(page);
    await page.goto("/");
    expect(await savedAnswerCount(page)).toBeGreaterThan(0);

    await page.getByRole("button", {name: "나비 홈으로", exact: true}).click();

    await expect(page).toHaveURL(/\/$/u);
    expect(await savedAnswerCount(page)).toBe(0);
});
