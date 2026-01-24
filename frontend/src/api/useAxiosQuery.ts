import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';

/**
 * Wraps tanstack useQuery to extract the data from the AxiosResponse and
 * add a new return value axiosResponse which contains the raw response.
 * @param options The options to pass to useQuery.
 * @returns The useQuery response, with the extracted data and axiosResponse values.
 */
export function useAxiosQuery<T>(options: UseQueryOptions<AxiosResponse<T>>) {
    const response = useQuery(options);
    const queryClient = useQueryClient();
    return {
        ...response,
        data: response.data?.data,
        axiosResponse: response.data,
        onUpdate: (data: T) => {
            queryClient.setQueryData(options.queryKey, { ...response.data, data });
        },
    };
}
