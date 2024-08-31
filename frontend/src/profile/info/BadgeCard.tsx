import { User, compareCohorts } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Card, CardContent, CardHeader, Stack } from '@mui/material';

export const BadgeCard = ({ user }: { user: User }) => {
    if (!user.graduationCohorts?.length) {
        return null;
    }

    return (
        <Card>
            <CardHeader title='Badges' />
            <CardContent>
                <Stack direction='row' spacing={0.5} flexWrap='wrap' rowGap={1}>
                    {user.graduationCohorts
                        ?.sort(compareCohorts)
                        .filter((c, i) => user.graduationCohorts?.indexOf(c) === i)
                        .map((c) => <CohortIcon key={c} cohort={c} />)}
                </Stack>
            </CardContent>
        </Card>
    );
};
