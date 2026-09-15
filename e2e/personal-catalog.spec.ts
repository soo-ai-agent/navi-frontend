import {expect, test, type Locator, type Page, type Route} from "@playwright/test";
import {ConditionStatus, InterestCalcType, JoinRestriction, ReserveType} from "../src/catalog/enums/catalog";
import {EligibilityStatus, EstimateStatus, GoalReachStatus} from "../src/product/enums/comparison";
import {MonthlyLimitStatus} from "../src/question/enums/recommendation";
import type {CatalogProductResponseDTO} from "../src/catalog/types/catalog";
import type {ProductComparisonOptionResponseDTO, ProductComparisonResponseDTO} from "../src/product/types/comparison";

const catalogEndpoint: string = "**/api/v1/products";
const comparisonEndpoint: string = "**/api/v1/products/compare";
const product: CatalogProductResponseDTO = {
    product_id: "bank:one",
    bank_code: "bank",
    bank_name: "첫째은행",
    product_name: "개인 비교 적금",
    homepage_url: "https://bank.example/",
    call_center: "1588-0000",
    join_ways: "스마트폰",
    join_member: "만 19세 이상 개인",
    join_restriction: JoinRestriction.PARTIAL,
    monthly_limit_status: MonthlyLimitStatus.LIMITED,
    monthly_limit: 500000,
    bonus_condition_text: "급여 이체 시 연 1.00%p 우대",
    after_maturity_rate_text: "만기 후 기본금리의 50%",
    etc_note: "중도해지 시 약정금리 미적용",
    disclosure_month: "202609",
    disclosure_start_date: "2026-09-01",
    condition_status: ConditionStatus.EXTRACTED,
    rate_options: [
        {
            saving_term_months: 12,
            reserve_type: ReserveType.FIXED,
            interest_calc_type: InterestCalcType.SIMPLE,
            base_rate: "2.00",
            max_rate: "4.00",
        },
    ],
    other_conditions: [],
    other_eligibility_conditions: [
        {name: "가입 계좌 확인", value: "1인 1계좌", reason: "기존 가입 계좌를 확인해야 해요."},
    ],
    other_bonus_conditions: [
        {name: "급여 실적 확인", value: "월 50만원 이상 급여 이체", reason: "급여 이체 실적을 확인해야 해요."},
    ],
};
const option: ProductComparisonOptionResponseDTO = {
    ...product.rate_options[0],
    applied_rate: "3.00",
    eligibility_status: EligibilityStatus.ELIGIBLE,
    eligibility_reasons: [],
    goal_reach: GoalReachStatus.NO_GOAL,
    goal_shortfall: 0,
    estimate: {
        status: EstimateStatus.ESTIMATED,
        monthly_deposit: 100000,
        principal: 1200000,
        interest_before_tax: 19500,
        maturity_before_tax: 1219500,
        maturity_at_max_rate: 1226000,
        reason: "매월 초 같은 금액을 납입하는 세전 예상금액입니다.",
    },
};
// 세션에 저장된 누적 답변. 금액 비교 입력이 이 답변을 덮어쓰지 않아야 한다.
const storedEntries = [
    {
        key: "age",
        value: "25",
        questionTitle: "나이가 어떻게 되세요? (만)",
        answerLabel: "25세",
    },
    {
        key: "monthly",
        value: "200000",
        questionTitle: "매달 얼마씩 넣을까요? (원)",
        answerLabel: "20만원",
    },
];
async function serveCatalog(page: Page, catalog: readonly CatalogProductResponseDTO[] = [product]): Promise<void> {
    await page.route(catalogEndpoint, (route: Route) => route.fulfill({json: {products: catalog}}));
    // 상세 화면은 상품 한 건만 받는다. compare 는 별도 라우트가 뒤에 등록되어 먼저 처리된다.
    await page.route("**/api/v1/products/*", (route: Route) => {
        const requestedId: string = decodeURIComponent(new URL(route.request().url()).pathname.split("/").pop() ?? "");
        if (requestedId === "compare") {
            return route.fallback();
        }
        const found = catalog.find((entry: CatalogProductResponseDTO) => entry.product_id === requestedId);
        if (found === undefined) {
            return route.fulfill({status: 404, json: {detail: "상품을 찾을 수 없습니다."}});
        }
        return route.fulfill({json: found});
    });
}
async function serveComparisons(
    page: Page,
    compared: readonly ProductComparisonResponseDTO[] = [{product_id: product.product_id, options: [option]}],
): Promise<void> {
    await page.route(comparisonEndpoint, (route: Route) => route.fulfill({json: {products: compared}}));
}
function activeCard(page: Page): Locator {
    return page.getByRole("tabpanel", {name: "전체", exact: true}).getByRole("link", {name: /개인 비교 적금/u});
}

