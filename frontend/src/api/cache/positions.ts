import { useEffect, useMemo } from 'react';

import { normalizeFen } from '../../database/explorer';
import { useApi } from '../Api';
import { Request, useRequest } from '../Request';
import { useCache } from './Cache';
import { GetExplorerPositionResult } from '../explorerApi';

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
        [cache.positions, normalizedFen]
    );

    useEffect(() => {
        if (!cache.positions.isFetched(normalizedFen) && !request.isSent()) {
            request.onStart();
            api.getPosition(normalizedFen)
                .then((resp) => {
                    console.log('getPosition: ', resp);
                    cache.positions.markFetched(normalizedFen);
                    cache.positions.put(resp.data);
                    request.onSuccess();
                })
                .catch((err) => {
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
    useEffect(() => {
        if (!cache.positions.isFetched(normalizedFen)) {
            reset();
        }
    }, [normalizedFen, cache.positions, reset]);

    return { position, request, putPosition: cache.positions.put };
}
