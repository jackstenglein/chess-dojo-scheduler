import { Chip, Tooltip } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

interface CreatedAtChipProps {
    createdAt?: string;
}

const CreatedAtChip: React.FC<CreatedAtChipProps> = ({ createdAt }) => {
    if (!createdAt) {
        return (
            <Tooltip title='Dojo member since 1.0'>
                <Chip
                    icon={<CalendarMonthIcon fontSize='small' />}
                    label='Dojo 1.0'
                    variant='outlined'
                    color='secondary'
                />
            </Tooltip>
        );
    }

    const date = new Date(createdAt).toLocaleDateString();

    return (
        <Tooltip title={`Dojo member since ${date}`}>
            <Chip
                icon={<CalendarMonthIcon fontSize='small' />}
                label={date}
                variant='outlined'
                color='secondary'
            />
        </Tooltip>
    );
};

export default CreatedAtChip;
