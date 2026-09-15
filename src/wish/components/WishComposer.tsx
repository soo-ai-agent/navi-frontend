import type {FormEvent, KeyboardEvent} from "react";
import {WishMessages} from "../enums/wish";

type Props = {
    readonly draft: string;
    readonly disabled: boolean;
    readonly onChangeDraft: (value: string) => void;
    readonly onSubmit: () => void;
};

export default function WishComposer({draft, disabled, onChangeDraft, onSubmit}: Props) {
    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        onSubmit();
    };
    const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
        }
    };
    return (
        <form className="sticky wish-composer" onSubmit={submit}>
            <textarea className="wish-input" aria-label={WishMessages.TITLE} placeholder={WishMessages.PLACEHOLDER}
                value={draft} onChange={(event) => onChangeDraft(event.target.value)} onKeyDown={submitOnEnter} rows={1} />
            <button className="wish-send" type="submit" aria-label={WishMessages.SEND}
                disabled={disabled || draft.trim() === ""}>↑</button>
        </form>
    );
}
