import WarningIcon from '@mui/icons-material/Warning';
import { Link, Stack, Tooltip, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { SubscriptionStatus, User, compareCohorts } from '../../database/user';
import CohortIcon from '../../scoreboard/CohortIcon';
import Avatar from '../Avatar';

interface UserInfoProps {
    user: User;
    linkUsername?: boolean;
}

const UserInfo: React.FC<UserInfoProps> = ({ user, linkUsername }) => {
    return (
        <Stack direction='row' spacing={2}>
            <Avatar user={user} />

            <Stack>
                <Stack
                    direction='row'
                    alignItems='center'
                    spacing={2}
                    flexWrap='wrap'
                    rowGap={1}
                >
                    <Typography variant='h4'>
                        {linkUsername ? (
                            <Link component={RouterLink} to={`/profile/${user.username}`}>
                                {user.displayName}
                            </Link>
                        ) : (
                            user.displayName
                        )}
                    </Typography>

                    {user.subscriptionStatus === SubscriptionStatus.FreeTier && (
                        <Tooltip title='This account is on the free tier and has limited access to the site'>
                            <WarningIcon color='warning' />
                        </Tooltip>
                    )}

                    {user.graduationCohorts && user.graduationCohorts.length > 0 ? (
                        <Stack direction='row' spacing={0.5} flexWrap='wrap' rowGap={1}>
                            {user.graduationCohorts
                                .sort(compareCohorts)
                                .filter(
                                    (c, i) => user.graduationCohorts?.indexOf(c) === i,
                                )
                                .map((c) => (
                                    <CohortIcon key={c} cohort={c} />
                                ))}
                        </Stack>
                    ) : (
                        user.previousCohort && <CohortIcon cohort={user.previousCohort} />
                    )}
                </Stack>
                <Typography variant='h5' color='text.secondary'>
                    {user.dojoCohort}
                </Typography>
            </Stack>
        </Stack>
    );
};

export default UserInfo;
