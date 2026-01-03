import { User } from '../database/user';
import { axiosService } from './axiosService';

/**
 * listCoaches returns a list of coaches.
 * @returns An AxiosResponse containing the list of coaches.
 */
export function listCoaches() {
    return axiosService.get<User[]>(`/public/coach`, { functionName: 'listCoaches' });
}
