import { Groups } from '@mui/icons-material';
import { Chip } from '@mui/material';

interface MemberCountChipProps {
    count: number;
}

const MemberCountChip: React.FC<MemberCountChipProps> = ({ count }) => {
    return (
        <Chip
            color='secondary'
            icon={<Groups sx={{ pl: '4px' }} />}
            label={`${count} member${count !== 1 ? 's' : ''}`}
        />
    );
};

export default MemberCountChip;
