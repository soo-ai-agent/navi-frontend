type Props = {
    readonly className: string;
};

export default function BrandButterfly({className}: Props) {
    return (
        <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
            <g className="brand-wing-left">
                <path d="M31 33 C 18 12, 4 14, 6 26 C 7 34, 18 36, 31 33 Z" fill="#FFD400" stroke="#E0A800" strokeWidth="1.5" />
                <path d="M31 34 C 18 46, 8 50, 10 40 C 12 34, 22 33, 31 34 Z" fill="#FFE066" stroke="#E0A800" strokeWidth="1.5" />
            </g>
            <g className="brand-wing-right">
                <path d="M33 33 C 46 12, 60 14, 58 26 C 57 34, 46 36, 33 33 Z" fill="#FFD400" stroke="#E0A800" strokeWidth="1.5" />
                <path d="M33 34 C 46 46, 56 50, 54 40 C 52 34, 42 33, 33 34 Z" fill="#FFE066" stroke="#E0A800" strokeWidth="1.5" />
            </g>
            <ellipse cx="32" cy="34" rx="2.6" ry="10" fill="#5A3E00" />
            <path
                d="M31 24 C 28 18, 24 16, 22 15 M33 24 C 36 18, 40 16, 42 15"
                stroke="#5A3E00"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
            />
        </svg>
    );
}