test("은행 카테고리를 마우스로 좌우 드래그하면 해당 은행 상품을 표시한다", async ({page}) => {
    await page.setViewportSize({width: 375, height: 900});
    await serveCatalog(page, [
        product,
        {
            ...product,
            product_id: "second:one",
            bank_code: "second",
            bank_name: "둘째은행",
            product_name: "둘째 적금",
        },
    ]);
    await serveComparisons(page);
    await page.goto("/products?monthly=100000&months=12");
    const pager: Locator = page.locator(".catalog-pager");
    await expect(activeCard(page)).toBeVisible();
    const bounds = await pager.boundingBox();
    if (bounds === null) {
        throw new Error("카테고리 페이저를 찾을 수 없습니다.");
    }
    await page.mouse.move(bounds.x + bounds.width * .9, bounds.y + 50);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * .1, bounds.y + 50, {steps: 12});
    await page.mouse.up();

    await expect(page.getByRole("tab", {name: "첫째은행", exact: true})).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel", {name: "첫째은행"}).getByRole("link")).toHaveCount(1);
});

for (const scenario of [
    {status: EligibilityStatus.ELIGIBLE, label: "가입 가능"},
    {status: EligibilityStatus.NEEDS_CONFIRMATION, label: "조건 확인 필요"},
    {status: EligibilityStatus.NOT_ELIGIBLE, label: "가입 불가"},
]) {
    test(`전체 상품 카드에서 ${scenario.label} 상태를 구분한다`, async ({page}) => {
        await serveCatalog(page);
        await serveComparisons(page, [
            {
                product_id: product.product_id,
                options: [
                    {
                        ...option,
                        eligibility_status: scenario.status,
                        estimate: {...option.estimate, status: EstimateStatus.INELIGIBLE, reason: "가입 조건을 확인해 주세요."},
                    },
                ],
            },
        ]);
        await page.goto("/products");

        await expect(activeCard(page).locator(".comparison-eligibility")).toHaveText(scenario.label);
    });
}

test("가로 금리 막대는 공시 최고금리 중 내 확인 금리를 표시한다", async ({page}) => {
    await serveCatalog(page);
    await serveComparisons(page);
    await page.goto("/products?monthly=100000&months=12");

    const meter: Locator = activeCard(page).getByRole("meter", {name: "내 확인 금리"});
    await expect(meter).toHaveAttribute("aria-valuenow", "3");
    await expect(meter).toHaveAttribute("aria-valuemax", "4");
    await expect(activeCard(page).locator(".comparison-maturity-item.is-mine")).toContainText("1,219,500원");
    await expect(activeCard(page).locator(".comparison-maturity")).toContainText("1,226,000원");
});

