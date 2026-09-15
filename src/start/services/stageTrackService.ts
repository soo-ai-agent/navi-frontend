import type {CatalogProductResponseDTO} from "../../catalog/types/catalog";

const NAMES_PER_TRACK: number = 20;

type Track = readonly string[];
type TrackPair = readonly [Track, Track]; // [윗줄, 아랫줄]

export type StageTracks = {
    readonly banks: Track;
    readonly bankTracks: TrackPair;
    readonly savingsNameTracks: TrackPair;
    readonly productCount: number;
};

function splitInHalf(items: Track): TrackPair {
    const half: number = Math.ceil(items.length / 2);
    return [items.slice(0, half), items.slice(half)];
}

export function buildStageTracks(products: readonly CatalogProductResponseDTO[]): StageTracks {
    const banks: Track = [...new Set(products.map((product: CatalogProductResponseDTO) => product.bank_name))];
    const names: Track = products.slice(0, NAMES_PER_TRACK * 2).map((product: CatalogProductResponseDTO) => product.product_name);

    return {
        banks,
        bankTracks: splitInHalf(banks),
        savingsNameTracks: splitInHalf(names),
        productCount: products.length,
    };
}
