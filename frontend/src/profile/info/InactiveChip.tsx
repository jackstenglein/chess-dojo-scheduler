import { Chip, Tooltip } from '@mui/material';

import { User, isActive } from '../../database/user';

interface InactiveChipProps {
    user: User;
}

const InactiveChip: React.FC<InactiveChipProps> = ({ user }) => {
    const isUserActive = isActive(user);
    if (isUserActive) {
        return null;
    }

    return (
        <Tooltip title='User has not updated progress in the past month'>
            <Chip label='Inactive' color='error' variant='outlined' />
        </Tooltip>
    );
};

export default InactiveChip;