test("납입액을 입력하지 않으면 금리와 가입 상태를 유지하고 만기 0원을 표시하지 않는다", async ({page}) => {
    await serveCatalog(page);
    await serveComparisons(page, [
        {
            product_id: product.product_id,
            options: [
                {
                    ...option,
                    estimate: {
                        status: EstimateStatus.AMOUNT_REQUIRED,
                        monthly_deposit: 0,
                        principal: 0,
                        interest_before_tax: 0,
                        maturity_before_tax: 0,
                        maturity_at_max_rate: 0,
                        reason: "월 납입액을 입력해 주세요.",
                    },
                },
            ],
        },
    ]);
    await page.goto("/products");

    // 목록 카드는 사유를 적지 않는다 — 금리와 가입 상태만 남고 만기금액은 비어 있다.
    await expect(activeCard(page)).not.toContainText("월 납입액을 입력해 주세요.");
    await expect(activeCard(page).getByRole("meter")).toBeVisible();
    await expect(activeCard(page).locator(".comparison-maturity")).toHaveCount(0);
});

test("납입액 입력 후 표시된 만기금액과 상세 URL에 같은 입력을 사용한다", async ({page}) => {
    await serveCatalog(page);
    await serveComparisons(page);
    await page.goto("/products");
    await page.getByRole("textbox", {name: "월 납입액 (원)"}).fill("100000");
    await page.getByRole("button", {name: "예상금액 확인"}).click();
    await activeCard(page).click();
    await page.reload();

    await expect(page).toHaveURL(/monthly=100000&months=12/u);
    await expect(page.getByText("월 납입액 100,000원", {exact: true})).toBeVisible();
    await expect(page.locator(".hero")).toContainText("1,219,500원");
    await expect(page.getByRole("tab", {name: "가입 대상", exact: true})).toBeVisible();
});

for (const scenario of [
    {status: EstimateStatus.INVALID_AMOUNT, amount: "abc", reason: "월 납입액은 숫자로 입력해 주세요."},
    {status: EstimateStatus.MONTHLY_LIMIT_EXCEEDED, amount: "600000", reason: "공시 납입 한도를 초과했어요."},
    {status: EstimateStatus.CHECK_REQUIRED, amount: "100000", reason: "매주 납입하는 상품이므로 납입 일정을 확인해 주세요."},
]) {
    test(`예상금액을 계산할 수 없는 ${scenario.status} 이유는 상세에서만 보여준다`, async ({page}) => {
        await serveCatalog(page);
        await serveComparisons(page, [
            {
                product_id: product.product_id,
                options: [
                    {
                        ...option,
                        estimate: {...option.estimate, status: scenario.status, reason: scenario.reason},
                    },
                ],
            },
        ]);
        await page.goto(`/products?monthly=${scenario.amount}&months=12`);

        await expect(activeCard(page)).not.toContainText(scenario.reason);
        await expect(activeCard(page).locator(".comparison-maturity")).toHaveCount(0);

        await activeCard(page).click();
        await expect(page.locator(".hero")).toContainText(scenario.reason);
    });
}

test("비교 요청 실패 후에도 상품을 유지하고 재시도로 비교 정보를 표시한다", async ({page}) => {
    await serveCatalog(page);
    await page.route(comparisonEndpoint, (route: Route) => route.fulfill({status: 503, json: {detail: "unavailable"}}));
    await page.goto("/products");
    await expect(activeCard(page)).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("개인별 비교 정보를 불러오지 못했어요.");
    await page.unroute(comparisonEndpoint);
    await serveComparisons(page);
    await page.getByRole("button", {name: "비교정보 다시 확인"}).click();

    await expect(activeCard(page).getByRole("meter")).toBeVisible();
});

test("선택한 기간이 없는 상품도 목록에서 제외하지 않는다", async ({page}) => {
    await serveCatalog(page);
    await serveComparisons(page);
    await page.goto("/products?months=24");

    await expect(activeCard(page)).toContainText("선택한 기간의 금리 옵션이 없어요.");
});

