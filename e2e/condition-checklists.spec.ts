import {InterestCalcType, ReserveType} from "../src/catalog/enums/catalog";
import {expect, test, type Locator, type Page, type Route} from "@playwright/test";
import {BonusResult, MonthlyLimitStatus, NextStepStatus} from "../src/question/enums/recommendation";
import {serveComparison} from "./comparisonFixture";
import type {RankedProductResponseDTO} from "../src/question/types/recommendation";

const endpoint: string = "**/api/v1/questions/next";
const checklistProduct: RankedProductResponseDTO = {
    product_id: "checklist-product",
    rank: 1,
    bank_name: "테스트 은행",
    product_name: "체크리스트 적금",
    rate: "3.00",
    base_rate: "3.00",
    max_rate: "4.00",
    reserve_type: ReserveType.FIXED,
    interest_calc_type: InterestCalcType.SIMPLE,
    saving_term_months: 12,
    monthly_limit_status: MonthlyLimitStatus.LIMITED,
    monthly_limit: 500000,
    bonus_condition_text: "당행 계좌에서 자동이체한 입금 건별 0.10%p 우대",
    bonus_results: [],
    other_conditions: [
        {name: "기타 유의사항", value: "중도해지 시 약정금리 미적용", reason: "해지 시점별 금리를 확인해야 합니다."},
    ],
    other_eligibility_conditions: [
        {name: "가입 계좌 제한", value: "1인 1계좌", reason: "기존 가입 계좌가 있는지 확인해야 합니다."},
    ],
    other_bonus_conditions: [
        {name: "입금 건별 우대", value: "당행 계좌에서 자동이체한 입금 건별 0.10%p 우대", reason: "우대 대상 입금 건을 확인해야 합니다."},
    ],
};

async function showProduct(page: Page, product: RankedProductResponseDTO): Promise<void> {
    await serveComparison(page, product);
    await page.route(endpoint, async (route: Route): Promise<void> => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({status: NextStepStatus.DONE, question: null, result: {rows: [product]}}),
        });
    });
    await page.goto("/questions");
    // 질문이 끝나면 내가 답한 조건을 먼저 확인하고 결과로 넘어간다.
    await page.getByRole("button", {name: "결과 보기", exact: true}).click();
}

test("추천 카드에 가입조건 확인 필요를 표시한다", async ({page}) => {
    await showProduct(page, checklistProduct);

    const card: Locator = page.getByRole("button", {name: /체크리스트 적금/u});
    await expect(card.locator(".comparison-eligibility")).toBeVisible();
    await expect(card).toContainText("연 3.00%");
});

test("상세에서 미확인 자격과 우대를 원문 및 사유로 표시한다", async ({page}) => {
    await showProduct(page, checklistProduct);
    await page.getByRole("button", {name: /체크리스트 적금/u}).click();

    await page.getByRole("tab", {name: "가입 자격", exact: true}).click();
    const eligibility: Locator = page.getByRole("region", {name: "가입 자격·납입 조건 체크리스트"});
    await expect(eligibility).toContainText("1인 1계좌");
    await expect(eligibility).toContainText("기존 가입 계좌가 있는지 확인해야 합니다.");

    await page.getByRole("tab", {name: "우대 조건", exact: true}).click();
    const bonuses: Locator = page.getByRole("region", {name: "우대조건 체크리스트"});
    await expect(bonuses).toContainText(checklistProduct.bonus_condition_text);
    await expect(bonuses).toContainText("우대 대상 입금 건을 확인해야 합니다.");

    await page.getByRole("tab", {name: "확인할 조건", exact: true}).click();
    await expect(page.getByRole("region", {name: "기타 공시 조건 체크리스트"})).toContainText("중도해지 시 약정금리 미적용");
    await expect(page.getByRole("checkbox")).toHaveCount(0);
});

test("확정 우대와 체크리스트가 함께 있어도 서버 금리를 유지한다", async ({page}) => {
    const product: RankedProductResponseDTO = {
        ...checklistProduct,
        rate: "3.20",
        bonus_results: [{label: "마케팅 동의", result: BonusResult.ELIGIBLE, percentage_point: "0.20"}],
    };
    await showProduct(page, product);
    await page.getByRole("button", {name: /체크리스트 적금/u}).click();

    await expect(page.getByText("연 3.20%", {exact: true})).toBeVisible();
    await page.getByRole("tab", {name: "우대 조건", exact: true}).click();
    await expect(page.getByText("마케팅 동의", {exact: true})).toBeVisible();
    await expect(page.getByText("충족", {exact: true})).toBeVisible();
    // 확정 우대와 체크리스트는 같은 '우대 조건' 탭에서 함께 보여준다.
    await expect(page.getByRole("region", {name: "우대조건 체크리스트"})).toBeVisible();
});

test("체크리스트 사유가 잘못된 응답은 오류로 표시한다", async ({page}) => {
    await page.route(endpoint, async (route: Route): Promise<void> => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                status: NextStepStatus.DONE,
                question: null,
                result: {
                    rows: [
                        {
                            ...checklistProduct,
                            other_bonus_conditions: [{name: "우대", value: "공시 조건", reason: 123}],
                        },
                    ],
                },
            }),
        });
    });
    await page.goto("/questions");

    await expect(page.getByRole("alert")).toHaveText("응답을 읽지 못했어요. 다시 시도해 주세요.");
});
