import { Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useClubs } from '../../api/cache/clubs';
import { RequestSnackbar } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import { ListClubItem } from '../../clubs/ClubGrid';
import { User } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';

interface ClubsTabProps {
    /** The user whose joined clubs will be displayed. */
    user: User;
}

/**
 * Displays a list of clubs the specified user is a member of.
 * @param user The user whose clubs will be listed.
 * @returns A ReactNode displaying the list of clubs the user is in.
 */
const ClubsTab: React.FC<ClubsTabProps> = ({ user }) => {
    const viewer = useAuth().user;
    const { clubs, request } = useClubs(user.clubs || []);

    if (request.isLoading()) {
        return <LoadingPage />;
    }

    const isCurrentUser = viewer?.username === user.username;
    const displayedClubs = isCurrentUser ? clubs : clubs.filter((c) => !c.unlisted);

    if (displayedClubs.length === 0) {
        return (
            <Stack alignItems='center'>
                <RequestSnackbar request={request} />

                {isCurrentUser ? (
                    <>
                        <Typography>You have not joined any clubs yet.</Typography>
                        <Typography>
                            Go to the{' '}
                            <Link component={RouterLink} to='/clubs'>
                                Clubs page
                            </Link>{' '}
                            to join some!
                        </Typography>
                    </>
                ) : (
                    <Typography textAlign='center'>
                        This user has not joined any clubs
                    </Typography>
                )}
            </Stack>
        );
    }

    return (
        <Stack>
            <RequestSnackbar request={request} />

            {displayedClubs.map((club) => (
                <ListClubItem key={club.id} club={club} />
            ))}
        </Stack>
    );
};

export default ClubsTab;
