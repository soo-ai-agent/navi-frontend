import type {WishTurn} from "../types/wish";
import {WishMessages} from "../enums/wish";

type Props = {readonly turn: WishTurn};

// 대화 한 턴: 오른쪽 사용자 말풍선 + (있으면) 왼쪽 답변 말풍선, 마지막 턴에는 순위 카드가 붙는다.
export default function WishTurnBubbles({turn}: Props) {
    const hasBotBubble: boolean = turn.response.reply !== "" || turn.response.ranked.length > 0 || turn.response.unmapped.length > 0;
    return (
        <article className="wish-turn">
            <p className="wish-bubble wish-me">{turn.message}</p>
            {hasBotBubble && (
                <div className="wish-bubble wish-bot">
                    {turn.response.reply !== "" && <p>{turn.response.reply}</p>}
                    {turn.response.ranked.map((product) => (
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
                    {turn.response.unmapped.length > 0 && (
                        <div className="wish-unmapped">
                            <p className="s">{WishMessages.UNMAPPED_TITLE}</p>
                            {turn.response.unmapped.map((item) => <p className="s" key={item.name}>{item.text}</p>)}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}
