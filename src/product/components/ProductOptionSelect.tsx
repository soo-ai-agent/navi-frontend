import type {ChangeEvent} from "react";
import {ComparisonMessages} from "../enums/comparison";
import type {ComparisonOptionChoice} from "../types/comparison";

type Props = {
    readonly calculation: {
        readonly options: readonly ComparisonOptionChoice[];
        readonly optionValue: string;
        readonly selectOption: (event: ChangeEvent<HTMLSelectElement>) => void;
    };
};

export default function ProductOptionSelect({calculation: {options, optionValue, selectOption}}: Props) {
    if (options.length < 2) {
        return null;
    }
    return (
        <label className="product-option-select">
            {ComparisonMessages.OPTION}
            <select value={optionValue} onChange={selectOption}>
                {options.map((option: ComparisonOptionChoice) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
            <span className="cap">{ComparisonMessages.OPTION_RULE}</span>
        </label>
    );
}
