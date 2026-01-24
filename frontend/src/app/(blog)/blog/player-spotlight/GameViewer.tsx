'use client';

import { ErrorSnackbar } from '@/api/ErrorSnackbar';
import { getGame } from '@/api/gameApi';
import { useAxiosQuery } from '@/api/useAxiosQuery';
import { DefaultUnderboardTab } from '@/board/pgn/boardTools/underboard/underboardTabs';
import PgnBoard from '@/board/pgn/PgnBoard';
import { MUI_LICENSE_KEY } from '@/config';
import { GameContext } from '@/context/useGame';
import { LicenseInfo } from '@mui/x-license';

LicenseInfo.setLicenseKey(MUI_LICENSE_KEY);

export const GameViewer = ({ cohort, id }: { cohort: string; id: string }) => {
    const { isPending, data, error, onUpdate } = useAxiosQuery({
        queryKey: ['games', cohort, id],
        queryFn: () => getGame(cohort, id),
        staleTime: 3600 * 60 * 1000, // 1 hour
    });

    if (isPending) {
        return null;
    }

    return (
        <GameContext.Provider
            value={{
                game: data,
                onUpdateGame: onUpdate,
                isOwner: false,
            }}
        >
            <ErrorSnackbar error={error} />
            <PgnBoard
                pgn={data?.pgn}
                startOrientation={data?.orientation}
                underboardTabs={[
                    DefaultUnderboardTab.Tags,
                    DefaultUnderboardTab.Comments,
                    DefaultUnderboardTab.Explorer,
                    DefaultUnderboardTab.Clocks,
                ]}
                showElapsedMoveTimes
            />
        </GameContext.Provider>
    );
};
