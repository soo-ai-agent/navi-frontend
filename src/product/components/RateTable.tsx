import {CatalogMessages} from "../../catalog/enums/catalog";
import type {CatalogRateView} from "../../catalog/types/catalog";

type Props = {readonly rows: readonly CatalogRateView[]};

export default function RateTable({rows}: Props) {
    if (rows.length === 0) {
        return <p className="notice">{CatalogMessages.NO_RATE}</p>;
    }
    return (
        <div className="card product-rate-card">
            <table className="rates">
                <thead>
                    <tr>
                        <th>{CatalogMessages.TERM}</th>
                        <th>{CatalogMessages.RESERVE}</th>
                        <th>{CatalogMessages.CALCULATION}</th>
                        <th>{CatalogMessages.BASE}</th>
                        <th>{CatalogMessages.MAXIMUM}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row: CatalogRateView) => (
                        <tr key={row.key}>
                            <td>{row.term}</td>
                            <td>{row.reserve}</td>
                            <td>{row.calculation}</td>
                            <td>{row.base}</td>
                            <td>{row.maximum}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
