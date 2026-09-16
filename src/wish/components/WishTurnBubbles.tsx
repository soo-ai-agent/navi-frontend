import {Link} from "react-router-dom";
import type {WishTurn} from "../types/wish";
import {NextStepStatus} from "../../question/enums/recommendation";
import {RoutePath} from "../../common/enums/routePath";
import {WishMessages} from "../enums/wish";

type Props = {readonly turn: WishTurn; readonly hidesQuestion: boolean};

// 순위 상품은 추천 세션에 저장되지 않으므로 전체 상품과 같은 주소(product_id 쿼리)로 상세에 들어간다.
function productDetailHref(productId: string): string {
    const detailPath: string = RoutePath.PRODUCT_DETAIL.replace(":name", encodeURIComponent(productId));
    return `${detailPath}?product_id=${encodeURIComponent(productId)}`;
}

// 대화 한 턴: 오른쪽 사용자 말풍선 + 왼쪽 답변 말풍선(답변·순위·미확인 요구·지난 질문).
// 질문 제목은 WishQuestionBubble 이 선택 버튼과 함께 그리는 동안에만 숨긴다.
export default function WishTurnBubbles({turn, hidesQuestion}: Props) {
    const {reply, ranked, unmapped, next} = turn.response;
    const pastQuestionTitle: string = !hidesQuestion && next.status === NextStepStatus.QUESTION ? next.question.title : "";
    const hasBotBubble: boolean = reply !== "" || ranked.length > 0 || unmapped.length > 0 || pastQuestionTitle !== "";
    return (
        <article className="wish-turn">
            <p className="wish-bubble wish-me">{turn.message}</p>
            {hasBotBubble && (
                <div className="wish-bubble wish-bot">
                    {reply !== "" && <p>{reply}</p>}
                    {ranked.map((product) => (
                        <Link className="card wish-product" key={`${product.rank}:${product.product_id}`}
                            to={productDetailHref(product.product_id)} draggable={false}>
                            <div className="row">
                                <div className="l">
                                    <div className="n">{product.rank}위 · {product.product_name}</div>
                                    <div className="s">{product.bank_name} · {product.saving_term_months}개월</div>
                                </div>
                                <div className="r">연 {product.rate}%</div>
                            </div>
                            <p className="s wish-reason">{product.reason}</p>
                        </Link>
                    ))}
                    {unmapped.length > 0 && (
                        <div className="wish-unmapped">
                            <p className="s">{WishMessages.UNMAPPED_TITLE}</p>
                            {unmapped.map((item) => <p className="s" key={item.name}>{item.text}</p>)}
                        </div>
                    )}
                    {pastQuestionTitle !== "" && <p>{pastQuestionTitle}</p>}
                </div>
            )}
        </article>
    );
}
