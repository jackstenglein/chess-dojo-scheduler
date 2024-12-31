import { normalizeFen } from '@/database/explorer';
import { AxiosError } from 'axios';
import { useEffect, useMemo } from 'react';
import { useApi } from '../Api';
import { Request, useRequest } from '../Request';
import { GetExplorerPositionResult } from '../explorerApi';
import { useCache } from './Cache';

interface UsePositionResponse {
    position: GetExplorerPositionResult | undefined;
    request: Request;
    putPosition: (p: GetExplorerPositionResult) => void;
}

export function usePosition(fen: string): UsePositionResponse {
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const normalizedFen = normalizeFen(fen);
    const position = useMemo(
        () => cache.positions.get(normalizedFen),
        [cache.positions, normalizedFen],
    );

    useEffect(() => {
        if (!cache.positions.isFetched(normalizedFen) && !request.isSent()) {
            request.onStart();
            api.getPosition(normalizedFen)
                .then((resp) => {
                    cache.positions.markFetched(normalizedFen);
                    cache.positions.put(resp.data);
                    request.onSuccess();
                })
                .catch((err: AxiosError) => {
                    console.error('getPosition: ', err);
                    if (err.response?.status === 404) {
                        cache.positions.markFetched(normalizedFen);
                        request.onSuccess();
                    } else {
                        request.onFailure(err);
                    }
                });
        }
    }, [api, request, cache.positions, normalizedFen]);

    const reset = request.reset;
    const onSuccess = request.onSuccess;
    useEffect(() => {
        if (!cache.positions.isFetched(normalizedFen)) {
            reset();
        } else {
            onSuccess();
        }
    }, [normalizedFen, cache.positions, reset, onSuccess]);

    return { position, request, putPosition: cache.positions.put };
}
