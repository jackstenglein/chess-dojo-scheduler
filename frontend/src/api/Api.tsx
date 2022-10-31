import { createContext, ReactNode, useContext, useMemo } from 'react';

import { useAuth } from '../auth/Auth';
import { Availability } from '../database/availability';
import { User } from '../database/user';
import {
    AvailabilityApiContextType,
    bookAvailability,
    deleteAvailability,
    getAvailabilities,
    setAvailability,
} from './availabilityApi';
import { UserApiContextType, getUser, updateUser } from './userApi';

/**
 * ApiContextType defines the interface of the API as available through ApiProvider.
 */
type ApiContextType = UserApiContextType & AvailabilityApiContextType;

const ApiContext = createContext<ApiContextType>(null!);

/**
 * @returns The current ApiContext value.
 */
export function useApi() {
    return useContext(ApiContext);
}

/**
 * ApiProvider provides access to API calls. It implements the ApiContextType interface.
 * ApiProvider must be a child of AuthProvider.
 * @param param0 React props. The only used prop is children.
 * @returns An ApiContext.Provider wrapping the provided children.
 */
export function ApiProvider({ children }: { children: ReactNode }) {
    const auth = useAuth();
    const idToken = auth.user?.cognitoUser?.session?.idToken.jwtToken ?? '';

    const value = useMemo(() => {
        return {
            getUser: () => getUser(idToken),
            updateUser: (update: Partial<User>) =>
                updateUser(idToken, update, auth.updateUser),

            setAvailability: (a: Availability) => setAvailability(idToken, a),
            deleteAvailability: (a: Availability) => deleteAvailability(idToken, a),
            bookAvailability: (a: Availability, time: Date, type: string) =>
                bookAvailability(idToken, a, time, type),
            getAvailabilities: (limit?: number, startKey?: string) =>
                getAvailabilities(idToken, limit, startKey),
        };
    }, [idToken, auth.updateUser]);

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
