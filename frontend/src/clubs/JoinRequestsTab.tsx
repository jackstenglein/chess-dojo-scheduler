import { Stack, Typography } from '@mui/material';

import { useAuth } from '../auth/Auth';
import { ClubDetails } from '../database/club';

interface JoinRequestsTabProps {
    club: ClubDetails;
}

const JoinRequestsTab: React.FC<JoinRequestsTabProps> = ({ club }) => {
    const viewer = useAuth().user;
    if (viewer?.username !== club.owner) {
        return null;
    }

    return (
        <Stack>
            {Object.values(club.joinRequests).map((joinRequest) => (
                <Typography key={joinRequest.username}>{joinRequest.username}</Typography>
            ))}
        </Stack>
    );
};

export default JoinRequestsTab;
