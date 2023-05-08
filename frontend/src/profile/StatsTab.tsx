import { Stack } from '@mui/material';

import {
    RatingSystem,
    User,
    getRatingUsername,
    getSystemCurrentRating,
    getSystemStartRating,
    hideRatingUsername,
} from '../database/user';
import RatingCard from './RatingCard';
import DojoScoreCard from './DojoScoreCard';

interface StatsTabProps {
    user: User;
}

const StatsTab: React.FC<StatsTabProps> = ({ user }) => {
    return (
        <Stack spacing={4}>
            <DojoScoreCard user={user} />

            {Object.values(RatingSystem).map((rs) => {
                const currentRating = getSystemCurrentRating(user, rs);
                const startRating = getSystemStartRating(user, rs);

                if (currentRating <= 0 && startRating <= 0) {
                    return null;
                }

                return (
                    <RatingCard
                        key={rs}
                        system={rs}
                        cohort={user.dojoCohort}
                        username={getRatingUsername(user, rs)}
                        usernameHidden={hideRatingUsername(user, rs)}
                        currentRating={currentRating}
                        startRating={startRating}
                        isPreferred={user.ratingSystem === rs}
                    />
                );
            })}
        </Stack>
    );
};

export default StatsTab;
