import { Link } from '@/components/navigation/Link';
import { User, compareCohorts } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Card, CardContent, CardHeader, Stack, Tooltip } from '@mui/material';
import Image from 'next/image';
import postmortem2023 from './2023-postmortem.png';
import postmortem2024 from './2024-postmortem.png';

export const BadgeCard = ({ user }: { user: User }) => {
    if (!user.graduationCohorts?.length) {
        return null;
    }

    return (
        <Card>
            <CardHeader title='Badges' />
            <CardContent sx={{ pt: 0 }}>
                <Stack direction='row' columnGap={0.75} flexWrap='wrap' rowGap={1}>
                    {user.graduationCohorts
                        ?.sort(compareCohorts)
                        .filter((c, i) => user.graduationCohorts?.indexOf(c) === i)
                        .map((c) => <CohortIcon key={c} cohort={c} />)}

                    {(!user.createdAt || user.createdAt < '2024-12') && (
                        <Link href={`/profile/${user.username}/postmortem/2024`}>
                            <Tooltip title='View my 2024 postmortem!'>
                                <Image
                                    src={postmortem2024}
                                    style={{ height: '40px', width: '40px' }}
                                    alt='2024 postmortem'
                                />
                            </Tooltip>
                        </Link>
                    )}

                    {(!user.createdAt || user.createdAt < '2023-12') && (
                        <Link href={`/profile/${user.username}/postmortem/2023`}>
                            <Tooltip title='View my 2023 postmortem!'>
                                <Image
                                    src={postmortem2023}
                                    style={{ height: '40px', width: '40px' }}
                                    alt='2023 postmortem'
                                />
                            </Tooltip>
                        </Link>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};
