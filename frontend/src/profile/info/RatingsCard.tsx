import {
    formatRatingSystem,
    getSystemCurrentRating,
    RatingSystem,
    User,
} from '@/database/user';
import { RatingSystemIcon } from '@/style/RatingSystemIcons';
import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';

export const RatingsCard = ({ user }: { user: User }) => {
    const systems = Object.values(RatingSystem)
        .filter((rs) => user.ratings[rs])
        .sort(
            (lhs, rhs) =>
                (user.ratings[rhs]?.currentRating ?? 0) -
                (user.ratings[lhs]?.currentRating ?? 0),
        );

    return (
        <Card>
            <CardHeader title='Ratings' />
            <CardContent sx={{ pt: 1 }}>
                <Grid2 container rowGap={1} alignItems='center'>
                    {systems.map((rs) => {
                        const currentRating = getSystemCurrentRating(user, rs);
                        if (currentRating <= 0) {
                            return null;
                        }

                        return (
                            <RatingRow
                                key={rs}
                                system={rs}
                                currentRating={currentRating}
                                name={user.ratings[rs]?.name}
                            />
                        );
                    })}
                </Grid2>
            </CardContent>
        </Card>
    );
};

const RatingRow = ({
    system,
    currentRating,
    name,
}: {
    system: RatingSystem;
    currentRating: number;
    name?: string;
}) => {
    return (
        <>
            <Grid2 xs={2} display='flex' alignItems='center' justifyContent='center'>
                <RatingSystemIcon system={system} size='small' />
            </Grid2>
            <Grid2 xs={8}>
                <Typography>
                    {formatRatingSystem(system)}{' '}
                    {system === RatingSystem.Custom && name && ` (${name})`}
                </Typography>
            </Grid2>

            <Grid2 xs={2}>
                <Typography fontWeight='bold'>{currentRating}</Typography>
            </Grid2>
        </>
    );
};
