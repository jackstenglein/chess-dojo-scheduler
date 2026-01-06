// axios.d.ts
import 'axios';

// Custom config for logging requests/responses.
declare module 'axios' {
    export interface AxiosRequestConfig {
        /** The name of the invoked function. */
        functionName?: string;
        /** The start time of the request in epoch milliseconds. */
        startTime?: number;
    }

    export interface AxiosResponse {
        /** The latency of the request. */
        latencyMillis?: number;
    }

    export interface AxiosError {
        /** The latency of the request. */
        latencyMillis?: number;
    }
}
