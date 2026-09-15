import type {WishTurn} from "../types/wish";
import {NextStepStatus} from "../../question/enums/recommendation";
import {WishMessages} from "../enums/wish";

type Props = {readonly turn: WishTurn; readonly isLast: boolean};

// 대화 한 턴: 오른쪽 사용자 말풍선 + 왼쪽 답변 말풍선(답변·순위·미확인 요구·지난 질문).
// 마지막 턴의 질문은 선택 버튼과 함께 WishQuestionBubble 이 따로 그리므로 여기서는 지난 턴의 질문 제목만 남긴다.
export default function WishTurnBubbles({turn, isLast}: Props) {
    const {reply, ranked, unmapped, next} = turn.response;
    const pastQuestionTitle: string = !isLast && next.status === NextStepStatus.QUESTION ? next.question.title : "";
    const hasBotBubble: boolean = reply !== "" || ranked.length > 0 || unmapped.length > 0 || pastQuestionTitle !== "";
    return (
        <article className="wish-turn">
            <p className="wish-bubble wish-me">{turn.message}</p>
            {hasBotBubble && (
                <div className="wish-bubble wish-bot">
                    {reply !== "" && <p>{reply}</p>}
                    {ranked.map((product) => (
                        <div className="card wish-product" key={`${product.rank}:${product.product_id}`}>
                            <div className="row">
                                <div className="l">
                                    <div className="n">{product.rank}위 · {product.product_name}</div>
                                    <div className="s">{product.bank_name} · {product.saving_term_months}개월</div>
                                </div>
                                <div className="r">연 {product.rate}%</div>
                            </div>
                            <p className="s wish-reason">{product.reason}</p>
                        </div>
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
