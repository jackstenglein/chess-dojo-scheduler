import { Link } from '@/components/navigation/Link';
import { User } from '@/database/user';
import Avatar from '@/profile/Avatar';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Stack, Typography } from '@mui/material';

interface UserInfoProps {
    user: User;
    linkUsername?: boolean;
}

const UserInfo: React.FC<UserInfoProps> = ({ user, linkUsername }) => {
    return (
        <Stack direction='row' spacing={2}>
            <Avatar user={user} />

            <Stack>
                <Stack direction='row' alignItems='center' spacing={2} flexWrap='wrap' rowGap={1}>
                    <Typography variant='h4'>
                        {linkUsername ? (
                            <Link href={`/profile/${user.username}`}>{user.displayName}</Link>
                        ) : (
                            user.displayName
                        )}
                    </Typography>

                    <CohortIcon
                        cohort={user.dojoCohort}
                        tooltip={`Member of the ${user.dojoCohort} cohort`}
                    />
                </Stack>
                <Typography variant='h5' color='text.secondary'>
                    {user.dojoCohort}
                </Typography>
            </Stack>
        </Stack>
    );
};

export default UserInfo;
