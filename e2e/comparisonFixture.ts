import type {Page, Route} from "@playwright/test";
import {EligibilityStatus, EstimateStatus, GoalReachStatus} from "../src/product/enums/comparison";
import type {RankedProductResponseDTO} from "../src/question/types/recommendation";

const comparisonEndpoint: string = "**/api/v1/products/compare";

/** 추천 결과 카드는 비교 API 의 자격·금액을 그린다. 추천 행과 같은 금리로 응답해야 카드가 준비 상태가 된다. */
export async function serveComparison(page: Page, row: RankedProductResponseDTO): Promise<void> {
    const body = {
        products: [
            {
                product_id: row.product_id,
                options: [
                    {
                        saving_term_months: row.saving_term_months,
                        reserve_type: row.reserve_type,
                        interest_calc_type: row.interest_calc_type,
                        base_rate: row.base_rate,
                        max_rate: row.max_rate,
                        applied_rate: row.rate,
                        eligibility_status: EligibilityStatus.NEEDS_CONFIRMATION,
                        eligibility_reasons: ["가입 계좌가 이미 있는지 확인해 주세요."],
                        goal_reach: GoalReachStatus.NO_GOAL,
                        goal_shortfall: 0,
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
        ],
    };
    await page.route(comparisonEndpoint, (route: Route) => route.fulfill({json: body}));
}
