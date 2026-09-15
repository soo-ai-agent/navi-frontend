import type {JSX} from "react";
import BrandButterfly from "../../common/components/BrandButterfly";
import {StartMessages} from "../enums/start";
import type {StageState} from "../hooks/useStartStage";

type Props = {
    readonly stage: StageState;
};

export default function MatchStage({stage}: Props) {
    const {bankTracks, savingsNameTracks, pickBank, hopKey, productCount, setTrackSpeed} = stage;
    const tracks: readonly (readonly string[])[] = [...bankTracks, ...savingsNameTracks];

    const trackViews: JSX.Element[] = [];
    for (const trackLabels of tracks) {
        if (trackLabels.length === 0) {
            continue;
        }
        const doubledLabels: readonly string[] = [...trackLabels, ...trackLabels];

        const chips: JSX.Element[] = [];
        for (let index: number = 0; index < doubledLabels.length; index++) {
            chips.push(<span className="chip" key={`${doubledLabels[index]}-${index}`}>{doubledLabels[index]}</span>);
        }

        trackViews.push(<div className="track" key={trackLabels.join("|")} ref={setTrackSpeed}>{chips}</div>);
    }

    return (
        <div className="match" aria-hidden="true">
            <div className="stage">
                <div className="lanes">{trackViews}</div>

                <div className="pick">
                    <div className="bfly-wrap">
                        <BrandButterfly key={hopKey} className={hopKey > 0 ? "bfly hop" : "bfly"} />
                    </div>
                    <b key={pickBank}>{pickBank}</b>{StartMessages.PICK_QUESTION_TAIL}
                    <p className="cap">{StartMessages.STAGE_HELP_HEAD}{productCount}{StartMessages.STAGE_HELP_TAIL}</p>
                </div>
            </div>
        </div>
    );
}
