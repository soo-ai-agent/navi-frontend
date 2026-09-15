import {expect, test, type Page, type Route} from "@playwright/test";
import {ConditionStatus, InterestCalcType, JoinRestriction, ReserveType} from "../src/catalog/enums/catalog";
import {MonthlyLimitStatus} from "../src/question/enums/recommendation";
import type {CatalogProductResponseDTO} from "../src/catalog/types/catalog";

const endpoint: string = "**/api/v1/products";
const product: CatalogProductResponseDTO = {
    product_id: "bank:last",
    bank_code: "bank",
    bank_name: "테스트은행",
    product_name: "마지막 전체 적금",
    homepage_url: "https://bank.example/",
    call_center: "1588-0000",
    join_ways: "스마트폰,영업점",
    join_member: "만 19세 이상 개인",
    join_restriction: JoinRestriction.PARTIAL,
    monthly_limit_status: MonthlyLimitStatus.LIMITED,
    monthly_limit: 5000000,
    bonus_condition_text: "자동이체 실적에 따라 연 0.5%p 우대",
    after_maturity_rate_text: "만기 후 1개월 이내 기본금리의 50%",
    etc_note: "1인 1계좌만 가입 가능",
    disclosure_month: "202609",
    disclosure_start_date: "2026-09-01",
    condition_status: ConditionStatus.EXTRACTED,
    rate_options: [
        {
            saving_term_months: 6,
            reserve_type: ReserveType.FREE,
            interest_calc_type: InterestCalcType.COMPOUND,
            base_rate: "2.50",
            max_rate: "3.00",
        },
        {
            saving_term_months: 12,
            reserve_type: ReserveType.FIXED,
            interest_calc_type: InterestCalcType.SIMPLE,
            base_rate: "3.00",
            max_rate: "3.50",
        },
    ],
    other_conditions: [],
    other_eligibility_conditions: [
        {name: "가입 자격 확인", value: "만 19세 이상 개인", reason: "신분증을 확인해 주세요."},
    ],
    other_bonus_conditions: [
        {name: "자동이체 우대", value: "자동이체 실적에 따라 연 0.5%p 우대", reason: "은행의 실적 기준을 확인해 주세요."},
    ],
};
const catalog: readonly CatalogProductResponseDTO[] = [
    ...Array.from(
        {length: 10},
        (_entry: unknown, index: number): CatalogProductResponseDTO => ({
            ...product,
            product_id: `bank:${index}`,
            product_name: `전체 적금 ${index + 1}`,
        }),
    ),
    product,
];
async function showCatalog(page: Page): Promise<void> {
    await page.route(endpoint, async (route: Route): Promise<void> => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({products: catalog}),
        });
    });
    // 상세 화면은 상품 한 건만 받는다.
    await page.route("**/api/v1/products/*", async (route: Route): Promise<void> => {
        const requestedId: string = decodeURIComponent(new URL(route.request().url()).pathname.split("/").pop() ?? "");
        const found: CatalogProductResponseDTO | undefined = catalog.find(
            (entry: CatalogProductResponseDTO) => entry.product_id === requestedId,
        );
        if (found === undefined) {
            await route.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({detail: "상품을 찾을 수 없습니다."}),
            });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(found),
        });
    });
    await page.goto("/products");
}

test("전체 상품은 열 개 이후의 상품도 표시한다", async ({page}) => {
    await showCatalog(page);

    await expect(page.getByRole("tabpanel", {name: "전체", exact: true}).locator(".catalog-product-card")).toHaveCount(11);
    await expect(page.getByRole("link", {name: /마지막 전체 적금/u})).toContainText("공시 최고금리 연 3.50%");
});

test("전체 목록 마지막 상품 상세는 새로고침해도 같은 상품을 표시한다", async ({page}) => {
    await showCatalog(page);
    await page.getByRole("link", {name: /마지막 전체 적금/u}).click();
    await page.reload();

    await expect(page.getByRole("heading", {name: "마지막 전체 적금"})).toBeVisible();
    await expect(page.locator(".hero")).toContainText("공시 최고금리");
    await expect(page.getByRole("button", {name: "전체 상품으로"})).toBeVisible();
});

test("상세 금리 탭은 모든 기간의 적립 방식과 단복리 금리를 표시한다", async ({page}) => {
    await showCatalog(page);
    await page.getByRole("link", {name: /마지막 전체 적금/u}).click();
    await page.getByRole("tab", {name: "금리", exact: true}).click();

    const table = page.getByRole("table");
    await expect(table.getByRole("row")).toHaveCount(3);
    await expect(table.getByRole("row").nth(1)).toHaveText("6개월자유복리2.50%3.00%");
    await expect(table.getByRole("row").nth(2)).toHaveText("12개월정액단리3.00%3.50%");
});

test("가입 조건 탭에서 납입 한도를 확인한다", async ({page}) => {
    await showCatalog(page);
    await page.getByRole("link", {name: /마지막 전체 적금/u}).click();
    await page.getByRole("tab", {name: "가입 조건", exact: true}).click();

    await expect(page.getByRole("tabpanel", {name: "가입 조건"})).toContainText("월 납입 한도5,000,000원");
});

test("유의사항 탭에서 만기 후 금리를 확인한다", async ({page}) => {
    await showCatalog(page);
    await page.getByRole("link", {name: /마지막 전체 적금/u}).click();
    await page.getByRole("tab", {name: "유의사항", exact: true}).click();

    await expect(page.getByRole("tabpanel", {name: "유의사항"})).toContainText("만기 후 1개월 이내 기본금리의 50%");
});

test("공시 정보 탭에서 공시 시점을 확인한다", async ({page}) => {
    await showCatalog(page);
    await page.getByRole("link", {name: /마지막 전체 적금/u}).click();
    await page.getByRole("tab", {name: "공시 정보", exact: true}).click();

    await expect(page.getByRole("tabpanel", {name: "공시 정보"})).toContainText("2026-09-01");
});

test("가입 대상 탭에서 은행 연락처를 확인한다", async ({page}) => {
    await showCatalog(page);
    await page.getByRole("link", {name: /마지막 전체 적금/u}).click();

    await expect(page.getByRole("tabpanel", {name: "가입 대상"})).toContainText("1588-0000");
});

test("전체 상품 조회 실패 후 다시 시도하면 상품 목록을 표시한다", async ({page}) => {
    await page.route(endpoint, async (route: Route): Promise<void> => {
        await route.fulfill({status: 503, contentType: "application/json", body: "{}"});
    });
    await page.goto("/products");
    await expect(page.getByRole("alert")).toContainText("상품 정보를 불러오지 못했어요.");
    await page.unroute(endpoint);
    await page.route(endpoint, async (route: Route): Promise<void> => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({products: [product]}),
        });
    });
    await page.getByRole("button", {name: "다시 시도"}).click();

    await expect(page.getByRole("link", {name: /마지막 전체 적금/u})).toBeVisible();
});

test("필수 필드가 누락된 전체 상품 응답은 오류로 표시한다", async ({page}) => {
    await page.route(endpoint, async (route: Route): Promise<void> => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({products: [{product_id: "incomplete"}]}),
        });
    });
    await page.goto("/products");

    await expect(page.getByRole("alert")).toHaveText("응답을 읽지 못했어요. 다시 시도해 주세요.");
});