test("가입 대상과 유의사항과 우대 조건을 각 상세 탭에 분리한다", async ({page}) => {
    await serveCatalog(page);
    await serveComparisons(page);
    await page.goto("/product/bank%3Aone?product_id=bank%3Aone&monthly=100000&months=12");

    await expect(page.getByRole("tabpanel", {name: "가입 대상"})).toContainText("만 19세 이상 개인");
    await expect(page.getByRole("tabpanel", {name: "가입 대상"})).not.toContainText("월 50만원 이상 급여 이체");

    await page.getByRole("tab", {name: "유의사항", exact: true}).click();
    await expect(page.getByRole("tabpanel", {name: "유의사항"})).toContainText("중도해지 시 약정금리 미적용");

    await page.getByRole("tab", {name: "우대 조건", exact: true}).click();
    await expect(page.getByRole("tabpanel", {name: "우대 조건"})).toContainText("월 50만원 이상 급여 이체");

    await page.getByRole("tab", {name: "공시 정보", exact: true}).click();
    await expect(page.getByRole("tabpanel", {name: "공시 정보"})).toContainText("급여 이체 시 연 1.00%p 우대");
});

test("금액 비교용 입력은 원래 누적 답변을 덮어쓰지 않는다", async ({page}) => {
    const stored: string = JSON.stringify({entries: storedEntries, response: null});
    await page.addInitScript((value: string): void => sessionStorage.setItem("navi.server-recommendation.v1", value), stored);
    await serveCatalog(page);
    await serveComparisons(page);
    await page.goto("/products");
    await page.getByRole("textbox", {name: "월 납입액 (원)"}).fill("100000");
    const request = page.waitForRequest((entry) =>
        entry.url().endsWith("/api/v1/products/compare")
        && entry.postDataJSON().monthly === "100000");
    await page.getByRole("button", {name: "예상금액 확인"}).click();
    const sent = await request;

    expect(sent.postDataJSON()).toEqual({age: "25", monthly: "100000", months: "12"});
    expect(await page.evaluate(() => sessionStorage.getItem("navi.server-recommendation.v1"))).toBe(stored);
});

test("공시 최고금리가 0인 상품의 막대에 NaN을 표시하지 않는다", async ({page}) => {
    await serveCatalog(page);
    await serveComparisons(page, [
        {
            product_id: product.product_id,
            options: [
                {
                    ...option,
                    applied_rate: "0.00",
                    base_rate: "0.00",
                    max_rate: "0.00",
                },
            ],
        },
    ]);
    await page.goto("/products");

    const meter: Locator = activeCard(page).getByRole("meter");
    await expect(meter).toHaveAttribute("aria-valuenow", "0");
    await expect(meter).toHaveAttribute("aria-valuemax", "0");
    await expect(meter.locator(".comparison-meter-fill")).toHaveAttribute("style", "width: 0%;");
});

test("상세에서 기간을 고르면 그 기간의 비교 결과를 보여준다", async ({page}) => {
    const sixMonths: ProductComparisonOptionResponseDTO = {...option, saving_term_months: 6, applied_rate: "2.50"};
    await serveCatalog(page, [{...product, rate_options: [...product.rate_options, sixMonths]}]);
    await serveComparisons(page, [{product_id: product.product_id, options: [option, sixMonths]}]);
    await page.goto("/product/bank%3Aone?product_id=bank%3Aone&months=12");
    const period: Locator = page.getByRole("combobox", {name: "가입 기간"});
    await period.selectOption("6");
    await page.getByRole("tab", {name: "가입 대상", exact: true}).click();

    await expect(page.locator(".product-eligibility-notice .comparison-option")).toHaveText("6개월 · 정액 · 단리");
    await expect(page).toHaveURL(/months=6/u);
});

