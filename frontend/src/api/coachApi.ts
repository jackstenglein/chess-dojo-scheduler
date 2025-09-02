import axios from 'axios';

import { getConfig } from '../config';
import { User } from '../database/user';

const BASE_URL = getConfig().api.baseUrl;

/**
 * listCoaches returns a list of coaches.
 * @returns An AxiosResponse containing the list of coaches.
 */
export function listCoaches() {
    return axios.get<User[]>(`${BASE_URL}/public/coach`);
}
