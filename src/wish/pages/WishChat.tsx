import "../wish.css";
import BrandHome from "../../common/components/BrandHome";
import {RequestStatus} from "../../question/enums/recommendation";
import {WishMessages} from "../enums/wish";
import WishComposer from "../components/WishComposer";
import WishQuestionBubble from "../components/WishQuestionBubble";
import WishTurnBubbles from "../components/WishTurnBubbles";
import {useWishChat} from "../hooks/useWishChat";

export default function WishChat() {
    const {chat, composer} = useWishChat();
    return (
        <section id="wish">
            <header className="top"><BrandHome /></header>
            <h1>{WishMessages.TITLE}</h1>
            <p className="sub">{WishMessages.HELP}</p>
            <div className="wish-chat">
                {chat.turns.map((turn) => (
                    <WishTurnBubbles key={turn.id} turn={turn} />
                ))}
                {chat.currentQuestion !== null && (
                    <WishQuestionBubble question={chat.currentQuestion}
                        onSelectOption={chat.answerWithOption} onContinueWithQuestions={chat.continueWithQuestions} />
                )}
                {chat.state.status === RequestStatus.LOADING && (
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
            <WishComposer draft={composer.draft} disabled={chat.state.status === RequestStatus.LOADING || chat.isDone}
                onChangeDraft={composer.setDraft} onSubmit={composer.submit} />
        </section>
    );
}
