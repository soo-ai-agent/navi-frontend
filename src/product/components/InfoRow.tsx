type Props = {readonly label: string; readonly value: string};

export default function InfoRow({label, value}: Props) {
    return (
        <div className="kv">
            <dt className="k">{label}</dt>
            <dd className="v">{value}</dd>
        </div>
    );
}
