import { Stack } from '@mui/material';

import { RatingSystem, User } from '../database/user';
import RatingCard from './RatingCard';
import DojoScoreCard from './DojoScoreCard';

interface StatsTabProps {
    user: User;
}

const StatsTab: React.FC<StatsTabProps> = ({ user }) => {
    return (
        <Stack spacing={4}>
            <DojoScoreCard user={user} />

            {(user.chesscomUsername !== '' || user.currentChesscomRating > 0) && (
                <RatingCard
                    system={RatingSystem.Chesscom}
                    cohort={user.dojoCohort}
                    username={user.chesscomUsername}
                    usernameHidden={user.hideChesscomUsername}
                    currentRating={user.currentChesscomRating}
                    startRating={user.startChesscomRating}
                    isPreferred={user.ratingSystem === RatingSystem.Chesscom}
                />
            )}

            {(user.lichessUsername !== '' || user.currentLichessRating > 0) && (
                <RatingCard
                    system={RatingSystem.Lichess}
                    cohort={user.dojoCohort}
                    username={user.lichessUsername}
                    usernameHidden={user.hideLichessUsername}
                    currentRating={user.currentLichessRating}
                    startRating={user.startLichessRating}
                    isPreferred={user.ratingSystem === RatingSystem.Lichess}
                />
            )}

            {(user.currentFideRating > 0 || user.startFideRating > 0) && (
                <RatingCard
                    system={RatingSystem.Fide}
                    cohort={user.dojoCohort}
                    username={user.fideId}
                    usernameHidden={user.hideFideId}
                    currentRating={user.currentFideRating}
                    startRating={user.startFideRating}
                    isPreferred={user.ratingSystem === RatingSystem.Fide}
                />
            )}

            {(user.currentUscfRating > 0 || user.startUscfRating > 0) && (
                <RatingCard
                    system={RatingSystem.Uscf}
                    cohort={user.dojoCohort}
                    username={user.uscfId}
                    usernameHidden={user.hideUscfId}
                    currentRating={user.currentUscfRating}
                    startRating={user.startUscfRating}
                    isPreferred={user.ratingSystem === RatingSystem.Uscf}
                />
            )}

            {(user.currentEcfRating > 0 || user.startEcfRating > 0) && (
                <RatingCard
                    system={RatingSystem.Ecf}
                    cohort={user.dojoCohort}
                    username={user.ecfId}
                    usernameHidden={user.hideEcfId}
                    currentRating={user.currentEcfRating}
                    startRating={user.startEcfRating}
                    isPreferred={user.ratingSystem === RatingSystem.Ecf}
                />
            )}
        </Stack>
    );
};

export default StatsTab;
