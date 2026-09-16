import "../wish.css";
import BrandHome from "../../common/components/BrandHome";
import {RequestStatus} from "../../question/enums/recommendation";
import {WishMessages, WishStepStatus} from "../enums/wish";
import WishComposer from "../components/WishComposer";
import WishQuestionBubble from "../components/WishQuestionBubble";
import WishTurnBubbles from "../components/WishTurnBubbles";
import {useWishChat} from "../hooks/useWishChat";
import {useWishScroll} from "../hooks/useWishScroll";

export default function WishChat() {
    const {chat, composer} = useWishChat();
    const chatRef = useWishScroll();
    const isLoading: boolean = chat.state.status === RequestStatus.LOADING;
    const isDone: boolean = chat.step.status === WishStepStatus.DONE;
    const hasShownQuestion: boolean = chat.shownQuestion !== null;
    return (
        <section id="wish">
            <header className="top"><BrandHome /></header>
            <h1>{WishMessages.TITLE}</h1>
            <p className="sub">{WishMessages.HELP}</p>
            <div className="wish-chat" ref={chatRef}>
                {chat.turns.map((turn, index) => (
                    <WishTurnBubbles key={turn.id} turn={turn}
                        hidesQuestion={index === chat.turns.length - 1 && hasShownQuestion} />
                ))}
                {chat.shownQuestion !== null && (
                    <WishQuestionBubble question={chat.shownQuestion}
                        onSelectOption={chat.answerWithOption} onContinueWithQuestions={chat.continueWithQuestions} />
                )}
                {isLoading && (
                    <>
                        <p className="wish-bubble wish-me">{chat.pendingMessage}</p>
                        <p role="status" className="wish-bubble wish-bot">
                            {chat.loadingMessage}
                            <span className="wish-eta">{WishMessages.LOADING_ESTIMATE}</span>
                        </p>
                    </>
                )}
                {chat.state.status === RequestStatus.ERROR && (
                    <>
                        <p className="wish-bubble wish-me">{chat.pendingMessage}</p>
                        <p role="alert" className="wish-bubble wish-bot wish-error">{chat.state.message}</p>
                    </>
                )}
            </div>
            <WishComposer draft={composer.draft} disabled={isLoading || isDone}
                onChangeDraft={composer.setDraft} onSubmit={composer.submit} />
        </section>
    );
}
