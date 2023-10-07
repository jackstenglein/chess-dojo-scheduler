import { Chip } from '@mui/material';

interface CountChipProps {
    count: number;
    label: string;
    singularLabel?: string;
}

const CountChip: React.FC<CountChipProps> = ({ count, label, singularLabel }) => {
    return (
        <Chip
            label={`${count} ${count === 1 ? singularLabel || label : label}`}
            variant='outlined'
            color='secondary'
        />
    );
};

export default CountChip;
