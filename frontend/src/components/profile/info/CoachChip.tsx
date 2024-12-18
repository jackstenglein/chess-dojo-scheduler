import { User } from '@/database/user';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { Chip, Tooltip } from '@mui/material';

interface CoachChipProps {
    user?: User;
}

const CoachChip: React.FC<CoachChipProps> = ({ user }) => {
    if (!user?.isCoach) {
        return null;
    }

    return (
        <Tooltip title='This member is a Dojo coach'>
            <Chip
                icon={<RocketLaunchIcon fontSize='small' />}
                label='Coach'
                variant='outlined'
                color='success'
            />
        </Tooltip>
    );
};

export default CoachChip;
