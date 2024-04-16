import { getConfig } from '../config';

const BASE_URL = getConfig().api.baseUrl;

export type TacticsApiContextType = {
    listTests: (startKey?: string) => Promise<TacticsTest[]>;
};
