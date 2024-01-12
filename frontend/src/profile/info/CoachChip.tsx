import { Chip, Tooltip } from '@mui/material';
import { Sports } from '@mui/icons-material';

import { User } from '../../database/user';

interface CoachChipProps {
    user?: User;
}

const CoachChip: React.FC<CoachChipProps> = ({ user }) => {
    if (!user || !user.isCoach) {
        return null;
    }

    return (
        <Tooltip title='This member is a Dojo coach'>
            <Chip
                icon={<Sports fontSize='small' />}
                label='Coach'
                variant='outlined'
                color='primary'
            />
        </Tooltip>
    );
};

export default CoachChip;
