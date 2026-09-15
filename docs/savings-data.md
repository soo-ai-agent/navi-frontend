# 적금 데이터 — 공시 원본에서 응답까지

[순위 엔진](ranking-engine.md)이 판정에 쓰고 [질문 API](question-api.md) 응답에 실리는 적금 데이터가 어떻게 만들어지는지 정한다.
원본은 금융감독원 공시다.

## 정제를 서버에서 끝낸다

공시 원본은 그대로 쓸 수 없는 모양으로 온다. 정제를 프론트가 하면 화면마다 같은 변환이 반복되고,
경계에서 형 변환이 필요해진 순간 이미 계약이 어긋난 것이다(제4원칙 · 자료형 일치).

그래서 아래 정제를 **서버에서 끝내고** 내보낸다.

1. **두 배열을 조인해 중첩한다** — 공시는 상품과 금리 옵션이 복합키로 갈라져 온다.
   조인을 프론트가 하면 화면마다 `find` 가 반복되므로, 상품 하나에 `rate_options` 를 중첩해 내린다.
2. **문자열로 온 값의 타입을 확정한다**

   ```
   "save_trm": "12"            → saving_term_months: 12          (number)
   "join_deny": "1"            → join_restriction: "ANYONE"       (enum)
   "rsrv_type": "F"            → reserve_type: "FREE"             (enum)
   "intr_rate_type": "M"       → interest_calc_type: "COMPOUND"   (enum)
   ```

   단 **금리는 문자열로 유지한다.** `base_rate`·`max_rate` 는 공시가 준 정밀도를 그대로 보존해야 하고,
   숫자로 바꾸면 반올림 오차가 생긴다. 프론트는 이 값을 표시에만 쓰고 계산은 서버가 한다.
3. **약어를 푼다** — `intr_rate2`·`spcl_cnd`·`mtrt_int` 는 공시 API 의 이름이다. 우리 서버가 계약의 주인이므로
   나가는 이름은 풀어쓴다(`max_rate`·`bonus_condition_text`·`after_maturity_rate_text`).
   공시 약어는 서버 내부 수집 계층까지만 살려 둔다.
4. **"없음"을 상태로 표현한다** — 월 납입 한도처럼 "한도 없음"이 있는 값은 `null` 로 내리지 않는다.
   `monthly_limit_status` 가 정본이고 `monthly_limit` 은 `LIMITED` 일 때만 뜻을 갖는다(`UNLIMITED` 면 0).
   `null` 로 내리면 받는 화면마다 존재 검사가 번진다.
5. **구조화된 우대조건과 원문을 함께 내린다** — 사람 말로 온 우대조건을 구조로 바꾸는 것은 AI 의 일이며([AI 의 역할](ai-role.md)),
   그 옆에 `bonus_condition_text` 로 원문을 남긴다. 원문을 버리면 "왜 이렇게 판정했나"를 사용자에게도 검수자에게도 보여줄 수 없다.
6. **판정하지 못한 조건을 감추지 않는다** — AI 가 구조화하지 못한 조건은 `other_conditions`·`other_eligibility_conditions`·
   `other_bonus_conditions` 로 내리고 `condition_status` 로 상태를 밝힌다. 판정에 쓰이지 않았다는 사실이 화면에 드러나야 한다.

## 응답 예시

`GET /api/v1/products` 의 상품 하나다. 필드 이름은 서버가 준 그대로 프론트 `CatalogProductResponseDTO` 에 옮겨진다.

```json
{
    "product_id": "0010001:WR0001F",
    "bank_code": "0010001",
    "bank_name": "우리은행",
    "product_name": "우리SUPER주거래적금",
    "homepage_url": "https://spot.wooribank.com/",
    "call_center": "1588-5000",
    "join_ways": "영업점,인터넷,스마트폰,전화(텔레뱅킹)",
    "join_member": "만 19세 이상 개인",
    "join_restriction": "ANYONE",
    "monthly_limit_status": "LIMITED",
    "monthly_limit": 500000,
    "bonus_condition_text": "1.우리은행 입출식 계좌에서 각 항목별 실적 월 수가 ...",
    "after_maturity_rate_text": "만기 후 1년 이내 기본금리의 50%",
    "etc_note": "중도해지 시 약정금리 미적용",
    "disclosure_month": "202608",
    "disclosure_start_date": "2026-08-20",
    "condition_status": "EXTRACTED",
    "rate_options": [
        {"saving_term_months": 12, "reserve_type": "FREE", "interest_calc_type": "SIMPLE", "base_rate": "2.45", "max_rate": "3.85"},
        {"saving_term_months": 24, "reserve_type": "FREE", "interest_calc_type": "SIMPLE", "base_rate": "2.40", "max_rate": "3.80"}
    ],
    "other_conditions": [],
    "other_eligibility_conditions": [{"name": "가입 계좌 확인", "value": "1인 1계좌", "reason": "기존 가입 계좌를 확인해야 해요."}],
    "other_bonus_conditions": []
}
```

## 개인 조건을 반영한 비교

위 목록은 공시 그대로라 "누구에게나 같은" 값이다. 사용자의 납입액·기간을 반영한 값은 `POST /api/v1/products/compare` 가 따로 준다.

응답은 상품별 옵션마다 적용금리(`applied_rate`), 가입 가능 여부(`eligibility_status`), 만기 예상금액(`estimate`)을 담는다.
**계산은 전부 서버가 한다** — 프론트가 금리와 개월 수로 이자를 다시 계산하면 같은 공식이 두 곳에 생긴다(제3원칙 · 고칠 지점을 하나로).

만기금액을 낼 수 없는 경우(납입액 미입력, 한도 초과, 주간 납입 상품 등)도 `estimate.status` 와 `reason` 으로 내린다.
금액 자리에 0을 넣어 "계산했는데 0원"처럼 보이게 하지 않는다.

## 데이터는 언제 갱신되나

공시 갱신 때마다 배치로 수집·번역·검수를 거쳐 확정한다 — 사용자 요청 경로 밖이다.
그 파이프라인과 AI 의 몫은 [AI 의 역할](ai-role.md)에 있다.

공시 수집은 `backend/scripts/sync_disclosure.py`, 우대조건 구조화는 `backend/scripts/structure_bonuses.py` 가 맡는다.
