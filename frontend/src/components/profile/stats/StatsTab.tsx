import { useAuth } from '@/auth/Auth';
import {
    getRatingUsername,
    getSystemCurrentRating,
    getSystemStartRating,
    hideRatingUsername,
    RatingSystem,
    User,
} from '@/database/user';
import { Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import RatingCard from './RatingCard';
import TacticsScoreCard from './TacticsScoreCard';

interface StatsTabProps {
    user: User;
}

const StatsTab: React.FC<StatsTabProps> = ({ user }) => {
    const { user: viewer } = useAuth();
    const [hidden, setHidden] = useState(
        viewer?.enableZenMode && viewer.username === user.username,
    );

    if (hidden) {
        return (
            <Stack spacing={2} alignItems='center'>
                <Typography>Ratings are hidden in Zen Mode.</Typography>
                <Button onClick={() => setHidden(false)}>View Anyway</Button>
            </Stack>
        );
    }

    const preferredSystem = user.ratingSystem;
    const currentRating = getSystemCurrentRating(user, preferredSystem);
    const startRating = getSystemStartRating(user, preferredSystem);

    return (
        <Stack spacing={4}>
            <RatingCard
                system={preferredSystem}
                cohort={user.dojoCohort}
                username={getRatingUsername(user, preferredSystem)}
                usernameHidden={hideRatingUsername(user, preferredSystem)}
                currentRating={currentRating}
                startRating={startRating}
                isPreferred={true}
                ratingHistory={
                    user.ratingHistories ? user.ratingHistories[preferredSystem] : undefined
                }
                name={user.ratings[preferredSystem]?.name}
            />

            {Object.values(RatingSystem).map((rs) => {
                if (rs === preferredSystem) {
                    return null;
                }

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
                        ratingHistory={user.ratingHistories ? user.ratingHistories[rs] : undefined}
                        name={user.ratings[rs]?.name}
                    />
                );
            })}

            <TacticsScoreCard user={user} />
        </Stack>
    );
};

export default StatsTab;