test("늦게 도착한 이전 비교 응답이 새 납입액의 결과를 덮어쓰지 않는다", async ({page}) => {
    await serveCatalog(page);
    // 이전 HTTP 요청은 새 응답을 표시할 때까지 의도적으로 보류한다.
    let previous: Route | undefined;
    await page.route(comparisonEndpoint, async (route: Route): Promise<void> => {
        if (route.request().postDataJSON().monthly === "100000") {
            previous = route;
            return;
        }
        await route.fulfill({
            json: {
                products: [
                    {product_id: product.product_id, options: [{...option, applied_rate: "3.20"}]},
                ],
            },
        });
    });
    await page.goto("/products?monthly=100000&months=12");
    await expect.poll(() => previous !== undefined).toBe(true);
    await page.getByRole("textbox", {name: "월 납입액 (원)"}).fill("200000");
    await page.getByRole("button", {name: "예상금액 확인"}).click();
    await expect(activeCard(page).getByRole("meter")).toHaveAttribute("aria-valuenow", "3.2");
    if (previous === undefined) {
        throw new Error("이전 비교 요청이 도착하지 않았습니다.");
    }
    await previous.fulfill({json: {products: [{product_id: product.product_id, options: [option]}]}});

    await expect(activeCard(page).getByRole("meter")).toHaveAttribute("aria-valuenow", "3.2");
});

test("월 납입액 칩을 다시 누르면 누른 금액으로 만기금액을 요청한다", async ({page}) => {
    await serveCatalog(page);
    await serveComparisons(page);
    await page.goto("/products");
    await page.getByRole("button", {name: "30만원", exact: true}).click();
    await page.getByRole("button", {name: "50만원", exact: true}).click();

    const submitted = page.waitForRequest((request) =>
        request.url().endsWith("/api/v1/products/compare")
        && request.postDataJSON().monthly === "500000");
    await page.getByRole("button", {name: "예상금액 확인", exact: true}).click();

    expect((await submitted).postDataJSON()).toEqual({monthly: "500000", months: "12"});
    await expect(page.getByRole("textbox", {name: "월 납입액 (원)"})).toHaveValue("500,000");
});

test("월 납입액 입력의 앞뒤 공백을 정리한 값으로 비교한다", async ({page}) => {
    await serveCatalog(page);
    await serveComparisons(page);
    await page.goto("/products");
    await page.getByRole("textbox", {name: "월 납입액 (원)"}).fill(" 300000 ");

    const submitted = page.waitForRequest((request) =>
        request.url().endsWith("/api/v1/products/compare")
        && request.postDataJSON().monthly === "300000");
    await page.getByRole("button", {name: "예상금액 확인", exact: true}).click();

    expect((await submitted).postDataJSON()).toEqual({monthly: "300000", months: "12"});
    await expect(page.getByRole("textbox", {name: "월 납입액 (원)"})).toHaveValue("300,000");
});

test("예전 비교 결과를 갱신할 때 누적 답변을 보존한다", async ({page}) => {
    const stored: string = JSON.stringify({
        entries: storedEntries,
        response: {
            status: "done",
            question: null,
            result: {
                rows: [
                    {
                        product_id: "legacy",
                        rank: 1,
                        bank_name: "은행",
                        product_name: "이전 적금",
                        rate: "3.00",
                        base_rate: "2.00",
                        saving_term_months: 12,
                        monthly_limit_status: "UNLIMITED",
                        monthly_limit: 0,
                        bonus_condition_text: "",
                        bonus_results: [],
                        other_conditions: [],
                        other_eligibility_conditions: [],
                        other_bonus_conditions: [],
                    },
                ],
            },
        },
    });
    await page.addInitScript((value: string): void => sessionStorage.setItem("navi.server-recommendation.v1", value), stored);
    await page.route("**/api/v1/questions/next", (route: Route) => route.fulfill({
        json: {
            status: "question",
            result: null,
            question: {
                key: "months",
                title: "기간을 선택해 주세요",
                answer_kind: "OPTIONS",
                options: [["12", "12개월"]],
            },
        },
    }));
    await page.goto("/result");
    const request = page.waitForRequest((entry) => entry.url().endsWith("/api/v1/questions/next"));
    await page.getByRole("button", {name: "비교정보 갱신"}).click();
    const sent = await request;

    expect(sent.postDataJSON()).toEqual({age: "25", monthly: "200000"});
});
