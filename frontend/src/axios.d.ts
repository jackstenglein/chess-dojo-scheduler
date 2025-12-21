// axios.d.ts
import 'axios';

declare module 'axios' {
    export interface AxiosRequestConfig {
        /** Custom config for logging requests/responses. */
        functionName?: string;
    }
}
