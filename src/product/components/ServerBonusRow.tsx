import type {BonusView} from "../../question/types/recommendation";

type Props = {readonly bonus: BonusView};

export default function ServerBonusRow({bonus}: Props) {
    return (
        <li className="row">
            <span className="l">
                <span className="n">{bonus.label}</span>
                <span className="s product-server-bonus-status">{bonus.status}</span>
            </span>
            <span className="r">{bonus.point}</span>
        </li>
    );
}
